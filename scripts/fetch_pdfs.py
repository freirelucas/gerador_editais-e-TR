#!/usr/bin/env python3
"""Baixa o PDF principal de cada chamada e extrai o texto (pdftotext -layout) para um
cache COMMITADO em data/pdf_text/<slug>.txt + manifest.json.

Passo OFFLINE/manual — NUNCA roda no CI. A rede só é usada aqui; o enriquecimento
(enrich_corpus.py) lê apenas o cache de texto, garantindo reprodutibilidade.

- Binários ficam em data/raw/pdfs/ (gitignored); só o texto é commitado.
- Escolha do PDF é CONSCIENTE DO CONTEÚDO: cada chamada tem vários PDFs (edital, anexos,
  resultado, planilha avaliadora e a versão curta do DOU). Ranqueamos os candidatos pelo
  nome (preferindo "Chamada_Pública_Especializada/Unificada…" sob /chamadas_publicas/),
  baixamos em ordem, VALIDAMOS que é PDF de verdade (%PDF, não página HTML de erro) e
  ficamos com o texto mais "edital" — de preferência o que traz o quadro de vagas.
- Resiliente a 404/timeout; pula o que já está em cache. `--heal` rebaixa só os caches
  ruins (vazios ou páginas do DOU) escolhendo um PDF melhor, sem regredir um cache bom.
"""
import json, re, subprocess, hashlib, argparse
from urllib.parse import unquote
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CORPUS = ROOT / "data" / "corpus_chamadas_2023-2026.json"
PDF_DIR = ROOT / "data" / "raw" / "pdfs"
TXT_DIR = ROOT / "data" / "pdf_text"
MANIFEST = TXT_DIR / "manifest.json"

LIMIAR_TEXTO = 400  # abaixo disso, provável PDF escaneado/vazio -> flag (sem inventar)

# Seleção do PDF certo por chamada. O edital REAL (com o quadro de vagas) costuma se
# chamar "Chamada_Pública_Especializada/Unificada_Pipa_NNN-AAAA.pdf" e fica sob
# /chamadas_publicas/. Evitamos anexos, resultados, planilhas e a versão curta do DOU.
EVITAR = re.compile(r"anexo|resultado|errata|retifica|homolog|gabarito|recurso|result|"
                    r"planilha|avaliador|aviso|\bata\b|cronograma|classific", re.I)
EDITAL_FORTE = re.compile(r"especializ|unificad", re.I)
PREFERIR = re.compile(r"chamada|edital|selet", re.I)


def slug(reg, usados):
    """Chave estável e única por chamada: '2026_pipa_020'."""
    prog = (reg.get("programa") or "x").lower()
    m = re.search(r"(\d{1,3})\s*/\s*\d{4}", reg.get("titulo") or "")
    if m:
        base = f"{reg.get('ano')}_{prog}_{m.group(1).zfill(3)}"
    else:
        tail = re.sub(r"[^a-z0-9]+", "-", (reg.get("url") or "").rsplit("/", 1)[-1].lower())
        base = f"{reg.get('ano')}_{prog}_{tail[:40]}"
    s, i = base, ord("a")
    while s in usados:
        s = f"{base}_{chr(i)}"
        i += 1
    usados.add(s)
    return s


def candidatos(reg):
    """PDFs da chamada, ranqueados do mais provável edital ao menos provável."""
    urls = reg.get("pdf_urls") or []

    def score(u):
        b = unquote(u.rsplit("/", 1)[-1]).lower()
        path = u.lower()
        return (
            1 if EVITAR.search(b) else 0,             # despioriza anexo/resultado/planilha
            0 if EDITAL_FORTE.search(b) else 1,       # prioriza especializada/unificada
            0 if "chamadas_publicas" in path else 1,  # prioriza a pasta de editais
            0 if PREFERIR.search(b) else 1,           # depois, qualquer "chamada/edital"
            -len(b),                                  # e o nome mais completo (não o curto do DOU)
        )
    return sorted(urls, key=score)


def eh_pdf(dest):
    try:
        with open(dest, "rb") as f:
            return f.read(5).startswith(b"%PDF")
    except OSError:
        return False


def baixa(url, dest, tentativas=3):
    """200 só quando cai um PDF de verdade; 415 = veio algo que não é PDF (HTML de erro)."""
    code = "0"
    for _ in range(tentativas):
        r = subprocess.run(
            ["curl", "-sSL", "--globoff", "-A", "Mozilla/5.0", "--max-time", "60",
             "-w", "%{http_code}", "-o", str(dest), url],
            capture_output=True, text=True)
        code = (r.stdout or "").strip()[-3:]
        if code == "200":
            return 200 if (dest.exists() and dest.stat().st_size > 0 and eh_pdf(dest)) else 415
        if code == "404":
            return 404
    return int(code) if code.isdigit() else 0


def extrai(pdf):
    try:
        r = subprocess.run(["pdftotext", "-layout", str(pdf), "-"],
                           capture_output=True, text=True, timeout=90)
        return r.stdout or ""
    except subprocess.TimeoutExpired:
        return ""


def parece_dou(t):
    """Página do Diário Oficial (vários avisos numa folha), não o edital limpo."""
    return "ISSN 1677" in t or len(re.findall(r"EXTRATO DE|AVISO DE", t)) >= 3


def tem_quadro(t):
    return bool(re.search(r"quadro a seguir|vagas imediatas", t, re.I))


def qualidade(t):
    """Pontua o texto: quanto mais 'edital com quadro de vagas', maior. <LIMIAR => -1."""
    if len(t.strip()) < LIMIAR_TEXTO:
        return -1.0
    s = 0.0
    if tem_quadro(t):
        s += 100
    if re.search(r"objeto|requisitos|inscri", t, re.I):
        s += 10
    if parece_dou(t):
        s -= 50
    return s + min(len(t), 30000) / 10000.0


def cache_ruim(t):
    return len(t.strip()) < LIMIAR_TEXTO or parece_dou(t)


def melhor_pdf(reg, pdf_path, max_tentativas=6):
    """Tenta candidatos em ordem; devolve (texto, url, http) do melhor edital. Para cedo
    ao achar o quadro de vagas. http registra o último código relevante (p/ flag)."""
    best_t, best_u, best_q = None, None, -2.0
    last_http = None
    for u in candidatos(reg)[:max_tentativas]:
        code = baixa(u, pdf_path)
        last_http = code
        if code != 200:
            continue
        t = extrai(pdf_path)
        q = qualidade(t)
        if q > best_q:
            best_t, best_u, best_q = t, u, q
        if tem_quadro(t):
            break
    return best_t, best_u, last_http


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, help="máx. de NOVOS downloads (teste)")
    ap.add_argument("--year", help="filtra por ano")
    ap.add_argument("--program", help="filtra por programa (ex.: PIPA)")
    ap.add_argument("--force", action="store_true", help="rebaixa mesmo se em cache")
    ap.add_argument("--heal", action="store_true",
                    help="rebaixa só caches ruins (vazio/DOU), escolhendo um PDF melhor")
    args = ap.parse_args()

    PDF_DIR.mkdir(parents=True, exist_ok=True)
    TXT_DIR.mkdir(parents=True, exist_ok=True)
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    manifest, usados = [], set()
    n_ok = n_curto = n_404 = n_cache = n_novos = n_heal = 0

    for reg in corpus:
        s = slug(reg, usados)  # consome o slug p/ manter unicidade mesmo se pular
        if (args.year and str(reg.get("ano")) != args.year) or \
           (args.program and (reg.get("programa") or "") != args.program):
            continue
        txt_path = TXT_DIR / f"{s}.txt"
        cached = txt_path.exists() and txt_path.stat().st_size > 0
        cache_txt = txt_path.read_text(encoding="utf-8", errors="replace") if cached else ""
        ruim = cached and cache_ruim(cache_txt)
        precisa = args.force or not cached or (args.heal and ruim)
        e = {"slug": s, "titulo": reg.get("titulo"), "ano": reg.get("ano"),
             "programa": reg.get("programa"), "url_pdf": None}

        if not precisa:
            e.update(url_pdf=(candidatos(reg) or [None])[0], http=200, chars=len(cache_txt),
                     cacheado=True, flag=None if not cache_ruim(cache_txt) else "texto_curto")
            manifest.append(e)
            n_cache += 1
            continue
        if not reg.get("pdf_urls"):
            e.update(http=None, chars=len(cache_txt), flag="sem_pdf")
            manifest.append(e)
            continue
        if args.limit is not None and n_novos >= args.limit:
            e.update(http=None, chars=len(cache_txt), flag="pendente")
            manifest.append(e)
            continue

        pdf_path = PDF_DIR / f"{s}.pdf"
        t, url, http = melhor_pdf(reg, pdf_path)
        n_novos += 1
        e["url_pdf"] = url

        # Nada utilizável: preserva o cache antigo (não apaga texto bom por uma falha de rede).
        if t is None:
            e.update(http=http, chars=len(cache_txt),
                     flag=f"http_{http}" if http in (404, 415, 0) else "sem_pdf_valido")
            manifest.append(e)
            n_404 += (http == 404)
            continue

        # Não regredir: só sobrescreve se o novo texto for igual/melhor que o cache.
        if cached and not cache_ruim(cache_txt) and qualidade(t) <= qualidade(cache_txt):
            t = cache_txt
        else:
            txt_path.write_text(t, encoding="utf-8")
            if ruim:
                n_heal += 1

        curto = len(t.strip()) < LIMIAR_TEXTO
        n_curto += curto
        n_ok += not curto
        e.update(http=200, bytes=pdf_path.stat().st_size if pdf_path.exists() else 0,
                 sha256=hashlib.sha256(pdf_path.read_bytes()).hexdigest()[:16] if pdf_path.exists() else None,
                 chars=len(t), flag="texto_curto" if curto else None)
        manifest.append(e)

    MANIFEST.write_text(json.dumps(
        {"gerado_em": datetime.now(timezone.utc).date().isoformat(), "itens": manifest},
        ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"PDFs: {n_ok} ok | {n_curto} texto_curto | {n_404} 404 | {n_cache} em cache | "
          f"{n_novos} novos | {n_heal} curados | manifest {len(manifest)} itens")


if __name__ == "__main__":
    main()
