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


def _regiao_quadro(texto):
    """Recorta a região do quadro 3.1. Aceita o gatilho 'quadro a seguir' OU, na falta
    dele, o cabeçalho 'Vagas imediatas' (recuando p/ pegar a linha de cabeçalho). Corta no
    fim da tabela (3.2 / 'Não haverá' / legenda 'AC: Ampla' / 'Portaria')."""
    m = re.search(r"quadro a seguir", texto, re.I)
    start = m.start() if m else None
    if start is None:
        m = re.search(r"vagas imediatas", texto, re.I)
        if not m:
            return None
        start = max(0, m.start() - 200)
    win = texto[start: start + 2600]
    return re.split(r"\n\s*3\.2[\.\)]|N[ãa]o haver[áa]|Portaria n[ºo°]|\bAC\s*[:\-]\s*Ampla", win)[0]


def _celulas_por_ancora(win):
    """Layout comum: as 8 células vêm DEPOIS do 'R$ <valor>'. Lê de cada âncora 'R$' até a
    próxima (ou fim), atravessando quebras de linha (robusto a linha quebrada na extração).
    Devolve (grupos_de_8, puladas) — pula seleção truncada sem derrubar o quadro."""
    anchors = [m.start() for m in re.finditer(r"R\$\s*[\d.,]+", win)]
    if not anchors:
        return [], 0
    anchors.append(len(win))
    grupos, puladas = [], 0
    for i in range(len(anchors) - 1):
        span = re.sub(r"^\s*R\$\s*[\d.,]+", "", win[anchors[i]: anchors[i + 1]], count=1)
        cels = re.findall(r"\*|\d+", span)
        if len(cels) >= 8:
            grupos.append(cels[:8])
        else:
            puladas += 1
    return grupos, puladas


def _celulas_por_run(win):
    """Layout alternativo (seleção única): as 8 células vêm ANTES do 'R$', na linha do
    candidato/modalidade. Varre runs de 8 células `*`/número na mesma linha, já sem os
    valores monetários (removidos), evitando confundir rótulo de seleção e cifras."""
    limpo = re.sub(r"R\$\s*[\d.,]+", " ", win)
    return [re.findall(r"\*|\d+", m.group(0)) for m in
            re.finditer(r"(?<![\d*])(?:\*|\d{1,2})(?:[ \t]+(?:\*|\d{1,2})){7}(?![\d*])", limpo)]


def extrai_quadro(texto):
    """Soma as vagas do quadro 3.1 por categoria (AC ER M PCD, imediatas + reserva; `*`=0).
    Robusto à extração do PDF: tenta o layout 'células após R$' e, se nada casar, o layout
    'células antes do R$' (seleção única). Não inventa: sanidade descarta números absurdos
    (total 0, total > 2000 ou reservadas > total)."""
    win = _regiao_quadro(texto)
    if not win:
        return None
    grupos, puladas = _celulas_por_ancora(win)
    if not grupos:
        grupos, puladas = _celulas_por_run(win), 0
    if not grupos:
        return None
    agg = {c: 0 for c in QUADRO_COLS}
    for cels in grupos:
        nums = [0 if c == "*" else int(c) for c in cels[:8]]
        for col, imed, res in zip(QUADRO_COLS, nums[0:4], nums[4:8]):
            agg[col] += imed + res
    total = sum(agg.values())
    reservadas = agg["ER"] + agg["M"] + agg["PCD"]
    if total <= 0 or total > 2000 or reservadas > total:
        return None
    return {
        "total": total,
        "ampla_concorrencia": agg["AC"],
        "reservadas": reservadas,
        "por_categoria": {"Étnico-racial": agg["ER"], "Mulheres": agg["M"], "PCD": agg["PCD"]},
        "selecoes": len(grupos),
        **({"selecoes_puladas": puladas} if puladas else {}),
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
