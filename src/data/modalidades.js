// Modalidades de participação e valores de bolsa do PIPA.
// Fonte: Portaria Normativa IPEA nº 317/2025 — Art. 4º (modalidades) e Anexo I (valores).
// `moeda`: "BRL" | "USD" | "NONE" (Pesquisador Convidado é voluntário, sem bolsa).
// `formacao`: forma curta da titulação (usada pelo compositor de perfil do wizard).
export const MODALIDADES = [
  {
    nome: "Assistente de Pesquisa e Ciência de Dados Iniciante",
    valor: 1582.0, moeda: "BRL",
    requisito: "Matrícula regular em curso de graduação.",
    formacao: "graduação em curso",
  },
  {
    nome: "Assistente de Pesquisa e Ciência de Dados Júnior",
    valor: 2785.0, moeda: "BRL",
    requisito: "Graduação concluída.",
    formacao: "graduação concluída",
  },
  {
    nome: "Assistente de Pesquisa Pleno",
    valor: 4030.0, moeda: "BRL",
    requisito: "Título de mestre ou especialista, ou no mínimo dois anos de experiência comprovada em pesquisa.",
    formacao: "título de mestre (ou especialista, ou no mínimo dois anos de experiência em pesquisa)",
  },
  {
    nome: "Assistente em Ciência de Dados Pleno",
    valor: 4030.0, moeda: "BRL",
    requisito: "Graduação concluída, com conhecimentos e habilidades em ciência de dados.",
    formacao: "graduação concluída, com conhecimentos em ciência de dados",
  },
  {
    nome: "Assistente de Pesquisa e Ciência de Dados Sênior",
    valor: 6240.0, moeda: "BRL",
    requisito: "Graduação concluída e título de pós-graduação lato ou stricto sensu.",
    formacao: "graduação e pós-graduação (lato ou stricto sensu)",
  },
  {
    nome: "Doutor Bolsista",
    valor: 6760.0, moeda: "BRL",
    requisito: "Título de doutor.",
    formacao: "título de doutor",
  },
  {
    nome: "Pesquisador Internacional",
    valor: 2400.0, moeda: "USD",
    requisito: "Docente/pesquisador de instituição estrangeira; admissão por processo seletivo simplificado.",
    formacao: "docente ou pesquisador de instituição estrangeira",
  },
  {
    nome: "Pesquisador Convidado",
    valor: 0.0, moeda: "NONE",
    requisito: "Admissão por convite; serviço voluntário (Lei nº 9.608/1998). Não faz jus a bolsa.",
    formacao: "admissão por convite (serviço voluntário)",
  },
];
