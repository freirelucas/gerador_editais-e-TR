// Geração de documentos do PIPA ancorada na norma vigente
// (Portaria Normativa IPEA nº 317/2025): o Termo de Referência (Art. 7º) e a minuta de
// Chamada Pública Especializada derivada dele. O núcleo regulado (modalidade, valores,
// prazos, comissão, recursos) vem da norma; os campos descritivos (projeto, perfil,
// atividades, critérios) são preenchidos pelo proponente.
//
// MODELO 1→N: um TR tem uma OU MAIS vagas (seleções). `vagasDe(f)` normaliza para um
// array sempre — sintetizando uma vaga dos campos de topo quando o rascunho é antigo —,
// então o documento lê como bolsa única quando há 1 vaga e como seleções quando há várias.
// Cada vaga é completa: modalidade, qtd, tipo, cotas, perfil, atividades e critérios próprios.
import { MODALIDADES } from "../data/modalidades.js";
import { NORMA } from "../data/norma.js";
import { fmtValor, extenso, fmtData } from "./format.js";

const ou = (v, fallback) => (v && String(v).trim() ? String(v).trim() : fallback);
const pad = (n) => String(n).padStart(2, "0");
const modOf = (nome) => MODALIDADES.find((m) => m.nome === nome) || { nome: nome || "[MODALIDADE]", valor: 0, moeda: "BRL", requisito: "" };
const cotasDe = (v) => ({ er: parseInt(v.cotaER) || 0, m: parseInt(v.cotaM) || 0, pcd: parseInt(v.cotaPCD) || 0 });
const temCota = (v) => { const c = cotasDe(v); return c.er + c.m + c.pcd > 0; };

// Normaliza o formulário para um array de vagas SEMPRE (≥1). Rascunho antigo (campos de
// topo, sem f.vagas) é convertido em uma vaga sintetizada — compatibilidade retroativa.
function vagasDe(f) {
  if (Array.isArray(f.vagas) && f.vagas.length) return f.vagas;
  return [{
    modalidade: f.modalidade,
    qtd: f.qtd,
    tipo: f.cadastroReserva ? "Imediata + cadastro reserva" : "Imediata",
    cotaER: f.cotasOn ? f.cotaER : 0, cotaM: f.cotasOn ? f.cotaM : 0, cotaPCD: f.cotasOn ? f.cotaPCD : 0,
    perfil: f.perfil, atividades: f.atividades, criterios: f.criterios,
  }];
}
const durs = (f) => {
  const durB = parseInt(f.duracaoBolsa) || 12;
  return { durB, durP: parseInt(f.duracaoPesquisa) || durB };
};

// ---------- Vaga única: prosa de bolsa "normal" ----------
function caracteristicasBolsa(v, f) {
  const mod = modOf(v.modalidade);
  const q = parseInt(v.qtd) || 1;
  const { durB } = durs(f);
  const cadastro = /cadastro reserva/i.test(v.tipo || "") || f.cadastroReserva;
  const b = [
    `Modalidade: ${mod.nome} — ${fmtValor(mod.valor, mod.moeda)} mensais (Anexo I da ${NORMA.portaria}).`,
    `Requisito da modalidade: ${ou(mod.requisito, "conforme Art. 4º da norma vigente.")}`,
    `Quantitativo: ${pad(q)} (${extenso(q)}) bolsa(s), com duração prevista de ${pad(durB)} (${extenso(durB)}) ${durB === 1 ? "mês" : "meses"}, renovável a critério do IPEA.`,
    cadastro
      ? "Haverá cadastro reserva, observada a ordem de classificação, admitido provimento adicional na vigência da chamada (Art. 9º, §2º)."
      : "Não haverá cadastro reserva.",
  ];
  if (ou(f.reservaVagas, "")) b.push(`Público-alvo / reserva de vagas (Art. 25): ${f.reservaVagas.trim()}`);
  if (temCota(v)) {
    const { er, m, pcd } = cotasDe(v);
    const ac = Math.max(q - er - m - pcd, 0);
    b.push(`Reserva de vagas (cotas): das ${pad(q)} vaga(s), ${pad(ac)} de ampla concorrência e ${pad(er + m + pcd)} reservada(s), conforme o quadro abaixo e ${ou(f.fundamentoCotas, "a legislação aplicável e o disposto na chamada")}.`);
    if (f.heteroident) b.push("A autodeclaração étnico-racial será confirmada por procedimento de heteroidentificação, na forma da chamada.");
  }
  return b;
}

// Quadro de vagas por cota (AC/ER/M/PCD) — só categorias com reserva, mais AC e total.
function quadroVagas(v) {
  const q = parseInt(v.qtd) || 1;
  const { er, m, pcd } = cotasDe(v);
  const ac = Math.max(q - er - m - pcd, 0);
  const rows = [["Categoria", "Vagas"], ["Ampla concorrência (AC)", pad(ac)]];
  if (er) rows.push(["Étnico-racial (ER)", pad(er)]);
  if (m) rows.push(["Mulheres (M)", pad(m)]);
  if (pcd) rows.push(["Pessoa com deficiência (PCD)", pad(pcd)]);
  rows.push(["Total", pad(q)]);
  return rows;
}

// ---------- Várias vagas: edital com seleções (Seleção 1, 2, …) ----------
// Quadro consolidado: uma linha por seleção (modalidade, valor, vagas, reserva) + total.
function quadroMultivagas(vs) {
  const rows = [["Seleção", "Modalidade", "Valor mensal", "Vagas", "Reserva"]];
  let tot = 0;
  vs.forEach((v, i) => {
    const m = modOf(v.modalidade);
    const q = parseInt(v.qtd) || 1; tot += q;
    const { er, m: mu, pcd } = cotasDe(v);
    const res = [er && `ER ${pad(er)}`, mu && `M ${pad(mu)}`, pcd && `PCD ${pad(pcd)}`].filter(Boolean).join(", ") || "—";
    rows.push([`Seleção ${i + 1}${v.tipo ? ` — ${v.tipo}` : ""}`, m.nome, fmtValor(m.valor, m.moeda), pad(q), res]);
  });
  rows.push(["Total", "", "", pad(tot), ""]);
  return rows;
}

function caracteristicasMultivagas(vs, f) {
  const tot = vs.reduce((a, v) => a + (parseInt(v.qtd) || 1), 0);
  const b = [
    `Esta chamada compreende ${pad(vs.length)} (${extenso(vs.length)}) seleção(ões), totalizando ${pad(tot)} (${extenso(tot)}) bolsa(s), conforme o quadro a seguir. Cada seleção possui modalidade, valor e requisitos próprios (Art. 4º e Anexo I da ${NORMA.portaria}).`,
  ];
  if (ou(f.reservaVagas, "")) b.push(`Público-alvo / reserva de vagas (Art. 25): ${f.reservaVagas.trim()}`);
  if (vs.some((v) => temCota(v))) b.push(`As vagas reservadas (cotas) observam, em cada seleção, a ordem de classificação e ${ou(f.fundamentoCotas, "a legislação aplicável")}, conforme detalhado na chamada.`);
  return b;
}

// Perfil/requisitos por seleção (requisito da modalidade + texto específico, se houver).
const perfilMultivagas = (vs) => vs.map((v, i) => {
  const m = modOf(v.modalidade);
  const req = ou(m.requisito, "requisitos conforme Art. 4º da norma vigente.");
  const esp = ou(v.perfil, "");
  return `Seleção ${i + 1} — ${m.nome}: ${req}${esp ? ` ${esp}` : ""}`;
});
const atividadesMultivagas = (vs) => vs.map((v, i) =>
  `Seleção ${i + 1} — ${modOf(v.modalidade).nome}: ${ou(v.atividades, "[descrever as atividades de pesquisa desta seleção].")}`);
const criteriosMultivagas = (vs, f) => vs.map((v, i) =>
  `Seleção ${i + 1} — ${modOf(v.modalidade).nome}: ${ou(v.criterios, criteriosDefault(f))}`);

const criteriosDefault = (f) =>
  f.cartaIntencoes
    ? "A seleção considerará a carta de intenções (trajetória profissional, competências aplicáveis ao objeto e motivações) e a análise curricular, conforme modelo divulgado na chamada (Art. 8º, §1º)."
    : "A seleção será baseada em análise curricular e critérios complementares — ensaios, propostas de projeto ou de atividades, entrevistas, entre outros — definidos na chamada (Art. 8º, §2º).";

const comissaoTexto = (f) =>
  ou(
    f.comissao,
    `Comissão julgadora composta por, no mínimo, ${NORMA.comissaoMinIntegrantes} (três) integrantes e um suplente, indicados pelo coordenador do projeto (Art. 9º). Vedada a participação de cônjuge/parente até 3º grau, orientador dos últimos cinco anos ou amigo íntimo/inimigo do avaliado.`
  );

function cronograma(f) {
  return [
    ["Etapa", "Data"],
    ["Publicação da chamada", fmtData(f.dataPub)],
    [`Inscrições (mín. ${NORMA.prazoMinEspecializadaDias} dias)`, `${fmtData(f.inscIni)} a ${fmtData(f.inscFim)}`],
    ["Divulgação do resultado", `a partir de ${fmtData(f.resultado)}`],
    ["Início das atividades", `a partir de ${fmtData(f.inicio)}`],
  ];
}

// Seção "modalidade/quadro" conforme o nº de vagas (1 = bolsa; N = seleções).
const secModalidade = (vs, f, t1, tN) => vs.length > 1
  ? { t: tN, b: caracteristicasMultivagas(vs, f), table: quadroMultivagas(vs) }
  : { t: t1, b: caracteristicasBolsa(vs[0], f), ...(temCota(vs[0]) ? { table: quadroVagas(vs[0]) } : {}) };

// ---------- Termo de Referência (Art. 7º) ----------
export function buildTR(f) {
  const vs = vagasDe(f);
  const { durB, durP } = durs(f);
  const multi = vs.length > 1;
  const S = [];
  S.push({ t: `TERMO DE REFERÊNCIA — CHAMADA PÚBLICA ESPECIALIZADA IPEA/PIPA Nº ${ou(f.numero, "XXX/AAAA")}`, head: true });
  S.push({ p: `Termo de referência para seleção de bolsista no âmbito do ${NORMA.programa}, nos termos do Art. 7º da ${NORMA.portaria}.` });
  S.push({ n: 1, t: "UNIDADE RESPONSÁVEL E COORDENAÇÃO", b: [
    `Unidade responsável: ${ou(f.unidade, "[DIRETORIA/UNIDADE RESPONSÁVEL]")}.`,
    `Coordenação do projeto: ${ou(f.coordenador, "[NOME DO(S) COORDENADOR(ES)]")}.`,
  ] });
  S.push({ n: 2, t: "DEFINIÇÃO DO PROJETO DE PESQUISA", b: [
    ou(f.projeto, "[Descrever o projeto de pesquisa: objeto, justificativa, objetivos e resultados esperados.]"),
  ] });
  S.push({ n: 3, t: "PERFIL DO BOLSISTA DESEJADO", b: multi
    ? perfilMultivagas(vs)
    : [ou(vs[0].perfil, "[Descrever titulação, conhecimentos, competências e experiência desejados.]")] });
  S.push({ n: 4, ...secModalidade(vs, f, "MODALIDADE, VALOR E QUANTITATIVO DA BOLSA", "MODALIDADES, VALORES E QUADRO DE VAGAS") });
  S.push({ n: 5, t: "DURAÇÃO DA BOLSA E DA PESQUISA", b: [
    `Duração da bolsa: ${pad(durB)} (${extenso(durB)}) ${durB === 1 ? "mês" : "meses"}.`,
    `Tempo de duração da pesquisa: ${pad(durP)} (${extenso(durP)}) ${durP === 1 ? "mês" : "meses"}.`,
  ] });
  S.push({ n: 6, t: "ATIVIDADES A SEREM DESENVOLVIDAS", b: multi
    ? atividadesMultivagas(vs)
    : [ou(vs[0].atividades, "[Descrever as atividades de pesquisa que o bolsista irá desenvolver.]")] });
  S.push({ n: 7, t: "CRITÉRIOS DE SELEÇÃO", b: multi ? criteriosMultivagas(vs, f) : [ou(vs[0].criterios, criteriosDefault(f))] });
  S.push({ n: 8, t: "COMISSÃO JULGADORA", b: [comissaoTexto(f)] });
  S.push({ n: 9, t: "INSCRIÇÕES, RESULTADO E RECURSOS", b: [
    `As inscrições serão realizadas pelo SISBOLSAS (${NORMA.sisbolsas}), pelo prazo mínimo de ${NORMA.prazoMinEspecializadaDias} (dez) dias (Art. 8º, §4º).`,
    "O resultado será divulgado no sítio do IPEA e seu extrato publicado no Diário Oficial da União (Art. 10).",
    "Caberá recurso fundamentado, na forma da chamada, com juízo de retratação pela comissão julgadora e deliberação final da DIDES (Art. 9º, §§3º e 4º).",
  ], table: cronograma(f) });
  S.push({ n: 10, t: "DISPOSIÇÕES FINAIS", b: [
    NORMA.vinculo,
    `Aplicam-se subsidiariamente as disposições da ${NORMA.portaria} e demais normas pertinentes; os casos omissos serão resolvidos pela ${NORMA.diretoria}.`,
  ] });
  S.push({ sign: true, b: [
    `Brasília, ${fmtData(f.dataPub)}.`,
    `${ou(f.coordenador, "[COORDENADOR(A) DO PROJETO]")} — Coordenação do projeto`,
    `De acordo. ${ou(f.diretoria, "[DIRETOR(A) DA ÁREA]")} (Art. 7º, parágrafo único).`,
  ] });
  return S;
}

// ---------- Minuta de Chamada Pública Especializada (derivada do TR) ----------
export function buildEdital(f) {
  const vs = vagasDe(f);
  const multi = vs.length > 1;
  const S = [];
  S.push({ t: `CHAMADA PÚBLICA ESPECIALIZADA IPEA/PIPA Nº ${ou(f.numero, "XXX/AAAA")}`, head: true });
  S.push({ p: `O ${NORMA.instituto}, CONVIDA interessados(as) a se candidatarem à concessão de bolsa de pesquisa no âmbito do ${NORMA.programa}, nos termos da ${NORMA.portaria} e do Termo de Referência (Anexo I).` });
  S.push({ n: 1, t: "DO OBJETO", b: [
    `Seleção de bolsista para o projeto de pesquisa: ${ou(f.projeto, "[TÍTULO/OBJETO DO PROJETO]")}, conforme o Termo de Referência constante do Anexo I.`,
  ] });
  S.push({ n: 2, ...secModalidade(vs, f, "DA MODALIDADE, DO VALOR E DO QUANTITATIVO", "DAS MODALIDADES, DOS VALORES E DO QUADRO DE VAGAS") });
  S.push({ n: 3, t: "DOS REQUISITOS E DO PERFIL", b: multi
    ? perfilMultivagas(vs)
    : [
      `Requisito da modalidade: ${ou(modOf(vs[0].modalidade).requisito, "conforme Art. 4º da norma vigente.")}`,
      `Perfil desejado: ${ou(vs[0].perfil, "[Descrever o perfil exigido.]")}`,
    ] });
  S.push({ n: 4, t: "DAS INSCRIÇÕES", b: [
    `As candidaturas serão realizadas exclusivamente pelo SISBOLSAS (${NORMA.sisbolsas}), no período do cronograma, observado o prazo mínimo de ${NORMA.prazoMinEspecializadaDias} (dez) dias.`,
  ], table: cronograma(f) });
  S.push({ n: 5, t: "DOS CRITÉRIOS DE SELEÇÃO", b: multi ? criteriosMultivagas(vs, f) : [ou(vs[0].criterios, criteriosDefault(f))] });
  S.push({ n: 6, t: "DA COMISSÃO JULGADORA", b: [comissaoTexto(f)] });
  S.push({ n: 7, t: "DO RESULTADO E DOS RECURSOS", b: [
    "O resultado será divulgado no sítio do IPEA e seu extrato publicado no Diário Oficial da União (Art. 10).",
    "Caberá recurso fundamentado, com juízo de retratação pela comissão julgadora e deliberação final da DIDES (Art. 9º).",
  ] });
  S.push({ n: 8, t: "DAS DISPOSIÇÕES FINAIS", b: [
    NORMA.vinculo,
    `Os casos omissos serão resolvidos pela ${NORMA.diretoria}, observada a ${NORMA.portaria}.`,
  ] });
  S.push({ sign: true, b: [
    `Brasília, ${fmtData(f.dataPub)}.`,
    `${ou(f.diretoria, "[DIRETORIA RESPONSÁVEL]")}`,
    `Instituto de Pesquisa Econômica Aplicada — IPEA`,
  ] });
  return S;
}

// Serializa as seções (cabeçalho, parágrafo, seção numerada, tabela, assinatura) em texto puro.
export function minutaToText(S) {
  const out = [];
  for (const s of S) {
    if (s.head) { out.push(s.t.toUpperCase()); out.push(""); continue; }
    if (s.p) { out.push(s.p); out.push(""); continue; }
    if (s.sign) { out.push(""); s.b.forEach((l) => out.push(l)); continue; }
    if (s.n) { out.push(`${s.n}. ${s.t}`); (s.b || []).forEach((l) => out.push(l)); }
    if (s.table) { s.table.forEach((r) => out.push(r.join("  |  "))); }
    if (s.n || s.table) out.push("");
  }
  return out.join("\n");
}
