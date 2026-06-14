# Grupo focal de UX — quem faz editais na DIEST

> Pesquisa de UX conduzida sobre o **fluxo real** do Gerador (`BuilderView.jsx`), com
> foco na **DIEST** (Diretoria de Estudos e Políticas do Estado, das Instituições e da
> Democracia) — a área com **mais projetos ativos (100)** e a **menor cobertura de
> bolsas (17%: 15 chamadas PIPA ÷ 89 projetos por tema)**. É quem mais usa o Gerador e
> quem mais sente o atrito.

## 10 personas

| # | Persona | Perfil | Meta ao abrir o Gerador |
|---|---|---|---|
| P1 | **Marco**, coordenador sênior (11 projetos ativos) | técnico, com pressa | partir do *seu* projeto e exportar em minutos |
| P2 | **Helena**, diretora que assina o TR | revisora, pouco tempo | conferir conformidade sem preencher |
| P3 | **Rosa**, secretária da diretoria | não-pesquisadora | operacionalizar o edital com linguagem clara |
| P4 | **Téo**, pós-doc, primeira vez | inseguro com a norma | ser guiado, não errar a Portaria 317 |
| P5 | **Dalva**, planejamento/conformidade | normativa | cotas, prazos, Art. 4º/9º/25 corretos |
| P6 | **Iuri**, pesquisador quantitativo | técnico | perfil com R/Python/microdados |
| P7 | **Bia**, estagiária de apoio | digita a minuta | achar rápido o projeto certo |
| P8 | **Nara**, responsável por inclusão | foco em cotas | reserva ER/M/PCD e heteroidentificação |
| P9 | **Caio**, edital grande (multivagas) | organizado | várias seleções numa chamada |
| P10 | **Vera**, gestora que reaproveita | eficiência | reusar um edital anterior como base |

## Achados do grupo focal (sobre o fluxo real)

| Id | Dor | Quem levantou | Severidade |
|----|-----|---------------|------------|
| F1 | **Achar o projeto é lento.** 100 projetos da DIEST num `<select>` nativo, títulos cortados em 64 caracteres, sem busca. | P1, P7, P10 | **alta** |
| F2 | **"Cadê meus erros?"** Conformidade só visível no último passo; o stepper não indica *qual* passo tem pendência. | P2, P5 | **alta** |
| F3 | **"O que foi preenchido?"** Ao partir de um projeto, os campos mudam sozinhos sem confirmação do que entrou. | P3, P4 | **média** |
| F4 | **Ordem da sugestão.** A sugestão de modalidade (passo Bolsa) usa a função, que só é definida no passo seguinte (Perfil). | P6 | baixa |
| F5 | **Oportunidade invisível.** A DIEST é sub-servida por bolsas; um empurrão de "tema com pouca bolsa" ajudaria a priorizar. | P1, P10 | baixa |
| — | Cotas (ER/M/PCD, heteroidentificação) e multivagas já atendem bem. | P8, P9 | (elogio) |

## Implementado nesta rodada (UX → engenharia)

- **F1 — Seletor de projeto com busca.** O `<select>` com optgroups deu lugar a um
  combobox: escopo padrão **na diretoria atual** (chips "só DIEST (100)" × "todas as
  áreas (366)"), **busca acento-insensível** por título/tema, lista rolável com
  **títulos completos** + diretoria/tema/ano. (`BuilderView.jsx`: estado `projQ`/`projAll`,
  `norm`, `projMatches`.)
- **F2 — Pendência por passo no stepper.** Cada passo ganha um **ponto vermelho (erro)
  ou âmbar (alerta)** quando há conformidade pendente naquele passo, reaproveitando o
  mapeamento `STEP_CONF`. O usuário enxerga e clica direto no passo problemático.
- **F3 — Confirmação do preenchimento.** Após escolher um projeto, mostra
  **"✓ Preenchido a partir de \<título\> — diretoria · tema · função · ano"** com
  **"trocar projeto"**. A função agora vem inferida do **mix de produtos** do projeto
  (ver abaixo); só fica "função a definir" nos 2 projetos sem produto registrado.
- **Inferência de função pelos produtos.** Cobertura de função saltou de **34/366 (9%)
  para 364/366 (99%)**: "Base de Dados" prominente → *Ciência de Dados – Engenharia* (16);
  demais saídas (artigos, TDs, notas) → *Apoio à pesquisa* (318); o título mantém a
  distinção fina quant/DS. Validado pelo `npm run stress` (2196/2196 builds, 0 exceções).
- **F5 — Empurrão de oportunidade.** Sob a diretoria, mostra a cobertura de bolsas do
  tema (projetos ativos × chamadas PIPA). Quando sub-servido (<25%, ex.: DIEST 89×15),
  destaca "tema sub-servido por bolsas: boa hora para um edital". Dado pré-computado em
  `PROJETOS_RESUMO.coberturaPorTema` (extrator).
- **Bug corrigido:** colisão de `key` no `App.jsx` (header e view irmãos com `key={tab}`),
  que gerava warning de chave duplicada no console.

## Backlog (próximas rodadas)

- **F4 — Sugestão de modalidade** também no passo Perfil, ou nota de que melhora ao
  definir a função.
