import { useState, useMemo, useEffect, useRef } from "react";
import { C, SANS, RADIUS, SHADOW } from "../theme.js";
import * as S from "../lib/stats.js";
import { CORPUS } from "../data/corpus.js";
import { PROJETOS, PROJETOS_RESUMO } from "../data/projetos.js";
import { rotuloUnidade } from "../data/diretorias.js";
import quality from "../data/quality.json";
import { COR_PROGRAMA, MONO, SERIF } from "./charts/primitives.js";
import { readUrl, writeAnalytics, DEFAULT_DIM } from "../lib/urlState.js";
import { baixarCsv, baixarSvgPng, slugArquivo } from "../lib/export.js";
import Bars from "./charts/Bars.jsx";
import StackedBars from "./charts/StackedBars.jsx";
import Line from "./charts/Line.jsx";
import Donut from "./charts/Donut.jsx";
import SerieMensal from "./charts/SerieMensal.jsx";

// Tom do "insight" (a conclusão): mais escuro que muted e sem itálico — a leitura é a
// protagonista da legenda, não uma nota de rodapé.
const INK_SOFT = "#3a3f47";
const hoje = new Date().toISOString().slice(0, 10);

// rótulo legível do recorte atual ("PIPA · 2025 · Com reserva") e slug p/ nome de arquivo
const escopoLabel = (f) =>
  [f.programa !== "Todos" && f.programa, f.ano !== "Todos" && f.ano, f.reserva !== "Todas" && f.reserva].filter(Boolean).join(" · ");
const slugFiltro = (f) => {
  const e = escopoLabel(f);
  return e ? slugArquivo(e) : "completo";
};
// CSV simples rótulo/valor a partir de [{label,value}]
const csvLV = (data, c1 = "rotulo", c2 = "valor") => () => [[c1, c2], ...data.map((d) => [d.label, d.value])];

// linhas CSV das chamadas do recorte (campos canônicos + listas juntadas)
function csvChamadas(sub) {
  const head = ["url", "titulo", "ano", "programa", "situacao", "prazo_ini", "prazo_fim", "janela_dias",
    "modalidade", "papel", "diretoria", "funcao", "tema", "formacao", "reserva", "categorias_cota"];
  const j = (a) => (a || []).join("; ");
  return [head, ...sub.map((c) => [
    c.url, c.titulo, c.ano, c.programa, c.situacao, c.prazo_ini_iso, c.prazo_fim_iso, c.janela_dias,
    c.modalidade_canonica, c.papel, c.diretoria, j(c.categoria_funcao), j(c.categoria_tema), j(c.formacao),
    (c.vagas_por_cota || {}).tem_reserva ? "sim" : "não", j((c.vagas_por_cota || {}).categorias),
  ])];
}

function Secao({ titulo, nota, children }) {
  return (
    <section style={{ marginTop: 38 }}>
      <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>{titulo}</h2>
      <div style={{ borderTop: `2px solid ${C.ink}`, marginBottom: nota ? 12 : 20 }} />
      {nota && <p style={{ fontFamily: SERIF, fontSize: 13, color: C.muted, margin: "0 0 18px", maxWidth: 820, lineHeight: 1.55 }}>{nota}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))", gap: 28 }}>
        {children}
      </div>
    </section>
  );
}

function Figura({ titulo, insight, children, wide, escopo, csv, noTools, nomeArquivo }) {
  const ref = useRef(null);
  const base = nomeArquivo || `ipea-${slugArquivo(titulo)}`;
  const png = () => baixarSvgPng(ref.current?.querySelector("svg"), { filename: base + ".png" });
  return (
    <figure style={{ margin: 0, gridColumn: wide ? "1 / -1" : "auto" }}>
      <figcaption style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase", color: C.azul, fontWeight: 700 }}>
            {titulo}{escopo && <span className="fchip">filtrado · {escopo}</span>}
          </div>
          {!noTools && (
            <div className="figtools">
              {csv && <button onClick={() => baixarCsv(base + ".csv", csv())} title="Baixar dados (CSV)">CSV</button>}
              <button onClick={png} title="Baixar imagem (PNG)">PNG</button>
            </div>
          )}
        </div>
        {insight && <div style={{ fontFamily: SERIF, fontSize: 14, color: INK_SOFT, marginTop: 5, lineHeight: 1.5 }}>{insight}</div>}
      </figcaption>
      <div ref={ref} style={{ background: "#ffffff", border: `1px solid ${C.line}`, borderRadius: 2, padding: "14px 16px" }}>
        {children}
      </div>
    </figure>
  );
}

function Vazio({ escopo }) {
  return (
    <div style={{ fontFamily: SERIF, fontSize: 13.5, color: C.muted, padding: "30px 6px", textAlign: "center" }}>
      Sem dados para <b>{escopo || "este recorte"}</b>. Tente afrouxar um filtro.
    </div>
  );
}

// destaques (KPIs) — os números que SÃO a história, em peso de manchete
function KPI({ num, unit, label, sub, accent }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderTop: `3px solid ${accent}`, borderRadius: 6, padding: "15px 16px" }}>
      <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 29, lineHeight: 1, color: C.ink, letterSpacing: "-.02em" }}>
        {num}{unit && <span style={{ fontSize: 15, fontWeight: 700, marginLeft: 3, color: C.muted }}>{unit}</span>}
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 13.5, fontWeight: 700, color: C.ink, marginTop: 9 }}>{label}</div>
      <div style={{ fontFamily: SERIF, fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 1.4 }}>{sub}</div>
    </div>
  );
}

// controle segmentado (pílulas)
function Seg({ label, value, options, onChange, inline = false }) {
  return (
    <div style={{ display: inline ? "inline-flex" : "flex", flexWrap: "wrap", alignItems: "center", gap: inline ? 7 : 6, marginBottom: inline ? 0 : 12 }}>
      <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase", color: C.muted, fontWeight: 700, width: inline ? "auto" : 78, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {options.map((o) => {
          const on = o === value;
          return (
            <button key={o} onClick={() => onChange(o)} style={{
              fontFamily: SERIF, fontSize: 12.5, fontWeight: 600, padding: "5px 11px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${on ? C.azul : C.line}`, background: on ? C.azul : "#fff", color: on ? "#fff" : C.muted, transition: "all .12s ease",
            }}>{o}</button>
          );
        })}
      </div>
    </div>
  );
}

// barra de filtro GLOBAL — controla explorador, "o que pedem" e sazonalidade
function FilterBar({ filtro, setFiltro, sub, ativo }) {
  const [copiado, setCopiado] = useState(false);
  const escopo = escopoLabel(filtro);
  const set = (k) => (v) => setFiltro({ ...filtro, [k]: v });
  const copiarLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopiado(true); setTimeout(() => setCopiado(false), 1800); }
    catch { window.prompt("Copie o link do recorte:", window.location.href); }
  };
  const baixarRecorte = () => baixarCsv(`ipea-chamadas-${slugFiltro(filtro)}-${hoje}.csv`, csvChamadas(sub));
  return (
    <div className={ativo ? "flash" : ""} style={{
      marginTop: 16, border: `1px solid ${ativo ? C.azulClaro : C.line}`, background: ativo ? C.accentSoft : C.surface2,
      borderRadius: 10, padding: "13px 16px",
    }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 18px" }}>
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", color: C.ink }}>Filtro global</span>
        <Seg inline label="Programa" value={filtro.programa} options={S.PROGRAMAS_OPC} onChange={set("programa")} />
        <Seg inline label="Ano" value={filtro.ano} options={S.ANOS_OPC} onChange={set("ano")} />
        <Seg inline label="Reserva" value={filtro.reserva} options={S.RESERVA_OPC} onChange={set("reserva")} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: SERIF, fontSize: 13, color: C.ink }}>
            <b style={{ fontSize: 16 }}>{sub.length}</b> <span style={{ color: C.muted }}>/ {S.totalChamadas} chamadas</span>
          </span>
          {ativo && (
            <button onClick={() => setFiltro({ programa: "Todos", ano: "Todos", reserva: "Todas" })} style={{
              fontFamily: SERIF, fontSize: 12, fontWeight: 600, color: C.azul, background: "none", border: "none", cursor: "pointer", textDecoration: "underline",
            }}>limpar</button>
          )}
          <span className="figtools">
            <button onClick={copiarLink} title="Copiar link deste recorte">{copiado ? "link copiado ✓" : "copiar link"}</button>
            <button onClick={baixarRecorte} title="Baixar as chamadas do recorte (CSV)">baixar recorte (CSV)</button>
          </span>
        </div>
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 11.5, color: C.muted, marginTop: 9 }}>
        {ativo ? <>Recorte ativo: <b style={{ color: INK_SOFT }}>{escopo}</b>. </> : null}
        Filtra o explorador, <i>“o que as chamadas pedem”</i> e a sazonalidade — as demais seções são panorama do corpus inteiro.
      </div>
    </div>
  );
}

// Painel de drill-down: lista as chamadas por trás de uma barra clicada (com link ao edital).
// Fecha no ✕, no clique fora ou no Esc.
function DrillDown({ titulo, chamadas, onClose }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(20,28,40,.42)",
      backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="fadeUp" role="dialog" aria-label={titulo} style={{ background: C.card,
        borderRadius: RADIUS.lg, boxShadow: SHADOW.lg, width: "min(680px,100%)", maxHeight: "82vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 20px", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase", color: C.azul, fontWeight: 700 }}>Drill-down</div>
            <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{titulo}</div>
            <div style={{ fontFamily: SERIF, fontSize: 12.5, color: C.muted, marginTop: 2 }}>{chamadas.length} resultado{chamadas.length === 1 ? "" : "s"}</div>
          </div>
          <button onClick={onClose} title="Fechar (Esc)" style={{ fontFamily: MONO, fontSize: 15, lineHeight: 1, color: C.muted,
            background: C.sunken, border: "none", borderRadius: RADIUS.pill, width: 30, height: 30, cursor: "pointer", flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "6px 8px" }}>
          {chamadas.map((c, i) => {
            const href = c.url || c.pdf || null;
            const sub = c.sub != null ? c.sub
              : `${c.ano} · ${c.programa}${c.modalidade_canonica ? " · " + c.modalidade_canonica : c.modalidade ? " · " + c.modalidade : ""}`;
            const inner = (<>
              <div style={{ fontFamily: SERIF, fontSize: 14, color: C.ink, fontWeight: 600, lineHeight: 1.35 }}>{c.titulo}</div>
              <div style={{ fontFamily: MONO, fontSize: 11.5, color: C.muted, marginTop: 2 }}>{sub}</div>
            </>);
            if (c.acao) {
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: RADIUS.sm }}>
                  <div style={{ flex: 1, minWidth: 0 }}>{inner}</div>
                  <button onClick={c.acao} title="Gerar um edital a partir deste projeto" style={{ flexShrink: 0, fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: "#fff", background: C.azul, border: "none", borderRadius: RADIUS.sm, padding: "7px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>✦ gerar edital</button>
                </div>
              );
            }
            return href
              ? <a key={i} href={href} target="_blank" rel="noreferrer" className="lk" style={{ display: "block", textDecoration: "none", padding: "10px 12px", borderRadius: RADIUS.sm }}>{inner}</a>
              : <div key={i} style={{ padding: "10px 12px", borderRadius: RADIUS.sm }}>{inner}</div>;
          })}
          {!chamadas.length && <div style={{ padding: 18, fontFamily: SERIF, color: C.muted }}>Nenhuma chamada corresponde neste recorte.</div>}
        </div>
      </div>
    </div>
  );
}
// rótulo da dimensão do explorador → chave do resolvedor S.matchDim
const DIM_KEY = { "Função do perfil": "funcao", "Tema / domínio": "tema", "Formação exigida": "formacao", "Papel / modalidade": "papel", "Diretoria": "diretoria", "Categoria de cota": "cota" };

// explorador: dimensão local + recorte do filtro global; exporta PNG e CSV
function Explorador({ filtro }) {
  const [dim, setDim] = useState(() => readUrl().dim || DEFAULT_DIM);
  const [drill, setDrill] = useState(null);
  useEffect(() => { writeAnalytics({ filtro, dim }); }, [dim]); // eslint-disable-line react-hooks/exhaustive-deps
  const ref = useRef(null);
  const sub = useMemo(() => S.filtrar(filtro), [filtro]);
  const meta = S.DIMENSOES[dim];
  const dados = useMemo(() => meta.fn(sub).slice(0, 14), [dim, sub]);
  const soma = dados.reduce((s, d) => s + d.value, 0);
  const escopo = escopoLabel(filtro) || "todas as chamadas";
  const base = `ipea-${slugArquivo(dim)}-${slugFiltro(filtro)}`;
  const png = () => baixarSvgPng(ref.current?.querySelector("svg"), { filename: base + ".png" });
  const csv = () => baixarCsv(base + ".csv", [["rotulo", "valor", "share_%"], ...dados.map((d) => [d.label, d.value, soma ? Math.round((d.value / soma) * 100) : 0])]);

  return (
    <section style={{ marginTop: 38 }}>
      <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>Explore você mesmo</h2>
      <div style={{ borderTop: `2px solid ${C.ink}`, marginBottom: 12 }} />
      <p style={{ fontFamily: SERIF, fontSize: 13, color: C.muted, margin: "0 0 16px", maxWidth: 820, lineHeight: 1.55 }}>
        Escolha a dimensão — o recorte vem do <b>filtro global</b> acima e tudo recalcula ao vivo. Função, tema,
        formação e cota são <i>multi-rótulo</i> (a soma pode passar do nº de chamadas).
      </p>
      <Seg label="Dimensão" value={dim} options={S.DIMENSOES_LISTA} onChange={setDim} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginTop: 6 }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase", color: C.azul, fontWeight: 700 }}>
          {dim} · {escopo}
        </div>
        {dados.length > 0 && (
          <div className="figtools">
            <button onClick={csv} title="Baixar dados (CSV)">CSV</button>
            <button onClick={png} title="Baixar imagem (PNG)">PNG</button>
          </div>
        )}
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 14, color: INK_SOFT, margin: "5px 0 10px", lineHeight: 1.5 }}>
        {dados.length
          ? `${dados[0].label} lidera com ${dados[0].value}${meta.multi ? " menções" : " chamadas"} entre as ${sub.length} do recorte.`
          : "Nenhuma chamada neste recorte tem esse atributo."}
      </div>
      <div ref={ref} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 2, padding: "14px 16px", minHeight: 120 }}>
        {dados.length
          ? <Bars data={dados} horizontal={meta.horizontal} color={C.azul}
              onSelect={(v) => setDrill({ titulo: `${dim}: ${v}`, chamadas: sub.filter((c) => S.matchDim(c, DIM_KEY[dim], v)) })} />
          : <Vazio escopo={escopoLabel(filtro)} />}
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 11.5, color: C.muted, marginTop: 7 }}>
        Clique numa barra para ver as chamadas por trás dela.{meta.multi && dados.length > 0 ? ` ${soma} menções no total (multi-rótulo).` : ""}
      </div>
      {drill && <DrillDown titulo={drill.titulo} chamadas={drill.chamadas} onClose={() => setDrill(null)} />}
    </section>
  );
}

export default function AnalyticsView({ irPara }) {
  const init = readUrl();
  const [filtro, setFiltro] = useState(init.filtro);
  const ativo = filtro.programa !== "Todos" || filtro.ano !== "Todos" || filtro.reserva !== "Todas";
  useEffect(() => { writeAnalytics({ filtro, dim: readUrl().dim || DEFAULT_DIM }); }, [filtro]);

  const sub = useMemo(() => S.filtrar(filtro), [filtro]);
  const escopo = ativo ? escopoLabel(filtro) : null;

  // datasets que RESPONDEM ao filtro global (reusam os agregadores do explorador)
  const dFuncao = useMemo(() => S.DIMENSOES["Função do perfil"].fn(sub), [sub]);
  const dFormacao = useMemo(() => S.DIMENSOES["Formação exigida"].fn(sub), [sub]);
  const dPapel = useMemo(() => S.DIMENSOES["Papel / modalidade"].fn(sub), [sub]);
  const dTema = useMemo(() => S.DIMENSOES["Tema / domínio"].fn(sub), [sub]);
  const serie = useMemo(() => S.serieMensalDe(sub), [sub]);
  const serieCob = useMemo(() => sub.filter((c) => c.prazo_ini_iso).length, [sub]);
  const janela = useMemo(() => S.janelaDe(sub), [sub]);

  const prov = quality.proveniencia;
  const enr = quality.enriquecimento || {};
  const dadosPrograma = S.porPrograma.map((p) => ({ label: p.programa, value: p.total, color: COR_PROGRAMA[p.programa] }));
  const projNota = S.projParcial
    ? ` 2026 é parcial (até ${S.refDate}); o projetado é pró-rata linear (real ÷ fração do ano ≈ ${Math.round(S.fracAnoCorr * 100)}%).`
    : "";

  // valores dos destaques
  const promob = S.porPrograma.find((p) => p.programa === "PROMOB")?.total || 0;
  const promobPct = Math.round((promob / S.totalChamadas) * 100);
  const promob23 = S.programaPorAno.find((l) => l.ano === "2023")?.PROMOB ?? 0;
  const promob24 = S.programaPorAno.find((l) => l.ano === "2024")?.PROMOB ?? 0;
  const r24 = S.cotaPorAnoPct.find((a) => a.ano === "2024")?.pct ?? 0;
  const r26 = S.cotaPorAnoPct.find((a) => a.ano === "2026")?.pct ?? 0;
  const pctBR = String(S.cotaPctTotal).replace(".", ",");
  // completude: legenda lê os MESMOS números do gráfico (via key) — não pode contradizer
  const cp = Object.fromEntries(S.completude.map((c) => [c.key, c.pct]));
  const md = S.modalidadeCanon;

  // ---- interatividade ----
  // Cross-filter: gráficos cujo eixo é faceta (programa/ano) clicam direto no filtro global
  // (clique fixa; clicar de novo limpa — substitui por dimensão). Drill-down: os categóricos
  // abrem a lista das chamadas por trás da barra (S.matchDim resolve a dimensão → chamadas).
  const [drill, setDrill] = useState(null);
  const abrir = (titulo, chamadas) => setDrill({ titulo, chamadas });
  const selPrograma = filtro.programa !== "Todos" ? filtro.programa : null;
  const selAno = filtro.ano !== "Todos" ? filtro.ano : null;
  const setPrograma = (p) => setFiltro((f) => ({ ...f, programa: f.programa === p ? "Todos" : p }));
  const setAno = (a) => setFiltro((f) => ({ ...f, ano: f.ano === a ? "Todos" : a }));
  const setAnoPrograma = (a, p) => setFiltro((f) => (f.ano === a && f.programa === p ? { ...f, ano: "Todos", programa: "Todos" } : { ...f, ano: a, programa: p }));
  const selStack = selAno && selPrograma ? { x: selAno, k: selPrograma } : null;
  // Gera um edital a partir do projeto: serializa os campos no formato do rascunho do
  // Builder (#s=…, mesmo esquema do compartilhar) e troca para a aba Gerador, que remonta
  // e hidrata a partir do hash. encodeURIComponent evita que +/=/ do base64 se percam.
  const gerarDoProjeto = (p) => {
    const form = {
      diretoriaSel: p.diretoria, unidade: rotuloUnidade(p.diretoria) || "",
      temas: p.temas, funcoes: p.funcoes, projetoNome: p.titulo, coordenador: p.coordenador || "",
    };
    try {
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(form))));
      location.hash = "#s=" + encodeURIComponent(b64) + "&p=" + encodeURIComponent(p.id);
    } catch { /* ignore */ }
    setDrill(null);
    irPara && irPara("builder");
  };
  // drill-down de PROJETOS (sem URL): lista título + área/coordenação + ação "gerar edital"
  const abrirProjetos = (titulo, projs) => setDrill({
    titulo, chamadas: projs.map((p) => ({
      titulo: p.titulo,
      sub: `${p.ano || "—"} · ${p.diretoria}${p.coordenador ? " · " + p.coordenador : ""}`,
      acao: irPara ? () => gerarDoProjeto(p) : undefined,
    })),
  });

  // ---- novos dados: projetos ativos do IPEA (demanda de pesquisa) ----
  const projPorTema = useMemo(() => {
    const m = {}; PROJETOS.forEach((p) => (m[p.temas[0]] = (m[p.temas[0]] || 0) + 1));
    return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, []);
  const projPorDir = useMemo(() => {
    const m = {}; PROJETOS.forEach((p) => (m[p.diretoria] = (m[p.diretoria] || 0) + 1));
    return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, []);
  const coberturaTema = useMemo(() => {
    const pj = {}; PROJETOS.forEach((p) => (pj[p.temas[0]] = (pj[p.temas[0]] || 0) + 1));
    const pp = {}; CORPUS.forEach((c) => c.programa === "PIPA" && (c.categoria_tema || []).forEach((t) => (pp[t] = (pp[t] || 0) + 1)));
    return Object.keys(pj).map((t) => ({ label: t, value: Math.round((100 * (pp[t] || 0)) / pj[t]), pipa: pp[t] || 0, ativos: pj[t] }))
      .sort((a, b) => a.value - b.value);
  }, []);

  return (
    <div style={{ fontFamily: SERIF, color: C.ink }}>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: C.muted, margin: "0 0 18px", maxWidth: 800 }}>
        Corpus de <b>{S.totalChamadas} chamadas</b> (2023–2026) raspadas do portal IPEA e enriquecidas com campos
        extraídos dos PDFs. <b>A história em uma frase:</b> o <b>PROMOB</b> dominou até 2024; a <b>Portaria Normativa
        Ipea nº 317/2025</b> o converteu no <b>PIPA</b> — e com o PIPA veio a <b>reserva de vagas</b>. Use o filtro
        global para recortar, compartilhar o link e exportar; o que os dados <i>não</i> sustentam está na procedência.
      </p>

      {/* ---------- DESTAQUES ---------- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: 14, marginBottom: 6 }}>
        <KPI num={S.totalChamadas} label="chamadas no corpus" sub="2023–2026, raspadas do portal IPEA" accent={C.azul} />
        <KPI num={promobPct} unit="%" label="do acervo é PROMOB" sub="o legado que a 317/2025 converteu em PIPA" accent={C.gold} />
        <KPI num={`${r24}→${r26}`} unit="%" label="reserva de vagas saltou" sub={`de 2024 a 2026 · ${S.comReserva} chamadas (${pctBR}%) no total`} accent={C.azul} />
        <KPI num={S.janelaMediana} unit="dias" label="mediana de inscrição" sub="janela típica de candidatura" accent={C.azulClaro} />
      </div>

      {/* ---------- FILTRO GLOBAL ---------- */}
      <FilterBar filtro={filtro} setFiltro={setFiltro} sub={sub} ativo={ativo} />

      {/* ---------- 1. A VIRADA (panorama, não filtra) ---------- */}
      <Secao titulo="A virada PROMOB → PIPA">
        <Figura titulo="Programa × ano — a virada estrutural" wide
          csv={() => [["ano", "PROMOB", "PIPA", "PROCIN"], ...S.programaPorAno.map((d) => [d.ano, d.PROMOB, d.PIPA, d.PROCIN])]}
          insight={`PROMOB domina 2023–2024 (${promob23}, ${promob24}) e some em 2026; PIPA cresce. A Portaria 317/2025 converteu PROMOB/PROCIN no PIPA — por isso o gerador é PIPA-only. A fatia hachurada de 2026 é o projetado.${projNota}`}>
          <StackedBars data={S.programaPorAnoProj} xKey="ano" keys={["PROMOB", "PIPA", "PROCIN"]} cores={COR_PROGRAMA} projected
            onSelect={setAnoPrograma} selected={selStack} />
        </Figura>
        <Figura titulo="Chamadas por ano — real e projetado"
          csv={() => [["ano", "total", "projetado"], ...S.porAnoProjetado.map((a) => [a.ano, a.total, a.projetado ?? ""])]}
          insight={"Tendência de queda no nº de chamadas." + (projNota || " 2026 é parcial.")}>
          <Line data={S.porAnoProjetado.map((a) => ({ label: a.ano, value: a.total }))}
            projected={S.porAnoProjetado.map((a) => a.projetado)} onSelect={setAno} selected={selAno} />
        </Figura>
        <Figura titulo="Participação por programa" csv={csvLV(dadosPrograma, "programa", "chamadas")}
          insight={`PROMOB responde por ~${promobPct}% de todo o corpus — o acervo histórico é, em essência, PROMOB.`}>
          <Donut data={dadosPrograma} onSelect={setPrograma} selected={selPrograma} />
        </Figura>
      </Secao>

      {/* ---------- EXPLORADOR (filtra) ---------- */}
      <Explorador filtro={filtro} />

      {/* ---------- PROJETOS ATIVOS (novos dados, panorama) ---------- */}
      <Secao titulo="Projetos ativos do IPEA — demanda de pesquisa"
        nota={`${PROJETOS.length} projetos em andamento (planilha institucional), traduzidos para o universo da base (taxonomia de tema/função, 6 diretorias substantivas). Panorama do portfólio de projetos — não responde ao filtro global, que é das chamadas. Clique nas barras para ver os projetos.`}>
        <Figura titulo="Projetos ativos por tema" wide csv={csvLV(projPorTema, "tema", "projetos")}
          insight={`Onde a pesquisa em curso se concentra: ${projPorTema.slice(0, 3).map((d) => `${d.label} ${d.value}`).join(", ")}. O tema vem do título (taxonomia) ou, sem precedente, da diretoria da área.`}>
          <Bars data={projPorTema} horizontal color={C.azul} onSelect={(v) => abrirProjetos(`Projetos · tema: ${v}`, PROJETOS.filter((p) => p.temas[0] === v))} />
        </Figura>
        <Figura titulo="Cobertura de bolsas por tema — chamadas PIPA por projeto ativo (%)" csv={() => [["tema", "cobertura_pct", "chamadas_pipa", "projetos_ativos"], ...coberturaTema.map((d) => [d.label, d.value, d.pipa, d.ativos])]}
          insight={`Chamadas PIPA ÷ projetos ativos, por tema. Onde há muita pesquisa e poucas bolsas — sub-servido, logo oportunidade de TR: ${coberturaTema.slice(0, 3).map((d) => `${d.label} ${d.value}% (${d.pipa}/${d.ativos})`).join(", ")}.`}>
          <Bars data={coberturaTema} horizontal unit="%" color={(d) => (d.value < 25 ? C.gold : C.cerrado)}
            onSelect={(v) => abrirProjetos(`Projetos · tema: ${v}`, PROJETOS.filter((p) => p.temas[0] === v))} />
        </Figura>
        <Figura titulo="Projetos ativos por diretoria" csv={csvLV(projPorDir, "diretoria", "projetos")}
          insight="Distribuição por área coordenadora substantiva (não-substantivas foram mapeadas pela diretoria envolvida / tema).">
          <Bars data={projPorDir} horizontal color={C.azul} onSelect={(v) => abrirProjetos(`Projetos · diretoria: ${v}`, PROJETOS.filter((p) => p.diretoria === v))} />
        </Figura>
        <Figura titulo="O que os projetos entregam — tipos de produto" csv={csvLV(PROJETOS_RESUMO.produtosPorTipo, "tipo", "produtos")}
          insight={`${PROJETOS_RESUMO.totalProdutos.toLocaleString("pt-BR")} produtos nos projetos ativos. Predominam saídas analíticas (artigos, TDs, notas técnicas) — sinal de "Apoio à pesquisa"/"Métodos quantitativos"; "Base de Dados" aponta engenharia de dados. É a melhor pista de FUNÇÃO (o título raramente a revela).`}>
          <Bars data={PROJETOS_RESUMO.produtosPorTipo} horizontal color={C.cerrado} />
        </Figura>
      </Secao>

      {/* ---------- 2. O QUE PEDEM (filtra) ---------- */}
      <Secao titulo="O que as chamadas pedem"
        nota="Perfis SOLICITADOS pelas chamadas — não há dados de contratação/resultado no acervo. Classificação por regras sobre objeto+requisitos (taxonomia editável em data/taxonomia.json); rótulos múltiplos podem somar mais que o total. Responde ao filtro global.">
        <Figura titulo="Função do perfil (classificação)" escopo={escopo} noTools={!dFuncao.length} csv={csvLV(dFuncao, "funcao", "mencoes")}
          insight="O que a chamada quer que a pessoa faça — derivado de objeto+requisitos.">
          {dFuncao.length ? <Bars data={dFuncao} horizontal onSelect={(v) => abrir(`Função: ${v}`, sub.filter((c) => S.matchDim(c, "funcao", v)))} /> : <Vazio escopo={escopo} />}
        </Figura>
        <Figura titulo="Formação exigida" escopo={escopo} noTools={!dFormacao.length} csv={csvLV(dFormacao, "formacao", "mencoes")}
          insight="Titulação mínima citada nos requisitos (multi-rótulo).">
          {dFormacao.length ? <Bars data={dFormacao} horizontal color={C.gold} onSelect={(v) => abrir(`Formação: ${v}`, sub.filter((c) => S.matchDim(c, "formacao", v)))} /> : <Vazio escopo={escopo} />}
        </Figura>
        <Figura titulo="Papel/modalidade pedido por seleção" wide escopo={escopo} noTools={!dPapel.length} csv={csvLV(dPapel, "papel", "chamadas")}
          insight="Papel nomeado em cada seleção do edital — oficial (PIPA) e legado (PROMOB). Variantes de acento/caixa foram agrupadas; só os 8 nomes oficiais entram em modalidade_canonica.">
          {dPapel.length ? <Bars data={dPapel} horizontal onSelect={(v) => abrir(`Papel/modalidade: ${v}`, sub.filter((c) => S.matchDim(c, "papel", v)))} /> : <Vazio escopo={escopo} />}
        </Figura>
        <Figura titulo="Temas / domínios (classificação)" escopo={escopo} noTools={!dTema.length} csv={csvLV(dTema, "tema", "mencoes")}
          insight="Domínio temático por regras sobre objeto+projeto+requisitos.">
          {dTema.length ? <Bars data={dTema} horizontal color={C.gold} onSelect={(v) => abrir(`Tema: ${v}`, sub.filter((c) => S.matchDim(c, "tema", v)))} /> : <Vazio escopo={escopo} />}
        </Figura>
      </Secao>

      {/* ---------- 3. VAGAS DE INCLUSÃO (panorama) ---------- */}
      <Secao titulo="Vagas de inclusão (cotas)"
        nota={`Vagas reservadas a ação afirmativa. Das ${S.totalChamadas} chamadas, ${S.comReserva} (${S.cotaPctTotal}%) preveem reserva EXPLÍCITA — e concentram-se em PIPA 2025–2026 (ver evolução). Contamos chamadas com reserva, não o nº de vagas (não está nos editais); tema e função são multi-rótulo, somam mais que ${S.comReserva}.`}>
        <Figura titulo="Chamadas com reserva — por categoria (nº)" csv={() => [["categoria", "chamadas", "% das com reserva"], ...S.porCotaPct.map((d) => [d.label, d.n, d.value])]}
          insight={`Magnitude entre as ${S.comReserva} chamadas com reserva: ${S.porCotaPct.map((d) => `${d.label} ${d.n} (${d.value}%)`).join(", ")}. Indígena é citado à parte, mas na 317 entra na cota étnico-racial.`}>
          <Bars data={S.porCotaPct.map((d) => ({ label: d.label, value: d.n }))} horizontal color={C.cerrado}
            onSelect={(v) => abrir(`Reserva — ${v}`, CORPUS.filter((c) => S.matchDim(c, "cota", v)))} />
        </Figura>
        <Figura titulo="Chamadas com reserva — por ano (nº e %)" csv={() => [["ano", "com_reserva", "total", "pct"], ...S.cotaPorAnoPct.map((a) => [a.ano, a.comReserva, a.total, a.pct])]}
          insight={`A reserva era ~ausente até 2024 e salta com a 317/2025 (abr): ${S.cotaPorAnoPct.map((a) => `${a.ano} ${a.comReserva}/${a.total} (${a.pct}%)`).join(" · ")}. Mudança de regime, não tendência suave.`}>
          <Bars data={S.cotaPorAnoPct.map((a) => ({ label: a.ano, value: a.comReserva }))}
            color={(d) => (d.label >= "2025" ? C.cerrado : C.line)} onSelect={setAno} selected={selAno} />
        </Figura>
        <Figura titulo="Quais TEMAS reservam mais (nº de chamadas)" wide csv={csvLV(S.reservaPorTema, "tema", "chamadas")}
          insight={`A inclusão se concentra em temas sociais: ${S.reservaPorTema.slice(0, 3).map((t) => `${t.label} ${t.value}`).join(", ")}… É onde a reserva de vagas mais aparece.`}>
          <Bars data={S.reservaPorTema} horizontal color={C.cerrado}
            onSelect={(v) => abrir(`Reserva · tema: ${v}`, CORPUS.filter((c) => S.temReserva(c) && S.matchDim(c, "tema", v)))} />
        </Figura>
        <Figura titulo="Quais FUNÇÕES reservam mais (nº de chamadas)" csv={csvLV(S.reservaPorFuncao, "funcao", "chamadas")}
          insight={`Por função pedida: ${S.reservaPorFuncao.map((f) => `${f.label} ${f.value}`).join(", ")}.`}>
          <Bars data={S.reservaPorFuncao} horizontal color={C.cerrado}
            onSelect={(v) => abrir(`Reserva · função: ${v}`, CORPUS.filter((c) => S.temReserva(c) && S.matchDim(c, "funcao", v)))} />
        </Figura>
        <Figura titulo="Quais DIRETORIAS reservam mais (nº de chamadas)" csv={csvLV(S.reservaPorDiretoria, "diretoria", "chamadas")}
          insight={`Cuidado: a diretoria só foi extraída em ${S.comReserva - S.reservaDiretoriaSem} das ${S.comReserva} (${S.reservaDiretoriaSem} não identificadas) — entre as identificadas, distribui-se por igual entre as diretorias econômicas/sociais. Sinal fraco, leia com cautela.`}>
          <Bars data={S.reservaPorDiretoria} horizontal color={C.cerrado}
            onSelect={(v) => abrir(`Reserva · diretoria: ${v}`, CORPUS.filter((c) => S.temReserva(c) && S.matchDim(c, "diretoria", v)))} />
        </Figura>
      </Secao>

      {/* ---------- 4. CONFORMIDADE (panorama) ---------- */}
      <Secao titulo="Conformidade — Portaria 317/2025"
        nota={`A Portaria Normativa Ipea nº 317 (18/04/2025) criou o PIPA e o quadro padrão de reserva AC/ER/M/PCD + heteroidentificação, citado por todos os editais PIPA. Só se mede no PIPA: PROMOB e PROCIN são programas anteriores que a 317 revogou/converteu — não os rege. Duas faces: a adesão estrutural (o quadro aparece) e, onde o edital traz a tabela numérica (3.1), a fração REAL de vagas reservadas — esta lida diretamente do texto dos editais.`}>
        <Figura titulo="Adesão ao quadro de reserva no PIPA — por ano (% dos editais analisados)" csv={() => [["ano", "pct", "com_reserva", "analisados"], ...S.adesaoPipaPorAno.map((a) => [a.ano, a.pct, a.comReserva, a.analisados])]}
          insight={`Fração dos editais PIPA analisados que trazem o quadro AC/ER/M/PCD: ${S.adesaoPipaPorAno.map((a) => `${a.ano} ${a.pct}% (${a.comReserva}/${a.analisados})`).join(" · ")}. O quadro se consolida ano a ano — não é universal porque o edital de vaga única costuma citá-lo sem aplicar split.`}>
          <Bars data={S.adesaoPipaPorAno.map((a) => ({ label: a.ano, value: a.pct }))} horizontal unit="%" color={C.azul}
            onSelect={setAno} selected={selAno} />
        </Figura>
        <Figura titulo="Vagas reservadas no PIPA — % do total de vagas (medido no quadro)" csv={() => [["categoria", "pct_do_total", "vagas"], ...S.vagasPipaQuadro.porCategoriaPct.map((c) => [c.label, c.value, c.n])]}
          insight={`Lido do quadro numérico (seção 3.1) de ${S.vagasPipaQuadro.n} editais PIPA: ${S.vagasPipaQuadro.reservadas} de ${S.vagasPipaQuadro.total} vagas são reservadas (${S.vagasPipaQuadro.pct}%); o resto é ampla concorrência. Por categoria do total: ${S.vagasPipaQuadro.porCategoriaPct.map((c) => `${c.label} ${c.value}% (${c.n})`).join(", ")}. A norma fixa 30/40/10, mas a aplicação real difere — a reserva de PcD não foi acionada. Salto por ano: ${S.vagasPipaQuadro.porAno.map((a) => `${a.ano} ${a.pct}%`).join(" · ")}.`}>
          <Bars data={S.vagasPipaQuadro.porCategoriaPct} horizontal unit="%" color={C.cerrado}
            onSelect={(v) => abrir(`Vagas reservadas — ${v} (PIPA, quadro 3.1)`, CORPUS.filter((c) => c.programa === "PIPA" && (c.vagas_por_cota || {}).quadro && S.matchDim(c, "cota", v)))} />
        </Figura>
      </Secao>

      {/* ---------- 5. SAZONALIDADE (filtra) ---------- */}
      <Secao titulo="Sazonalidade & prazos">
        <Figura titulo="Aberturas por mês — série temporal" wide escopo={escopo} noTools={!serie.length} csv={() => [["mes", "aberturas"], ...serie.map((d) => [d.ym, d.value])]}
          insight={`Volume por mês de abertura das inscrições (${serieCob}/${sub.length} com data): a tendência de queda e a sazonalidade aparecem no detalhe mensal; as linhas tracejadas marcam a virada de ano.`}>
          {serie.length ? <SerieMensal data={serie} onSelect={setAno} selected={selAno} /> : <Vazio escopo={escopo} />}
        </Figura>
        <Figura titulo="Janela de inscrição (dias)" escopo={escopo} noTools={!janela.hist.length} csv={() => [["faixa_dias", "chamadas"], ...janela.hist.map((h) => [h.faixa, h.total])]}
          insight={`Mediana de ${janela.mediana ?? "—"} dias (${janela.n} com janela informada); a maioria concentra-se entre 10 e 14 dias.`}>
          {janela.hist.length ? <Bars data={janela.hist.map((h) => ({ label: h.faixa, value: h.total }))}
            onSelect={(v) => abrir(`Janela de inscrição: ${v} dias`, sub.filter((c) => S.matchJanela(c, v)))} /> : <Vazio escopo={escopo} />}
        </Figura>
      </Secao>

      {/* ---------- 6. PROCEDÊNCIA (panorama) ---------- */}
      <Secao titulo="Procedência & limitações">
        <Figura titulo="Completude dos campos do corpus" wide csv={() => [["campo", "pct"], ...S.completude.map((c) => [c.campo, c.pct])]}
          insight={`${S.totalChamadas} chamadas raspadas do portal IPEA; ${enr.com_texto} com texto de PDF utilizável (${enr.texto_curto} curtos/escaneados, ${enr.pdf_404 || 0} indisponíveis). Tudo é máquina-extraído e o que falta fica explícito: a modalidade vem como texto livre em ${cp.mod_txt}% do corpus (heterogêneo, dezenas de variantes), e ${cp.mod_can}% das chamadas PIPA (${md.pipa} de ${md.pipaTotal}) normalizam para a modalidade canônica da 317 — o vocabulário oficial não rege PROMOB/PROCIN. O quadro numérico de vagas já foi extraído em ${cp.vagas}% das PIPA (${md.vagasPipa} de ${md.pipaTotal}); o campo legado "nº de bolsas" seguia esparso e saiu do gráfico. Comparar volume por modalidade padronizada só se sustenta dentro do PIPA. A biblioteca de cláusulas foi de ${prov.biblioteca_antes.clausulas.toLocaleString("pt-BR")} para ${prov.biblioteca_depois.clausulas.toLocaleString("pt-BR")} após fundir chaves de OCR e remover duplicatas. Situação das chamadas é um snapshot da raspagem — não use como estado ao vivo.`}>
          <Bars data={S.completude.map((c) => ({ label: c.campo, value: c.pct }))} horizontal unit="%"
            color={(d) => (d.value < 50 ? C.gold : C.cerrado)} />
        </Figura>
      </Secao>

      {drill && <DrillDown titulo={drill.titulo} chamadas={drill.chamadas} onClose={() => setDrill(null)} />}
    </div>
  );
}
