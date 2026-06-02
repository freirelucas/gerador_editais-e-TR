#!/usr/bin/env python3
"""Baixa o PDF principal de cada chamada e extrai o texto (pdftotext -layout) para um
cache COMMITADO em data/pdf_text/<slug>.txt + manifest.json.

Passo OFFLINE/manual — NUNCA roda no CI. A rede só é usada aqui; o enriquecimento
(enrich_corpus.py) lê apenas o cache de texto, garantindo reprodutibilidade.

- Binários ficam em data/raw/pdfs/ (gitignored); só o texto é commitado.
- Escolhe o edital PRINCIPAL por chamada (evita anexos/resultados) — ~253 downloads,
  não os ~1.407 PDFs do acervo.
- Resiliente a 404/timeout; pula o que já está em cache (use --force para rebaixar).
"""
import json, re, subprocess, hashlib, argparse
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CORPUS = ROOT / "data" / "corpus_chamadas_2023-2026.json"
PDF_DIR = ROOT / "data" / "raw" / "pdfs"
TXT_DIR = ROOT / "data" / "pdf_text"
MANIFEST = TXT_DIR / "manifest.json"

LIMIAR_TEXTO = 400  # abaixo disso, provável PDF escaneado/vazio -> flag (sem inventar)
EVITAR = re.compile(r"anexo|resultado|errata|retifica|homolog|gabarito|recurso|result", re.I)
PREFERIR = re.compile(r"chamada|especializada|edital|unificada|selet", re.I)


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


def escolhe_pdf(reg):
    """Prefere o edital principal; despioriza anexos/resultados."""
    urls = reg.get("pdf_urls") or []
    if not urls:
        return None
    def score(u):
        b = u.rsplit("/", 1)[-1]
        return (1 if EVITAR.search(b) else 0, 0 if PREFERIR.search(b) else 1, len(b))
    return sorted(urls, key=score)[0]


def baixa(url, dest, tentativas=3):
    code = "0"
    for _ in range(tentativas):
        r = subprocess.run(
            ["curl", "-sSL", "--globoff", "-A", "Mozilla/5.0", "--max-time", "60",
             "-w", "%{http_code}", "-o", str(dest), url],
            capture_output=True, text=True)
        code = (r.stdout or "").strip()[-3:]
        if code == "200" and dest.exists() and dest.stat().st_size > 0:
            return 200
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, help="máx. de NOVOS downloads (teste)")
    ap.add_argument("--year", help="filtra por ano")
    ap.add_argument("--force", action="store_true", help="rebaixa mesmo se em cache")
    args = ap.parse_args()

    PDF_DIR.mkdir(parents=True, exist_ok=True)
    TXT_DIR.mkdir(parents=True, exist_ok=True)
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    manifest, usados = [], set()
    n_ok = n_curto = n_404 = n_cache = n_novos = 0

    for reg in corpus:
        s = slug(reg, usados)  # consome o slug p/ manter unicidade mesmo se pular
        if args.year and str(reg.get("ano")) != args.year:
            continue
        url = escolhe_pdf(reg)
        txt_path = TXT_DIR / f"{s}.txt"
        e = {"slug": s, "titulo": reg.get("titulo"), "ano": reg.get("ano"),
             "programa": reg.get("programa"), "url_pdf": url}
        if url is None:
            e.update(http=None, chars=0, flag="sem_pdf")
            manifest.append(e)
            continue
        if txt_path.exists() and txt_path.stat().st_size > 0 and not args.force:
            t = txt_path.read_text(encoding="utf-8", errors="replace")
            e.update(http=200, chars=len(t), cacheado=True,
                     flag=None if len(t.strip()) >= LIMIAR_TEXTO else "texto_curto")
            manifest.append(e)
            n_cache += 1
            continue
        if args.limit is not None and n_novos >= args.limit:
            e.update(http=None, chars=0, flag="pendente")
            manifest.append(e)
            continue
        pdf_path = PDF_DIR / f"{s}.pdf"
        code = baixa(url, pdf_path)
        n_novos += 1
        if code != 200:
            e.update(http=code, chars=0, flag=f"http_{code}")
            manifest.append(e)
            n_404 += (code == 404)
            continue
        t = extrai(pdf_path)
        txt_path.write_text(t, encoding="utf-8")
        curto = len(t.strip()) < LIMIAR_TEXTO
        n_curto += curto
        n_ok += not curto
        e.update(http=200, bytes=pdf_path.stat().st_size,
                 sha256=hashlib.sha256(pdf_path.read_bytes()).hexdigest()[:16],
                 chars=len(t), flag="texto_curto" if curto else None)
        manifest.append(e)

    MANIFEST.write_text(json.dumps(
        {"gerado_em": datetime.now(timezone.utc).date().isoformat(), "itens": manifest},
        ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"PDFs: {n_ok} ok | {n_curto} texto_curto | {n_404} 404 | "
          f"{n_cache} em cache | {n_novos} novos | manifest {len(manifest)} itens")


if __name__ == "__main__":
    main()
