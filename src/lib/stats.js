// Agregações para a aba de Analytics, derivadas ao vivo do CORPUS limpo.
// Tudo aqui é honesto sobre o que falta: nada de inventar bolsas/modalidades ausentes.
import { CORPUS } from "../data/corpus.js";

const ANOS = ["2023", "2024", "2025", "2026"];
const PROGRAMAS = ["PIPA", "PROCIN", "PROMOB"];

const conta = (arr, chave) => {
  const m = new Map();
  for (const x of arr) {
    const k = chave(x);
    if (k == null) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
};

// --- contagens por dimensão ---
export const porAno = ANOS.map((ano) => ({
  ano,
  total: CORPUS.filter((c) => c.ano === ano).length,
}));

export const porPrograma = PROGRAMAS.map((p) => ({
  programa: p,
  total: CORPUS.filter((c) => c.programa === p).length,
}));

export const porSituacao = [...conta(CORPUS, (c) => c.situacao)].map(([k, v]) => ({
  situacao: k,
  total: v,
}));

// matriz programa × ano (a virada estrutural PROMOB -> PIPA)
export const programaPorAno = ANOS.map((ano) => {
  const linha = { ano };
  for (const p of PROGRAMAS) {
    linha[p] = CORPUS.filter((c) => c.ano === ano && c.programa === p).length;
  }
  return linha;
});

// --- janela de inscrição (dias) ---
const janelas = CORPUS.map((c) => c.janela_dias).filter((d) => typeof d === "number" && d >= 0);
export const histJanela = (() => {
  const bins = new Map();
  for (const d of janelas) {
    const b = Math.min(Math.floor(d / 5) * 5, 40);
    bins.set(b, (bins.get(b) || 0) + 1);
  }
  return [...bins.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([b, n]) => ({ faixa: b === 40 ? "40+" : `${b}–${b + 4}`, total: n }));
})();
export const janelaMediana = janelas.length
  ? [...janelas].sort((a, b) => a - b)[Math.floor(janelas.length / 2)]
  : null;

// --- sazonalidade: abertura por mês × ano (heatmap) ---
export const heatmapMesAno = (() => {
  const grade = ANOS.map((ano) => ({ ano, meses: Array(12).fill(0) }));
  for (const c of CORPUS) {
    if (!c.prazo_ini_iso) continue;
    const [y, m] = c.prazo_ini_iso.split("-");
    const linha = grade.find((g) => g.ano === y);
    if (linha) linha.meses[parseInt(m) - 1] += 1;
  }
  return grade;
})();

// --- série temporal mensal: aberturas por mês (mês de início das inscrições) ---
// Usa o que já temos (datas em nível de mês); sem rede. Captura tendência + sazonalidade.
export const serieMensal = (() => {
  const cont = new Map();
  let minYM = null, maxYM = null;
  for (const c of CORPUS) {
    if (!c.prazo_ini_iso) continue;
    const ym = c.prazo_ini_iso.slice(0, 7);
    cont.set(ym, (cont.get(ym) || 0) + 1);
    if (!minYM || ym < minYM) minYM = ym;
    if (!maxYM || ym > maxYM) maxYM = ym;
  }
  if (!minYM) return [];
  const out = [];
  let [y, m] = minYM.split("-").map(Number);
  const [ey, em] = maxYM.split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    const ym = `${y}-${String(m).padStart(2, "0")}`;
    out.push({ ym, ano: String(y), mes: m, value: cont.get(ym) || 0 });
    if (++m > 12) { m = 1; y++; }
  }
  return out;
})();
export const serieMensalCobertura = CORPUS.filter((c) => c.prazo_ini_iso).length;

// --- temas dos títulos de projeto ---
const STOP = new Set(
  ("de da do das dos e a o as os para com no na nos nas em um uma sobre por que à á " +
    "ao aos pela pelo dos análise").split(" ")
);
export const topTemas = (() => {
  const m = new Map();
  for (const c of CORPUS) {
    for (const w of (c.projeto || "").toLowerCase().match(/[a-zà-ú]{4,}/g) || []) {
      if (!STOP.has(w)) m.set(w, (m.get(w) || 0) + 1);
    }
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([tema, total]) => ({ tema, total }));
})();

// --- qualidade: completude e flags (honestidade primeiro) ---
const N = CORPUS.length;
const frac = (pred) => Math.round((100 * CORPUS.filter(pred).length) / N);
export const completude = [
  { campo: "url / título / ano", pct: 100 },
  { campo: "programa", pct: frac((c) => c.programa) },
  { campo: "datas (prazo)", pct: frac((c) => c.prazo_ini_iso && c.prazo_fim_iso) },
  { campo: "modalidade", pct: frac((c) => c.modalidade) },
  { campo: "qtd. de bolsas", pct: frac((c) => c.qtd_bolsas != null) },
];
export const flagsCount = (() => {
  const m = new Map();
  for (const c of CORPUS) for (const f of c.flags || []) m.set(f, (m.get(f) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([flag, total]) => ({ flag, total }));
})();

export const totalChamadas = N;

// ===================== enriquecimento (extraído dos PDFs) =====================
const semAcento = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// contagem multi-rótulo sobre um campo array (categoria_funcao, categoria_tema, ...)
const contaLista = (campo) => {
  const m = new Map();
  for (const c of CORPUS) for (const v of c[campo] || []) m.set(v, (m.get(v) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
};

export const porFuncao = contaLista("categoria_funcao");
export const porTema = contaLista("categoria_tema");
export const porFormacao = contaLista("formacao");

// papel solicitado — agrupa variantes (acento/caixa) e exibe a forma mais comum
export const porPapel = (() => {
  const g = new Map();
  for (const c of CORPUS) {
    if (!c.papel) continue;
    const k = semAcento(c.papel).replace(/\s+/g, " ").trim();
    const e = g.get(k) || { total: 0, sur: new Map() };
    e.total++;
    e.sur.set(c.papel, (e.sur.get(c.papel) || 0) + 1);
    g.set(k, e);
  }
  return [...g.values()]
    .map((e) => ({ label: [...e.sur.entries()].sort((a, b) => b[1] - a[1])[0][0], value: e.total }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 14);
})();

// diretoria substantiva + bucket honesto de "não identificada"
export const porDiretoria = (() => {
  const m = new Map();
  let sem = 0;
  for (const c of CORPUS) c.diretoria ? m.set(c.diretoria, (m.get(c.diretoria) || 0) + 1) : sem++;
  const arr = [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  if (sem) arr.push({ label: "não identificada", value: sem, color: "#c9d4d7" });
  return arr;
})();

// reserva de vagas (cotas) — presença EXPLÍCITA por categoria (multi-rótulo) e por ano.
// Honesto: conta menção a reserva/cota/ação afirmativa nos PDFs, sem inferir nº de vagas.
export const porCota = (() => {
  const m = new Map();
  for (const c of CORPUS) for (const cat of (c.vagas_por_cota || {}).categorias || []) m.set(cat, (m.get(cat) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
})();
export const comReserva = CORPUS.filter((c) => (c.vagas_por_cota || {}).tem_reserva).length;
export const cotaPorAno = ANOS.map((ano) => ({
  ano,
  total: CORPUS.filter((c) => c.ano === ano && (c.vagas_por_cota || {}).tem_reserva).length,
}));

// --- cotas como % e a virada de regime (Portaria Normativa Ipea nº 317/2025) ---
// O 7,9% "global" engana: mistura a era PROMOB (sem o quadro AC/ER/M/PCD) com a era PIPA.
// A virada se mede por programa e por ano; conformidade aqui é ESTRUTURAL (o quadro aparece
// onde a 317 vale), não numérica (os editais citam a 317 mas não repetem os percentuais, e
// não contamos vagas por categoria — o quadro varia demais).
export const cotaAnalisados = CORPUS.filter((c) => c.vagas_por_cota != null).length;
export const cotaPctTotal = Math.round((comReserva / totalChamadas) * 1000) / 10;
export const cotaPorAnoPct = ANOS.map((ano) => {
  const sub = CORPUS.filter((c) => c.ano === ano);
  const res = sub.filter((c) => (c.vagas_por_cota || {}).tem_reserva).length;
  return { ano, total: sub.length, comReserva: res, pct: sub.length ? Math.round((res / sub.length) * 100) : 0 };
});
export const cotaPorPrograma = PROGRAMAS.map((programa) => {
  const sub = CORPUS.filter((c) => c.programa === programa);
  const analisados = sub.filter((c) => c.vagas_por_cota != null).length;
  const res = sub.filter((c) => (c.vagas_por_cota || {}).tem_reserva).length;
  return { programa, total: sub.length, analisados, comReserva: res,
           pct: analisados ? Math.round((res / analisados) * 100) : 0 };
}).filter((p) => p.analisados > 0).sort((a, b) => b.pct - a.pct);
export const comHetero = CORPUS.filter((c) => (c.vagas_por_cota || {}).heteroidentificacao).length;
export const heteroProgramas = [...new Set(
  CORPUS.filter((c) => (c.vagas_por_cota || {}).heteroidentificacao).map((c) => c.programa)
)];
// categorias reservadas como % das chamadas COM reserva (presença, não nº de vagas)
export const porCotaPct = porCota.map((d) => ({
  label: d.label, value: comReserva ? Math.round((d.value / comReserva) * 100) : 0, n: d.value,
}));

// função × ano (StackedBars) — categorias de função realmente presentes
export const funcoesLabels = porFuncao.map((f) => f.label);
export const perfilPorAno = ANOS.map((ano) => {
  const linha = { ano };
  for (const f of funcoesLabels)
    linha[f] = CORPUS.filter((c) => c.ano === ano && (c.categoria_funcao || []).includes(f)).length;
  return linha;
});

// ===================== 2026 real (YTD) + projetado (pró-rata linear) =====================
// "hoje" = data do build (snapshot determinístico); fallback p/ relógio em runtime/SSR.
const HOJE = (() => {
  try {
    return new Date(typeof __BUILD_DATE__ !== "undefined" ? __BUILD_DATE__ : Date.now());
  } catch {
    return new Date();
  }
})();
export const refDate = HOJE.toISOString().slice(0, 10);
export const anoCorrente = String(HOJE.getFullYear());
export function fracaoAno(hoje = HOJE) {
  const ini = new Date(hoje.getFullYear(), 0, 1);
  const fim = new Date(hoje.getFullYear() + 1, 0, 1);
  return (hoje - ini) / (fim - ini);
}
export const fracAnoCorr = fracaoAno();
const projeta = (realYTD) => (fracAnoCorr > 0 ? Math.round(realYTD / fracAnoCorr) : realYTD);
export const projParcial = ANOS.includes(anoCorrente) && fracAnoCorr < 0.999;

// série anual com projeção só no ano corrente parcial (incremento = projetado - total)
export const porAnoProjetado = porAno.map((d) => ({
  ano: d.ano,
  total: d.total,
  projetado: d.ano === anoCorrente && projParcial ? projeta(d.total) : null,
}));
export const programaPorAnoProj = programaPorAno.map((linha) => {
  if (linha.ano !== anoCorrente || !projParcial) return { ...linha };
  const out = { ...linha };
  for (const p of PROGRAMAS) out[p + "_proj"] = Math.max(projeta(linha[p]) - linha[p], 0);
  return out;
});

// ===================== cobertura do enriquecimento (captions honestas) =====================
export const cobertura = {
  comTexto: CORPUS.filter((c) => c.enriquecido).length,
  objeto: CORPUS.filter((c) => c.objeto).length,
  diretoria: CORPUS.filter((c) => c.diretoria).length,
  funcao: CORPUS.filter((c) => (c.categoria_funcao || []).length).length,
  tema: CORPUS.filter((c) => (c.categoria_tema || []).length).length,
  papel: CORPUS.filter((c) => c.papel).length,
  cotas: comReserva,
};
