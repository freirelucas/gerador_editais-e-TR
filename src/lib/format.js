// Formatadores em português do Brasil.

// Valor monetário em reais: 3360 -> "R$ 3.360,00".
export const BRL = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Número por extenso no feminino (até doze), usado para "uma bolsa", "dois meses" etc.
export const extenso = (n) => {
  const u = [
    "zero", "uma", "duas", "três", "quatro", "cinco", "seis",
    "sete", "oito", "nove", "dez", "onze", "doze",
  ];
  return u[n] || String(n);
};

// Data ISO (YYYY-MM-DD) -> "3 de junho de 2026". Vazio vira um placeholder.
export const fmtData = (iso) => {
  if (!iso) return "____ de __________ de ____";
  const [y, m, d] = iso.split("-");
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`;
};
