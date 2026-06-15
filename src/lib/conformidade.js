// Checagem de conformidade do rascunho contra a norma vigente (Portaria 317/2025).
// Não bloqueia a exportação — é um rascunho —, mas sinaliza pendências com o artigo de origem.
import { NORMA } from "../data/norma.js";
import { MODALIDADES } from "../data/modalidades.js";

export const diffDias = (a, b) => {
  if (!a || !b) return null;
  return Math.round((new Date(b) - new Date(a)) / 86400000);
};

// Normaliza para o array de vagas (≥1), igual ao gerador: 1 vaga = bolsa; N = seleções.
function vagasDe(f) {
  if (Array.isArray(f.vagas) && f.vagas.length) return f.vagas;
  return [{ modalidade: f.modalidade, qtd: f.qtd, perfil: f.perfil, atividades: f.atividades,
    criterios: f.criterios, cotaER: f.cotasOn ? f.cotaER : 0, cotaM: f.cotasOn ? f.cotaM : 0, cotaPCD: f.cotasOn ? f.cotaPCD : 0 }];
}

// sev: "ok" | "warn" | "err"
export function conformidade(f) {
  const out = [];
  const add = (sev, label, detail) => out.push({ sev, label, detail });
  const tem = (v) => !!(v && String(v).trim());
  const vs = vagasDe(f);
  const multi = vs.length > 1;

  add(tem(f.numero) ? "ok" : "warn", "Número da chamada",
    tem(f.numero) ? f.numero : "defina o nº (ex.: 020/2026)");

  const assina = tem(f.unidade) && tem(f.coordenador) && tem(f.diretoria);
  add(assina ? "ok" : "warn", "Unidade, coordenação e diretoria",
    assina ? "completos para assinatura" : "necessários (Art. 7º, parágrafo único)");

  add(tem(f.projeto) ? "ok" : "err", "Definição do projeto",
    tem(f.projeto) ? "preenchida" : "obrigatória (Art. 7º, II)");

  // Perfil: ao menos uma vaga com perfil preenchido (em multivagas, todas idealmente).
  const comPerfil = vs.filter((v) => tem(v.perfil)).length;
  add(comPerfil === vs.length ? "ok" : "warn", "Perfil do bolsista",
    comPerfil === vs.length ? "preenchido" : `${comPerfil}/${vs.length} vaga(s) — recomendado (Art. 7º, III)`);

  // Modalidade e valor: cada vaga deve ter modalidade válida do Anexo I.
  const semMod = vs.filter((v) => !MODALIDADES.find((m) => m.nome === v.modalidade)).length;
  add(semMod === 0 ? "ok" : "warn", "Modalidade e valor",
    semMod === 0 ? (multi ? `${vs.length} vaga(s) — Anexo I` : `${modNome(vs[0])} — Anexo I`) : `${semMod} vaga(s) sem modalidade do Anexo I`);

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

  // Vagas/seleções: reserva ≤ vagas em cada uma; panorama do conjunto.
  const tot = vs.reduce((a, v) => a + (parseInt(v.qtd) || 1), 0);
  if (multi) add("ok", "Seleções (multivagas)", `${vs.length} seleção(ões), ${tot} bolsa(s) no total`);
  vs.forEach((v, i) => {
    const q = parseInt(v.qtd) || 1;
    const res = (parseInt(v.cotaER) || 0) + (parseInt(v.cotaM) || 0) + (parseInt(v.cotaPCD) || 0);
    const rotulo = multi ? `Seleção ${i + 1}: ` : "";
    if (res > q) add("err", `${rotulo}Reserva ≤ vagas`, `${res} reservada(s) de ${q}`);
  });

  add("ok", "Comissão julgadora",
    `mín. ${NORMA.comissaoMinIntegrantes} integrantes + 1 suplente (Art. 9º)`);

  // ---- Padrões empíricos do corpus PIPA (sev "info"; só aparecem quando há desvio) ----
  vs.forEach((v, i) => {
    const cdMod = (v.modalidade || "").includes("Ciência de Dados");
    const cdFunc = (v.funcoes || f.funcoes || []).some((fn) => fn.includes("Ciência de Dados"));
    if (cdMod && !cdFunc)
      add("info", `${multi ? `Seleção ${i + 1}: ` : ""}Coerência modalidade × função (corpus)`,
        "modalidade de Ciência de Dados sem função de Ciência de Dados — nas chamadas PIPA, 9/9 casam");
  });
  if (tot > 3)
    add("info", "Quantitativo usual (corpus)",
      `${tot} vagas — no corpus PIPA o usual é 1 bolsa (máximo observado: 3)`);
  if (din != null && din >= NORMA.prazoMinEspecializadaDias && din > 21)
    add("info", "Janela de inscrição usual (corpus)",
      `${din} dias — mediana PIPA 13 (faixa típica 11–14 dias)`);

  return out;
}

const modNome = (v) => (MODALIDADES.find((m) => m.nome === v.modalidade) || { nome: "modalidade" }).nome;

export const resumoConf = (lista) => ({
  err: lista.filter((x) => x.sev === "err").length,
  warn: lista.filter((x) => x.sev === "warn").length,
  ok: lista.filter((x) => x.sev === "ok").length,
});
