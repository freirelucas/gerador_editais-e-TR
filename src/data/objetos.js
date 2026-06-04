// Padrões REAIS de "objeto / definição do projeto" extraídos do corpus — SOMENTE chamadas
// PIPA (programa atual; PROMOB/PROCIN têm outro formato e ficam de fora, para evitar
// conflito de formatos). Texto verbatim das chamadas, identificado por arquivo de origem.
// Estrutura recorrente observada (fonte: data/pdf_text/{2025,2026}_pipa_*.txt):
//   §1 OBJETO  = fórmula administrativa que nomeia o Projeto;
//   §5/6 INFORMAÇÕES SOBRE O PROJETO = "Propósito do trabalho" (a definição/justificativa
//   substantiva) + "Atividades a serem desenvolvidas" (lista).

// Fórmula de abertura do OBJETO mais frequente (vista em 9 chamadas; variante curta em 6).
export const OBJETO_FORMULA =
  'Seleção de interessados para concessão de bolsa de pesquisa e formação de cadastro reserva, ' +
  'conforme a Portaria Normativa Ipea nº 317, de 18 de abril de 2025, para atuar no Projeto: "{PROJETO}".';

// Andaime do "Propósito do trabalho" (estrutura real, com lacunas para o proponente).
export const PROPOSITO_SKELETON =
  "Propósito do trabalho: [contextualize o problema de política pública ou o mandato " +
  "institucional que motiva o projeto]. A pesquisa do Ipea contribuirá com [a contribuição " +
  "específica — estudos, modelos, indicadores, metodologia ou acompanhamento].";

// Exemplares REAIS por tema (propósito verbatim, truncado com …). DIEST = "Estado,
// instituições e democracia". Servem de ponto de partida editável, não de texto final.
export const OBJETO_EXEMPLOS = [
  { tema: "Macroeconomia e finanças", projeto: "Macroeconomia sob incerteza forte",
    proposito: "Elaborar modelos de equilíbrio geral aplicados para o Brasil que incorporem incerteza em um sentido amplo, abrangendo formas de incerteza denominadas por Dequech (2006) como “strong uncertainty”…", fonte: "2026_pipa_019" },
  { tema: "Macroeconomia e finanças", projeto: "Estimação dos Efeitos Econômicos da PLOA 2025/26 (Matriz Insumo-Produto)",
    proposito: "Os gastos e transferências do governo possuem efeitos distintos sobre a atividade econômica, seja sobre a renda gerada, o emprego, importações e sobre a própria arrecadação fiscal…", fonte: "2026_pipa_017" },
  { tema: "Social, trabalho e renda", projeto: "Análise das Políticas de Emprego e Boletim Mercado de Trabalho",
    proposito: "O Brasil tem problemas estruturais em seu mercado de trabalho, que tende a ser caracterizado por ocupações associadas à baixa qualificação do trabalhador e uma alta taxa de informalidade…", fonte: "2026_pipa_012" },
  { tema: "Social, trabalho e renda", projeto: "Acompanhamento e Análise de Políticas em Educação",
    proposito: "O projeto envolve estudos e pesquisas em educação, a produção do capítulo de Educação para a edição de 2026 do boletim Políticas Sociais: Acompanhamento e Análise, e o acompanhamento da produção do Ipea relativa ao ODS 4…", fonte: "2025_pipa_037" },
  { tema: "Social, trabalho e renda", projeto: "INCLUA – Igualdade Racial",
    proposito: "A INCLUA – Plataforma de Recursos Pró-Equidade em Políticas Públicas tem o objetivo de oferecer aos gestores e profissionais envolvidos na implementação de programas, serviços e ações governamentais um instrumento que mobilize a atenção…", fonte: "2026_pipa_018" },
  { tema: "Estado, instituições e democracia", projeto: "A reconstrução da Participação Social no Governo Federal",
    proposito: "A participação social, entendida como “o direito de tomar parte na direção dos negócios públicos do seu país”, foi afirmada internacionalmente como um direito humano na década de 1940…", fonte: "2025_pipa_039" },
  { tema: "Estado, instituições e democracia", projeto: "O uso e o não uso de evidências pela burocracia federal brasileira",
    proposito: "A atuação do/a pesquisador/a selecionado/a visa apoiar estudos e atividades voltadas a investigar e fomentar a investigação sobre dinâmicas de mobilização de conhecimento e processos de institucionalização do uso de evidências…", fonte: "2025_pipa_041" },
  { tema: "Regional, urbano e ambiental", projeto: "Resíduos sólidos e a inclusão socioeconômica de catadoras e catadores",
    proposito: "O Ipea, na condição de membro convidado pelo CIISC (Decreto nº 11.414/2023), foi acionado para a elaboração de uma metodologia que produza dados oficiais do Governo Federal sobre o tema…", fonte: "2026_pipa_010" },
  { tema: "Regional, urbano e ambiental", projeto: "Plano Nacional de Habitação 2023-2040",
    proposito: "O presente projeto visa à realização de estudos, pesquisas e análises para subsidiar a elaboração e definição do Plano Nacional de Habitação (Planhab) para 2024-2040, de acordo com a Lei nº 11.124/2005…", fonte: "2025_pipa_036" },
  { tema: "Setorial, inovação e infraestrutura", projeto: "Impactos da transformação digital no Estado e sociedade",
    proposito: "Tecnologia e comunicação são o motor de grandes mudanças sociais nos últimos anos. As novas tecnologias se sucedem cada vez mais rapidamente, dificultando a avaliação dos seus impactos…", fonte: "2025_pipa_038" },
  { tema: "Internacional e comércio", projeto: "Desigualdade, comércio internacional e mudança estrutural",
    proposito: "Construir modelos de equilíbrio geral com comércio internacional para analisar a transformação estrutural em economias abertas, com ênfase na desigualdade dos impactos sobre a renda…", fonte: "2026_pipa_020" },
];

export const objetoFormula = (projetoNome) =>
  OBJETO_FORMULA.replace("{PROJETO}", (projetoNome && projetoNome.trim()) || "[NOME DO PROJETO]");
export const exemplosPorTema = (temas = []) =>
  OBJETO_EXEMPLOS.filter((e) => temas.includes(e.tema));
