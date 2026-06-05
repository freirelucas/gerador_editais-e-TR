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
