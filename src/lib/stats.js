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
