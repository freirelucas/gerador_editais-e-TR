// Liga a rede de dependências (lib/bayes.js: NMI + DAG aprendido por hill-climbing/BIC) ao
// gerador. Dada a evidência já preenchida no formulário — diretoria, tema, função —, sugere a
// MODALIDADE mais provável a partir do histórico real de chamadas PIPA.
//
// Honestidade (N pequeno: 55 PIPA): usa UM condicional P(alvo|preditor) com contagem real (n);
// escolhe o preditor pela aresta do DAG (o pai aprendido) e, no desempate/ausência de aresta,
// pela informação mútua (NMI); sem suporte suficiente (linha do CPT com n < MIN_N) recai na
// base histórica (marginal). A modalidade canônica do corpus é ruidosa (43 níveis instáveis),
// por isso prevê-se o GRUPO (Assistente/Doutor) — discriminante e bem suportado — e mapeia-se
// ao nível concreto modal do histórico, que casa exatamente com a norma (data/modalidades).
import { observacoes, pairMI, cpt, learnDAG } from "./bayes.js";
import { MODALIDADES } from "../data/modalidades.js";
import { DIRETORIAS } from "../data/diretorias.js";

// Mapa sigla→nome canônico da diretoria (casa com o rótulo do corpus usado nos CPTs).
const DIRETORIA_NOME = Object.fromEntries(DIRETORIAS.map((d) => [d.sigla, d.nome]));

const ESCOPO = "pipa";
const MIN_N = 5; // suporte mínimo da linha do CPT p/ condicionar (abaixo disso é ruído)
const PREDITORES = ["diretoria", "tema", "funcao"]; // evidência que o gerador captura

// DAG aprendido uma vez por sessão (o bootstrap é caro). Se falhar, ordena só por NMI.
let _edges;
function dagEdges() {
  if (_edges === undefined) {
    try { _edges = learnDAG(ESCOPO, { B: 40 }).edges; } catch { _edges = []; }
  }
  return _edges;
}
const confDAG = (from, to) => {
  const e = dagEdges().find((x) => x.from === from && x.to === to);
  return e ? e.conf : 0;
};

// Marginal P(alvo) no escopo — base histórica quando não há evidência com suporte.
function marginal(target) {
  const m = new Map();
  let n = 0;
  for (const o of observacoes(ESCOPO)) {
    const v = o[target];
    if (v == null) continue;
    m.set(v, (m.get(v) || 0) + 1);
    n++;
  }
  let best = null;
  for (const [v, c] of m) if (!best || c > best.c) best = { v, c };
  return best ? { valor: best.v, p: best.c / n, n, via: null, base: true } : null;
}

// Prediz P(alvo | melhor preditor disponível). evid: { diretoria, tema, funcao } (ou null).
function predizer(target, evid) {
  const obs = observacoes(ESCOPO);
  const cands = PREDITORES
    .filter((k) => evid[k] != null)
    .map((k) => ({ k, val: evid[k], conf: confDAG(k, target), nmi: pairMI(obs, k, target).nmi }))
    .sort((a, b) => b.conf - a.conf || b.nmi - a.nmi);
  for (const c of cands) {
    const t = cpt(ESCOPO, c.k, target);
    const row = t.matrix.find((m) => m.r === c.val);
    if (row && row.tot >= MIN_N) {
      let bi = 0;
      for (let i = 1; i < row.probs.length; i++) if (row.probs[i] > row.probs[bi]) bi = i;
      return { valor: t.cols[bi], p: row.probs[bi], n: row.tot, via: { var: c.k, val: c.val, pai: c.conf >= 0.5 } };
    }
  }
  return marginal(target);
}

// Grupo previsto → modalidade concreta da norma (nível modal do histórico; casa com MODALIDADES).
const MODAL_DO_GRUPO = {
  Doutor: "Doutor Bolsista",
  Assistente: "Assistente de Pesquisa Pleno",
  Pesquisador: "Pesquisador Internacional",
};
const achaModalidade = (nome) => MODALIDADES.find((m) => m.nome === nome) || null;
const NOME_PREDITOR = { diretoria: "diretoria", tema: "tema", funcao: "função" };

// Sugestão de modalidade para o formulário atual. Retorna null sem nenhuma evidência.
export function sugerirModalidade(form) {
  const dir = (DIRETORIA_NOME[form.diretoriaSel]) || null;
  const evid = {
    diretoria: dir,
    tema: (form.temas && form.temas[0]) || null,
    funcao: (form.funcoes && form.funcoes[0]) || null,
  };
  if (!evid.diretoria && !evid.tema && !evid.funcao) return null;

  const grupo = predizer("modalGrupo", evid);
  if (!grupo || !grupo.valor) return null;
  const modalidade = achaModalidade(MODAL_DO_GRUPO[grupo.valor]) || MODALIDADES[0];
  return {
    grupo: grupo.valor,
    modalidade, // objeto completo da norma (nome, valor, requisito, formacao…)
    p: grupo.p,
    n: grupo.n,
    base: !!grupo.base,
    via: grupo.via ? { ...grupo.via, nome: NOME_PREDITOR[grupo.via.var] } : null,
  };
}
