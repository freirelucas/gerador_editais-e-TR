// Primitivas compartilhadas dos gráficos SVG (sem dependência externa).
import { C, SANS } from "../../theme.js";

// Cores por programa (consistentes em toda a aba) e paleta categórica geral, em Azul IPEA.
export const COR_PROGRAMA = { PIPA: C.azul, PROMOB: C.gold, PROCIN: C.azulClaro };
export const PALETA = [C.azul, C.gold, C.azulClaro, C.azulEscuro, "#8fb4bf", C.muted];

export const MONO = SANS;
export const SERIF = SANS;

export const fmtInt = (n) => n.toLocaleString("pt-BR");

// Maior valor "redondo" para o topo do eixo.
export function niceMax(v) {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * mag >= v) || 10;
  return step * mag;
}

// Ticks uniformes de 0..max.
export function ticks(max, n = 4) {
  return Array.from({ length: n + 1 }, (_, i) => Math.round((max / n) * i));
}
