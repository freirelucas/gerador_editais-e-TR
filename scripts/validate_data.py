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
DIRETORIAS = {"DIMAC", "DISOC", "DIRUR", "DISET", "DINTE", "DIEST", "DIDES"}


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
        # campos enriquecidos: OPCIONAIS — valida só a forma quando presentes,
        # nunca exige (gate passa com ou sem enriquecimento).
        for campo in ("modalidades_extraidas", "formacao", "requisitos", "atividades",
                      "valores_brl", "categoria_funcao", "categoria_tema"):
            if campo in r and not isinstance(r[campo], list):
                erros.append(f"corpus[{i}] {campo} deveria ser lista")
        for campo in ("objeto", "papel", "modalidade_canonica"):
            if r.get(campo) is not None and not isinstance(r[campo], str):
                erros.append(f"corpus[{i}] {campo} deveria ser string")
        if r.get("diretoria") is not None and r["diretoria"] not in DIRETORIAS:
            erros.append(f"corpus[{i}] diretoria inválida: {r['diretoria']!r}")
        vc = r.get("vagas_por_cota")
        if vc is not None:
            if not isinstance(vc, dict):
                erros.append(f"corpus[{i}] vagas_por_cota deveria ser dict|null")
            elif not isinstance(vc.get("categorias", []), list):
                erros.append(f"corpus[{i}] vagas_por_cota.categorias deveria ser lista")

    tax = ROOT / "data" / "taxonomia.json"
    if tax.exists():
        try:
            t = json.loads(tax.read_text(encoding="utf-8"))
            assert isinstance(t, dict) and any(k in t for k in ("FUNCAO", "TEMA"))
        except (json.JSONDecodeError, AssertionError) as ex:
            erros.append(f"taxonomia.json inválida: {ex}")

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
