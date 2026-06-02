#!/usr/bin/env python3
"""Classificador por regras, DATA-DRIVEN. Lê data/taxonomia.json e marca, em cada
chamada, categoria_funcao[] e categoria_tema[] (multi-rótulo) a partir de
objeto+projeto+papel+modalidades+requisitos+formação.

Re-rodável de forma barata: edite data/taxonomia.json e rode `python scripts/classify.py`
— não precisa re-baixar (fetch) nem re-enriquecer. Casamento por substring sem acentos.
Último passo antes de build_app_data.py.
"""
import json, unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CORPUS = ROOT / "data" / "corpus_chamadas_2023-2026.json"
TAX = ROOT / "data" / "taxonomia.json"


def sa(s):
    return "".join(c for c in unicodedata.normalize("NFD", s or "")
                   if unicodedata.category(c) != "Mn").lower()


def haystack(r):
    parts = [r.get("objeto"), r.get("projeto"), r.get("projeto_vinculado"), r.get("papel"),
             " ".join(r.get("modalidades_extraidas") or []),
             " ".join(r.get("requisitos") or []),
             " ".join(r.get("formacao") or [])]
    return sa(" ".join(p for p in parts if p))


def classifica(r, tax):
    h = haystack(r)
    out = {}
    for eixo, cats in tax.items():
        if eixo.startswith("_"):
            continue
        out[eixo] = [c for c, kws in cats.items() if any(sa(k) in h for k in kws)]
    return out


def main():
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    tax = json.loads(TAX.read_text(encoding="utf-8"))
    cf, ct, nf, nt = Counter(), Counter(), 0, 0
    for r in corpus:
        res = classifica(r, tax)
        r["categoria_funcao"] = res.get("FUNCAO", [])
        r["categoria_tema"] = res.get("TEMA", [])
        nf += bool(r["categoria_funcao"])
        nt += bool(r["categoria_tema"])
        for x in r["categoria_funcao"]:
            cf[x] += 1
        for x in r["categoria_tema"]:
            ct[x] += 1
    CORPUS.write_text(json.dumps(corpus, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"classificados: função {nf}/{len(corpus)} | tema {nt}/{len(corpus)}")
    print("  FUNÇÃO:", dict(cf.most_common()))
    print("  TEMA:  ", dict(ct.most_common()))


if __name__ == "__main__":
    main()
