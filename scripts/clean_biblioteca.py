#!/usr/bin/env python3
"""Limpa a biblioteca de cláusulas (data/raw -> data/). Idempotente.

- Funde chaves duplicadas por OCR/espaço (ex.: 'CLÁUSULA DE RESERV A').
- Desfaz quebras de linha de PDF (\\n -> espaço) e colapsa espaços.
- Corrige token-splits de OCR conhecidos.
- Deduplica cláusulas idênticas dentro da categoria; remove lixo (<25 chars).
Estrutura de saída preservada: { CATEGORIA: [clausula, ...] }.
"""
import json, re
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "biblioteca_clausulas.json"
OUT = ROOT / "data" / "biblioteca_clausulas.json"

MIN_LEN = 25  # cláusulas menores são lixo de extração

# Correções pontuais de OCR (aplicadas a chaves e textos)
OCR_FIX = {
    "V ALOR": "VALOR", "RESERV A": "RESERVA", "EDURAÇÃO": "E DURAÇÃO",
    "APROV ADOS": "APROVADOS", "TRABA LHO": "TRABALHO", "RESERV A": "RESERVA",
    "CANDIDATO S": "CANDIDATOS", "ESCLARECIMENT OS": "ESCLARECIMENTOS",
}


def aplica_ocr(s):
    for bad, good in OCR_FIX.items():
        s = s.replace(bad, good).replace(bad.title(), good.title())
    return s


def limpa_texto(t):
    t = t.replace("\r", " ").replace("\n", " ")
    t = aplica_ocr(t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


_SPLIT = re.compile(r"(?<![A-Za-zÀ-ú])[A-Za-zÀ-ú] ")


def feiura(chave):
    """Quanto maior, mais 'suja' a chave (letras isoladas, espaços duplos)."""
    return len(_SPLIT.findall(chave)) + chave.count("  ")


def chave_normalizada(k):
    return re.sub(r"\s+", "", aplica_ocr(k)).upper()


def main():
    raw = json.loads(RAW.read_text(encoding="utf-8"))
    antes_categorias = len(raw)
    antes_clausulas = sum(len(v) for v in raw.values())

    # 1) agrupa chaves equivalentes e escolhe a canônica (menos feia; desempata por volume)
    grupos = defaultdict(list)
    for k in raw:
        grupos[chave_normalizada(k)].append(k)
    canonica = {}
    for _, ks in grupos.items():
        melhor = min(ks, key=lambda k: (feiura(k), -len(raw[k])))
        for k in ks:
            canonica[k] = limpa_texto(melhor)

    # 2) funde, limpa, deduplica preservando ordem
    limpo = {}
    dup_removidas = lixo_removido = 0
    for k, clausulas in raw.items():
        alvo = canonica[k]
        bucket = limpo.setdefault(alvo, {"vistos": set(), "lista": []})
        for c in clausulas:
            ct = limpa_texto(c)
            if len(ct) < MIN_LEN:
                lixo_removido += 1
                continue
            if ct in bucket["vistos"]:
                dup_removidas += 1
                continue
            bucket["vistos"].add(ct)
            bucket["lista"].append(ct)

    final = {k: v["lista"] for k, v in limpo.items()}
    OUT.write_text(json.dumps(final, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    depois_clausulas = sum(len(v) for v in final.values())
    print(f"biblioteca: categorias {antes_categorias} -> {len(final)}")
    print(f"            cláusulas {antes_clausulas} -> {depois_clausulas} "
          f"(dup removidas: {dup_removidas}, lixo: {lixo_removido})")
    # checagem: nenhuma chave equivalente sobrou
    assert len({chave_normalizada(k) for k in final}) == len(final), "ainda há chaves equivalentes!"
    print("            chaves únicas: OK")


if __name__ == "__main__":
    main()
