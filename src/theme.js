// Identidade visual do IPEA.
// Cores institucionais (Manual de Identidade Visual do IPEA): "Azul IPEA" (Pantone
// 5405 C / 548) e "Preto IPEA". Tipografia institucional: Frutiger — aqui aproximada por
// Source Sans 3 (humanista) para texto e Poppins para o logotipo "ipea".
export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Source+Sans+3:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');
`;

export const SANS = "'Source Sans 3', system-ui, sans-serif";
export const WORDMARK = "'Poppins', 'Source Sans 3', sans-serif";

export const C = {
  // superfícies
  paper: "#eef2f4", // fundo da página (claro, gov.br)
  card: "#ffffff",
  ink: "#16292f", // Preto IPEA (texto)
  muted: "#5b7178",
  line: "#d3dfe2",
  // Azul IPEA e variações
  azul: "#10566a", // primário (Pantone 5405 C aprox.)
  azulEscuro: "#0a3a47", // Pantone 548 (faixas/rodapé)
  azulClaro: "#4f8a9e",
  // aliases mantidos para compatibilidade com componentes existentes
  cerrado: "#10566a", // -> azul (primário)
  terra: "#1f6b7d", // -> azul médio (links/realces)
  gold: "#c98a1e", // âmbar (acento em gráficos)
  abertaBg: "#dbe9ec",
  abertaFg: "#10566a",
};
