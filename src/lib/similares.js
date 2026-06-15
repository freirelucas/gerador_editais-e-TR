// Prefill do corpus: encontra chamadas PIPA reais parecidas com as escolhas atuais e
// expõe os textos aproveitáveis (definição/objeto, perfil/requisitos, atividades) como
// ponto de partida editável. Tudo vem do corpus enriquecido (data/corpus_*.json).
import { CORPUS } from "../data/corpus.js";

const txt = (v) => (Array.isArray(v) ? v.filter(Boolean).join(" ") : v || "");
const clamp = (s, n) => {
  s = String(s).replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "…" : s;
};

const PIPA = CORPUS.filter((c) => String(c.programa).includes("PIPA"));

// Pontua a semelhança da chamada `c` com as decisões atuais do formulário `f`.
function score(c, f) {
  let s = 0;
  if (c.modalidade_canonica && f.modalidade && c.modalidade_canonica === f.modalidade) s += 5;
  else if (c.modalidade && f.modalidade && c.modalidade.split(" ")[0] === f.modalidade.split(" ")[0]) s += 2;
  const ct = c.categoria_tema || [], cf = c.categoria_funcao || [];
  s += (f.temas || []).filter((t) => ct.includes(t)).length * 2;
  s += (f.funcoes || []).filter((fn) => cf.includes(fn)).length * 2;
  if (c.diretoria && f.diretoriaSel && String(c.diretoria) === String(f.diretoriaSel)) s += 2;
  return s;
}

// Ranking de ocorrências de um atributo (string ou lista) sobre um conjunto de chamadas.
const rank = (pool, getArr) => {
  const m = new Map();
  for (const c of pool) for (const v of getArr(c) || []) if (v) m.set(v, (m.get(v) || 0) + 1);
  return [...m.entries()]
    .map(([nome, k]) => ({ nome, k, pct: Math.round((100 * k) / pool.length) }))
    .sort((a, b) => b.k - a.k);
};

const mediana = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

// Características de vagas TÍPICAS para o domínio do projeto: agrega as chamadas PIPA reais do(s)
// mesmo(s) tema(s) — com fallback p/ a diretoria e, por fim, todo o PIPA — e resume o PADRÃO
// (modalidade usual, quantitativo, janela de inscrição, reserva de cotas). Descreve o padrão a
// partir de dados reais; não copia o texto de uma chamada específica.
export function vagasTipicas(f) {
  const temas = f.temas || [];
  let pool = PIPA.filter((c) => (c.categoria_tema || []).some((t) => temas.includes(t)));
  let escopo = "tema";
  if (pool.length < 5 && f.diretoriaSel != null) {
    const d = PIPA.filter((c) => String(c.diretoria) === String(f.diretoriaSel));
    if (d.length > pool.length) { pool = d; escopo = "diretoria"; }
  }
  if (!pool.length) { pool = PIPA; escopo = "PIPA"; }
  const n = pool.length;
  const nums = (key) => pool.map((c) => Number(c[key])).filter((x) => Number.isFinite(x) && x > 0);
  const qtd = nums("qtd_bolsas");
  const comReserva = pool.filter((c) => c.tem_reserva === true || c.tem_reserva === 1).length;
  return {
    n, escopo,
    modalidades: rank(pool, (c) => (c.modalidade_canonica ? [c.modalidade_canonica] : [])).slice(0, 3),
    qtdMediana: mediana(qtd),
    qtdMax: qtd.length ? Math.max(...qtd) : null,
    janelaMediana: mediana(nums("janela_dias")),
    pctReserva: n ? Math.round((100 * comReserva) / n) : 0,
  };
}

// Top-N chamadas PIPA reais mais parecidas que tenham texto aproveitável.
export function chamadasSimilares(f, n = 3) {
  return PIPA
    .filter((c) => c.objeto || c.atividades || c.requisitos || c.formacao)
    .map((c) => ({ c, s: score(c, f) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map(({ c, s }) => ({
      score: s,
      titulo: c.titulo,
      ano: c.ano,
      modalidade: c.modalidade_canonica || c.modalidade || "",
      projetoNome: c.projeto || c.projeto_vinculado || "",
      def: clamp(txt(c.objeto), 700),
      perfil: clamp([txt(c.formacao), txt(c.requisitos)].filter(Boolean).join(" — "), 700),
      atividades: clamp(txt(c.atividades), 700),
      url: (c.pdf_urls && c.pdf_urls[0]) || c.url || null,
    }));
}
