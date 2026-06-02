# Gerador de Editais e Termos de Referência — IPEA/PIPA

Ferramenta web para **explorar o corpus de Chamadas Públicas do IPEA**, **gerar minutas**
de editais e **analisar os dados**, com base na regulamentação vigente do Programa de
Incentivo à Pesquisa Aplicada (PIPA).

Três abas:

- **Construtor de minuta** — monta em tempo real a minuta de uma Chamada Pública e
  oferece **sugestões de cláusulas reais** (extraídas da biblioteca limpa) nos campos
  livres. Copia ou baixa em `.txt`.
- **Corpus de editais** — busca e filtros (ano, programa, situação) sobre 253 chamadas
  raspadas do portal IPEA (2023–2026).
- **Analytics dos dados** — painel de gráficos (SVG próprio, sem dependências) que
  **começa pela qualidade/limitações** dos dados e mostra a virada estrutural
  PROMOB→PIPA, prazos, sazonalidade, temas e a biblioteca de cláusulas.

> ⚠️ As minutas geradas são **rascunhos de trabalho**. Revisão jurídica e adequação à
> versão vigente do regulamento PIPA são obrigatórias antes de qualquer publicação.
> Valores conforme a Portaria Normativa IPEA nº 262/2023 (altera a Portaria nº 492/2010).

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
**Settings → Pages → Source = GitHub Actions**. O `base` do Vite já aponta para
`/gerador_editais-e-tr/` em produção.

## Estrutura do repositório

```
.
├── index.html · package.json · vite.config.js   # app Vite
├── .github/workflows/deploy.yml                  # CI: valida dados + deploy Pages
├── src/
│   ├── main.jsx · App.jsx · theme.js
│   ├── data/
│   │   ├── corpus.js                # adaptador do corpus limpo
│   │   ├── clausulas.js             # sugestões de cláusula p/ o construtor
│   │   ├── modalidades.js · boilerplate.js
│   │   ├── quality.json             # métricas p/ a aba Analytics (gerado)
│   │   └── clausulas_sugeridas.json # (gerado)
│   ├── lib/
│   │   ├── format.js · minuta.js
│   │   └── stats.js                 # agregações da aba Analytics
│   └── components/
│       ├── Pill.jsx · CorpusView.jsx · BuilderView.jsx
│       ├── AnalyticsView.jsx
│       └── charts/                  # Bars, StackedBars, Line, Donut, Heatmap (SVG puro)
├── scripts/                         # pipeline de dados + gerador de gráficos (Python)
├── data/
│   ├── raw/                         # SEMENTES brutas (imutáveis)
│   ├── corpus_chamadas_2023-2026.json   # canônico limpo
│   ├── biblioteca_clausulas.json        # canônico limpo
│   └── DATA.md                      # dicionário, proveniência e limites
├── analytics/
│   ├── REPORT.md                    # achados mais interessantes
│   └── highlights/                  # gráficos do relatório
└── examples/                        # exemplos de Chamada e TR (.docx)
```
