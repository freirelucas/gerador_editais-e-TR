// Cláusulas reais mais frequentes (extraídas da biblioteca limpa) oferecidas como
// sugestão nos campos livres do construtor. Arquivo pequeno gerado por
// scripts/build_app_data.py — a biblioteca completa (~3 MB) NÃO é empacotada.
import sugeridas from "./clausulas_sugeridas.json";

export const CLAUSULAS_SUGERIDAS = sugeridas;

// Devolve as cláusulas sugeridas para um rótulo de seção (ex.: "REQUISITOS DOS CANDIDATOS").
export function clausulasDe(rotulo) {
  return CLAUSULAS_SUGERIDAS[rotulo] || [];
}
