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
OUT_QUALITY = ROOT / "src" / "data" / "quality.json"
OUT_SUG = ROOT / "src" / "data" / "clausulas_sugeridas.json"

# Categorias oferecidas como sugestão nos campos livres do construtor
SUGESTOES = {
    "OBJETO": "OBJETO",
    "REQUISITOS DOS CANDIDATOS": "REQUISITOS DOS CANDIDATOS",
    "CRITÉRIOS DE JULGAMENTO": "CRITÉRIOS DE JULGAMENTO",
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


if __name__ == "__main__":
    main()
