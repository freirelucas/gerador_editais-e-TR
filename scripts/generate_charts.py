#!/usr/bin/env python3
"""Varredura exploratória: gera ~100 gráficos do corpus e da biblioteca em
analytics/charts/ (PNG) + analytics/index.md. Enumeração sistemática
(dimensão × recorte × métrica) — não é preenchimento artificial.

Os destaques curados vão para analytics/REPORT.md (escrito à mão após inspeção).
"""
import json, re, sys
from pathlib import Path
from collections import Counter, defaultdict
from datetime import date

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

sys.path.insert(0, str(Path(__file__).resolve().parent))
import clean_biblioteca as cb

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "analytics" / "charts"
OUT.mkdir(parents=True, exist_ok=True)
corpus = json.loads((ROOT / "data" / "corpus_chamadas_2023-2026.json").read_text(encoding="utf-8"))
bib = json.loads((ROOT / "data" / "biblioteca_clausulas.json").read_text(encoding="utf-8"))
raw_bib = json.loads((ROOT / "data" / "raw" / "biblioteca_clausulas.json").read_text(encoding="utf-8"))

PAPER, INK, CERRADO, TERRA, GOLD, LINE = "#f4f0e6", "#1c1a14", "#3d5a3d", "#8a4b2b", "#9a7d2e", "#cdc4ad"
COR_PROG = {"PIPA": CERRADO, "PROMOB": TERRA, "PROCIN": GOLD}
PROGRAMAS, ANOS = ["PIPA", "PROCIN", "PROMOB"], ["2023", "2024", "2025", "2026"]
MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
STOP = set("de da do das dos e a o as os para com no na nos nas em um uma sobre por que à á ao aos pela pelo".split())

plt.rcParams.update({"figure.facecolor": PAPER, "axes.facecolor": "#fffdf7", "font.size": 10,
                     "axes.edgecolor": LINE, "axes.titlesize": 12, "text.color": INK,
                     "axes.labelcolor": INK, "xtick.color": INK, "ytick.color": INK})

INDEX, N = [], 0
def save(fig, title):
    global N
    N += 1
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:55]
    fn = f"{N:03d}_{slug}.png"
    fig.suptitle(title, fontweight="bold")
    fig.tight_layout()
    fig.savefig(OUT / fn, dpi=96)
    plt.close(fig)
    INDEX.append((N, title, fn))

def fig():
    return plt.subplots(figsize=(6.4, 3.8))

def barra(labels, vals, title, cor=CERRADO, h=False):
    f, ax = fig()
    (ax.barh(labels, vals, color=cor) if h else ax.bar(labels, vals, color=cor))
    if h: ax.invert_yaxis()
    else: ax.tick_params(axis="x", rotation=0)
    save(f, title)

def pizza(labels, vals, title, cores=None):
    f, ax = fig()
    ax.pie(vals, labels=labels, autopct="%1.0f%%", colors=cores, textprops={"fontsize": 9})
    save(f, title)

def hist(vals, title, bins=15, cor=CERRADO):
    if not vals: return
    f, ax = fig(); ax.hist(vals, bins=bins, color=cor, edgecolor=PAPER); save(f, title)

def temas(regs, k=10):
    c = Counter()
    for r in regs:
        for w in re.findall(r"[a-zà-ú]{4,}", (r.get("projeto") or "").lower()):
            if w not in STOP: c[w] += 1
    return c.most_common(k)

def janelas(regs):
    return [r["janela_dias"] for r in regs if isinstance(r.get("janela_dias"), int) and r["janela_dias"] >= 0]

def mes_de(r):
    return int(r["prazo_ini_iso"].split("-")[1]) if r.get("prazo_ini_iso") else None

# ---------------- A. Visão geral ----------------
barra(ANOS, [sum(c["ano"] == a for c in corpus) for a in ANOS], "Chamadas por ano")
barra(PROGRAMAS, [sum(c["programa"] == p for c in corpus) for p in PROGRAMAS], "Chamadas por programa", cor=TERRA)
pizza(PROGRAMAS, [sum(c["programa"] == p for c in corpus) for p in PROGRAMAS], "Participação por programa", [COR_PROG[p] for p in PROGRAMAS])
sit = Counter(c["situacao"] for c in corpus)
pizza(list(sit), list(sit.values()), "Situação (snapshot)", [CERRADO, LINE])
# stacked + grouped programa×ano
mat = {p: [sum(c["ano"] == a and c["programa"] == p for c in corpus) for a in ANOS] for p in PROGRAMAS}
f, ax = fig(); base = [0] * len(ANOS)
for p in ["PROMOB", "PIPA", "PROCIN"]:
    ax.bar(ANOS, mat[p], bottom=base, label=p, color=COR_PROG[p]); base = [b + v for b, v in zip(base, mat[p])]
ax.legend(); save(f, "Programa por ano (empilhado)")
f, ax = fig(); import numpy as np; x = np.arange(len(ANOS)); w = 0.25
for i, p in enumerate(PROGRAMAS): ax.bar(x + (i - 1) * w, mat[p], w, label=p, color=COR_PROG[p])
ax.set_xticks(x); ax.set_xticklabels(ANOS); ax.legend(); save(f, "Programa por ano (agrupado)")
f, ax = fig(); ax.plot(ANOS, [sum(c["ano"] == a for c in corpus) for a in ANOS], "-o", color=CERRADO); save(f, "Tendência de chamadas por ano")
f, ax = fig(); cum = np.cumsum([sum(c["ano"] == a for c in corpus) for a in ANOS]); ax.plot(ANOS, cum, "-o", color=TERRA); save(f, "Chamadas acumuladas")
for p in PROGRAMAS:
    f, ax = fig(); share = [100 * mat[p][i] / max(1, sum(mat[q][i] for q in PROGRAMAS)) for i in range(len(ANOS))]
    ax.plot(ANOS, share, "-o", color=COR_PROG[p]); ax.set_ylabel("% do ano"); save(f, f"Participação de {p} por ano (%)")
# meses / dia-da-semana
ab = Counter(m for m in (mes_de(c) for c in corpus) if m)
barra(MESES, [ab.get(i + 1, 0) for i in range(12)], "Abertura de inscrições por mês (todos)", cor=GOLD)
import datetime as _dt
wd = Counter(_dt.date.fromisoformat(c["prazo_ini_iso"]).weekday() for c in corpus if c.get("prazo_ini_iso"))
barra(["seg", "ter", "qua", "qui", "sex", "sáb", "dom"], [wd.get(i, 0) for i in range(7)], "Abertura por dia da semana", cor=GOLD)
hist(janelas(corpus), "Janela de inscrição — dias (todos)")
labels = [c.get("titulo", "") for c in corpus]
hist([len(c.get("projeto") or "") for c in corpus], "Tamanho do título do projeto (chars)", cor=TERRA)
hist([len(c.get("pdf_urls") or []) for c in corpus], "PDFs por chamada", bins=8, cor=GOLD)
comp = {"prog": 100, "datas": round(100 * sum(bool(c.get("prazo_ini_iso")) for c in corpus) / len(corpus)),
        "modalid.": round(100 * sum(bool(c.get("modalidade")) for c in corpus) / len(corpus)),
        "qtd": round(100 * sum(c.get("qtd_bolsas") is not None for c in corpus) / len(corpus))}
barra(list(comp), list(comp.values()), "Completude dos campos (%)", cor=TERRA)
flags = Counter(fl for c in corpus for fl in c.get("flags", []))
barra(list(flags), list(flags.values()), "Sinalizações de qualidade", cor=TERRA, h=True)
md = Counter(c["modalidade"] for c in corpus if c.get("modalidade"))
barra([m[:22] for m, _ in md.most_common(10)], [v for _, v in md.most_common(10)], "Modalidades (texto bruto, top 10)", h=True)
mdc = Counter(c["modalidade_canonica"] for c in corpus if c.get("modalidade_canonica"))
if mdc: barra(list(mdc), list(mdc.values()), "Modalidades canônicas mapeadas", h=True)
tt = temas(corpus, 12); barra([t for t, _ in tt], [v for _, v in tt], "Temas mais frequentes (todos)", cor=TERRA, h=True)

# ---------------- B. Por programa ----------------
for p in PROGRAMAS:
    regs = [c for c in corpus if c["programa"] == p]
    if not regs: continue
    barra(ANOS, [sum(c["ano"] == a for c in regs) for a in ANOS], f"{p}: chamadas por ano", cor=COR_PROG[p])
    hist(janelas(regs), f"{p}: janela de inscrição (dias)", cor=COR_PROG[p])
    tt = temas(regs, 8)
    if tt: barra([t for t, _ in tt], [v for _, v in tt], f"{p}: temas mais frequentes", cor=COR_PROG[p], h=True)
    s = Counter(c["situacao"] for c in regs); pizza(list(s), list(s.values()), f"{p}: situação", [CERRADO, LINE])
    ab = Counter(m for m in (mes_de(c) for c in regs) if m)
    barra(MESES, [ab.get(i + 1, 0) for i in range(12)], f"{p}: abertura por mês", cor=COR_PROG[p])

# ---------------- C. Por ano ----------------
for a in ANOS:
    regs = [c for c in corpus if c["ano"] == a]
    mix = Counter(c["programa"] for c in regs)
    pizza(list(mix), list(mix.values()), f"{a}: mix de programas", [COR_PROG.get(k, GOLD) for k in mix])
    tt = temas(regs, 8)
    if tt: barra([t for t, _ in tt], [v for _, v in tt], f"{a}: temas mais frequentes", h=True)
    hist(janelas(regs), f"{a}: janela de inscrição (dias)", cor=GOLD)
    ab = Counter(m for m in (mes_de(c) for c in regs) if m)
    barra(MESES, [ab.get(i + 1, 0) for i in range(12)], f"{a}: abertura por mês", cor=CERRADO)

# ---------------- D. Janela detalhada ----------------
f, ax = fig(); ax.boxplot([janelas([c for c in corpus if c["programa"] == p]) or [0] for p in PROGRAMAS], labels=PROGRAMAS); save(f, "Janela por programa (boxplot)")
f, ax = fig(); ax.boxplot([janelas([c for c in corpus if c["ano"] == a]) or [0] for a in ANOS], labels=ANOS); save(f, "Janela por ano (boxplot)")
js = sorted(janelas(corpus)); f, ax = fig(); ax.plot(js, [i / len(js) for i in range(len(js))], color=CERRADO); ax.set_xlabel("dias"); ax.set_ylabel("ECDF"); save(f, "ECDF da janela de inscrição")

# ---------------- E. Temas por recorte ----------------
for p in PROGRAMAS:
    tt = temas([c for c in corpus if c["programa"] == p], 6)
    if tt: barra([t for t, _ in tt], [v for _, v in tt], f"Temas — {p}", cor=COR_PROG[p], h=True)
for a in ANOS:
    tt = temas([c for c in corpus if c["ano"] == a], 6)
    if tt: barra([t for t, _ in tt], [v for _, v in tt], f"Temas — {a}", h=True)

# ---------------- F. Biblioteca ----------------
counts = sorted(((k, len(v)) for k, v in bib.items()), key=lambda x: -x[1])
barra([k[:24] for k, _ in counts[:20]], [v for _, v in counts[:20]], "Biblioteca: cláusulas por categoria (top 20)", h=True)
# dup e variabilidade na semente
dup, var = [], []
for k, cl in raw_bib.items():
    norm = [cb.limpa_texto(c) for c in cl]
    if len(norm) >= 8:
        u = len(set(norm)) / len(norm); dup.append((k, 1 - u)); var.append((k, u))
dup.sort(key=lambda x: -x[1]); var.sort(key=lambda x: x[1])
barra([k[:24] for k, _ in dup[:15]], [round(100 * v) for _, v in dup[:15]], "Biblioteca: duplicação na semente (%) top 15", cor=TERRA, h=True)
barra([k[:24] for k, _ in var[:15]], [round(100 * v) for _, v in var[:15]], "Biblioteca: menor variabilidade (% único)", h=True)
lens = [len(t) for v in bib.values() for t in v]
hist(lens, "Biblioteca: tamanho das cláusulas (chars)", bins=30)
hist([l for l in lens if l < 2000], "Biblioteca: tamanho (<2000 chars)", bins=30, cor=GOLD)
EN_RE = re.compile(r"\b(THE|OF|AND|REQUIREMENTS|SCHOLARSHIP|RESEARCH|PROJECT|TITLE|EXPECTED|CANDIDATE|MODALITY|CHRONOGRAM|OBJECT|OBJECTIVE|PURPOSE|RESERVATION|DURATION|QUANTITY|RESULTS|ACTIVITIES)\b")
en = [k for k in bib if EN_RE.search(k.upper())]
pizza(["Português", "Inglês"], [len(bib) - len(en), len(en)], "Biblioteca: idioma das categorias", [CERRADO, TERRA])
barra(["antes", "depois"], [len(raw_bib), len(bib)], "Biblioteca: categorias antes/depois", cor=GOLD)
barra(["antes", "depois"], [sum(len(v) for v in raw_bib.values()), sum(len(v) for v in bib.values())], "Biblioteca: cláusulas antes/depois", cor=GOLD)
medianas = sorted(((k, sorted(len(t) for t in v)[len(v) // 2]) for k, v in bib.items() if len(v) >= 10), key=lambda x: -x[1])[:15]
barra([k[:24] for k, _ in medianas], [v for _, v in medianas], "Biblioteca: tamanho mediano por categoria (top 15)", h=True)
f, ax = fig()
xs = [len(v) for v in bib.values()]; ys = [sum(len(t) for t in v) / len(v) for v in bib.values()]
ax.scatter(xs, ys, color=CERRADO, alpha=.6); ax.set_xlabel("nº de cláusulas"); ax.set_ylabel("tamanho médio")
save(f, "Biblioteca: nº de cláusulas × tamanho médio")

# ---------------- G. Extras temporais ----------------
fim = Counter(int(c["prazo_fim_iso"].split("-")[1]) for c in corpus if c.get("prazo_fim_iso"))
barra(MESES, [fim.get(i + 1, 0) for i in range(12)], "Encerramento de inscrições por mês", cor=TERRA)
ym = Counter(c["prazo_ini_iso"][:7] for c in corpus if c.get("prazo_ini_iso"))
keys = sorted(ym)
f, ax = fig(); ax.plot(range(len(keys)), [ym[k] for k in keys], color=CERRADO)
ax.set_xticks(range(0, len(keys), 6)); ax.set_xticklabels([keys[i] for i in range(0, len(keys), 6)], rotation=45, fontsize=7)
save(f, "Série mensal de aberturas (2023–2026)")
def tri(m): return (m - 1) // 3 + 1
trishow = Counter(tri(mes_de(c)) for c in corpus if mes_de(c))
barra([f"T{i}" for i in range(1, 5)], [trishow.get(i, 0) for i in range(1, 5)], "Chamadas por trimestre (todos)", cor=GOLD)
for a in ANOS:
    t = Counter(tri(mes_de(c)) for c in corpus if c["ano"] == a and mes_de(c))
    barra([f"T{i}" for i in range(1, 5)], [t.get(i, 0) for i in range(1, 5)], f"{a}: chamadas por trimestre", cor=CERRADO)
for p in PROGRAMAS:
    regs = [c for c in corpus if c["programa"] == p]
    f, ax = fig(); ax.boxplot([janelas([c for c in regs if c["ano"] == a]) or [0] for a in ANOS], tick_labels=ANOS)
    save(f, f"{p}: janela por ano (boxplot)")
    hist([len(c.get("projeto") or "") for c in regs], f"{p}: tamanho do título (chars)", cor=COR_PROG[p])
barra(ANOS, [round(sum(janelas([c for c in corpus if c["ano"] == a])) / max(1, len(janelas([c for c in corpus if c["ano"] == a]))), 1) for a in ANOS], "Janela média por ano (dias)", cor=TERRA)
barra(PROGRAMAS, [round(sum(janelas([c for c in corpus if c["programa"] == p])) / max(1, len(janelas([c for c in corpus if c["programa"] == p]))), 1) for p in PROGRAMAS], "Janela média por programa (dias)", cor=CERRADO)
# heatmaps mês×ano (abertura / encerramento)
for campo, nome in [("prazo_ini_iso", "abertura"), ("prazo_fim_iso", "encerramento")]:
    M = [[0] * 12 for _ in ANOS]
    for c in corpus:
        if c.get(campo):
            y, m = c[campo].split("-")[0], int(c[campo].split("-")[1])
            if y in ANOS: M[ANOS.index(y)][m - 1] += 1
    f, ax = fig(); im = ax.imshow(M, cmap="YlGn", aspect="auto")
    ax.set_xticks(range(12)); ax.set_xticklabels(MESES, fontsize=7); ax.set_yticks(range(len(ANOS))); ax.set_yticklabels(ANOS)
    f.colorbar(im, ax=ax); save(f, f"Heatmap mês×ano — {nome}")
# completude/flags por recorte (empilhado)
f, ax = fig(); base = [0, 0, 0]
com = [sum(1 for c in corpus if c["programa"] == p and c.get("modalidade")) for p in PROGRAMAS]
sem = [sum(1 for c in corpus if c["programa"] == p and not c.get("modalidade")) for p in PROGRAMAS]
ax.bar(PROGRAMAS, com, label="com modalidade", color=CERRADO); ax.bar(PROGRAMAS, sem, bottom=com, label="sem", color=LINE)
ax.legend(); save(f, "Modalidade preenchida × programa")
f, ax = fig()
comq = [sum(1 for c in corpus if c["ano"] == a and c.get("qtd_bolsas") is not None) for a in ANOS]
semq = [sum(1 for c in corpus if c["ano"] == a and c.get("qtd_bolsas") is None) for a in ANOS]
ax.bar(ANOS, comq, label="com qtd", color=CERRADO); ax.bar(ANOS, semq, bottom=comq, label="sem", color=LINE)
ax.legend(); save(f, "Qtd. de bolsas preenchida × ano")

# ---------------- H. Biblioteca extra ----------------
hist([len(v) for v in bib.values()], "Biblioteca: nº de cláusulas por categoria", bins=20, cor=GOLD)
barra([k[:22] for k, _ in counts[:30]], [v for _, v in counts[:30]], "Biblioteca: cláusulas por categoria (top 30)", h=True)
hist([1 - len(set(cb.limpa_texto(c) for c in cl)) / len(cl) for cl in raw_bib.values() if len(cl) >= 4], "Biblioteca: distribuição da taxa de duplicação", bins=20, cor=TERRA)
lens_pt = [len(t) for k, v in bib.items() for t in v if k not in en]
lens_en = [len(t) for k, v in bib.items() for t in v if k in en]
hist(lens_pt, "Biblioteca: tamanho das cláusulas PT", bins=25)
hist(lens_en, "Biblioteca: tamanho das cláusulas EN", bins=15, cor=TERRA)
en_counts = sorted(((k, len(bib[k])) for k in en), key=lambda x: -x[1])
if en_counts: barra([k[:24] for k, _ in en_counts], [v for _, v in en_counts], "Biblioteca: cláusulas por categoria EN", cor=TERRA, h=True)
tt = temas(corpus, 20); barra([t for t, _ in tt], [v for _, v in tt], "Temas mais frequentes (top 20)", cor=TERRA, h=True)
hist([len((c.get("projeto") or "").split()) for c in corpus], "Nº de palavras no título do projeto", bins=20, cor=CERRADO)

# ---------------- I. Fechamento (rumo a 100) ----------------
um = sum(1 for c in corpus if len(c.get("pdf_urls") or []) == 1)
mult = sum(1 for c in corpus if len(c.get("pdf_urls") or []) > 1)
pizza(["1 PDF", "2+ PDFs"], [um, mult], "Chamadas: 1 vs múltiplos PDFs", [LINE, CERRADO])
med_pt = sorted(lens_pt)[len(lens_pt) // 2] if lens_pt else 0
med_en = sorted(lens_en)[len(lens_en) // 2] if lens_en else 0
barra(["PT", "EN"], [med_pt, med_en], "Biblioteca: tamanho mediano PT × EN (chars)", cor=GOLD)
f, ax = fig(); x = np.arange(len(ANOS)); w = 0.25
for i, p in enumerate(PROGRAMAS):
    medias = [round(sum(janelas([c for c in corpus if c["ano"] == a and c["programa"] == p])) /
                    max(1, len(janelas([c for c in corpus if c["ano"] == a and c["programa"] == p]))), 1) for a in ANOS]
    ax.bar(x + (i - 1) * w, medias, w, label=p, color=COR_PROG[p])
ax.set_xticks(x); ax.set_xticklabels(ANOS); ax.set_ylabel("dias"); ax.legend(); save(f, "Janela média por programa × ano")
barra(["Português", "Inglês"], [len(bib) - len(en), len(en)], "Biblioteca: nº de categorias por idioma", cor=CERRADO)

# ---------------- índice ----------------
idx = ["# Índice da varredura de gráficos\n", f"> {N} gráficos gerados em {date.today()}. ",
       "Reproduza com `python scripts/generate_charts.py`.\n"]
for n, title, fn in INDEX:
    idx.append(f"{n:>3}. **{title}** — `charts/{fn}`")
(ROOT / "analytics" / "index.md").write_text("\n".join(idx) + "\n", encoding="utf-8")
print(f"✅ {N} gráficos em analytics/charts/ + analytics/index.md")
