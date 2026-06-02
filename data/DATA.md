# Dados — dicionário, proveniência e limites

Os dados nascem de uma **raspagem do portal IPEA** (snapshot ~junho/2026). A
**semente bruta** fica imutável em `data/raw/`; os arquivos canônicos em `data/` são
**gerados** pelo pipeline em `scripts/` e validados por `scripts/validate_data.py`.

```
data/raw/   ── sementes (nunca editadas)        + data/raw/pdfs/ (binários, gitignored)
   ↓ scripts/clean_corpus.py · clean_biblioteca.py
data/       ── canônicos limpos (consumidos pelo app)
   ↓ scripts/fetch_pdfs.py      → data/pdf_text/ (texto dos editais, COMMITADO; rede só aqui)
   ↓ scripts/enrich_corpus.py   (objeto, papel, formação, requisitos, diretoria, … por seção)
   ↓ scripts/classify.py        (categoria_funcao/tema via data/taxonomia.json — editável)
   ↓ scripts/build_app_data.py
src/data/   ── derivados pequenos (quality.json, clausulas_sugeridas.json)
```

## `corpus_chamadas_2023-2026.json` — 253 chamadas

| campo | tipo | origem | observação |
|---|---|---|---|
| `url`, `titulo`, `ano`, `projeto` | string | bruto | 100% preenchidos |
| `situacao` | `ABERTA`\|`FECHADA` | limpo (caixa) | **snapshot** — caduca |
| `prazo_ini`, `prazo_fim` | `DD-MM-YY` | bruto | 97% |
| `prazo_ini_iso`, `prazo_fim_iso` | ISO `YYYY-MM-DD` | derivado | `null` se não parseável |
| `janela_dias` | int | derivado | `prazo_fim − prazo_ini` |
| `programa` | `PIPA`\|`PROCIN`\|`PROMOB` | normalizado | `programa_raw` guarda o original |
| `modalidade` | string | limpo / enriquecido | bruto só 21%; preenchido via PDF quando ausente |
| `modalidade_canonica` | string\|null | enriquecido | estrito: só as **8 oficiais** (Anexo I); editais PIPA |
| `qtd_bolsas` | int\|null | bruto | **só 5% preenchido** (não imputado) |
| `pdf_urls` | string[] | bruto | 100% têm ≥1 |
| `flags` | string[] | derivado | anomalias detectadas (ver abaixo) |

**flags:** `sem_datas`, `janela_invertida`, `titulo_ano_divergente`,
`modalidade_ausente`, `qtd_ausente`.

### Campos enriquecidos (extraídos dos PDFs — `enrich_corpus.py` + `classify.py`)

| campo | tipo | origem | cobertura (de 253) |
|---|---|---|---|
| `enriquecido` | bool | PDF | 216 com texto utilizável (37 curtos/escaneados, 0 dead links) |
| `objeto` | string\|null | seção OBJETO | 166 |
| `papel` | string\|null | "Seleção N - papel" | 176 (oficial PIPA + legado PROMOB) |
| `modalidades_extraidas` | string[] | seções | papéis por seleção |
| `formacao` | string[] | requisitos | 194 (Doutorado/Mestrado/…) |
| `requisitos`, `atividades` | string[] | seções | 166 / — (itens, com cap de tamanho) |
| `valores_brl` | number[] | tabela VAGAS | valores `R$` da bolsa |
| `projeto_vinculado` | string | OBJETO/projeto | título do projeto entre aspas |
| `diretoria`, `diretoria_nome` | string\|null | dicionário | **62** — substantiva (DIDES, que aprova, é excluída) |
| `categoria_funcao`, `categoria_tema` | string[] | `classify.py` | 183 / 206 — multi-rótulo, taxonomia editável |

**Honestidade:** tudo aqui é **máquina-extraído e imperfeito**. Campo sem evidência fica
`null`/vazio (nunca imputado) e entra na "Cobertura do enriquecimento" da aba Analytics.
A `diretoria` é o campo mais esparso (substantiva identificável em ~25% dos editais).
**Não há dados de contratação/resultado** — "perfis" = perfis *solicitados*, não contratados.

### Limites (leia antes de analisar)
- **Sem análise de bolsas/financeira:** `qtd_bolsas` (5%) e `modalidade` (21%) são quase
  ausentes — qualquer total ou valor seria inventado.
- **`situacao` é um retrato congelado:** não use como estado ao vivo.
- **2026 é parcial** (vai até ~junho/2026).
- **`titulo_ano_divergente`:** ano do título/URL/campo divergem em alguns registros
  (ex.: título "022/2023" com URL `...022-2026`). Marcados, não corrigidos às cegas.

## `biblioteca_clausulas.json` — 87 categorias, 3.060 cláusulas

Objeto `{ CATEGORIA: [cláusula, …] }`. Trechos de cláusulas por seção, extraídos dos
editais. Limpeza aplicada: fusão de 13 grupos de chaves duplicadas por OCR (103→87),
desfez quebras de linha de PDF (`\n`→espaço), corrigiu token-splits de OCR, removeu
duplicatas exatas e lixo (<25 chars): **5.895 → 3.060** cláusulas. Há **15 categorias em
inglês** (vestígio das chamadas bilíngues do PROMOB).

## Reproduzir
```bash
python scripts/clean_corpus.py
python scripts/clean_biblioteca.py
python scripts/fetch_pdfs.py         # baixa editais + extrai texto → data/pdf_text/ (única etapa com rede)
python scripts/enrich_corpus.py      # campos por seção do edital (lê só o cache de texto)
python scripts/classify.py           # categoria_funcao/tema — edite data/taxonomia.json e rode de novo
python scripts/build_app_data.py
python scripts/validate_data.py      # porta de qualidade (exit≠0 se violar invariantes)
```
O cache `data/pdf_text/` é **commitado**, então `enrich`/`classify` são reprodutíveis
**sem rede** (e o CI roda só `validate_data.py` + `npm run build`, nunca o `fetch`).
A projeção de 2026 (real até hoje + pró-rata linear) usa a **data do build** como referência.
