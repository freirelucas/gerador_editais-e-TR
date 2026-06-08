// Estado compartilhável via querystring — deep-link de recortes do Analytics.
// Em GitHub Pages não há servidor de rotas, então usamos só ?query (servido pelo mesmo
// index.html) + history.replaceState: a URL acompanha o estado sem recarregar nem poluir
// o histórico de navegação. Slugs curtos mantêm o link limpo e legível.

const DIM_SLUG = {
  "Função do perfil": "funcao",
  "Tema / domínio": "tema",
  "Formação exigida": "formacao",
  "Papel / modalidade": "papel",
  "Diretoria": "diretoria",
  "Categoria de cota": "cota",
  "Programa": "programa",
  "Ano de abertura": "anoab",
};
const DIM_FROM = Object.fromEntries(Object.entries(DIM_SLUG).map(([k, v]) => [v, k]));
const RES_SLUG = { "Com reserva": "com", "Sem reserva": "sem" };
const RES_FROM = { com: "Com reserva", sem: "Sem reserva" };

export const DEFAULT_DIM = "Função do perfil";
export const VIEWS = ["builder", "corpus", "analytics", "redes"];

function setParams(updates) {
  const q = new URLSearchParams(window.location.search);
  for (const [k, v] of Object.entries(updates)) {
    if (v == null || v === "") q.delete(k);
    else q.set(k, v);
  }
  const s = q.toString();
  const url = window.location.pathname + (s ? `?${s}` : "") + window.location.hash;
  window.history.replaceState(null, "", url);
}

// lê o estado inicial da URL (na carga / deep-link recebido)
export function readUrl() {
  const q = new URLSearchParams(window.location.search);
  const view = q.get("view");
  return {
    view: VIEWS.includes(view) ? view : null,
    filtro: {
      programa: q.get("prog") || "Todos",
      ano: q.get("ano") || "Todos",
      reserva: RES_FROM[q.get("res")] || "Todas",
    },
    dim: DIM_FROM[q.get("dim")] || null,
  };
}

// grava só a aba (default builder é omitido p/ link limpo); preserva os demais params
export function writeView(view) {
  setParams({ view: view && view !== "builder" ? view : null });
}

// grava o recorte do Analytics (defaults omitidos); preserva ?view
export function writeAnalytics({ filtro, dim }) {
  setParams({
    prog: filtro.programa !== "Todos" ? filtro.programa : null,
    ano: filtro.ano !== "Todos" ? filtro.ano : null,
    res: RES_SLUG[filtro.reserva] || null,
    dim: dim && dim !== DEFAULT_DIM ? DIM_SLUG[dim] : null,
  });
}
