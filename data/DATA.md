# Dados — dicionário, proveniência e limites

Os dados nascem de uma **raspagem do portal IPEA** (snapshot ~junho/2026). A
**semente bruta** fica imutável em `data/raw/`; os arquivos canônicos em `data/` são
**gerados** pelo pipeline em `scripts/` e validados por `scripts/validate_data.py`.

```
data/raw/   ── sementes (nunca editadas)
   ↓ scripts/clean_corpus.py · clean_biblioteca.py
data/       ── canônicos limpos (consumidos pelo app)
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
| `modalidade` | string | limpo (trim) | **só 21% preenchido** |
| `modalidade_canonica` | string\|null | derivado | mapeia às 12 oficiais (só 6 batem) |
| `qtd_bolsas` | int\|null | bruto | **só 5% preenchido** |
| `pdf_urls` | string[] | bruto | 100% têm ≥1 |
| `flags` | string[] | derivado | anomalias detectadas (ver abaixo) |

**flags:** `sem_datas`, `janela_invertida`, `titulo_ano_divergente`,
`modalidade_ausente`, `qtd_ausente`.

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
python scripts/build_app_data.py
python scripts/validate_data.py      # porta de qualidade (exit≠0 se violar invariantes)
```
