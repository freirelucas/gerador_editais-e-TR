// Perfis de critérios de seleção REAIS, minerados das chamadas PIPA com seção de JULGAMENTO
// (16/55 traziam tabela de critérios pontuados). Achados do corpus que ancoram isto:
//  • a entrevista aparece em 100% das chamadas com critérios completos;
//  • os critérios variam por modalidade (Doutor → produção acadêmica + métodos; Pleno →
//    currículo temático + proposta; Ciência de Dados → softwares/microdados, ± prova prática);
//  • cláusula recorrente: nota < 50% do total pode desclassificar; desempate por maior idade.
// `itens` traz os pesos reais observados. Texto editável pelo proponente.
export const CRITERIOS_PERFIS = [
  {
    tag: "Doutor Bolsista",
    fonte: "2025_pipa_037, 2025_pipa_038",
    itens: [
      { c: "Produção acadêmica (artigos em periódicos com revisão por pares; tese e dissertação) na temática", p: 3 },
      { c: "Aplicação de método(s) quantitativo(s) e/ou qualitativo(s) ao objeto da pesquisa", p: 3 },
      { c: "Experiência profissional dos últimos cinco anos, acadêmica ou não, relacionada ao tema (Currículo Lattes)", p: 2 },
      { c: "Formação complementar — cursos, intercâmbios, doutorado-sanduíche, pós-doutorado (Lattes)", p: 1 },
      { c: "Entrevista", p: 3 },
    ],
  },
  {
    tag: "Ciência de Dados",
    fonte: "2025_pipa_036, 2026_pipa_012",
    itens: [
      { c: "Conhecimentos em programação e processamento de microdados", p: 3 },
      { c: "Conhecimento em softwares estatísticos (R, Python, Stata) e organização de bases de dados", p: 3 },
      { c: "Experiência com dados socioeconômicos, censitários e registros administrativos; relatórios e dashboards", p: 2 },
      { c: "Entrevista", p: 2 },
    ],
    // Variante rara (1 chamada): prova prática antes da entrevista.
    opcional: { c: "Prova prática (Excel e R ou Python), aplicada aos mais bem pontuados antes da entrevista", p: 2 },
  },
  {
    tag: "Assistente de Pesquisa Pleno / pesquisa",
    fonte: "2025_pipa_039, 2026_pipa_010",
    itens: [
      { c: "Análise do currículo acadêmico — publicações relacionadas ao tema e à avaliação/análise de políticas públicas", p: 4 },
      { c: "Experiência de pesquisa na área temática (social, ambiental, institucional etc.)", p: 2 },
      { c: "Qualidade do projeto/proposta de pesquisa apresentada", p: 3 },
      { c: "Entrevista", p: 3 },
    ],
  },
  {
    tag: "Geral (Iniciante/Júnior/demais)",
    fonte: "padrão derivado das chamadas PIPA",
    itens: [
      { c: "Análise curricular — formação e experiência aplicáveis ao objeto", p: 3 },
      { c: "Conhecimentos e experiência na área temática do projeto", p: 2 },
      { c: "Proposta/plano de atividades ou ensaio sobre o objeto", p: 2 },
      { c: "Entrevista", p: 3 },
    ],
  },
];

const acha = (tag) => CRITERIOS_PERFIS.find((p) => p.tag === tag);
// Seleciona o perfil de critérios a partir da modalidade e das funções escolhidas.
export function escolherPerfilCriterios(modalidade = "", funcoes = []) {
  const cd = funcoes.some((fn) => fn.includes("Ciência de Dados"));
  if (modalidade.includes("Doutor")) return acha("Doutor Bolsista");
  if (cd || modalidade === "Assistente em Ciência de Dados Pleno") return acha("Ciência de Dados");
  if (modalidade.includes("Pleno") || modalidade.includes("Sênior")) return acha("Assistente de Pesquisa Pleno / pesquisa");
  return acha("Geral (Iniciante/Júnior/demais)");
}
