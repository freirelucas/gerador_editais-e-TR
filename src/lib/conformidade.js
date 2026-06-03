// Checagem de conformidade do rascunho contra a norma vigente (Portaria 317/2025).
// Não bloqueia a exportação — é um rascunho —, mas sinaliza pendências com o artigo de origem.
import { NORMA } from "../data/norma.js";
import { MODALIDADES } from "../data/modalidades.js";

export const diffDias = (a, b) => {
  if (!a || !b) return null;
  return Math.round((new Date(b) - new Date(a)) / 86400000);
};

// sev: "ok" | "warn" | "err"
export function conformidade(f) {
  const out = [];
  const add = (sev, label, detail) => out.push({ sev, label, detail });
  const tem = (v) => !!(v && String(v).trim());

  add(tem(f.numero) ? "ok" : "warn", "Número da chamada",
    tem(f.numero) ? f.numero : "defina o nº (ex.: 020/2026)");

  const assina = tem(f.unidade) && tem(f.coordenador) && tem(f.diretoria);
  add(assina ? "ok" : "warn", "Unidade, coordenação e diretoria",
    assina ? "completos para assinatura" : "necessários (Art. 7º, parágrafo único)");

  add(tem(f.projeto) ? "ok" : "err", "Definição do projeto",
    tem(f.projeto) ? "preenchida" : "obrigatória (Art. 7º, II)");
  add(tem(f.perfil) ? "ok" : "warn", "Perfil do bolsista",
    tem(f.perfil) ? "preenchido" : "recomendado (Art. 7º, III)");

  const mod = MODALIDADES.find((m) => m.nome === f.modalidade);
  add(mod && mod.valor > 0 ? "ok" : "warn", "Modalidade e valor",
    mod ? `${mod.nome} — Anexo I` : "selecione a modalidade");

  const din = diffDias(f.inscIni, f.inscFim);
  if (din == null)
    add("warn", "Prazo de inscrição ≥ 10 dias", "defina início e fim das inscrições");
  else
    add(din >= NORMA.prazoMinEspecializadaDias ? "ok" : "err", "Prazo de inscrição ≥ 10 dias",
      `${din} dia(s) — mínimo ${NORMA.prazoMinEspecializadaDias} (Art. 8º, §4º)`);

  [["publicação → inscrição", f.dataPub, f.inscIni],
   ["inscrição → resultado", f.inscFim, f.resultado],
   ["resultado → início", f.resultado, f.inicio]].forEach(([nome, a, b]) => {
    const dd = diffDias(a, b);
    if (dd != null) add(dd >= 0 ? "ok" : "err", `Ordem: ${nome}`,
      dd >= 0 ? "datas coerentes" : "data fora de ordem");
  });

  if (f.cotasOn) {
    const q = parseInt(f.qtd) || 1;
    const res = (parseInt(f.cotaER) || 0) + (parseInt(f.cotaM) || 0) + (parseInt(f.cotaPCD) || 0);
    add(res <= q ? "ok" : "err", "Reserva ≤ total de vagas", `${res} reservada(s) de ${q}`);
  }

  add("ok", "Comissão julgadora",
    `mín. ${NORMA.comissaoMinIntegrantes} integrantes + 1 suplente (Art. 9º)`);

  return out;
}

export const resumoConf = (lista) => ({
  err: lista.filter((x) => x.sev === "err").length,
  warn: lista.filter((x) => x.sev === "warn").length,
  ok: lista.filter((x) => x.sev === "ok").length,
});
