#!/usr/bin/env python3
"""Enriquecimento por chamada a partir do cache de texto dos editais (data/pdf_text/).

Segundo passo do pipeline (após clean_corpus.py + fetch_pdfs.py): NÃO usa rede, lê só o
cache de texto, então é reprodutível e determinístico. Extrai, por seção do edital:
objeto, projeto vinculado, modalidade(s)+valor (preenche a lacuna de ~79%), formação,
requisitos, atividades e diretoria (dicionário; null honesto). Escreve in place em
data/corpus_chamadas_2023-2026.json. Ordem: clean -> fetch -> ENRICH -> classify -> build.

Não inventa valores: campo sem evidência fica ausente/None e entra na cobertura honesta.
"""
import json, re, unicodedata
from collections import Counter
from pathlib import Path
from fetch_pdfs import slug, TXT_DIR, LIMIAR_TEXTO  # DRY: mesma slugificação do fetch

ROOT = Path(__file__).resolve().parent.parent
CORPUS = ROOT / "data" / "corpus_chamadas_2023-2026.json"

# 8 modalidades oficiais (espelham src/data/modalidades.js — Anexo I da Portaria 317/2025)
OFICIAIS = [
    "Assistente de Pesquisa e Ciência de Dados Iniciante",
    "Assistente de Pesquisa e Ciência de Dados Júnior",
    "Assistente de Pesquisa Pleno",
    "Assistente em Ciência de Dados Pleno",
    "Assistente de Pesquisa e Ciência de Dados Sênior",
    "Doutor Bolsista",
    "Pesquisador Internacional",
    "Pesquisador Convidado",
]

# Diretorias do IPEA. A substantiva (de pesquisa) é o que interessa ao filtro; DIDES é a
# diretoria institucional que coordena/aprova o programa (aparece em quase todo edital via
# Portaria), então NÃO conta como diretoria substantiva — evita marcar todas com DIDES.
DIRETORIAS = {
    "DIMAC": "Diretoria de Estudos e Políticas Macroeconômicas",
    "DISOC": "Diretoria de Estudos e Políticas Sociais",
    "DIRUR": "Diretoria de Estudos e Políticas Regionais, Urbanas e Ambientais",
    "DISET": "Diretoria de Estudos e Políticas Setoriais de Inovação e Infraestrutura",
    "DINTE": "Diretoria de Estudos e Relações Econômicas e Políticas Internacionais",
    "DIEST": "Diretoria de Estudos e Políticas do Estado, das Instituições e da Democracia",
    "DIDES": "Diretoria de Desenvolvimento Institucional",
}
SUBSTANTIVAS = ["DIMAC", "DISOC", "DIRUR", "DISET", "DINTE", "DIEST"]

FORMA = {
    "Doutorado": r"doutor",
    "Mestrado": r"\bmestr",
    "Especialista": r"especialist",
    "Graduação": r"gradua|bacharel|licenciatur",
    "Pós-graduação": r"p[oó]s-?gradua|lato sensu|stricto sensu",
}

# Modalidade é rotulada por seleção: "Seleção 1 - Assistente de Pesquisa Pleno" /
# "Candidato 1 - Profissional Sênior (Mestre)". Bem mais preciso que varrer o texto.
SEL = re.compile(r"(?:Sele[çc][ãa]o|Candidato)\s*\d+\s*[-–:]\s*([A-Za-zÀ-ú][^()\n;]{3,45})", re.I)

HDR = re.compile(
    r"^\s*(?:ANEXO\s+[IVX]+\s*[-.]?\s*)?(\d{1,2})[.)]\s+"
    r"([A-ZÀ-Ú][A-ZÀ-Ú0-9 ,;:ÇÃÕÉÊÁÍÓÚÂ./-]{3,})\s*$", re.M)

ALIASES = [
    ("objeto", "objeto"),
    ("vagas", "vagas"),
    ("quantidade e duracao", "qtd_duracao"),
    ("informacoes sobre o projeto", "projeto_info"),
    ("informacoes do projeto", "projeto_info"),
    ("requisitos", "requisitos"),
    ("perfil", "requisitos"),
    ("atividades", "atividades"),
    ("julgamento das candidaturas", "criterios"),
    ("criterios de julgamento", "criterios"),
    ("cronograma", "cronograma"),
]


def sa(s):
    """Minúsculas sem acentos, para casamento robusto (APLICÀVEIS/APLICÁVEIS/APLICAVEIS)."""
    return "".join(c for c in unicodedata.normalize("NFD", s or "")
                   if unicodedata.category(c) != "Mn").lower()


def _slot(hnorm):
    for pre, slot in ALIASES:
        if hnorm.startswith(pre):
            return slot
    return None


def secoes(t):
    """Fatia o edital em {slot: corpo} pelos cabeçalhos numerados."""
    heads = [(m.start(), m.end(), sa(re.sub(r"\s+", " ", m.group(2)).strip()))
             for m in HDR.finditer(t)]
    out = {}
    for i, (_, e, h) in enumerate(heads):
        fim = heads[i + 1][0] if i + 1 < len(heads) else len(t)
        slot = _slot(h)
        if slot and slot not in out:
            out[slot] = t[e:fim]
    return out


def _flat(s):
    return re.sub(r"\s+", " ", s or "").strip()


def extrai_objeto(sec):
    # remove só a citação da Portaria (cláusula no meio da frase), preservando o
    # "...para atuar no Projeto: 'X'." que carrega a substância do objeto.
    b = _flat(sec.get("objeto", ""))
    b = re.sub(r",?\s*conforme (?:a |o )?Portaria[^,;.]*", "", b, flags=re.I)
    b = re.sub(r"\s{2,}", " ", b).strip(" ,.;:")
    return b[:600] or None


def extrai_projeto_vinc(sec):
    b = sec.get("objeto", "") + " " + sec.get("projeto_info", "")
    m = (re.search(r"[Pp]rojeto:?\s*[“\"']([^”\"']{4,160})[”\"']", b)
         or re.search(r"[“”\"']([^“”\"']{8,160})[”\"']", b))
    return _flat(m.group(1)) if m else None


def extrai_modalidades(sec, texto):
    # Nomes oficiais aparecem contíguos nas seções REQUISITOS/QUANTIDADE
    # ("Seleção 1 - Assistente de Pesquisa Pleno"); na tabela VAGAS ficam quebrados
    # entre colunas. Por isso casamos o nome canônico no texto inteiro.
    flat_all = sa(_flat(texto))
    canon = [n for n in OFICIAIS if sa(n) in flat_all]
    src = " \n".join(sec.get(k, "") for k in ("requisitos", "vagas", "qtd_duracao", "atividades")) or texto
    papeis = []
    for m in SEL.finditer(src):
        r = _flat(m.group(1)).rstrip(" -–")
        if r and not any(sa(r) == sa(o) for o in papeis):
            papeis.append(r)
    modais = canon[:]
    for r in papeis:
        if not any(sa(r) in sa(c) or sa(c) in sa(r) for c in modais):
            modais.append(r)
    base_val = sec.get("vagas") or sec.get("qtd_duracao") or texto
    vals = sorted({float(v.replace(".", "").replace(",", "."))
                   for v in re.findall(r"R\$\s*([\d.]+,\d{2})", base_val)})
    return canon, modais[:6], vals


def extrai_formacao(sec, texto):
    base = sa(" ".join(sec.get(k, "") for k in ("requisitos", "vagas", "projeto_info")))
    if len(base.strip()) < 20:
        base = sa(texto)
    return [k for k, pat in FORMA.items() if re.search(pat, base)]


def bullets(body, n=6):
    parts = re.split(r"(?:\n|^)\s*(?:\d+\.\d+\.?\d*\.?|[-•▪])\s+", body or "")
    out = []
    for p in parts:
        p = _flat(p)
        if len(p) >= 20:
            out.append(p[:300])
        if len(out) >= n:
            break
    return out


def extrai_diretoria(texto, reg):
    up = (texto or "").upper() + " " + (reg.get("projeto") or "").upper()
    for ac in SUBSTANTIVAS:
        if re.search(rf"\b{ac}\b", up):
            return ac
    flat = sa(texto) + " " + sa(reg.get("projeto"))
    for ac in SUBSTANTIVAS:
        if sa(DIRETORIAS[ac]) in flat:
            return ac
    return None


def enrich(reg, texto):
    sec = secoes(texto)
    canon, modais, vals = extrai_modalidades(sec, texto)
    diret = extrai_diretoria(texto, reg)
    out = {
        "enriquecido": True,
        "fonte_texto": True,
        "objeto": extrai_objeto(sec),
        "projeto_vinculado": extrai_projeto_vinc(sec) or reg.get("projeto"),
        "modalidades_extraidas": modais,
        "modalidade_canonica": canon[0] if canon else None,  # estrito: só as 8 oficiais
        "papel": modais[0] if modais else None,  # papel solicitado (oficial OU legado)
        "valores_brl": vals,
        "formacao": extrai_formacao(sec, texto),
        "requisitos": bullets(sec.get("requisitos")),
        "atividades": bullets(sec.get("atividades") or sec.get("projeto_info")),
        "diretoria": diret,
        "diretoria_nome": DIRETORIAS.get(diret),
    }
    # preenche modalidade textual se estava ausente
    if not reg.get("modalidade") and modais:
        out["modalidade"] = modais[0]
    flags = []
    if not out["objeto"]:
        flags.append("objeto_ausente")
    if not diret:
        flags.append("diretoria_ausente")
    out["enrich_flags"] = flags
    return out


def main():
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    usados = set()
    cov = Counter()
    n_txt = 0
    for reg in corpus:
        s = slug(reg, usados)
        p = TXT_DIR / f"{s}.txt"
        reg.setdefault("categoria_funcao", [])
        reg.setdefault("categoria_tema", [])
        if p.exists() and p.stat().st_size > 0:
            t = p.read_text(encoding="utf-8", errors="replace")
            if len(t.strip()) >= LIMIAR_TEXTO:
                n_txt += 1
                reg.update(enrich(reg, t))
                cov["objeto"] += bool(reg.get("objeto"))
                cov["diretoria"] += bool(reg.get("diretoria"))
                cov["formacao"] += bool(reg.get("formacao"))
                cov["modalidade_canonica"] += bool(reg.get("modalidade_canonica"))
                cov["requisitos"] += bool(reg.get("requisitos"))
                continue
        reg["enriquecido"] = False
    CORPUS.write_text(json.dumps(corpus, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"enriquecidos: {n_txt}/{len(corpus)} (com texto)")
    for k in ("objeto", "modalidade_canonica", "diretoria", "formacao", "requisitos"):
        print(f"  {k}: {cov[k]}")


if __name__ == "__main__":
    main()
