#!/usr/bin/env python3
"""Extrai a estrutura de RESERVA DE VAGAS (cotas) de cada chamada a partir do cache de
texto dos editais (data/pdf_text/), gravando `vagas_por_cota` no corpus. Offline e
re-rodável (mesmo padrão do classify.py): edite as listas e rode
`python scripts/extract_cotas.py`.

Conservador e honesto: detecta reserva EXPLÍCITA (reserva de vaga / cota / ação afirmativa
/ heteroidentificação) e quais categorias (Étnico-racial / Mulheres / PCD / Indígena /
Quilombola) aparecem nesse contexto.

Quando o edital traz o QUADRO numérico de distribuição de vagas (seção 3.1, colunas
AC/ER/M/PCD em "Vagas imediatas" e "Cadastro Reserva", com `*` = sem reserva), também
extraímos as CONTAGENS por categoria e o total — gravadas em `vagas_por_cota.quadro`. O
formato é estável entre os editais PIPA pós-317; quando uma linha não casa com as 8 células
esperadas, descartamos o quadro inteiro (sem chutar número). Editais sem o quadro tabular
(vaga única em formato antigo) ficam sem `quadro` — presença sim, contagem não.
"""
import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_pdfs import slug, TXT_DIR, LIMIAR_TEXTO  # DRY: mesma slugificação do fetch

ROOT = Path(__file__).resolve().parent.parent
CORPUS = ROOT / "data" / "corpus_chamadas_2023-2026.json"


def sa(s):
    return "".join(c for c in unicodedata.normalize("NFD", s or "")
                   if unicodedata.category(c) != "Mn").lower()


# Sinal de reserva explícita (evita falsos positivos de "mulheres"/"negros" como tema).
RESERVA = ["reserva de vaga", "vagas reservadas", "vaga reservada", "cota", "cotas",
           "acao afirmativa", "acoes afirmativas", "heteroidentifica"]

CATS = {
    "Étnico-racial": ["etnico-racial", "etnico racial", "pretos e pardos", "pessoas negras",
                      "pessoa negra", "negros", "negras", "populacao negra"],
    "Mulheres": ["mulher", "mulheres", "genero feminino"],
    "PCD": ["pessoa com deficiencia", "pessoas com deficiencia", " pcd", "com deficiencia"],
    "Indígena": ["indigena"],
    "Quilombola": ["quilombola"],
}


# Ordem fixa das colunas do quadro 3.1 (vale para "Vagas imediatas" e "Cadastro Reserva").
QUADRO_COLS = ["AC", "ER", "M", "PCD"]


def extrai_quadro(texto):
    """Soma as vagas do quadro 3.1 por categoria. Cada linha de seleção tem 'R$ <valor>'
    seguido de 8 células (AC ER M PCD imediatas + AC ER M PCD reserva), `*` = 0. Retorna
    None se não houver quadro tabular parseável (não inventa números)."""
    mi = re.search(r"quadro a seguir", texto, re.I)
    if not mi:
        return None
    win = texto[mi.start(): mi.start() + 1500]
    win = re.split(r"\n\s*3\.2\.|N[ãa]o haver[áa]|Portaria n", win)[0]
    agg = {c: 0 for c in QUADRO_COLS}
    selecoes = 0
    for line in win.splitlines():
        if not re.search(r"R\$\s*[\d.,]+", line):
            continue
        apos = re.sub(r"^\s*[\d.,]+", "", line.split("R$", 1)[1], count=1)
        celulas = re.findall(r"\*|\d+", apos)
        if len(celulas) != 8:
            return None  # formato inesperado — descarta o quadro inteiro
        nums = [0 if c == "*" else int(c) for c in celulas]
        for col, imed, res in zip(QUADRO_COLS, nums[0:4], nums[4:8]):
            agg[col] += imed + res
        selecoes += 1
    if not selecoes:
        return None
    total = sum(agg.values())
    reservadas = agg["ER"] + agg["M"] + agg["PCD"]
    return {
        "total": total,
        "ampla_concorrencia": agg["AC"],
        "reservadas": reservadas,
        "por_categoria": {"Étnico-racial": agg["ER"], "Mulheres": agg["M"], "PCD": agg["PCD"]},
        "selecoes": selecoes,
    }


def extrai_cotas(texto):
    h = sa(texto)
    hetero = "heteroidentifica" in h
    if not any(k in h for k in RESERVA):
        return {"tem_reserva": False, "categorias": [], "heteroidentificacao": hetero}
    cats = [nome for nome, kws in CATS.items() if any(k in h for k in kws)]
    vc = {"tem_reserva": True, "categorias": cats, "heteroidentificacao": hetero}
    quadro = extrai_quadro(texto)
    if quadro:
        vc["quadro"] = quadro
    return vc


def main():
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    usados = set()
    n_txt = n_res = n_hetero = n_quadro = 0
    g_total = g_reserv = 0
    cat_count = Counter()
    for reg in corpus:
        s = slug(reg, usados)  # consome `usados` para TODA chamada (mantém o mesmo slug do fetch)
        p = TXT_DIR / f"{s}.txt"
        if p.exists() and p.stat().st_size > 0:
            t = p.read_text(encoding="utf-8", errors="replace")
            if len(t.strip()) >= LIMIAR_TEXTO:
                n_txt += 1
                vc = extrai_cotas(t)
                reg["vagas_por_cota"] = vc
                n_res += vc["tem_reserva"]
                n_hetero += vc["heteroidentificacao"]
                for c in vc["categorias"]:
                    cat_count[c] += 1
                if "quadro" in vc:
                    n_quadro += 1
                    g_total += vc["quadro"]["total"]
                    g_reserv += vc["quadro"]["reservadas"]
                continue
        reg["vagas_por_cota"] = None
    CORPUS.write_text(json.dumps(corpus, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"cotas: {n_res}/{n_txt} chamadas com reserva explícita "
          f"(de {len(corpus)} no total) | heteroidentificação em {n_hetero}")
    print("  por categoria:", dict(cat_count.most_common()))
    pct = round(g_reserv / g_total * 100) if g_total else 0
    print(f"  quadro numérico em {n_quadro} chamadas | "
          f"{g_reserv}/{g_total} vagas reservadas ({pct}%)")


if __name__ == "__main__":
    main()
