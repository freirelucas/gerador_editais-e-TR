// Primitivas compartilhadas dos gráficos SVG (sem dependência externa).
import { C } from "../../theme.js";

// Cores por programa (consistentes em toda a aba) e paleta categórica geral.
export const COR_PROGRAMA = { PIPA: C.cerrado, PROMOB: C.terra, PROCIN: C.gold };
export const PALETA = [C.cerrado, C.terra, C.gold, "#7a9a6d", "#b0844a", "#9a6b4b", C.muted];

export const MONO = "'IBM Plex Mono',monospace";
export const SERIF = "Spectral,serif";

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
