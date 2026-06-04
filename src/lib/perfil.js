// Compositor do wizard — monta perfil/atividades limpos a partir das decisões
// (modalidade → formação; função(ões); tema(s); experiência). Tudo editável depois.
import { MODALIDADES } from "../data/modalidades.js";
import { FUNCAO_PERFIL, TEMA_LINHA } from "../data/perfis.js";

const lista = (arr) =>
  arr.length <= 1 ? arr.join("") : arr.slice(0, -1).join(", ") + " e " + arr[arr.length - 1];
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// "Profissional com {formação}, com {competências}, com atuação em {temas}. Experiência desejável: …"
export function comporPerfil({ modalidade, funcoes = [], temas = [], experiencia = "" }) {
  const mod = MODALIDADES.find((m) => m.nome === modalidade);
  const formacao = (mod && mod.formacao) || "a formação exigida pela modalidade";
  const compet = funcoes.map((fn) => (FUNCAO_PERFIL[fn] || {}).competencia).filter(Boolean);
  const linhas = temas.map((t) => TEMA_LINHA[t]).filter(Boolean);
  let s = `Profissional com ${formacao}`;
  if (compet.length) s += `, com ${lista(compet)}`;
  if (linhas.length) s += `, com atuação em ${lista(linhas)}`;
  s += ".";
  if (experiencia && experiencia.trim()) s += ` Experiência desejável: ${experiencia.trim()}.`;
  return s;
}

// Atividades das funções escolhidas (sem repetir), situadas no(s) tema(s).
export function comporAtividades({ funcoes = [], temas = [] }) {
  const ats = [];
  for (const fn of funcoes)
    for (const a of (FUNCAO_PERFIL[fn] || {}).atividades || []) if (!ats.includes(a)) ats.push(a);
  if (!ats.length) return "";
  const linhas = temas.map((t) => TEMA_LINHA[t]).filter(Boolean);
  let s = cap(ats.join("; "));
  if (linhas.length) s += `, no âmbito de ${lista(linhas)}`;
  return s + ".";
}
