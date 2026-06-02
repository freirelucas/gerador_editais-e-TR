#!/usr/bin/env python3
"""Limpa o corpus de chamadas (data/raw -> data/), preservando os campos originais
e acrescentando campos derivados. Idempotente: lê sempre da semente bruta.

Regras (não inventa valores ausentes):
- programa  -> {PIPA, PROCIN, PROMOB}        (mantém programa_raw)
- situacao  -> caixa alta consistente
- datas     -> prazo_ini_iso / prazo_fim_iso (ISO) + janela_dias
- modalidade-> trim + modalidade_canonica (12 oficiais; null se não bater)
- flags[]   -> anomalias por registro (sem_datas, titulo_ano_divergente, ...)
"""
import json, re, sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "corpus_chamadas_2023-2026.json"
OUT = ROOT / "data" / "corpus_chamadas_2023-2026.json"

CANONICAS = [
    "Auxiliar de Pesquisa", "Assistente de Pesquisa I", "Assistente de Pesquisa II",
    "Assistente de Pesquisa III", "Assistente de Pesquisa IV", "Doutor",
    "Pesquisador Visitante", "Incentivo à Pesquisa I", "Incentivo à Pesquisa II",
    "Pesquisador de Campo I", "Pesquisador de Campo II", "Profissional Sênior",
]
_CANON_LC = {c.lower(): c for c in CANONICAS}


def normaliza_programa(p):
    up = (p or "").upper()
    if "PROMOB" in up:
        return "PROMOB"
    if "PROCIN" in up:
        return "PROCIN"
    if "PIPA" in up:
        return "PIPA"
    return up or None


def para_iso(s):
    """'25-05-26' (DD-MM-YY) -> '2026-05-25'; devolve None se não parsear."""
    try:
        return datetime.strptime(s, "%d-%m-%y").date().isoformat()
    except (ValueError, TypeError):
        return None


def canoniza_modalidade(m):
    if not m:
        return None
    key = re.sub(r"\s+", " ", m).strip().rstrip(".").lower()
    return _CANON_LC.get(key)


def ano_da_url(url):
    m = re.search(r"-(\d{4})(?:/|$)", url or "")
    return m.group(1) if m else None


def ano_do_titulo(t):
    m = re.search(r"\b(20\d{2})\b", t or "")
    return m.group(1) if m else None


def limpa(reg):
    programa = normaliza_programa(reg.get("programa"))
    ini_iso = para_iso(reg.get("prazo_ini"))
    fim_iso = para_iso(reg.get("prazo_fim"))
    janela = None
    if ini_iso and fim_iso:
        janela = (datetime.fromisoformat(fim_iso) - datetime.fromisoformat(ini_iso)).days
    modalidade = re.sub(r"\s+", " ", (reg.get("modalidade") or "").strip()) or None

    flags = []
    if not (ini_iso and fim_iso):
        flags.append("sem_datas")
    if janela is not None and janela < 0:
        flags.append("janela_invertida")
    au, at = ano_da_url(reg.get("url")), ano_do_titulo(reg.get("titulo"))
    anos = {a for a in (str(reg.get("ano")), au, at) if a}
    if len(anos) > 1:
        flags.append("titulo_ano_divergente")
    if modalidade is None:
        flags.append("modalidade_ausente")
    if reg.get("qtd_bolsas") is None:
        flags.append("qtd_ausente")

    return {
        # originais preservados
        "url": reg.get("url"),
        "titulo": reg.get("titulo"),
        "ano": str(reg.get("ano")),
        "situacao": (reg.get("situacao") or "").strip().upper() or None,
        "prazo_ini": reg.get("prazo_ini"),
        "prazo_fim": reg.get("prazo_fim"),
        "programa": programa,
        "projeto": (reg.get("projeto") or "").strip() or None,
        "modalidade": modalidade,
        "qtd_bolsas": reg.get("qtd_bolsas"),
        "pdf_urls": reg.get("pdf_urls") or [],
        "pdf_file": reg.get("pdf_file"),
        # derivados
        "programa_raw": reg.get("programa"),
        "prazo_ini_iso": ini_iso,
        "prazo_fim_iso": fim_iso,
        "janela_dias": janela,
        "modalidade_canonica": canoniza_modalidade(modalidade),
        "flags": flags,
    }


def main():
    raw = json.loads(RAW.read_text(encoding="utf-8"))
    limpos = [limpa(r) for r in raw]
    OUT.write_text(json.dumps(limpos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    n_flags = sum(1 for r in limpos if r["flags"])
    print(f"corpus: {len(raw)} -> {len(limpos)} registros | {n_flags} com flags")
    print("  programas:", sorted({r["programa"] for r in limpos}))
    print("  modalidade_canonica preenchida:", sum(1 for r in limpos if r["modalidade_canonica"]))
    div = [r["titulo"] for r in limpos if "titulo_ano_divergente" in r["flags"]]
    print("  titulo_ano_divergente:", div)


if __name__ == "__main__":
    main()
