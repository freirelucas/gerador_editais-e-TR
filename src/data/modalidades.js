// Modalidades de participação e valores de bolsa do PIPA.
// Fonte: Portaria Normativa IPEA nº 317/2025 — Art. 4º (modalidades) e Anexo I (valores).
// `moeda`: "BRL" | "USD" | "NONE" (Pesquisador Convidado é voluntário, sem bolsa).
export const MODALIDADES = [
  {
    nome: "Assistente de Pesquisa e Ciência de Dados Iniciante",
    valor: 1582.0, moeda: "BRL",
    requisito: "Matrícula regular em curso de graduação.",
  },
  {
    nome: "Assistente de Pesquisa e Ciência de Dados Júnior",
    valor: 2785.0, moeda: "BRL",
    requisito: "Graduação concluída.",
  },
  {
    nome: "Assistente de Pesquisa Pleno",
    valor: 4030.0, moeda: "BRL",
    requisito: "Título de mestre ou especialista, ou no mínimo dois anos de experiência comprovada em pesquisa.",
  },
  {
    nome: "Assistente em Ciência de Dados Pleno",
    valor: 4030.0, moeda: "BRL",
    requisito: "Graduação concluída, com conhecimentos e habilidades em ciência de dados.",
  },
  {
    nome: "Assistente de Pesquisa e Ciência de Dados Sênior",
    valor: 6240.0, moeda: "BRL",
    requisito: "Graduação concluída e título de pós-graduação lato ou stricto sensu.",
  },
  {
    nome: "Doutor Bolsista",
    valor: 6760.0, moeda: "BRL",
    requisito: "Título de doutor.",
  },
  {
    nome: "Pesquisador Internacional",
    valor: 2400.0, moeda: "USD",
    requisito: "Docente/pesquisador de instituição estrangeira; admissão por processo seletivo simplificado.",
  },
  {
    nome: "Pesquisador Convidado",
    valor: 0.0, moeda: "NONE",
    requisito: "Admissão por convite; serviço voluntário (Lei nº 9.608/1998). Não faz jus a bolsa.",
  },
];
