// Corpus de Chamadas Públicas do IPEA (2023–2026).
//
// Fonte: ../../data/corpus_chamadas_2023-2026.json — CANÔNICO já limpo pelo
// pipeline em scripts/ (programa normalizado, datas ISO, campos derivados e flags
// de qualidade). A semente bruta fica preservada em data/raw/.
//
// Aqui apenas adicionamos dois apelidos de exibição usados pela interface (qtd, pdf),
// mantendo todos os campos limpos disponíveis para a aba de Analytics.
import limpo from "../../data/corpus_chamadas_2023-2026.json";

export const CORPUS = limpo.map((c) => ({
  ...c,
  qtd: c.qtd_bolsas, // CorpusView usa `qtd`
  pdf: (c.pdf_urls && c.pdf_urls[0]) || null,
}));
