# Gerador de Termo de Referência e Edital — IPEA/PIPA

Ferramenta web para **gerar o Termo de Referência e a minuta de Chamada Pública** do
Programa de Incentivo à Pesquisa Aplicada (PIPA), ancorados na **norma vigente — Portaria
Normativa IPEA nº 317, de 18 de abril de 2025** — além de explorar e analisar o corpus
histórico de chamadas. A interface reproduz a **identidade visual do IPEA** (Azul IPEA,
wordmark "ipea").

Três abas:

- **Gerador** — formulário enxuto que monta, em tempo real, o **Termo de Referência
  (Art. 7º)** e a **minuta de Chamada Pública Especializada** derivada, com as **8
  modalidades e valores atuais** (Anexo I). Os campos descritivos (projeto, perfil,
  atividades, critérios) oferecem **padrões de descrição** extraídos dos modelos antigos —
  úteis apenas fora do núcleo regulado. Copia ou baixa em `.txt`.
- **Explorador de projetos** — busca e filtros (ano, programa, situação, **diretoria,
  função, tema**) sobre 253 chamadas, com cartões **enriquecidos** (objeto, papel,
  formação, valores, função/tema) e requisitos/atividades expansíveis.
- **Analytics dos dados** — painel de gráficos (SVG próprio, sem dependências) que
  **começa pela qualidade/limitações** (incl. cobertura do enriquecimento) e mostra a
  virada PROMOB→PIPA, **perfis solicitados**, **diretorias**, temas, prazos e a biblioteca.
  Comparações por ano trazem **2026 real (até a data do build) + projetado** (pró-rata linear).

Os campos descritivos são **enriquecidos** baixando e parseando os PDFs dos editais
(`scripts/fetch_pdfs.py` → `enrich_corpus.py` → `classify.py`); a classificação de
função/tema é **configurável** em [`data/taxonomia.json`](data/taxonomia.json). Tudo é
máquina-extraído e imperfeito — a aba Analytics reporta a cobertura honestamente, e **não
há dados de contratação** (os "perfis" são os *solicitados* pelas chamadas).

> ⚠️ O documento gerado é um **rascunho de trabalho**: revisão jurídica e conferência com a
> versão vigente da norma são obrigatórias antes da publicação. As portarias anteriores
> (PROMOB/PNPD, PROCIN) foram **convertidas no PIPA** (Anexo II da Portaria 317/2025) — por
> isso o gerador é PIPA-only; as cláusulas dos modelos antigos servem apenas como padrões
> de descrição, fora do núcleo regulado.

## Como rodar

Requer [Node.js](https://nodejs.org/) 18+ e Python 3 (apenas para o pipeline de dados).

```bash
npm install      # dependências
npm run dev      # desenvolvimento (http://localhost:5173)
npm run build    # build de produção em dist/
npm run preview  # serve o build localmente
```

## Qualidade dos dados (pipeline)

A **semente bruta** da raspagem fica imutável em `data/raw/`; os arquivos canônicos em
`data/` são **gerados e validados** por scripts reproduzíveis. Detalhes e dicionário em
[`data/DATA.md`](data/DATA.md).

```bash
python scripts/clean_corpus.py      # normaliza programa/datas, deriva campos e flags
python scripts/clean_biblioteca.py  # funde chaves OCR, desfaz \n, dedup (5895 -> 3060)
python scripts/fetch_pdfs.py        # baixa editais + extrai texto → data/pdf_text/ (única etapa com rede)
python scripts/enrich_corpus.py     # objeto, papel, formação, requisitos, diretoria (por seção do PDF)
python scripts/classify.py          # categoria_funcao/tema (edite data/taxonomia.json e rode de novo)
python scripts/build_app_data.py    # gera src/data/quality.json + clausulas_sugeridas.json
python scripts/validate_data.py     # porta de qualidade (exit != 0 se violar invariantes)
```

## Analytics e a varredura de gráficos

A aba **Analytics** renderiza ~13 gráficos curados ao vivo. Para a exploração ampla,
`scripts/generate_charts.py` gera **102 gráficos** (matplotlib) em `analytics/charts/` e o
relatório dos mais interessantes está em [`analytics/REPORT.md`](analytics/REPORT.md).

```bash
pip install matplotlib && python scripts/generate_charts.py
```

## Deploy (GitHub Pages via Actions)

App Vite tem etapa de build, então o deploy é via **GitHub Actions** (não "deploy from a
branch"). O workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) roda a
porta de qualidade, builda e publica `dist/` no Pages a cada push em `main`. Ative em
**Settings → Pages → Source = GitHub Actions**. O `base` do Vite é **relativo (`./`)** em
produção, então o app funciona em `/<repo>/` independentemente da caixa do nome.

## Estrutura do repositório

```
.
├── index.html · package.json · vite.config.js   # app Vite
├── .github/workflows/deploy.yml                  # CI: valida dados + deploy Pages
├── src/
│   ├── main.jsx · App.jsx · theme.js
│   ├── data/
│   │   ├── corpus.js                # adaptador do corpus limpo
│   │   ├── clausulas.js             # padrões de descrição (campos descritivos)
│   │   ├── modalidades.js           # 8 modalidades + valores (Anexo I / Portaria 317)
│   │   ├── norma.js                 # núcleo regulado (Portaria 317/2025)
│   │   ├── quality.json             # métricas p/ a aba Analytics (gerado)
│   │   └── clausulas_sugeridas.json # (gerado)
│   ├── lib/
│   │   ├── format.js · minuta.js    # minuta.js: buildTR (Art. 7º) + buildEdital
│   │   └── stats.js                 # agregações da aba Analytics
│   └── components/
│       ├── Pill.jsx · CorpusView.jsx · BuilderView.jsx
│       ├── AnalyticsView.jsx
│       └── charts/                  # Bars, StackedBars, Line, Donut, Heatmap (SVG puro)
├── scripts/                         # pipeline (Python): clean_* → fetch_pdfs → enrich_corpus
│                                    #   → classify → build_app_data → validate (+ generate_charts)
├── data/
│   ├── raw/                         # SEMENTES brutas (imutáveis) + raw/pdfs/ (gitignored)
│   ├── pdf_text/                    # texto dos editais — cache COMMITADO (reprodutibilidade)
│   ├── taxonomia.json               # taxonomia editável (função/tema) p/ classify.py
│   ├── corpus_chamadas_2023-2026.json   # canônico limpo + enriquecido do PDF
│   ├── biblioteca_clausulas.json        # canônico limpo
│   └── DATA.md                      # dicionário, proveniência e limites
├── analytics/
│   ├── REPORT.md                    # achados mais interessantes
│   └── highlights/                  # gráficos do relatório
└── examples/                        # exemplos de Chamada e TR (.docx)
```
