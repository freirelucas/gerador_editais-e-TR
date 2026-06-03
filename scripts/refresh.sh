#!/usr/bin/env bash
# Atualização (refresh) dos dados — RODAR LOCALMENTE.
#
# Princípio do projeto: o scraping usa rede e roda SÓ aqui (nunca no CI). Este script
# reexecuta o pipeline ponta a ponta e revalida. Depois, revise o `git diff` dos dados
# (data/ e src/data/) e faça commit do que mudou — a curadoria humana é intencional.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "1/6 fetch     · rede: baixa/atualiza o cache de texto dos editais (data/pdf_text/)"
python3 scripts/fetch_pdfs.py
echo "2/6 enrich    · offline: extrai objeto, papel, formação, diretoria… do texto"
python3 scripts/enrich_corpus.py
echo "3/6 classify  · offline: função/tema (data/taxonomia.json)"
python3 scripts/classify.py
echo "4/6 cotas     · offline: reserva de vagas (vagas_por_cota)"
python3 scripts/extract_cotas.py
echo "5/6 app_data  · gera src/data/quality.json e sugestões"
python3 scripts/build_app_data.py
echo "6/6 validate  · invariantes do corpus + forma dos campos"
python3 scripts/validate_data.py

echo
echo "✓ refresh completo. Revise: git diff -- data/ src/data/  e faça commit dos dados atualizados."
