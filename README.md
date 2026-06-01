# Gerador de Editais e Termos de Referência — IPEA/PIPA

Ferramenta web para **explorar o corpus de Chamadas Públicas do IPEA** e
**gerar minutas** de editais do Programa de Incentivo à Pesquisa Aplicada
(PIPA), com base na regulamentação vigente.

A aplicação tem duas abas:

- **Construtor de minuta** — formulário que monta, em tempo real, a minuta de
  uma Chamada Pública (objeto, quantidade e duração, requisitos, modalidade e
  valor, cronograma, cláusulas-padrão e assinatura). A minuta pode ser copiada
  ou baixada em `.txt`.
- **Corpus de editais** — busca e filtros (ano, programa, situação) sobre 253
  chamadas raspadas do portal IPEA entre 2023 e 2026.

> ⚠️ As minutas geradas são **rascunhos de trabalho**. Revisão jurídica e
> adequação à versão vigente do regulamento PIPA são obrigatórias antes de
> qualquer publicação. Os valores das bolsas seguem a Portaria Normativa
> IPEA nº 262/2023 (que altera a Portaria nº 492/2010).

## Como rodar

Requer [Node.js](https://nodejs.org/) 18+.

```bash
npm install      # instala as dependências
npm run dev      # ambiente de desenvolvimento (http://localhost:5173)
npm run build    # build de produção em dist/
npm run preview  # serve o build de produção localmente
```

## Estrutura do repositório

```
.
├── index.html                  # ponto de entrada do Vite
├── package.json                # dependências e scripts
├── vite.config.js              # configuração do Vite + plugin React
├── src/
│   ├── main.jsx                # bootstrap do React
│   ├── App.jsx                 # raiz: cabeçalho, abas e rodapé
│   ├── theme.js                # paleta de cores e fontes
│   ├── data/
│   │   ├── corpus.js           # adaptador do corpus para a interface
│   │   ├── modalidades.js      # modalidades de bolsa e valores
│   │   └── boilerplate.js      # cláusulas-padrão das chamadas
│   ├── lib/
│   │   ├── format.js           # formatação de moeda, datas e números
│   │   └── minuta.js           # montagem e serialização da minuta
│   └── components/
│       ├── Pill.jsx            # etiqueta de programa/situação
│       ├── CorpusView.jsx      # aba de busca no corpus
│       └── BuilderView.jsx     # aba do construtor de minuta
├── data/
│   ├── corpus_chamadas_2023-2026.json  # corpus raspado (fonte única)
│   └── biblioteca_clausulas.json       # biblioteca de cláusulas por categoria
└── examples/
    ├── Chamada_PIPA_Unificada_Computacao_Economia.docx
    └── TR_PIPA_Soberania_Digital.docx
```

## Dados

- **`data/corpus_chamadas_2023-2026.json`** — corpus com 253 chamadas raspadas
  do portal IPEA (URL, título, ano, situação, prazos, programa, projeto,
  modalidade, quantidade de bolsas e links de PDF). É a **fonte única**
  consumida pela interface; `src/data/corpus.js` apenas projeta os campos usados
  e normaliza o nome do programa (PIPA / PROCIN / PROMOB) para o filtro.
- **`data/biblioteca_clausulas.json`** — biblioteca de trechos de cláusulas
  agrupados por categoria (`OBJETO`, `CRONOGRAMA`, `CRITÉRIOS DE JULGAMENTO`
  etc.), extraídos dos editais. Serve de insumo para enriquecer as
  cláusulas-padrão; ainda não é consumida diretamente pela interface.
- **`examples/`** — exemplos de documentos finais (Chamada unificada e Termo de
  Referência) em formato `.docx`.
