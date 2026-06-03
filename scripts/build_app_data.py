#!/usr/bin/env python3
"""Deriva artefatos pequenos que o APP consome (evita empacotar a biblioteca de ~3 MB):
- src/data/quality.json          : métricas da biblioteca + proveniência da limpeza
- src/data/clausulas_sugeridas.json : cláusulas reais mais frequentes p/ o construtor

Lê a semente bruta (para frequências reais) e os canônicos limpos.
"""
import json, re
from pathlib import Path
from collections import Counter, defaultdict
from datetime import datetime, timezone

import clean_biblioteca as cb  # limpa_texto, chave_normalizada, aplica_ocr

ROOT = Path(__file__).resolve().parent.parent
RAW_BIB = ROOT / "data" / "raw" / "biblioteca_clausulas.json"
CLEAN_BIB = ROOT / "data" / "biblioteca_clausulas.json"
CORPUS_JSON = ROOT / "data" / "corpus_chamadas_2023-2026.json"
MANIFEST = ROOT / "data" / "pdf_text" / "manifest.json"
OUT_QUALITY = ROOT / "src" / "data" / "quality.json"
OUT_SUG = ROOT / "src" / "data" / "clausulas_sugeridas.json"


def cobertura_enriquecimento():
    """Quantas chamadas tiveram cada campo extraído do PDF — para o painel de
    honestidade (deixa explícito o que é máquina-extraído e imperfeito)."""
    corpus = json.loads(CORPUS_JSON.read_text(encoding="utf-8"))
    n = len(corpus)
    tem = lambda r, k: bool(r.get(k))
    enr = {
        "total": n,
        "com_texto": sum(1 for r in corpus if r.get("enriquecido")),
        "objeto": sum(1 for r in corpus if tem(r, "objeto")),
        "papel": sum(1 for r in corpus if tem(r, "papel")),
        "modalidade_canonica": sum(1 for r in corpus if tem(r, "modalidade_canonica")),
        "formacao": sum(1 for r in corpus if tem(r, "formacao")),
        "requisitos": sum(1 for r in corpus if tem(r, "requisitos")),
        "diretoria": sum(1 for r in corpus if tem(r, "diretoria")),
        "categoria_funcao": sum(1 for r in corpus if tem(r, "categoria_funcao")),
        "categoria_tema": sum(1 for r in corpus if tem(r, "categoria_tema")),
    }
    from collections import Counter
    _cat = Counter()
    for r in corpus:
        for c in ((r.get("vagas_por_cota") or {}).get("categorias") or []):
            _cat[c] += 1
    enr["cotas_com_reserva"] = sum(1 for r in corpus if (r.get("vagas_por_cota") or {}).get("tem_reserva"))
    enr["cotas_por_categoria"] = dict(_cat.most_common())
    if MANIFEST.exists():
        itens = json.loads(MANIFEST.read_text(encoding="utf-8")).get("itens", [])
        enr["pdf_404"] = sum(1 for e in itens if str(e.get("flag", "")).startswith("http_"))
        enr["texto_curto"] = sum(1 for e in itens if e.get("flag") == "texto_curto")
    return enr

# Sugestões SOMENTE para campos descritivos (fora do núcleo regulado): as cláusulas dos
# modelos antigos servem como padrões de descrição de projetos/atividades/perfil — não
# como texto regulado (esse vem da Portaria 317/2025). Rótulo -> categoria da biblioteca.
SUGESTOES = {
    "DEFINIÇÃO DO PROJETO": "OBJETO",
    "PERFIL E REQUISITOS": "REQUISITOS DOS CANDIDATOS",
    "ATIVIDADES": "ATIVIDADES QUE O CANDIDATO IRÁ DESENVOLVER",
    "CRITÉRIOS DE SELEÇÃO": "CRITÉRIOS DE JULGAMENTO",
}
TOP_SUG = 6
EN_RE = re.compile(r"\b(THE|OF|AND|REQUIREMENTS|SCHOLARSHIP|RESEARCH|PROJECT|TITLE|"
                   r"EXPECTED|CANDIDATE|MODALITY|CHRONOGRAM|OBJECT|OBJECTIVE|"
                   r"IDENTIFICATION|IMPLEMENTATION|REVOCATION|CHALLENGING|PURPOSE|"
                   r"RESERVATION|DURATION|QUANTITY|RESULTS|ACTIVITIES)\b")


def main():
    raw = json.loads(RAW_BIB.read_text(encoding="utf-8"))
    clean = json.loads(CLEAN_BIB.read_text(encoding="utf-8"))

    # frequência real de cada cláusula (texto limpo) por categoria canônica
    freq = defaultdict(Counter)
    for k, clausulas in raw.items():
        alvo = cb.chave_normalizada(k)
        for c in clausulas:
            ct = cb.limpa_texto(c)
            if len(ct) >= cb.MIN_LEN:
                freq[alvo][ct] += 1

    # sugestões: cláusulas mais comuns por categoria-alvo
    sugestoes = {}
    for rotulo, cat in SUGESTOES.items():
        norm = cb.chave_normalizada(cat)
        sugestoes[rotulo] = [c for c, _ in freq.get(norm, Counter()).most_common(TOP_SUG)]
    OUT_SUG.write_text(json.dumps(sugestoes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # métricas da biblioteca para a aba de Analytics
    counts = {k: len(v) for k, v in clean.items()}
    top = sorted(counts.items(), key=lambda x: -x[1])[:15]
    en = [k for k in clean if EN_RE.search(k.upper())]
    lens = [len(t) for v in clean.values() for t in v]
    hist = Counter(min(l // 250 * 250, 2000) for l in lens)
    # taxa de duplicação na semente (antes da limpeza), por categoria
    dup_por_cat = []
    var = []
    for k, clausulas in raw.items():
        norm = [cb.limpa_texto(c) for c in clausulas]
        if len(norm) >= 8:
            uniq = len(set(norm)) / len(norm)
            dup_por_cat.append([k, round(1 - uniq, 3)])
            var.append([k, round(uniq, 3)])
    dup_por_cat.sort(key=lambda x: -x[1])
    var.sort(key=lambda x: x[1])

    quality = {
        "gerado_em": datetime.now(timezone.utc).date().isoformat(),
        "proveniencia": {
            "corpus": {"semente": "data/raw/corpus_chamadas_2023-2026.json",
                       "snapshot": "2026-06 (raspagem do portal IPEA)"},
            "biblioteca_antes": {"categorias": len(raw), "clausulas": sum(len(v) for v in raw.values())},
            "biblioteca_depois": {"categorias": len(clean), "clausulas": sum(counts.values())},
        },
        "enriquecimento": cobertura_enriquecimento(),
        "biblioteca": {
            "top_categorias": top,
            "duplicacao_por_categoria": dup_por_cat[:15],
            "variabilidade": var[:12],
            "idioma": {"pt": len(clean) - len(en), "en": len(en)},
            "categorias_en": sorted(en),
            "tamanho_hist": {str(k): v for k, v in sorted(hist.items())},
            "tamanho_resumo": {"min": min(lens), "mediana": sorted(lens)[len(lens) // 2],
                                "media": round(sum(lens) / len(lens)), "max": max(lens)},
        },
    }
    OUT_QUALITY.write_text(json.dumps(quality, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"clausulas_sugeridas.json: " + ", ".join(f"{k}={len(v)}" for k, v in sugestoes.items()))
    print(f"quality.json: biblioteca {len(raw)}->{len(clean)} cat, "
          f"{quality['proveniencia']['biblioteca_antes']['clausulas']}->"
          f"{quality['proveniencia']['biblioteca_depois']['clausulas']} cláusulas, "
          f"{len(en)} EN")
    e = quality["enriquecimento"]
    print(f"enriquecimento: {e['com_texto']}/{e['total']} c/ texto | objeto {e['objeto']} | "
          f"papel {e['papel']} | diretoria {e['diretoria']} | "
          f"função {e['categoria_funcao']} | tema {e['categoria_tema']} | cotas {e['cotas_com_reserva']}")


if __name__ == "__main__":
    main()
