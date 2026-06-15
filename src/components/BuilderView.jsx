import { useState, useMemo, useEffect, useRef } from "react";
import { C, SANS, SERIF, RADIUS, SHADOW } from "../theme.js";
import { MODALIDADES } from "../data/modalidades.js";
import { fmtValor } from "../lib/format.js";
import { buildTR, buildEdital, minutaToText } from "../lib/minuta.js";
import { conformidade, resumoConf, diffDias } from "../lib/conformidade.js";
import { downloadDoc, printDoc } from "../lib/docExport.js";
import { chamadasSimilares } from "../lib/similares.js";
import { FUNCOES, TEMAS, enfasesDe, recortesDe } from "../data/perfis.js";
import { comporPerfil, comporAtividades, comporObjeto, sugerirCriterios } from "../lib/perfil.js";
import { sugerirModalidade } from "../lib/sugestao.js";
import { DIRETORIAS, DIRETORIA_TEMA, PADRAO_DIRETORIA, rotuloUnidade } from "../data/diretorias.js";
import { exemplosPorTema } from "../data/objetos.js";
import { PROJETOS, PROJETOS_RESUMO } from "../data/projetos.js";

// Ícones inline (sem dependência).
const IP = {
  check: "M20 6 9 17l-5-5", copy: "M9 9h10v12H9zM5 15V3h10", eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  download: "M12 3v12m0 0 4-4m-4 4-4-4M4 21h16", spark: "M12 3l2 5.2L19 10l-5 1.8L12 17l-2-5.2L5 10l5-1.8L12 3Z",
  arrow: "M5 12h14m0 0-6-6m6 6-6 6", x: "M6 6l12 12M18 6 6 18",
};
function Ic({ d, size = 15, color = "currentColor", w = 1.8 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d={IP[d]} /></svg>;
}


// Projetos ativos do IPEA indexados por id (picker "partir de um projeto real" — busca em BuilderView).
const PROJ_BY_ID = Object.fromEntries(PROJETOS.map((p) => [p.id, p]));

const STEPS = ["Identificação", "Projeto", "Bolsa e perfil", "Vagas & cotas", "Seleção", "Cronograma", "Conformidade & exportar"];
const STEP_SHORT = ["Identificação", "Projeto", "Bolsa e perfil", "Vagas", "Seleção", "Cronograma", "Exportar"];
const SEVC = { ok: C.ok, warn: C.warn, err: C.err, info: C.azul };
const SEVBG = { ok: C.okBg, warn: C.warnBg, err: C.errBg, info: C.accentSoft };
const SEVI = { ok: "✓", warn: "!", err: "✕", info: "ℹ" };

// Seções do documento afetadas por cada passo (casa por trecho de título; serve TR e edital).
// A prévia mostra só estas seções — feedback vivo do passo atual; null = documento inteiro.
const FOCO = [
  ["UNIDADE"],
  ["DEFINIÇÃO DO PROJETO", "OBJETO"],
  ["MODALIDADE", "DURAÇÃO", "PERFIL", "REQUISITOS"],
  ["MODALIDADE", "QUANTITATIVO"],
  ["ATIVIDADES", "CRITÉRIOS", "COMISSÃO"],
  ["INSCRIÇÕES", "CRONOGRAMA", "RESULTADO"],
  null,
];

// Texto entre [colchetes] = ainda não preenchido. Linha inteira entre colchetes vira
// rascunho-fantasma (itálico esmaecido); colchetes no meio do texto viram "slots" de
// preenchimento (campo de mesclagem) — fim do "template inacabado" com colchetes crus.
const isGhost = (t) => typeof t === "string" && /^\s*\[[\s\S]*\]\s*$/.test(t.trim());
const ghostText = (t) => t.trim().replace(/^\[/, "").replace(/\]$/, "");
function Slot({ children }) {
  return <span style={{ background: C.accentSoft, color: C.azulEscuro, borderRadius: 4, padding: "0 5px", fontStyle: "italic", fontSize: ".93em" }}>{children}</span>;
}
function Linha({ t, base }) {
  if (isGhost(t)) return <p style={{ ...base, color: C.faint, fontStyle: "italic" }}>{ghostText(t)}</p>;
  if (typeof t === "string" && t.includes("[")) {
    return <p style={base}>{t.split(/(\[[^\]]*\])/g).map((seg, k) =>
      /^\[[^\]]*\]$/.test(seg) ? <Slot key={k}>{seg.slice(1, -1)}</Slot> : <span key={k}>{seg}</span>)}</p>;
  }
  return <p style={base}>{t}</p>;
}

// Renderiza uma seção da minuta. O documento usa SERIFA (artefato oficial); rótulos em SANS.
// `flash` (Set de chaves) acende a seção que acabou de mudar — prévia viva.
function renderSecao(s, i, flash) {
  const fl = flash && flash.has(JSON.stringify(s)) ? "flash" : undefined;
  let inner;
  if (s.head) inner = <h1 style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 700, textAlign: "center", lineHeight: 1.4, margin: "0 0 26px", color: C.ink }}>{s.t}</h1>;
  else if (s.p) inner = <Linha t={s.p} base={{ fontFamily: SERIF, textAlign: "justify", margin: "0 0 20px", color: C.muted }} />;
  else if (s.sign) inner = <div style={{ fontFamily: SERIF, textAlign: "center", marginTop: 40, lineHeight: 1.9 }}>{s.b.map((l, j) => <div key={j} style={{ fontWeight: j === 1 ? 600 : 400 }}>{l}</div>)}</div>;
  else inner = (
    <div style={{ margin: "0 0 22px" }}>
      {s.n && (
        <h2 style={{ display: "flex", alignItems: "baseline", gap: 8, fontFamily: SANS, fontSize: 12.5, color: C.azulEscuro, margin: "0 0 9px", fontWeight: 600, letterSpacing: ".01em" }}>
          <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: C.azul }}>{s.n}.</span>{s.t}
        </h2>
      )}
      {(s.b || []).map((l, j) => <Linha key={j} t={l} base={{ fontFamily: SERIF, fontSize: 14.5, textAlign: "justify", margin: "0 0 8px", lineHeight: 1.6 }} />)}
      {s.table && (
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, margin: "10px 0 0", fontFamily: SANS, fontSize: 13, border: `1px solid ${C.line}`, borderRadius: RADIUS.sm, overflow: "hidden" }}>
          <tbody>{s.table.map((r, ri) => (
            <tr key={ri}>{r.map((cell, ci) => (
              <td key={ci} style={{ borderBottom: ri < s.table.length - 1 ? `1px solid ${C.line}` : "none", borderRight: ci < r.length - 1 ? `1px solid ${C.line}` : "none", padding: "8px 11px",
                fontWeight: ri === 0 ? 600 : 400, background: ri === 0 ? C.accentSoft : C.card,
                fontSize: ri === 0 ? 11 : 13, letterSpacing: ri === 0 ? ".03em" : 0,
                color: ri === 0 ? C.azulEscuro : C.ink }}>{cell}</td>
            ))}</tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
  return <div key={i} className={fl}>{inner}</div>;
}

// Estado inicial do formulário (extraído p/ permitir hidratação de rascunho/link).
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
const STORE = "pipa-gerador-rascunho";
function carregarInicial() {
  try {
    const h = new URLSearchParams(location.hash.slice(1)).get("s");
    if (h) return { ...DEFAULTS, ...JSON.parse(decodeURIComponent(escape(atob(h)))) };
  } catch { /* link inválido — ignora */ }
  try {
    const sv = localStorage.getItem(STORE);
    if (sv) return { ...DEFAULTS, ...JSON.parse(sv) };
  } catch { /* sem storage */ }
  return DEFAULTS;
}

// Conformidade relevante a cada passo (casa por trecho do rótulo) — guardrails inline.
const STEP_CONF = [
  ["Número da chamada", "Unidade, coordenação"],
  ["Definição do projeto"],
  ["Modalidade e valor", "Perfil do bolsista"],
  ["Reserva", "Quantitativo usual", "Coerência modalidade", "Seleção", "Seleções"],
  ["Comissão"],
  ["Prazo de inscrição", "Ordem:", "Janela de inscrição"],
  null,
];

export default function BuilderView() {
  const [doc, setDoc] = useState("tr"); // "tr" | "edital"
  const [step, setStep] = useState(0);
  const [f, setF] = useState(carregarInicial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setVal = (k, v) => setF({ ...f, [k]: v });
  const toggle = (k) => (e) => setF({ ...f, [k]: e.target.checked });
  const toggleIn = (k, v) => setF((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));
  // ---- Multivagas: edital com várias seleções (Seleção 1, 2, …), cada uma com modalidade,
  // vagas, cotas e perfil próprios — formato real das chamadas PIPA.
  const novaVaga = (base = {}) => ({ modalidade: MODALIDADES[0].nome, qtd: "1", tipo: "Imediata", cotaER: "0", cotaM: "0", cotaPCD: "0", perfil: "", atividades: "", criterios: "", ...base });
  const setVaga = (i, k, v) => setF((p) => ({ ...p, vagas: p.vagas.map((x, j) => (j === i ? { ...x, [k]: v } : x)) }));
  const addVaga = () => setF((p) => ({ ...p, vagas: [...p.vagas, novaVaga()] }));
  const rmVaga = (i) => setF((p) => ({ ...p, vagas: p.vagas.filter((_, j) => j !== i) }));
  const toggleMultivagas = (on) => setF((p) => ({
    ...p, multivagas: on,
    // ao ligar, semeia a 1ª seleção com o que já foi preenchido no fluxo simples
    vagas: on && !p.vagas.length
      ? [novaVaga({ modalidade: p.modalidade, qtd: p.qtd, cotaER: p.cotaER, cotaM: p.cotaM, cotaPCD: p.cotaPCD, perfil: p.perfil, atividades: p.atividades, criterios: p.criterios }), novaVaga()]
      : p.vagas,
  }));
  // Escolher a diretoria otimiza o fluxo: pré-seleciona o tema da área e preenche o cabeçalho.
  // Mudar a área manualmente invalida o "preenchido a partir de <projeto>" — limpa a seleção.
  const setDiretoria = (sigla) => {
    setProjSel(""); setProjQ("");
    setF((p) => ({
      ...p, diretoriaSel: sigla,
      temas: DIRETORIA_TEMA[sigla] ? [DIRETORIA_TEMA[sigla]] : p.temas,
      unidade: rotuloUnidade(sigla) || p.unidade,
    }));
  };
  // Partir de um projeto ativo real: preenche diretoria/tema/função/título no universo da base.
  // projSel pode vir do deep-link do Analytics (#…&p=<id>) p/ mostrar o banner do projeto.
  const [projSel, setProjSel] = useState(() => {
    try { return new URLSearchParams(location.hash.slice(1)).get("p") || ""; } catch { return ""; }
  });
  const [projQ, setProjQ] = useState("");      // busca no seletor de projetos
  const [projAll, setProjAll] = useState(false); // escopo: só a diretoria atual × todas
  const [projHi, setProjHi] = useState(0);     // item destacado (navegação por teclado)
  const carregarProjeto = (id) => {
    setProjSel(id); setProjQ("");
    const pr = PROJ_BY_ID[id];
    if (!pr) return;
    setF((p) => ({
      ...p,
      diretoriaSel: pr.diretoria,
      unidade: rotuloUnidade(pr.diretoria) || p.unidade,
      temas: pr.temas.length ? pr.temas : p.temas,
      funcoes: pr.funcoes,
      projetoNome: pr.titulo,
      coordenador: pr.coordenador || p.coordenador,
    }));
  };
  const limparProj = () => { setProjSel(""); setProjQ(""); };
  // Busca acento-insensível; escopo padrão = diretoria atual (a DIEST tem ~100 projetos).
  const norm = (s) => (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const selProj = PROJ_BY_ID[projSel];
  const projCountDir = useMemo(() => PROJETOS.filter((p) => p.diretoria === f.diretoriaSel).length, [f.diretoriaSel]);
  const projMatches = useMemo(() => {
    const nq = norm(projQ);
    return PROJETOS
      .filter((p) => (projAll || p.diretoria === f.diretoriaSel) && (!nq || norm(p.titulo + " " + (p.temas[0] || "")).includes(nq)))
      .slice(0, 60);
  }, [projQ, projAll, f.diretoriaSel]);
  useEffect(() => { setProjHi(0); }, [projQ, projAll]); // busca/escopo muda → destaca o 1º
  const onProjKey = (e) => {
    if (!projMatches.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setProjHi((h) => Math.min(projMatches.length - 1, h + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setProjHi((h) => Math.max(0, h - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); const p = projMatches[projHi]; if (p) carregarProjeto(p.id); }
    else if (e.key === "Escape") { setProjQ(""); }
  };

  const minuta = useMemo(() => (doc === "tr" ? buildTR(f) : buildEdital(f)), [f, doc]);
  const conf = useMemo(() => conformidade(f), [f]);
  const resumo = resumoConf(conf);
  const confForStep = (st) => {
    const keys = STEP_CONF[st];
    if (!keys) return [];
    return conf.filter((c) => c.sev !== "ok" && keys.some((k) => c.label.includes(k)));
  };

  // Autosave (localStorage) — rascunho de trabalho persiste entre sessões.
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(f)); setSaved(true); } catch { /* ignore */ }
  }, [f]);

  // Consumiu o deep-link/rascunho do hash na montagem → limpa a URL. Sem isso, voltar de
  // outra aba (que remonta o Builder) re-hidrataria do hash antigo e descartaria edições;
  // o estado já está no formulário e no autosave (localStorage).
  useEffect(() => {
    if (location.hash.includes("s=")) {
      try { history.replaceState(null, "", location.pathname + location.search); } catch { /* ignore */ }
    }
  }, []);

  // Prévia viva: acende a(s) seção(ões) que acabaram de mudar.
  const minutaKeys = useMemo(() => minuta.map((s) => JSON.stringify(s)), [minuta]);
  const prevKeys = useRef(minutaKeys);
  const [flash, setFlash] = useState(() => new Set());
  useEffect(() => {
    const prev = prevKeys.current;
    const changed = new Set();
    minutaKeys.forEach((k, i) => { if (k !== prev[i]) changed.add(k); });
    prevKeys.current = minutaKeys;
    if (!changed.size) return;
    setFlash(changed);
    const t = setTimeout(() => setFlash(new Set()), 1100);
    return () => clearTimeout(t);
  }, [minutaKeys]);

  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(minutaToText(minuta));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  const sub = doc === "tr" ? "Termo de Referência — Programa PIPA" : "Chamada Pública — Programa PIPA";
  const dlPdf = () => printDoc(minuta, doc === "tr" ? "Termo de Referência" : "Chamada Pública", sub);
  const shareLink = () => {
    try {
      const s = btoa(unescape(encodeURIComponent(JSON.stringify(f))));
      const url = `${location.origin}${location.pathname}#s=${s}`;
      navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    } catch { /* ignore */ }
  };
  const limpar = () => {
    if (confirm("Limpar o rascunho e recomeçar do zero?")) {
      try { localStorage.removeItem(STORE); } catch { /* ignore */ }
      if (location.hash) location.hash = "";
      setF(DEFAULTS); setStep(0);
    }
  };
  const nomeArq = (ext) => {
    const pref = doc === "tr" ? "TR_PIPA" : "Chamada_PIPA";
    return `${pref}_${(f.numero || "minuta").replace(/\//g, "-")}.${ext}`;
  };
  const dlTxt = () => {
    const blob = new Blob([minutaToText(minuta)], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nomeArq("txt");
    a.click();
  };
  const dlDoc = () => {
    const titulo = doc === "tr" ? "Termo de Referência — PIPA" : "Chamada Pública — PIPA";
    downloadDoc(minuta, titulo, nomeArq("doc"), sub);
  };

  const inp = {
    fontFamily: SANS, fontSize: 14, padding: "10px 12px", background: C.surface2,
    border: `1px solid ${C.lineStrong}`, color: C.ink, borderRadius: RADIUS.sm, outline: "none",
    width: "100%", boxSizing: "border-box",
  };
  const lab = {
    fontFamily: SANS, fontSize: 13, color: C.muted, marginBottom: 6, display: "block",
    fontWeight: 500, lineHeight: 1.35,
  };
  const Field = ({ l, children }) => (<div><label style={lab}>{l}</label>{children}</div>);
  const Check = ({ k, l }) => (
    <label style={{ display: "flex", gap: 9, alignItems: "center", fontFamily: SANS, fontSize: 13.5, color: C.ink, cursor: "pointer" }}>
      <input type="checkbox" checked={f[k]} onChange={toggle(k)} style={{ accentColor: C.azul, width: 16, height: 16 }} />
      {l}
    </label>
  );
  const chipStyle = (on) => ({
    fontFamily: SANS, fontSize: 12.5, padding: "6px 13px", borderRadius: RADIUS.pill, cursor: "pointer", fontWeight: 500,
    background: on ? C.accentSoft : C.card, color: on ? C.azulEscuro : C.muted,
    border: `1px solid ${on ? C.azulClaro : C.line}`,
  });
  const ChipsMulti = ({ campo, opcoes }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {opcoes.map((o) => (
        <button key={o} type="button" onClick={() => toggleIn(campo, o)} style={chipStyle(f[campo].includes(o))}>{o}</button>
      ))}
    </div>
  );
  // Exemplos REAIS de projetos PIPA do(s) tema(s) selecionado(s) — ponto de partida editável.
  const ExemplosPipa = ({ temas, onUsar }) => {
    const ex = exemplosPorTema(temas);
    if (!ex.length) return null;
    return (
      <div style={{ border: `1px solid ${C.line}`, borderRadius: RADIUS.md, padding: "12px 14px", background: C.surface2 }}>
        <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: C.faint, marginBottom: 9 }}>
          Exemplos reais de projetos PIPA · {temas.join(" · ")}
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {ex.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
              <button type="button" onClick={() => onUsar(e.proposito)} style={{ ...compBtn, flexShrink: 0, padding: "3px 9px" }}>usar</button>
              <div style={{ fontFamily: SANS, fontSize: 12, color: C.ink, lineHeight: 1.4 }}>
                <b>{e.projeto}</b> <span style={{ color: C.muted }}>— {e.proposito.slice(0, 104)}… <i>({e.fonte})</i></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  const compBtn = {
    fontFamily: SANS, fontSize: 12, fontWeight: 600, padding: "8px 13px", display: "inline-flex", alignItems: "center", gap: 6,
    borderRadius: RADIUS.sm, cursor: "pointer", background: C.accentSoft, color: C.azulEscuro, border: `1px solid ${C.azulClaro}`,
    justifySelf: "start",
  };
  // Escape hatch (pedido recorrente): quando nenhum modelo/sugestão serve, deixa um
  // placeholder [entre colchetes] — que a prévia renderiza como rascunho-fantasma a preencher.
  const phBtn = {
    fontFamily: SANS, fontSize: 12, fontWeight: 500, padding: "8px 13px", display: "inline-flex", alignItems: "center", gap: 6,
    borderRadius: RADIUS.sm, cursor: "pointer", background: "transparent", color: C.muted, border: `1px dashed ${C.lineStrong}`,
    justifySelf: "start",
  };
  const PH = {
    projeto: "[Descrever o objeto do projeto: tema, justificativa e objetivos da pesquisa.]",
    perfil: "[Descrever o perfil desejado: formação, função/atividades, experiência e habilidades.]",
    atividades: "[Listar as atividades de pesquisa que o bolsista vai desenvolver.]",
    criterios: "[Definir os critérios de seleção e julgamento e seus pesos.]",
  };
  const PlaceholderBtn = ({ campo }) => (
    <button type="button" style={phBtn} onClick={() => setVal(campo, PH[campo])} title="Insere um placeholder editável na minuta">
      Não encontrei modelo — deixar placeholder
    </button>
  );
  const mod = MODALIDADES.find((m) => m.nome === f.modalidade);
  const q = parseInt(f.qtd) || 1;
  const reservaLive = (parseInt(f.cotaER) || 0) + (parseInt(f.cotaM) || 0) + (parseInt(f.cotaPCD) || 0);
  const acLive = Math.max(q - reservaLive, 0);
  const dInsc = diffDias(f.inscIni, f.inscFim);
  // Empurrão de oportunidade (F5): cobertura de bolsas do tema = chamadas PIPA ÷ projetos ativos.
  const cobTema = (PROJETOS_RESUMO.coberturaPorTema || {})[f.temas[0]];
  const temaSubservido = cobTema && cobTema.ativos >= 10 && cobTema.pipa / cobTema.ativos < 0.25;

  const btn = (primary) => ({
    fontFamily: SANS, fontSize: 13, padding: "9px 16px", borderRadius: RADIUS.sm, cursor: "pointer", fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 7,
    background: primary ? C.azul : C.card, color: primary ? "#fff" : C.ink,
    border: primary ? "none" : `1px solid ${C.lineStrong}`,
    boxShadow: primary ? SHADOW.xs : "none",
  });

  // Prefill do corpus: chamadas PIPA reais parecidas, com botão p/ puxar o texto ao campo.
  const sims = useMemo(() => chamadasSimilares(f, 3), [f.modalidade, f.temas, f.funcoes, f.diretoriaSel]);
  const Similares = ({ campo }) => {
    const map = { projeto: ["def", "definição"], perfil: ["perfil", "perfil"], atividades: ["atividades", "atividades"] };
    const [key, nome] = map[campo];
    const rel = sims.filter((x) => x[key]);
    if (!rel.length) return null;
    return (
      <div style={{ border: `1px solid ${C.line}`, borderRadius: RADIUS.md, background: C.surface2, padding: "12px 14px", display: "grid", gap: 9 }}>
        <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: C.faint, display: "flex", alignItems: "center", gap: 7 }}>
          <Ic d="spark" size={13} color={C.azul} /> Chamadas PIPA parecidas — puxe a {nome} real
        </div>
        {rel.map((x, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
            <button type="button" onClick={() => setVal(campo, x[key])} style={{ ...compBtn, flexShrink: 0, padding: "5px 11px" }}>usar</button>
            <div style={{ fontFamily: SANS, fontSize: 12, color: C.ink, lineHeight: 1.45 }}>
              <b>{x.titulo}</b> <span style={{ color: C.faint }}>· {x.modalidade}</span><br />
              <span style={{ color: C.muted }}>{x[key].slice(0, 116)}…</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Sugestão de modalidade a partir da rede de dependências (DAG/CPT) sobre o corpus PIPA,
  // condicionada à evidência já preenchida (diretoria → tema → função). Recalcula só quando
  // a evidência muda; o DAG é aprendido uma vez (memoizado em lib/sugestao).
  const sugMod = useMemo(() => sugerirModalidade(f), [f.diretoriaSel, f.temas.join("|"), f.funcoes.join("|")]);
  const SugestaoModalidade = () => {
    if (!sugMod) return null;
    const s = sugMod;
    const aplicada = f.modalidade === s.modalidade.nome;
    const pct = Math.round(s.p * 100);
    const via = s.base ? "base histórica PIPA" : `via ${s.via.nome}${s.via.pai ? " · pai no DAG" : ""}`;
    return (
      <div style={{ border: `1px solid ${C.azulClaro}`, borderRadius: RADIUS.md, background: C.accentSoft, padding: "12px 14px", display: "grid", gap: 9 }}>
        <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: C.azul, display: "flex", alignItems: "center", gap: 7 }}>
          <Ic d="spark" size={13} color={C.azul} /> Sugestão do histórico · rede de dependências
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.ink, lineHeight: 1.5 }}>
          O histórico PIPA aponta modalidade do tipo <b>{s.grupo}</b> →{" "}
          <b style={{ color: C.azulEscuro }}>{s.modalidade.nome}</b>{" "}
          <span style={{ color: C.muted }}>({fmtValor(s.modalidade.valor, s.modalidade.moeda)} · {s.modalidade.formacao})</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 6, background: C.line, borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: C.azul }} />
          </div>
          <span style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 700, color: C.azulEscuro, fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
          <span style={{ fontFamily: SANS, fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>n={s.n} · {via}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
          <button type="button" disabled={aplicada} onClick={() => setVal("modalidade", s.modalidade.nome)}
            style={{ ...compBtn, opacity: aplicada ? 0.55 : 1, cursor: aplicada ? "default" : "pointer" }}>
            {aplicada ? "✓ modalidade aplicada" : "Aplicar modalidade"}
          </button>
          <span style={{ fontFamily: SANS, fontSize: 10.5, color: C.faint, lineHeight: 1.35 }}>
            Estimativa do corpus (55 chamadas) — dependência estatística, não regra. Ajuste à vontade.
          </span>
        </div>
      </div>
    );
  };

  // Validação inline: guardrails do passo atual (warn/err/info), quieto quando tudo ok.
  const InlineConf = () => {
    const items = confForStep(step);
    if (!items.length) return null;
    return (
      <div style={{ display: "grid", gap: 6, marginTop: 2 }}>
        {items.map((c, i) => (
          <div key={i} style={{ display: "flex", gap: 9, alignItems: "baseline", fontFamily: SANS, fontSize: 12.5,
            background: SEVBG[c.sev], color: SEVC[c.sev], padding: "8px 11px", borderRadius: RADIUS.sm }}>
            <span style={{ fontWeight: 800, flexShrink: 0 }}>{SEVI[c.sev]}</span>
            <div style={{ lineHeight: 1.4, color: C.ink }}><b style={{ color: SEVC[c.sev] }}>{c.label}</b> — {c.detail}</div>
          </div>
        ))}
      </div>
    );
  };

  function stepBody() {
    switch (step) {
      case 0: return (<>
        <div style={{ background: C.accentSoft, border: `1px solid ${C.azulClaro}`, borderRadius: RADIUS.md, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: C.azulEscuro }}>✦ Partir de um projeto ativo do IPEA</div>
          {selProj ? (
            <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap", marginTop: 6 }}>
              <span style={{ fontFamily: SANS, fontSize: 12.5, color: C.azulEscuro, lineHeight: 1.45 }}>
                ✓ Preenchido a partir de <b>{selProj.titulo}</b>
              </span>
              <span style={{ fontFamily: SANS, fontSize: 11.5, color: C.muted }}>
                {selProj.diretoria} · {selProj.temas[0]}{selProj.funcoes.length ? " · " + selProj.funcoes.join(", ") : " · função a definir"}{selProj.ano ? " · " + selProj.ano : ""}
              </span>
              <button type="button" onClick={limparProj} style={{ background: "none", border: "none", color: C.azul, cursor: "pointer", fontFamily: SANS, fontSize: 12, fontWeight: 600, padding: 0 }}>trocar projeto</button>
            </div>
          ) : (<>
            <div style={{ fontFamily: SANS, fontSize: 12, color: C.muted, margin: "2px 0 8px", lineHeight: 1.45 }}>
              <b>{projCountDir}</b> projetos da {f.diretoriaSel} (de {PROJETOS.length}). Busque e escolha — preenche diretoria, tema, função e título (ajuste à vontade).
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <button type="button" onClick={() => setProjAll(false)} style={chipStyle(!projAll)}>só {f.diretoriaSel} ({projCountDir})</button>
              <button type="button" onClick={() => setProjAll(true)} style={chipStyle(projAll)}>todas as áreas ({PROJETOS.length})</button>
            </div>
            <input style={inp} placeholder="Buscar projeto por título ou tema… (↑↓ navega, Enter escolhe)" value={projQ} onChange={(e) => setProjQ(e.target.value)} onKeyDown={onProjKey} />
            <div style={{ maxHeight: 212, overflowY: "auto", marginTop: 8, display: "grid", gap: 4 }}>
              {projMatches.length === 0 && (
                <div style={{ fontFamily: SANS, fontSize: 12, color: C.muted, padding: "8px 2px" }}>Nenhum projeto encontrado{projAll ? "" : ` na ${f.diretoriaSel}`}.</div>
              )}
              {projMatches.map((p, idx) => {
                const hi = idx === projHi;
                return (
                  <button key={p.id} type="button" onClick={() => carregarProjeto(p.id)} onMouseEnter={() => setProjHi(idx)} className="lk"
                    ref={hi ? (el) => el && el.scrollIntoView({ block: "nearest" }) : undefined}
                    style={{ textAlign: "left", background: hi ? C.accentSoft : C.card, border: `1px solid ${hi ? C.azulClaro : C.line}`, borderRadius: RADIUS.sm, padding: "8px 10px", cursor: "pointer" }}>
                    <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.ink, fontWeight: 600, lineHeight: 1.35 }}>{p.titulo}</div>
                    <div style={{ fontFamily: SANS, fontSize: 11, color: C.muted, marginTop: 2 }}>{p.diretoria} · {p.temas[0]}{p.ano ? " · " + p.ano : ""}</div>
                  </button>
                );
              })}
            </div>
          </>)}
        </div>
        <Field l="Diretoria (área de pesquisa) — pré-seleciona o tema e prioriza sugestões da área">
          <select style={inp} value={f.diretoriaSel} onChange={(e) => setDiretoria(e.target.value)}>
            {DIRETORIAS.map((d) => <option key={d.sigla} value={d.sigla}>{d.sigla} — {d.nome}</option>)}
          </select>
        </Field>
        {cobTema && (
          <div style={{ fontFamily: SANS, fontSize: 12, lineHeight: 1.45, marginTop: -8,
            color: temaSubservido ? C.azulEscuro : C.muted,
            background: temaSubservido ? C.accentSoft : "transparent",
            border: temaSubservido ? `1px solid ${C.azulClaro}` : "none",
            borderRadius: RADIUS.sm, padding: temaSubservido ? "8px 11px" : 0 }}>
            <b>{cobTema.ativos}</b> projetos ativos neste tema · <b>{cobTema.pipa}</b> chamadas PIPA no histórico
            {temaSubservido && <> — <b>tema sub-servido por bolsas</b>: muita pesquisa, poucas chamadas. Boa hora para um edital.</>}
          </div>
        )}
        <Field l="Nº da chamada / TR"><input style={inp} placeholder="020/2026" value={f.numero} onChange={set("numero")} /></Field>
        <Field l="Unidade responsável (preenchida pela diretoria; edite p/ coordenação específica)">
          <input style={inp} placeholder="Diretoria / unidade responsável" value={f.unidade} onChange={set("unidade")} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          <Field l="Coordenação do projeto"><input style={inp} placeholder="Nome do coordenador" value={f.coordenador} onChange={set("coordenador")} /></Field>
          <Field l="Diretor(a) que assina o TR"><input style={inp} placeholder="Nome do(a) diretor(a)" value={f.diretoria} onChange={set("diretoria")} /></Field>
        </div>
      </>);
      case 1: return (<>
        <Field l="Tema / domínio do projeto — escolha um ou mais">
          <ChipsMulti campo="temas" opcoes={TEMAS} />
        </Field>
        <Field l="Nome do projeto — entra na fórmula do objeto">
          <input style={inp} placeholder="Ex.: Macroeconomia sob incerteza forte" value={f.projetoNome} onChange={set("projetoNome")} />
        </Field>
        <Field l="Definição do projeto de pesquisa">
          <textarea style={{ ...inp, minHeight: 120, resize: "vertical" }} placeholder="Objeto, justificativa e objetivos do projeto…" value={f.projeto} onChange={set("projeto")} />
          <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={compBtn} onClick={() => setVal("projeto", comporObjeto({ projetoNome: f.projetoNome }))}>
              ✦ Compor objeto (estrutura real PIPA)
            </button>
            <PlaceholderBtn campo="projeto" />
          </div>
        </Field>
        <ExemplosPipa temas={f.temas} onUsar={(p) => setVal("projeto", p)} />
        <Similares campo="projeto" />
      </>);
      case 2: return (<>
        {/* QUEM: a função/perfil vem primeiro — é o que torna a sugestão de modalidade fundamentada. */}
        <Field l="Função do perfil — o que a pessoa vai fazer (uma ou mais)">
          <ChipsMulti campo="funcoes" opcoes={FUNCOES} />
        </Field>
        {enfasesDe(f.funcoes).length > 0 && (
          <Field l="Ênfases técnicas (vocabulário real do corpus PIPA) — opcional">
            <ChipsMulti campo="enfases" opcoes={enfasesDe(f.funcoes)} />
          </Field>
        )}
        {/* A SUGESTÃO já considera a função escolhida acima; só então a modalidade. */}
        <SugestaoModalidade />
        <Field l="Modalidade da bolsa (Portaria 317/2025) — define valor, formação e requisito">
          <select style={inp} value={f.modalidade} onChange={set("modalidade")}>
            {MODALIDADES.map((m) => <option key={m.nome}>{m.nome}</option>)}
          </select>
        </Field>
        {mod && (
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.azul, marginTop: -6, lineHeight: 1.55 }}>
            valor mensal: <b>{fmtValor(mod.valor, mod.moeda)}</b> · Anexo I<br />
            formação: <b>{mod.formacao}</b><br />
            <span style={{ color: C.muted }}>requisito (Art. 4º): {mod.requisito}</span>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 13 }}>
          <Field l="Qtd. bolsas"><input style={inp} type="number" min="1" value={f.qtd} onChange={set("qtd")} /></Field>
          <Field l="Bolsa (meses)"><input style={inp} type="number" min="1" value={f.duracaoBolsa} onChange={set("duracaoBolsa")} /></Field>
          <Field l="Pesquisa (meses)"><input style={inp} type="number" min="1" value={f.duracaoPesquisa} onChange={set("duracaoPesquisa")} /></Field>
        </div>
        <Check k="cadastroReserva" l="Prever cadastro reserva (Art. 9º, §2º)" />
        {/* PERFIL redigido: a partir da função + modalidade já escolhidas. */}
        {recortesDe(f.temas).length > 0 && (
          <Field l="Recortes temáticos (do corpus) — opcional">
            <ChipsMulti campo="recortes" opcoes={recortesDe(f.temas)} />
          </Field>
        )}
        <Field l="Experiência / habilidades desejáveis — opcional">
          <input style={inp} placeholder="Ex.: experiência com Stata/R/Python; publicações na área…" value={f.experiencia} onChange={set("experiencia")} />
        </Field>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" style={compBtn}
            onClick={() => setVal("perfil", comporPerfil({ modalidade: f.modalidade, funcoes: f.funcoes, temas: f.temas, experiencia: f.experiencia, enfases: f.enfases, recortes: f.recortes }))}>
            ✦ Compor perfil a partir das escolhas
          </button>
          <PlaceholderBtn campo="perfil" />
        </div>
        <Field l="Perfil do bolsista desejado (editável)">
          <textarea style={{ ...inp, minHeight: 110, resize: "vertical" }} placeholder="Use ‘Compor perfil’ acima, ou escreva livremente…" value={f.perfil} onChange={set("perfil")} />
        </Field>
        <Similares campo="perfil" />
      </>);
      case 3: return (<>
        <label style={{ display: "flex", gap: 11, alignItems: "flex-start", cursor: "pointer", background: f.multivagas ? C.accentSoft : C.surface2, border: `1px solid ${f.multivagas ? C.azulClaro : C.line}`, borderRadius: RADIUS.md, padding: "12px 14px" }}>
          <input type="checkbox" checked={f.multivagas} onChange={(e) => toggleMultivagas(e.target.checked)} style={{ accentColor: C.azul, width: 16, height: 16, marginTop: 2 }} />
          <div>
            <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: C.ink }}>Edital com múltiplas seleções (multivagas)</div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: C.muted, lineHeight: 1.45, marginTop: 2 }}>
              Uma chamada com Seleção 1, 2, 3…, cada uma com modalidade, vagas, cotas e perfil próprios — como nas chamadas PIPA reais.
            </div>
          </div>
        </label>

        {!f.multivagas ? (<>
          <Field l="Público-alvo / reserva de vagas (Art. 25) — texto livre, opcional">
            <input style={inp} placeholder="Ex.: prioridade a pesquisadores de instituições do Norte/Nordeste…" value={f.reservaVagas} onChange={set("reservaVagas")} />
          </Field>
          <Check k="cotasOn" l="Prever reserva de vagas por cota (quadro AC/ER/M/PCD)" />
          {f.cotasOn && (<>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 13 }}>
              <Field l="Étnico-racial (ER)"><input style={inp} type="number" min="0" value={f.cotaER} onChange={set("cotaER")} /></Field>
              <Field l="Mulheres (M)"><input style={inp} type="number" min="0" value={f.cotaM} onChange={set("cotaM")} /></Field>
              <Field l="PCD"><input style={inp} type="number" min="0" value={f.cotaPCD} onChange={set("cotaPCD")} /></Field>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 12.5, color: reservaLive > q ? C.err : C.azul }}>
              ampla concorrência (AC): <b>{acLive}</b> · reservadas: <b>{reservaLive}</b> · total: <b>{q}</b>
              {reservaLive > q && <span style={{ fontWeight: 600 }}> — excede o total de vagas</span>}
            </div>
            <Check k="heteroident" l="Exigir procedimento de heteroidentificação" />
            <Field l="Fundamento legal das cotas — opcional">
              <input style={inp} placeholder="Ex.: Lei nº 12.990/2014; Decreto nº 9.508/2018…" value={f.fundamentoCotas} onChange={set("fundamentoCotas")} />
            </Field>
          </>)}
        </>) : (<>
          {f.vagas.map((v, i) => {
            const er = parseInt(v.cotaER) || 0, m = parseInt(v.cotaM) || 0, pcd = parseInt(v.cotaPCD) || 0;
            const vq = parseInt(v.qtd) || 1, vres = er + m + pcd;
            return (
              <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: RADIUS.md, padding: "14px 15px", background: C.surface2, display: "grid", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: C.azulEscuro }}>Seleção {i + 1}</span>
                  <button type="button" onClick={() => rmVaga(i)} title="Remover seleção" style={{ marginLeft: "auto", background: "none", border: "none", color: C.muted, cursor: "pointer", fontFamily: SANS, fontSize: 12, fontWeight: 600 }}>remover ✕</button>
                </div>
                <Field l="Modalidade">
                  <select style={inp} value={v.modalidade} onChange={(e) => setVaga(i, "modalidade", e.target.value)}>
                    {MODALIDADES.map((mm) => <option key={mm.nome} value={mm.nome}>{mm.nome} — {fmtValor(mm.valor, mm.moeda)}</option>)}
                  </select>
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 12 }}>
                  <Field l="Nº de vagas"><input style={inp} type="number" min="1" value={v.qtd} onChange={(e) => setVaga(i, "qtd", e.target.value)} /></Field>
                  <Field l="Tipo de vaga">
                    <select style={inp} value={v.tipo} onChange={(e) => setVaga(i, "tipo", e.target.value)}>
                      {["Imediata", "Cadastro reserva", "Imediata + cadastro reserva"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <Field l="Cota ER"><input style={inp} type="number" min="0" value={v.cotaER} onChange={(e) => setVaga(i, "cotaER", e.target.value)} /></Field>
                  <Field l="Cota M"><input style={inp} type="number" min="0" value={v.cotaM} onChange={(e) => setVaga(i, "cotaM", e.target.value)} /></Field>
                  <Field l="Cota PCD"><input style={inp} type="number" min="0" value={v.cotaPCD} onChange={(e) => setVaga(i, "cotaPCD", e.target.value)} /></Field>
                </div>
                {vres > vq && <div style={{ fontFamily: SANS, fontSize: 12, color: C.err, fontWeight: 600 }}>reserva ({vres}) excede as vagas ({vq})</div>}
                <Field l="Perfil/requisitos específicos desta seleção — opcional">
                  <textarea style={{ ...inp, minHeight: 52, resize: "vertical" }} placeholder="Em branco usa o requisito da modalidade…" value={v.perfil} onChange={(e) => setVaga(i, "perfil", e.target.value)} />
                </Field>
                <Field l="Atividades desta seleção — opcional">
                  <textarea style={{ ...inp, minHeight: 52, resize: "vertical" }} placeholder="Atividades de pesquisa específicas desta seleção…" value={v.atividades} onChange={(e) => setVaga(i, "atividades", e.target.value)} />
                </Field>
                <Field l="Critérios de seleção desta seleção — opcional">
                  <textarea style={{ ...inp, minHeight: 52, resize: "vertical" }} placeholder="Em branco usa o critério-padrão da norma…" value={v.criterios} onChange={(e) => setVaga(i, "criterios", e.target.value)} />
                  <div style={{ marginTop: 6 }}>
                    <button type="button" style={{ ...compBtn, padding: "6px 11px", fontSize: 11.5 }}
                      onClick={() => setVaga(i, "criterios", sugerirCriterios({ modalidade: v.modalidade, funcoes: f.funcoes }))}>
                      ✦ Sugerir critérios (padrão da modalidade)
                    </button>
                  </div>
                </Field>
              </div>
            );
          })}
          <button type="button" onClick={addVaga} style={{ ...compBtn, padding: "9px 14px" }}>+ Adicionar seleção</button>
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.muted }}>
            Total: <b style={{ color: C.ink }}>{f.vagas.reduce((a, v) => a + (parseInt(v.qtd) || 1), 0)}</b> bolsa(s) em <b style={{ color: C.ink }}>{f.vagas.length}</b> seleção(ões).
          </div>
        </>)}
      </>);
      case 4: return (<>
        {f.multivagas && (
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.azulEscuro, background: C.accentSoft, border: `1px solid ${C.azulClaro}`, borderRadius: RADIUS.sm, padding: "10px 12px", lineHeight: 1.45 }}>
            <b>Multivagas ativo:</b> atividades e critérios são definidos <b>por seleção</b> no passo <b>Vagas</b>. Os campos abaixo valem como base/rascunho.
          </div>
        )}
        <Field l="Atividades a desenvolver">
          <textarea style={{ ...inp, minHeight: 88, resize: "vertical" }} placeholder="Atividades de pesquisa do bolsista…" value={f.atividades} onChange={set("atividades")} />
          <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={compBtn}
              onClick={() => setVal("atividades", comporAtividades({ funcoes: f.funcoes, temas: f.temas }))}>
              ✦ Compor atividades (das funções do perfil)
            </button>
            <PlaceholderBtn campo="atividades" />
          </div>
          <div style={{ marginTop: 9 }}><Similares campo="atividades" /></div>
        </Field>
        <Field l="Critérios de seleção">
          <textarea style={{ ...inp, minHeight: 96, resize: "vertical" }} placeholder="Em branco usa o critério-padrão da norma; ou gere pelos critérios reais da modalidade…" value={f.criterios} onChange={set("criterios")} />
          <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={compBtn} onClick={() => setVal("criterios", sugerirCriterios({ modalidade: f.modalidade, funcoes: f.funcoes }))}>
              ✦ Sugerir critérios (padrão real da modalidade)
            </button>
            <PlaceholderBtn campo="criterios" />
          </div>
        </Field>
        <Check k="cartaIntencoes" l="Exigir carta de intenções (Art. 8º, §1º)" />
        <Field l="Composição da comissão julgadora — opcional">
          <textarea style={{ ...inp, minHeight: 56, resize: "vertical" }} placeholder="Em branco usa a composição-padrão (mín. 3 + 1 suplente, Art. 9º)…" value={f.comissao} onChange={set("comissao")} />
        </Field>
      </>);
      case 5: return (<>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          <Field l="Publicação"><input style={inp} type="date" value={f.dataPub} onChange={set("dataPub")} /></Field>
          <Field l="Início atividades"><input style={inp} type="date" value={f.inicio} onChange={set("inicio")} /></Field>
          <Field l="Inscrição início"><input style={inp} type="date" value={f.inscIni} onChange={set("inscIni")} /></Field>
          <Field l="Inscrição fim"><input style={inp} type="date" value={f.inscFim} onChange={set("inscFim")} /></Field>
          <Field l="Resultado"><input style={inp} type="date" value={f.resultado} onChange={set("resultado")} /></Field>
        </div>
        {dInsc != null && (
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: dInsc >= 10 ? C.ok : C.err, fontWeight: 600,
            background: dInsc >= 10 ? C.okBg : C.errBg, padding: "8px 12px", borderRadius: RADIUS.sm }}>
            Prazo de inscrição: {dInsc} dia(s) {dInsc >= 10 ? "✓ ok" : "✕ abaixo do mínimo de 10 (Art. 8º, §4º)"}
          </div>
        )}
      </>);
      case 6: return (<>
        <div style={{ display: "flex", gap: 8, fontFamily: SANS, fontSize: 12.5, fontWeight: 600 }}>
          {[["ok", `${resumo.ok} ok`], ["warn", `${resumo.warn} avisos`], ["err", `${resumo.err} erros`]].map(([k, l]) => (
            <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: SEVC[k], background: SEVBG[k], padding: "5px 11px", borderRadius: RADIUS.pill }}>{SEVI[k]} {l}</span>
          ))}
        </div>
        <div style={{ display: "grid", gap: 2 }}>
          {conf.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 11, alignItems: "baseline", fontFamily: SANS, fontSize: 13, padding: "8px 10px", borderRadius: RADIUS.sm, background: c.sev === "ok" ? "transparent" : SEVBG[c.sev] }}>
              <span style={{ color: SEVC[c.sev], fontWeight: 800, width: 12, flexShrink: 0 }}>{SEVI[c.sev]}</span>
              <div style={{ lineHeight: 1.45 }}><b>{c.label}</b> <span style={{ color: C.muted }}>— {c.detail}</span></div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          <button onClick={dlDoc} style={{ ...btn(true), padding: "11px 16px", fontSize: 13 }}>
            <Ic d="download" size={16} color="#fff" /> Word (.doc)
          </button>
          <button onClick={dlPdf} style={{ ...btn(false), padding: "11px 16px", fontSize: 13 }}><Ic d="doc" size={15} color={C.ink} /> PDF</button>
          <button onClick={shareLink} style={{ ...btn(false), padding: "11px 16px", fontSize: 13 }}>
            <Ic d={linkCopied ? "check" : "compass"} size={15} color={C.ink} /> {linkCopied ? "Link copiado" : "Copiar link"}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: SANS, fontSize: 11.5, color: C.faint }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Ic d="check" size={13} color={C.ok} /> {saved ? "Rascunho salvo neste navegador" : "—"}</span>
          <button onClick={limpar} style={{ background: "none", border: "none", color: C.azul, cursor: "pointer", fontFamily: SANS, fontSize: 11.5, fontWeight: 600, padding: 0 }}>limpar e recomeçar</button>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 11.5, color: C.faint, lineHeight: 1.5 }}>
          O link guarda todo o preenchimento (sem servidor). Rascunho de trabalho — revisão jurídica obrigatória antes da publicação no SEI/DOU.
        </div>
      </>);
      default: return null;
    }
  }

  const docHero = step === STEPS.length - 1; // último passo: o documento completo é o foco
  const foco = FOCO[step];
  let secoes = !foco ? minuta : minuta.filter((s) => s.head || (s.t && foco.some((k) => s.t.toUpperCase().includes(k))));
  if (foco && secoes.filter((s) => !s.head).length === 0) secoes = minuta; // fallback: nada casou
  const sev = resumo.err ? "err" : resumo.warn ? "warn" : "ok";
  const confChip = (
    <button onClick={() => setStep(STEPS.length - 1)} title="Ver conformidade" style={{
      fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
      background: SEVBG[sev], border: `1px solid ${SEVC[sev]}33`, borderRadius: RADIUS.pill, padding: "6px 12px", color: SEVC[sev],
    }}>{SEVI[sev]} {resumo.err ? `${resumo.err} erro(s)` : resumo.warn ? `${resumo.warn} aviso(s)` : "conforme"}</button>
  );
  const docToggle = (
    <div style={{ display: "inline-flex", background: C.sunken, borderRadius: RADIUS.sm, padding: 3, gap: 3 }}>
      {[["tr", "TR"], ["edital", "Chamada"]].map(([k, l]) => (
        <button key={k} onClick={() => setDoc(k)} style={{
          fontFamily: SANS, fontSize: 12, padding: "5px 12px", cursor: "pointer", borderRadius: 6, border: "none",
          background: doc === k ? C.card : "transparent", color: doc === k ? C.azulEscuro : C.muted,
          fontWeight: 600, boxShadow: doc === k ? SHADOW.xs : "none",
        }}>{l}</button>
      ))}
    </div>
  );

  return (
    <div className="twocol" style={{
      display: "grid", gap: 26, alignItems: "start",
      gridTemplateColumns: docHero ? "minmax(0,340px) minmax(0,1fr)" : "minmax(0,1fr) minmax(300px,372px)",
    }}>
      {/* ---------- ASSISTENTE (herói) ---------- */}
      <div style={{ display: "grid", gap: 18 }}>
        {/* stepper */}
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          {STEPS.map((s, i) => {
            const done = i < step, active = i === step;
            const iss = confForStep(i);
            const sev = iss.some((c) => c.sev === "err") ? "err" : iss.some((c) => c.sev === "warn") ? "warn" : null;
            return (
              <div key={i} onClick={() => setStep(i)} title={sev ? `${s} — ${iss.length} ponto(s) de atenção` : s}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", cursor: "pointer" }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: "absolute", top: 14, left: "50%", width: "100%", height: 2, background: done ? C.azul : C.line }} />
                )}
                <div className={active ? "pop" : ""} style={{
                  position: "relative",
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: SANS, fontSize: 12, fontWeight: 700, zIndex: 1,
                  background: done ? C.azul : active ? C.card : C.surface2,
                  color: done ? "#fff" : active ? C.azul : C.faint,
                  border: `2px solid ${done || active ? C.azul : C.line}`,
                  boxShadow: active ? SHADOW.focus : "none",
                }}>{done ? <Ic d="check" size={14} color="#fff" w={2.4} /> : i + 1}
                  {sev && (
                    <span title={`${iss.length} ponto(s) de atenção`} style={{
                      position: "absolute", top: -3, right: -3, width: 11, height: 11, borderRadius: "50%",
                      background: SEVC[sev], border: `2px solid ${C.card}`, boxSizing: "border-box",
                    }} />
                  )}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 9.5, marginTop: 6, textAlign: "center", lineHeight: 1.2,
                  color: active ? C.azulEscuro : C.faint, fontWeight: active ? 600 : 500 }}>{STEP_SHORT[i]}</div>
              </div>
            );
          })}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.card, padding: "26px 28px 28px" }}>
          <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: C.azul, marginBottom: 5 }}>
            Passo {step + 1} de {STEPS.length}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, letterSpacing: "-.01em", color: C.ink, marginBottom: 22 }}>{STEPS[step]}</div>
          <div key={step} className="fadeUp" style={{ display: "grid", gap: 17 }}>
            {stepBody()}
            <InlineConf />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}
            style={{ ...btn(false), opacity: step === 0 ? 0.45 : 1, cursor: step === 0 ? "default" : "pointer" }}>
            <span style={{ display: "inline-flex", transform: "scaleX(-1)" }}><Ic d="arrow" size={15} color={C.ink} /></span>Voltar
          </button>
          {step < STEPS.length - 1
            ? <button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} style={btn(true)}>Avançar <Ic d="arrow" size={15} color="#fff" /></button>
            : <button onClick={dlDoc} style={btn(true)}><Ic d="download" size={15} color="#fff" /> Baixar Word</button>}
        </div>
      </div>

      {/* ---------- PRÉVIA (companion contextual) ---------- */}
      <div style={{ position: docHero ? "static" : "sticky", top: 76 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: C.faint, display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Ic d="eye" size={13} color={C.faint} />{docHero ? "Documento completo" : `Prévia · ${STEP_SHORT[step]}`}
          </span>
          {!docHero && (
            <button onClick={() => setShowFull(true)} style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "transparent", border: "none", color: C.azul, padding: 0 }}>
              ver completo →
            </button>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {docToggle}{docHero && confChip}
          </div>
        </div>

        {docHero && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={copy} style={btn(true)}><Ic d={copied ? "check" : "copy"} size={15} color="#fff" />{copied ? "Copiado" : "Copiar"}</button>
            <button onClick={dlTxt} style={btn(false)}>.txt</button>
            <button onClick={dlDoc} style={btn(false)}><Ic d="download" size={15} color={C.ink} /> Word</button>
          </div>
        )}

        <div className={docHero ? "" : "cardhover"} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.card,
          padding: docHero ? "52px 60px" : "26px 30px", color: C.ink,
          minHeight: docHero ? 620 : 0, maxHeight: docHero ? "none" : "76vh", overflow: docHero ? "visible" : "auto" }}>
          {!docHero && (
            <div style={{ fontFamily: SANS, fontSize: 10.5, letterSpacing: ".04em", textTransform: "uppercase", color: C.azul, fontWeight: 600, marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 7 }}>
              <Ic d="spark" size={13} color={C.azul} />o documento se forma aqui
            </div>
          )}
          <div key={`${doc}-${step}`} className="fadeUp">{secoes.map((s, i) => renderSecao(s, i, flash))}</div>
        </div>
      </div>

      {/* ---------- MODAL: documento completo sob demanda ---------- */}
      {showFull && (
        <div onClick={() => setShowFull(false)} style={{ position: "fixed", inset: 0, background: "rgba(20,28,40,.42)", backdropFilter: "blur(3px)", zIndex: 50, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "30px 16px", overflow: "auto" }}>
          <div onClick={(e) => e.stopPropagation()} className="fadeUp" style={{ background: C.card, maxWidth: 860, width: "100%", borderRadius: RADIUS.lg, boxShadow: SHADOW.lg }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, background: "rgba(255,255,255,.9)", backdropFilter: "blur(8px)", borderRadius: `${RADIUS.lg}px ${RADIUS.lg}px 0 0`, flexWrap: "wrap" }}>
              <b style={{ fontFamily: SANS, fontSize: 14, color: C.ink }}>{doc === "tr" ? "Termo de Referência" : "Minuta de Chamada"}</b>
              {confChip}
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                {docToggle}
                <button onClick={copy} style={btn(true)}><Ic d={copied ? "check" : "copy"} size={15} color="#fff" />{copied ? "Copiado" : "Copiar"}</button>
                <button onClick={dlDoc} style={btn(false)}><Ic d="download" size={15} color={C.ink} /> Word</button>
                <button onClick={() => setShowFull(false)} style={{ ...btn(false), padding: "9px 11px" }}><Ic d="x" size={15} color={C.ink} /></button>
              </div>
            </div>
            <div style={{ padding: "48px 56px", color: C.ink }}>
              {minuta.map((s, i) => renderSecao(s, i, flash))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
