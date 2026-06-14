// Teste de stress do Gerador: roda os 366 projetos-semente pelos geradores REAIS
// (buildTR / buildEdital / conformidade / sugerirModalidade), em 3 variantes cada
// (base, com cotas, multivagas), e relata exceções, cobertura e pendências.
// Uso: node scripts/stress_test.mjs   → console + docs/stress_test_report.md
import { writeFileSync } from "node:fs";
import { PROJETOS } from "../src/data/projetos.js";
import { buildTR, buildEdital, minutaToText } from "../src/lib/minuta.js";
import { conformidade, resumoConf } from "../src/lib/conformidade.js";
import { sugerirModalidade } from "../src/lib/sugestao.js";
import { MODALIDADES } from "../src/data/modalidades.js";
import { DIRETORIA_TEMA, PADRAO_DIRETORIA, rotuloUnidade } from "../src/data/diretorias.js";

const DEFAULTS = {
  numero: "", diretoriaSel: PADRAO_DIRETORIA, unidade: rotuloUnidade(PADRAO_DIRETORIA),
  coordenador: "", projetoNome: "", projeto: "", perfil: "",
  temas: [DIRETORIA_TEMA[PADRAO_DIRETORIA]], funcoes: [], enfases: [], recortes: [], experiencia: "",
  modalidade: MODALIDADES[0].nome, qtd: "1", cadastroReserva: false, reservaVagas: "",
  cotasOn: false, cotaER: "0", cotaM: "0", cotaPCD: "0", heteroident: false, fundamentoCotas: "",
  multivagas: false, vagas: [],
  duracaoBolsa: "12", duracaoPesquisa: "12", atividades: "", criterios: "",
  cartaIntencoes: false, comissao: "", diretoria: "",
  dataPub: "", inscIni: "", inscFim: "", resultado: "", inicio: "",
};
const novaVaga = (base = {}) => ({ modalidade: MODALIDADES[0].nome, qtd: "1", tipo: "Imediata", cotaER: "0", cotaM: "0", cotaPCD: "0", perfil: "", atividades: "", criterios: "", ...base });

// Semeia a partir de um projeto (espelha carregarProjeto do BuilderView).
function semear(pr, i) {
  const mod = sugerirModalidade({ ...DEFAULTS, diretoriaSel: pr.diretoria, temas: pr.temas, funcoes: pr.funcoes });
  return {
    ...DEFAULTS,
    numero: `${String(i + 1).padStart(3, "0")}/2026`,
    diretoriaSel: pr.diretoria,
    unidade: rotuloUnidade(pr.diretoria) || DEFAULTS.unidade,
    temas: pr.temas.length ? pr.temas : DEFAULTS.temas,
    funcoes: pr.funcoes,
    projetoNome: pr.titulo,
    coordenador: pr.coordenador || "",
    modalidade: mod ? mod.modalidade.nome : DEFAULTS.modalidade,
    _sugMod: !!mod,
  };
}
const variantes = (base) => [
  ["base", base],
  ["cotas", { ...base, qtd: "4", cotasOn: true, cotaER: "1", cotaM: "1", cotaPCD: "0", heteroident: true }],
  ["multivagas", { ...base, multivagas: true, vagas: [novaVaga({ modalidade: base.modalidade, qtd: "2" }), novaVaga({ qtd: "1", tipo: "Cadastro reserva" })] }],
];

const erros = [];
const labelCount = new Map();
let buildsOK = 0, sevErr = 0, sevWarn = 0, comSug = 0, comFuncao = 0;

PROJETOS.forEach((pr, i) => {
  const base = semear(pr, i);
  if (base._sugMod) comSug++;
  if (pr.funcoes.length) comFuncao++;
  for (const [vname, f] of variantes(base)) {
    for (const [doc, build] of [["tr", buildTR], ["edital", buildEdital]]) {
      try {
        const m = build(f);
        const txt = minutaToText(m);
        if (!Array.isArray(m) || m.length === 0) throw new Error("minuta vazia");
        if (txt.trim().length < 200) throw new Error(`texto curto (${txt.trim().length} chars)`);
        buildsOK++;
      } catch (e) {
        erros.push({ id: pr.id, titulo: pr.titulo.slice(0, 50), doc, variante: vname, msg: String(e.message || e) });
      }
    }
  }
  // conformidade no estado "recém-semeado" (base) — o que ainda falta preencher
  try {
    const lista = conformidade(base);
    const r = resumoConf(lista);
    if (r.err) sevErr++;
    if (r.warn) sevWarn++;
    lista.filter((c) => c.sev === "err" || c.sev === "warn").forEach((c) => labelCount.set(c.label, (labelCount.get(c.label) || 0) + 1));
  } catch (e) {
    erros.push({ id: pr.id, titulo: pr.titulo.slice(0, 50), doc: "-", variante: "conformidade", msg: String(e.message || e) });
  }
});

const N = PROJETOS.length;
const buildsEsperados = N * 3 * 2;
const topLabels = [...labelCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

const linhas = [];
const L = (s = "") => linhas.push(s);
L("# Teste de stress do Gerador");
L("");
L(`Rodado em ${new Date().toISOString().slice(0, 10)} sobre **${N} projetos-semente**, cada um em **3 variantes** (base, cotas, multivagas) × **2 documentos** (TR, edital).`);
L("");
L("## Resultado");
L("");
L(`- **Builds executados sem exceção:** ${buildsOK}/${buildsEsperados} (${(100 * buildsOK / buildsEsperados).toFixed(1)}%)`);
L(`- **Exceções:** ${erros.length}`);
L(`- **Sugestão de modalidade (DAG) disponível:** ${comSug}/${N} (${(100 * comSug / N).toFixed(0)}%)`);
L(`- **Semente já traz função:** ${comFuncao}/${N} (${(100 * comFuncao / N).toFixed(0)}%) — o restante cai em "função a definir"`);
L("");
L("## Conformidade logo após semear (o que o usuário ainda precisa completar)");
L("");
L(`Esperado: a semente preenche identificação/tema/função/título, mas datas, definição do projeto, perfil e comissão ficam em aberto — por isso há alertas. Projetos com ≥1 **erro**: ${sevErr}/${N}; com ≥1 **alerta**: ${sevWarn}/${N}.`);
L("");
L("| pendência | nº de projetos |");
L("|---|---|");
topLabels.forEach(([lab, n]) => L(`| ${lab} | ${n} |`));
L("");
L("## Exceções");
L("");
if (!erros.length) {
  L("Nenhuma. Todos os documentos foram gerados em todas as variantes. ✅");
} else {
  L("| projeto | doc | variante | erro |");
  L("|---|---|---|---|");
  erros.slice(0, 40).forEach((e) => L(`| ${e.titulo} | ${e.doc} | ${e.variante} | ${e.msg} |`));
  if (erros.length > 40) L(`| … | | | +${erros.length - 40} |`);
}
L("");
const md = linhas.join("\n");
writeFileSync("docs/stress_test_report.md", md + "\n"); // rodar a partir da raiz do repo

console.log(`builds OK: ${buildsOK}/${buildsEsperados} | exceções: ${erros.length} | sug.modalidade: ${comSug}/${N} | função: ${comFuncao}/${N}`);
console.log(`conformidade: ${sevErr} c/ erro, ${sevWarn} c/ alerta`);
console.log("top pendências:", topLabels.slice(0, 6).map(([l, n]) => `${l}=${n}`).join(", "));
if (erros.length) { console.log("\nEXCEÇÕES (até 8):"); erros.slice(0, 8).forEach((e) => console.log(` - [${e.doc}/${e.variante}] ${e.titulo}: ${e.msg}`)); }
console.log("\n→ docs/stress_test_report.md");
