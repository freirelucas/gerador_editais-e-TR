// Montagem da minuta de Chamada Pública a partir dos campos do formulário.
import { MODALIDADES } from "../data/modalidades.js";
import { BOILER } from "../data/boilerplate.js";
import { BRL, extenso, fmtData } from "./format.js";

// Recebe o objeto de formulário (f) e devolve uma lista de seções estruturadas.
// Cada seção pode ser: cabeçalho (head), parágrafo solto (p), seção numerada
// (n + t + b), tabela (table) ou bloco de assinatura (sign).
export function buildMinuta(f) {
  const mod =
    MODALIDADES.find((m) => m.nome === f.modalidade) || { nome: f.modalidade, valor: 0 };
  const q = parseInt(f.qtd) || 1;
  const dur = parseInt(f.duracao) || 12;
  const S = [];
  S.push({
    t: `CHAMADA PÚBLICA IPEA/PIPA Nº ${f.numero || "XXX/AAAA"} — SELEÇÃO DE CANDIDATO(A) PARA CONCESSÃO DE BOLSA`,
    head: true,
  });
  S.push({ p: BOILER.preambulo });
  S.push({
    n: 1,
    t: "DO OBJETO",
    b: [
      `A presente Chamada tem por objetivo selecionar interessados(as) para a concessão de bolsa de pesquisa, que atendam aos requisitos do Termo de Referência constante do Anexo I e do REGULAMENTO desta Chamada, visando à realização de pesquisa no projeto: “${f.projeto || "[TÍTULO DO PROJETO]"}”.`,
    ],
  });
  S.push({
    n: 2,
    t: "DA QUANTIDADE E DURAÇÃO DAS BOLSAS",
    b: [
      `Será(ão) concedida(s) ${String(q).padStart(2, "0")} (${extenso(q)}) bolsa(s) com duração prevista de ${String(dur).padStart(2, "0")} (${extenso(dur)}) ${dur === 1 ? "mês" : "meses"}, podendo ser renovada(s) a critério do IPEA.`,
    ],
  });
  const reqs = (f.requisitos || "").split("\n").filter(Boolean);
  S.push({
    n: 3,
    t: "DOS REQUISITOS DOS CANDIDATOS",
    b: [
      `Modalidade: ${mod.nome}.`,
      ...(reqs.length
        ? reqs.map((r, i) => `3.${i + 1}. ${r.trim()}`)
        : ["3.1. [Descrever os requisitos de titulação, conhecimentos e experiência exigidos.]"]),
    ],
  });
  S.push({
    n: 4,
    t: "DA MODALIDADE E VALOR DA BOLSA",
    b: [
      `A bolsa será concedida na modalidade ${mod.nome}, no valor mensal de ${BRL(mod.valor)}, conforme tabela vigente estabelecida pela Portaria Normativa IPEA nº 262/2023, que alterou a Portaria nº 492/2010.`,
      `As bolsas do IPEA não podem ser acumuladas com bolsas de outras agências de fomento (Capes, CNPq, Fapesp, Faperj e congêneres).`,
    ],
  });
  S.push({
    n: 5,
    t: "DO CRONOGRAMA",
    table: [
      ["Etapa", "Data"],
      ["Publicação da Chamada", fmtData(f.dataPub)],
      ["Período de inscrições", `${fmtData(f.inscIni)} a ${fmtData(f.inscFim)}`],
      ["Divulgação do resultado", `a partir de ${fmtData(f.resultado)}`],
      ["Início das atividades", `a partir de ${fmtData(f.inicio)}`],
    ],
  });
  S.push({
    n: 6,
    t: "DA APRESENTAÇÃO E ENVIO DAS CANDIDATURAS",
    b: [
      `As candidaturas deverão ser realizadas exclusivamente por meio do SISBOLSAS (https://bolsas.ipea.gov.br/), no período indicado no cronograma, com o preenchimento do cadastro e o envio dos documentos exigidos.`,
    ],
  });
  S.push({
    n: 7,
    t: "DOS CRITÉRIOS DE JULGAMENTO",
    b: [
      f.criterios?.trim()
        ? f.criterios.trim()
        : `A seleção observará: a) aderência do currículo ao perfil e aos requisitos da modalidade; b) experiência e produção compatíveis com o objeto; c) entrevista, quando prevista. A pontuação e os pesos constam do Anexo I.`,
    ],
  });
  S.push({ n: 8, t: "DO RESULTADO DO JULGAMENTO", b: [BOILER.resultado] });
  S.push({ n: 9, t: "DOS RECURSOS ADMINISTRATIVOS", b: [BOILER.recursos] });
  S.push({ n: 10, t: "DA CONCESSÃO DA BOLSA", b: [BOILER.concessao] });
  S.push({ n: 11, t: "DO CANCELAMENTO DA CONCESSÃO", b: [BOILER.cancelamento] });
  S.push({ n: 12, t: "DOS AJUSTES DOS PROJETOS APROVADOS", b: [BOILER.ajustes] });
  S.push({ n: 13, t: "DAS PERMISSÕES E AUTORIZAÇÕES ESPECIAIS", b: [BOILER.permissoes] });
  S.push({ n: 14, t: "DA IMPUGNAÇÃO DA CHAMADA PÚBLICA", b: [BOILER.impugnacao] });
  S.push({ n: 15, t: "DA ANULAÇÃO OU REVOGAÇÃO DA CHAMADA PÚBLICA", b: [BOILER.anulacao] });
  S.push({ n: 16, t: "DOS ESCLARECIMENTOS E DAS INFORMAÇÕES ADICIONAIS", b: [BOILER.esclarecimentos] });
  S.push({ n: 17, t: "DA CLÁUSULA DE RESERVA", b: [BOILER.reserva] });
  S.push({
    sign: true,
    b: [
      `Brasília, ${fmtData(f.dataPub)}.`,
      `${f.diretoria || "[DIRETORIA RESPONSÁVEL]"}`,
      `Instituto de Pesquisa Econômica Aplicada — IPEA`,
    ],
  });
  return S;
}

// Serializa as seções da minuta para texto puro (usado ao copiar e ao baixar .txt).
export function minutaToText(S) {
  const out = [];
  for (const s of S) {
    if (s.head) {
      out.push(s.t.toUpperCase());
      out.push("");
      continue;
    }
    if (s.p) {
      out.push(s.p);
      out.push("");
      continue;
    }
    if (s.sign) {
      out.push("");
      s.b.forEach((l) => out.push(l));
      continue;
    }
    if (s.table) {
      s.table.forEach((r) => out.push(r.join("  |  ")));
      out.push("");
      continue;
    }
    out.push(`${s.n}. ${s.t}`);
    (s.b || []).forEach((l) => out.push(l));
    out.push("");
  }
  return out.join("\n");
}
