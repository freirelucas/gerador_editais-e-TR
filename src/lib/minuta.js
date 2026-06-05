// Geração de documentos do PIPA ancorada na norma vigente
// (Portaria Normativa IPEA nº 317/2025): o Termo de Referência (Art. 7º) e a minuta de
// Chamada Pública Especializada derivada dele. O núcleo regulado (modalidade, valores,
// prazos, comissão, recursos) vem da norma; os campos descritivos (projeto, perfil,
// atividades, critérios) são preenchidos pelo proponente.
import { MODALIDADES } from "../data/modalidades.js";
import { NORMA } from "../data/norma.js";
import { fmtValor, extenso, fmtData } from "./format.js";

function dados(f) {
  const mod =
    MODALIDADES.find((m) => m.nome === f.modalidade) ||
    { nome: f.modalidade || "[MODALIDADE]", valor: 0, moeda: "BRL", requisito: "" };
  return {
    mod,
    q: parseInt(f.qtd) || 1,
    durB: parseInt(f.duracaoBolsa) || 12,
    durP: parseInt(f.duracaoPesquisa) || parseInt(f.duracaoBolsa) || 12,
  };
}

const ou = (v, fallback) => (v && String(v).trim() ? String(v).trim() : fallback);

function caracteristicasBolsa(f, { mod, q, durB }) {
  const b = [
    `Modalidade: ${mod.nome} — ${fmtValor(mod.valor, mod.moeda)} mensais (Anexo I da ${NORMA.portaria}).`,
    `Requisito da modalidade: ${ou(mod.requisito, "conforme Art. 4º da norma vigente.")}`,
    `Quantitativo: ${String(q).padStart(2, "0")} (${extenso(q)}) bolsa(s), com duração prevista de ${String(durB).padStart(2, "0")} (${extenso(durB)}) ${durB === 1 ? "mês" : "meses"}, renovável a critério do IPEA.`,
    f.cadastroReserva
      ? "Haverá cadastro reserva, observada a ordem de classificação, admitido provimento adicional na vigência da chamada (Art. 9º, §2º)."
      : "Não haverá cadastro reserva.",
  ];
  if (ou(f.reservaVagas, "")) b.push(`Público-alvo / reserva de vagas (Art. 25): ${f.reservaVagas.trim()}`);
  if (f.cotasOn) {
    const er = parseInt(f.cotaER) || 0, m = parseInt(f.cotaM) || 0, pcd = parseInt(f.cotaPCD) || 0;
    const ac = Math.max(q - er - m - pcd, 0);
    b.push(`Reserva de vagas (cotas): das ${String(q).padStart(2, "0")} vaga(s), ${String(ac).padStart(2, "0")} de ampla concorrência e ${String(er + m + pcd).padStart(2, "0")} reservada(s), conforme o quadro abaixo e ${ou(f.fundamentoCotas, "a legislação aplicável e o disposto na chamada")}.`);
    if (f.heteroident) b.push("A autodeclaração étnico-racial será confirmada por procedimento de heteroidentificação, na forma da chamada.");
  }
  return b;
}

// Quadro de vagas por cota (AC/ER/M/PCD) — só categorias com reserva, mais AC e total.
function quadroVagas(f, { q }) {
  const er = parseInt(f.cotaER) || 0, m = parseInt(f.cotaM) || 0, pcd = parseInt(f.cotaPCD) || 0;
  const ac = Math.max(q - er - m - pcd, 0);
  const pad = (n) => String(n).padStart(2, "0");
  const rows = [["Categoria", "Vagas"], ["Ampla concorrência (AC)", pad(ac)]];
  if (er) rows.push(["Étnico-racial (ER)", pad(er)]);
  if (m) rows.push(["Mulheres (M)", pad(m)]);
  if (pcd) rows.push(["Pessoa com deficiência (PCD)", pad(pcd)]);
  rows.push(["Total", pad(q)]);
  return rows;
}

// ---------- Multivagas: edital com várias seleções (Seleção 1, 2, …) ----------
const modOf = (nome) => MODALIDADES.find((m) => m.nome === nome) || { nome: nome || "[MODALIDADE]", valor: 0, moeda: "BRL", requisito: "" };
const ehMulti = (f) => f.multivagas && Array.isArray(f.vagas) && f.vagas.length > 0;

// Quadro consolidado: uma linha por seleção (modalidade, valor, vagas, reserva) + total.
function quadroMultivagas(f) {
  const pad = (n) => String(n).padStart(2, "0");
  const rows = [["Seleção", "Modalidade", "Valor mensal", "Vagas", "Reserva"]];
  let tot = 0;
  f.vagas.forEach((v, i) => {
    const m = modOf(v.modalidade);
    const q = parseInt(v.qtd) || 1; tot += q;
    const er = parseInt(v.cotaER) || 0, mu = parseInt(v.cotaM) || 0, pcd = parseInt(v.cotaPCD) || 0;
    const res = [er && `ER ${pad(er)}`, mu && `M ${pad(mu)}`, pcd && `PCD ${pad(pcd)}`].filter(Boolean).join(", ") || "—";
    rows.push([`Seleção ${i + 1}${v.tipo ? ` — ${v.tipo}` : ""}`, m.nome, fmtValor(m.valor, m.moeda), pad(q), res]);
  });
  rows.push(["Total", "", "", pad(tot), ""]);
  return rows;
}

function caracteristicasMultivagas(f) {
  const tot = f.vagas.reduce((a, v) => a + (parseInt(v.qtd) || 1), 0);
  const temReserva = f.vagas.some((v) => (parseInt(v.cotaER) || 0) + (parseInt(v.cotaM) || 0) + (parseInt(v.cotaPCD) || 0) > 0);
  const b = [
    `Esta chamada compreende ${String(f.vagas.length).padStart(2, "0")} (${extenso(f.vagas.length)}) seleção(ões), totalizando ${String(tot).padStart(2, "0")} (${extenso(tot)}) bolsa(s), conforme o quadro a seguir. Cada seleção possui modalidade, valor e requisitos próprios (Art. 4º e Anexo I da ${NORMA.portaria}).`,
  ];
  if (temReserva) b.push("As vagas reservadas (cotas) observam, em cada seleção, a ordem de classificação e a legislação aplicável, conforme detalhado na chamada.");
  return b;
}

// Perfil/requisitos por seleção (requisito da modalidade + texto específico, se houver).
function perfilMultivagas(f) {
  return f.vagas.map((v, i) => {
    const m = modOf(v.modalidade);
    const req = ou(m.requisito, "requisitos conforme Art. 4º da norma vigente.");
    const esp = ou(v.perfil, "");
    return `Seleção ${i + 1} — ${m.nome}: ${req}${esp ? ` ${esp}` : ""}`;
  });
}
// Atividades por seleção.
const atividadesMultivagas = (f) => f.vagas.map((v, i) =>
  `Seleção ${i + 1} — ${modOf(v.modalidade).nome}: ${ou(v.atividades, "[descrever as atividades de pesquisa desta seleção].")}`);
// Critérios por seleção (texto próprio ou o padrão da norma).
const criteriosMultivagas = (f) => f.vagas.map((v, i) =>
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

// ---------- Termo de Referência (Art. 7º) ----------
export function buildTR(f) {
  const d = dados(f);
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
  S.push({ n: 3, t: "PERFIL DO BOLSISTA DESEJADO", b: ehMulti(f)
    ? perfilMultivagas(f)
    : [ou(f.perfil, "[Descrever titulação, conhecimentos, competências e experiência desejados.]")] });
  S.push(ehMulti(f)
    ? { n: 4, t: "MODALIDADES, VALORES E QUADRO DE VAGAS", b: caracteristicasMultivagas(f), table: quadroMultivagas(f) }
    : { n: 4, t: "MODALIDADE, VALOR E QUANTITATIVO DA BOLSA", b: caracteristicasBolsa(f, d), ...(f.cotasOn ? { table: quadroVagas(f, d) } : {}) });
  S.push({ n: 5, t: "DURAÇÃO DA BOLSA E DA PESQUISA", b: [
    `Duração da bolsa: ${String(d.durB).padStart(2, "0")} (${extenso(d.durB)}) ${d.durB === 1 ? "mês" : "meses"}.`,
    `Tempo de duração da pesquisa: ${String(d.durP).padStart(2, "0")} (${extenso(d.durP)}) ${d.durP === 1 ? "mês" : "meses"}.`,
  ] });
  S.push({ n: 6, t: "ATIVIDADES A SEREM DESENVOLVIDAS", b: ehMulti(f)
    ? atividadesMultivagas(f)
    : [ou(f.atividades, "[Descrever as atividades de pesquisa que o bolsista irá desenvolver.]")] });
  S.push({ n: 7, t: "CRITÉRIOS DE SELEÇÃO", b: ehMulti(f) ? criteriosMultivagas(f) : [ou(f.criterios, criteriosDefault(f))] });
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
  const d = dados(f);
  const S = [];
  S.push({ t: `CHAMADA PÚBLICA ESPECIALIZADA IPEA/PIPA Nº ${ou(f.numero, "XXX/AAAA")}`, head: true });
  S.push({ p: `O ${NORMA.instituto}, CONVIDA interessados(as) a se candidatarem à concessão de bolsa de pesquisa no âmbito do ${NORMA.programa}, nos termos da ${NORMA.portaria} e do Termo de Referência (Anexo I).` });
  S.push({ n: 1, t: "DO OBJETO", b: [
    `Seleção de bolsista para o projeto de pesquisa: ${ou(f.projeto, "[TÍTULO/OBJETO DO PROJETO]")}, conforme o Termo de Referência constante do Anexo I.`,
  ] });
  S.push(ehMulti(f)
    ? { n: 2, t: "DAS MODALIDADES, DOS VALORES E DO QUADRO DE VAGAS", b: caracteristicasMultivagas(f), table: quadroMultivagas(f) }
    : { n: 2, t: "DA MODALIDADE, DO VALOR E DO QUANTITATIVO", b: caracteristicasBolsa(f, d), ...(f.cotasOn ? { table: quadroVagas(f, d) } : {}) });
  S.push({ n: 3, t: "DOS REQUISITOS E DO PERFIL", b: ehMulti(f)
    ? perfilMultivagas(f)
    : [
      `Requisito da modalidade: ${ou(d.mod.requisito, "conforme Art. 4º da norma vigente.")}`,
      `Perfil desejado: ${ou(f.perfil, "[Descrever o perfil exigido.]")}`,
    ] });
  S.push({ n: 4, t: "DAS INSCRIÇÕES", b: [
    `As candidaturas serão realizadas exclusivamente pelo SISBOLSAS (${NORMA.sisbolsas}), no período do cronograma, observado o prazo mínimo de ${NORMA.prazoMinEspecializadaDias} (dez) dias.`,
  ], table: cronograma(f) });
  S.push({ n: 5, t: "DOS CRITÉRIOS DE SELEÇÃO", b: ehMulti(f) ? criteriosMultivagas(f) : [ou(f.criterios, criteriosDefault(f))] });
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
