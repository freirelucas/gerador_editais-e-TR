// Corpus de Chamadas Públicas do IPEA (2023–2026), raspado do portal institucional.
//
// Fonte única de dados: ../../data/corpus_chamadas_2023-2026.json
// Aqui projetamos apenas os campos usados pela interface e normalizamos o nome
// do programa (PIPA / PROCIN / PROMOB) para alimentar o filtro de forma estável.
import raw from "../../data/corpus_chamadas_2023-2026.json";

function normalizePrograma(p) {
  const up = (p || "").toUpperCase();
  if (up.includes("PROMOB")) return "PROMOB";
  if (up.includes("PROCIN")) return "PROCIN";
  if (up.includes("PIPA")) return "PIPA";
  return up;
}

export const CORPUS = raw.map((c) => ({
  titulo: c.titulo,
  ano: c.ano,
  programa: normalizePrograma(c.programa),
  situacao: c.situacao,
  projeto: c.projeto,
  modalidade: c.modalidade || "",
  qtd: c.qtd_bolsas ?? null,
  url: c.url,
  pdf: (c.pdf_urls && c.pdf_urls[0]) || null,
}));
