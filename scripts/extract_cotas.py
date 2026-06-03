#!/usr/bin/env python3
"""Extrai a estrutura de RESERVA DE VAGAS (cotas) de cada chamada a partir do cache de
texto dos editais (data/pdf_text/), gravando `vagas_por_cota` no corpus. Offline e
re-rodável (mesmo padrão do classify.py): edite as listas e rode
`python scripts/extract_cotas.py`.

Conservador e honesto: detecta reserva EXPLÍCITA (reserva de vaga / cota / ação afirmativa
/ heteroidentificação) e quais categorias (Étnico-racial / Mulheres / PCD / Indígena /
Quilombola) aparecem nesse contexto. NÃO infere contagens exatas por categoria — o quadro
AC/ER/M/PCD tem formato muito variável entre os editais, então registramos presença, não
números (o wizard, esse sim, produz o quadro numérico para chamadas novas).
"""
import json
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


def extrai_cotas(texto):
    h = sa(texto)
    hetero = "heteroidentifica" in h
    if not any(k in h for k in RESERVA):
        return {"tem_reserva": False, "categorias": [], "heteroidentificacao": hetero}
    cats = [nome for nome, kws in CATS.items() if any(k in h for k in kws)]
    return {"tem_reserva": True, "categorias": cats, "heteroidentificacao": hetero}


def main():
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    usados = set()
    n_txt = n_res = n_hetero = 0
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
                continue
        reg["vagas_por_cota"] = None
    CORPUS.write_text(json.dumps(corpus, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"cotas: {n_res}/{n_txt} chamadas com reserva explícita "
          f"(de {len(corpus)} no total) | heteroidentificação em {n_hetero}")
    print("  por categoria:", dict(cat_count.most_common()))


if __name__ == "__main__":
    main()
