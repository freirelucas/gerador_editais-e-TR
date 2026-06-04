// Compositor do wizard — monta objeto, perfil, atividades e critérios a partir das decisões,
// ancorado na norma (modalidades) e no corpus PIPA (objetos/critérios/vocabulário reais).
// Tudo editável depois.
import { MODALIDADES } from "../data/modalidades.js";
import { FUNCAO_PERFIL, TEMA_LINHA } from "../data/perfis.js";
import { objetoFormula, PROPOSITO_SKELETON } from "../data/objetos.js";
import { escolherPerfilCriterios } from "../data/criterios.js";

const lista = (arr) =>
  arr.length <= 1 ? arr.join("") : arr.slice(0, -1).join(", ") + " e " + arr[arr.length - 1];
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Objeto/definição no formato real das chamadas PIPA: fórmula + "Propósito do trabalho".
export function comporObjeto({ projetoNome = "" }) {
  return `${objetoFormula(projetoNome)}\n\n${PROPOSITO_SKELETON}`;
}

// "Profissional com {formação}, com {competências}, com atuação em {temas} ({recortes}).
//  Ênfase em {ênfases}. Experiência desejável: …"
export function comporPerfil({ modalidade, funcoes = [], temas = [], experiencia = "", enfases = [], recortes = [] }) {
  const mod = MODALIDADES.find((m) => m.nome === modalidade);
  const formacao = (mod && mod.formacao) || "a formação exigida pela modalidade";
  const compet = funcoes.map((fn) => (FUNCAO_PERFIL[fn] || {}).competencia).filter(Boolean);
  const linhas = temas.map((t) => TEMA_LINHA[t]).filter(Boolean);
  let s = `Profissional com ${formacao}`;
  if (compet.length) s += `, com ${lista(compet)}`;
  if (linhas.length) s += `, com atuação em ${lista(linhas)}`;
  if (recortes.length) s += ` (com recorte em ${lista(recortes)})`;
  s += ".";
  if (enfases.length) s += ` Ênfase em ${lista(enfases)}.`;
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

// Critérios de seleção no padrão real das chamadas PIPA (itens pontuados + cláusulas).
export function sugerirCriterios({ modalidade = "", funcoes = [], provaPratica = false }) {
  const perf = escolherPerfilCriterios(modalidade, funcoes);
  const itens = perf.itens.slice();
  if (provaPratica && perf.opcional) itens.splice(itens.length - 1, 0, perf.opcional); // antes da entrevista
  const letra = (i) => String.fromCharCode(65 + i);
  const corpo = itens.map((it, i) => `${letra(i)}) ${it.c} (peso ${it.p})`).join("; ");
  return (
    `A seleção observará os critérios de julgamento a seguir, com os pesos indicados: ${corpo}. ` +
    `A entrevista será aplicada às pessoas candidatas mais bem pontuadas nos demais critérios. ` +
    `Será desclassificada a candidatura com nota inferior a 50% da pontuação total; o desempate ` +
    `observará a maior idade na inscrição (SISBOLSAS).`
  );
}
