#!/usr/bin/env python3
"""Porta de qualidade dos dados canônicos. Sai com código != 0 em qualquer violação.
Roda no CI antes do build."""
import json, re, sys
from pathlib import Path
from datetime import date

ROOT = Path(__file__).resolve().parent.parent
CORPUS = ROOT / "data" / "corpus_chamadas_2023-2026.json"
BIB = ROOT / "data" / "biblioteca_clausulas.json"

PROGRAMAS = {"PIPA", "PROCIN", "PROMOB"}
SITUACOES = {"ABERTA", "FECHADA"}
ANOS = {"2023", "2024", "2025", "2026"}


def main():
    erros = []

    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    if not isinstance(corpus, list) or len(corpus) != 253:
        erros.append(f"corpus: esperado lista de 253, obtido {len(corpus)}")
    for i, r in enumerate(corpus):
        if r.get("programa") not in PROGRAMAS:
            erros.append(f"corpus[{i}] programa inválido: {r.get('programa')!r}")
        if r.get("situacao") not in SITUACOES:
            erros.append(f"corpus[{i}] situacao inválida: {r.get('situacao')!r}")
        if str(r.get("ano")) not in ANOS:
            erros.append(f"corpus[{i}] ano fora do intervalo: {r.get('ano')!r}")
        for campo in ("prazo_ini_iso", "prazo_fim_iso"):
            v = r.get(campo)
            if v is not None:
                try:
                    date.fromisoformat(v)
                except ValueError:
                    erros.append(f"corpus[{i}] {campo} não-ISO: {v!r}")
        if not isinstance(r.get("pdf_urls"), list):
            erros.append(f"corpus[{i}] pdf_urls não é lista")

    bib = json.loads(BIB.read_text(encoding="utf-8"))
    if not isinstance(bib, dict):
        erros.append("biblioteca: esperado objeto {categoria: [clausulas]}")
    vistas = {}
    for cat, clausulas in bib.items():
        nk = re.sub(r"\s+", "", cat).upper()
        if nk in vistas:
            erros.append(f"biblioteca: chave duplicada após normalização: {cat!r} ~ {vistas[nk]!r}")
        vistas[nk] = cat
        for c in clausulas:
            if "\n" in c or "\r" in c:
                erros.append(f"biblioteca[{cat!r}] cláusula com quebra de linha")
                break
            if c != c.strip() or "  " in c:
                erros.append(f"biblioteca[{cat!r}] cláusula com espaçamento não normalizado")
                break
        if len(clausulas) != len(set(clausulas)):
            erros.append(f"biblioteca[{cat!r}] contém duplicatas exatas")

    if erros:
        print(f"❌ VALIDAÇÃO FALHOU — {len(erros)} problema(s):")
        for e in erros[:40]:
            print("  -", e)
        sys.exit(1)
    print(f"✅ dados válidos — corpus: {len(corpus)} registros | biblioteca: {len(bib)} categorias")


if __name__ == "__main__":
    main()
