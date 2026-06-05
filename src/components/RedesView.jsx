import { useState, useMemo } from "react";
import { C, SANS, RADIUS, SHADOW } from "../theme.js";
import { learnDAG, cpt, NOME, TIER, TIER_LABEL, DAG_VARS } from "../lib/bayes.js";

const SUBST = ["tema", "funcao", "modalGrupo", "formacao", "cota", "janela"];
const heat = (t) => {
  const a = Math.min(1, Math.max(0, t));
  const m = (c1, c2) => Math.round(c1 + (c2 - c1) * a);
  return `rgb(${m(255, 91)},${m(255, 91)},${m(255, 214)})`;
};

export default function RedesView() {
  const [escopo, setEscopo] = useState("todos");
  const [contexto, setContexto] = useState(false);
  const [domain, setDomain] = useState(true);
  const [selKey, setSelKey] = useState(null);
  const [flip, setFlip] = useState(false);

  const vars = contexto ? DAG_VARS : SUBST;
  const dag = useMemo(() => learnDAG(escopo, { domain, B: 80, vars }), [escopo, domain, contexto]); // eslint-disable-line
  const edge = useMemo(() => dag.edges.find((e) => `${e.from}->${e.to}` === selKey) || dag.edges[0] || null, [dag, selKey]);

  const src = edge ? (flip ? edge.to : edge.from) : null;
  const tgt = edge ? (flip ? edge.from : edge.to) : null;
  const tbl = useMemo(() => (edge ? cpt(escopo, src, tgt) : null), [escopo, src, tgt, edge]);

  // Layout em camadas (tiers) — fluxo causa → efeito da esquerda p/ direita.
  const W = 560, H = 380, M = 76;
  const tiers = [...new Set(dag.nodes.map((n) => TIER[n]))].sort((a, b) => a - b);
  const colX = {}; tiers.forEach((t, i) => (colX[t] = M + (i * (W - 2 * M)) / Math.max(tiers.length - 1, 1)));
  const pos = {};
  tiers.forEach((t) => {
    const arr = dag.nodes.filter((n) => TIER[n] === t);
    arr.forEach((n, j) => (pos[n] = { x: colX[t], y: (H / (arr.length + 1)) * (j + 1) }));
  });
  const maxConf = Math.max(...dag.edges.map((e) => e.conf), 0.001);
  const isOn = (e) => edge && e.from === edge.from && e.to === edge.to;

  const Seg = ({ on, set, children }) => (
    <button onClick={set} style={{
      fontFamily: SANS, fontSize: 12.5, padding: "6px 13px", cursor: "pointer", borderRadius: 7, border: "none",
      background: on ? C.card : "transparent", color: on ? C.azulEscuro : C.muted, fontWeight: 600, boxShadow: on ? SHADOW.xs : "none",
    }}>{children}</button>
  );
  const Toggle = ({ on, set, children }) => (
    <button onClick={set} style={{
      fontFamily: SANS, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7,
      padding: "7px 13px", borderRadius: RADIUS.pill, border: `1px solid ${on ? C.azulClaro : C.line}`,
      background: on ? C.accentSoft : C.card, color: on ? C.azulEscuro : C.muted,
    }}>
      <span style={{ width: 14, height: 14, borderRadius: 4, background: on ? C.azul : C.card, border: `1.5px solid ${on ? C.azul : C.lineStrong}`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, lineHeight: 1 }}>{on ? "✓" : ""}</span>
      {children}
    </button>
  );

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", background: C.sunken, borderRadius: RADIUS.sm, padding: 3, gap: 3 }}>
          <Seg on={escopo === "todos"} set={() => { setEscopo("todos"); setSelKey(null); }}>Todo o corpus (253)</Seg>
          <Seg on={escopo === "pipa"} set={() => { setEscopo("pipa"); setSelKey(null); }}>Só PIPA</Seg>
        </div>
        <Toggle on={contexto} set={() => { setContexto((v) => !v); setSelKey(null); }}>Incluir contexto (área, programa)</Toggle>
        <Toggle on={domain} set={() => { setDomain((v) => !v); setSelKey(null); }}>Ordem temporal de domínio</Toggle>
      </div>

      <div className="twocol" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(320px,400px)", gap: 18, alignItems: "start" }}>
        {/* DAG */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.card, padding: "16px 18px 10px" }}>
          <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: C.faint, marginBottom: 4 }}>
            DAG aprendido — Hill-Climbing (BIC) · espessura ∝ estabilidade (bootstrap, B={dag.B})
          </div>
          <svg viewBox={`0 0 ${W} ${H + 28}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <defs>
              {[["aOn", C.azul], ["aOff", C.azulClaro]].map(([id, col]) => (
                <marker key={id} id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0 0L10 5L0 10z" fill={col} />
                </marker>
              ))}
            </defs>
            {domain && tiers.map((t) => (
              <text key={t} x={colX[t]} y={14} textAnchor="middle" fontFamily={SANS} fontSize="9.5" fontWeight="600" fill={C.faint}>
                {TIER_LABEL[t].split(" (")[0]}
              </text>
            ))}
            <g transform="translate(0,24)">
              {dag.edges.map((e) => {
                const p1 = pos[e.from], p2 = pos[e.to];
                if (!p1 || !p2) return null;
                const on = isOn(e);
                const dim = edge && !on;
                const dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.hypot(dx, dy) || 1;
                const r1 = 22, r2 = 28; // recuo p/ não cobrir o nó / dar espaço à seta
                const x1 = p1.x + (dx / len) * r1, y1 = p1.y + (dy / len) * r1;
                const x2 = p2.x - (dx / len) * r2, y2 = p2.y - (dy / len) * r2;
                return (
                  <line key={`${e.from}->${e.to}`} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={on ? C.azul : C.azulClaro} strokeOpacity={dim ? 0.22 : 1}
                    strokeWidth={1.4 + (e.conf / maxConf) * 6} strokeLinecap="round"
                    markerEnd={`url(#${on ? "aOn" : "aOff"})`} style={{ cursor: "pointer" }}
                    onClick={() => { setSelKey(`${e.from}->${e.to}`); setFlip(false); }} />
                );
              })}
              {dag.nodes.map((n) => {
                const p = pos[n], hot = edge && (edge.from === n || edge.to === n);
                return (
                  <g key={n}>
                    <circle cx={p.x} cy={p.y} r={21} fill={hot ? C.azul : C.accentSoft} stroke={C.azul} strokeWidth={hot ? 0 : 1.5} />
                    <text x={p.x} y={p.y + 4} textAnchor="middle" fontFamily={SANS} fontSize="12" fontWeight="700" fill={hot ? "#fff" : C.azulEscuro}>
                      {NOME[n].replace(" (grupo)", "").slice(0, 3)}
                    </text>
                    <text x={p.x} y={p.y + 36} textAnchor="middle" fontFamily={SANS} fontSize="11" fontWeight={hot ? 700 : 500} fill={hot ? C.ink : C.muted}>
                      {NOME[n].replace(" (grupo)", "")}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
          <div style={{ fontFamily: SANS, fontSize: 11, color: C.faint, padding: "2px 2px 8px", lineHeight: 1.5 }}>
            Seta = dependência dirigida no melhor modelo (BIC). A <b>direção</b> entre variáveis nem sempre é
            identificável só com dados (classes de equivalência); a ordem temporal de domínio ajuda a orientar.
            Estabilidade = fração de {dag.B} reamostragens em que a aresta reapareceu. Associação ≠ causalidade.
          </div>
        </div>

        {/* painel */}
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.card, padding: "16px 18px" }}>
            <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: C.faint, marginBottom: 10 }}>
              Arestas do DAG ({dag.edges.length}) · estabilidade
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              {dag.edges.map((e) => (
                <button key={`${e.from}->${e.to}`} onClick={() => { setSelKey(`${e.from}->${e.to}`); setFlip(false); }} style={{
                  display: "flex", alignItems: "center", gap: 10, textAlign: "left", cursor: "pointer",
                  background: isOn(e) ? C.accentSoft : "transparent", border: "none", borderRadius: RADIUS.sm, padding: "8px 10px",
                }}>
                  <div style={{ flex: 1, fontFamily: SANS, fontSize: 12.5, color: C.ink, fontWeight: isOn(e) ? 600 : 500 }}>
                    {NOME[e.from].replace(" (grupo)", "")} <span style={{ color: C.azul }}>→</span> {NOME[e.to].replace(" (grupo)", "")}
                    {e.confDir < 0.7 && <span title="direção incerta (classe de equivalência)" style={{ color: C.warn, marginLeft: 5 }}>⇄?</span>}
                  </div>
                  <div style={{ width: 50, height: 6, borderRadius: 3, background: C.sunken, overflow: "hidden" }}>
                    <div style={{ width: `${e.conf * 100}%`, height: "100%", background: e.conf > 0.7 ? C.azul : C.azulClaro }} />
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 11.5, color: C.azulEscuro, fontWeight: 600, fontVariantNumeric: "tabular-nums", width: 30, textAlign: "right" }}>
                    {Math.round(e.conf * 100)}
                  </div>
                </button>
              ))}
              {!dag.edges.length && <div style={{ fontFamily: SANS, fontSize: 13, color: C.muted }}>Nenhuma dependência sobrevive ao BIC neste recorte.</div>}
            </div>
          </div>

          {edge && tbl && (
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.card, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: C.ink }}>
                  P({NOME[tgt].replace(" (grupo)", "")} <span style={{ color: C.faint, fontWeight: 500 }}>|</span> {NOME[src].replace(" (grupo)", "")})
                </div>
                <button onClick={() => setFlip((v) => !v)} title="Inverter direção" style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, cursor: "pointer", color: C.azul, background: C.accentSoft, border: "none", borderRadius: RADIUS.pill, padding: "4px 10px" }}>⇄ inverter</button>
                <span style={{ marginLeft: "auto", fontFamily: SANS, fontSize: 11.5, color: C.faint }}>
                  estab. {Math.round(edge.conf * 100)}% · n={tbl.n}
                </span>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 11.5, color: C.muted, marginBottom: 12, lineHeight: 1.45 }}>
                Cada linha (categoria de <b>{NOME[src].replace(" (grupo)", "")}</b>) soma 100%. Célula escura = mais provável.
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "separate", borderSpacing: 0, fontFamily: SANS, fontSize: 11.5 }}>
                  <thead><tr>
                    <th style={{ position: "sticky", left: 0, background: C.card }} />
                    {tbl.cols.map((cc) => (
                      <th key={cc} style={{ padding: "0 6px 8px", color: C.muted, fontWeight: 600, textAlign: "center" }}>
                        <div style={{ writingMode: tbl.cols.length > 4 ? "vertical-rl" : "horizontal-tb", transform: tbl.cols.length > 4 ? "rotate(180deg)" : "none", whiteSpace: "nowrap", margin: "0 auto", maxHeight: 96, overflow: "hidden", textOverflow: "ellipsis" }}>{cc}</div>
                      </th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {tbl.matrix.map((row) => (
                      <tr key={row.r}>
                        <td title={`${row.r} (n=${row.tot})`} style={{ padding: "3px 10px 3px 0", color: C.ink, fontWeight: 500, whiteSpace: "nowrap", position: "sticky", left: 0, background: C.card, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {row.r} <span style={{ color: C.faint }}>·{row.tot}</span>
                        </td>
                        {row.probs.map((p, ci) => (
                          <td key={ci} title={`${(p * 100).toFixed(0)}%`} style={{ background: heat(p), color: p > 0.5 ? "#fff" : p > 0.06 ? C.azulEscuro : C.faint, textAlign: "center", padding: "7px 8px", minWidth: 40, fontWeight: p > 0.5 ? 700 : 400, border: `1px solid ${C.card}`, fontVariantNumeric: "tabular-nums" }}>
                            {p > 0.005 ? Math.round(p * 100) : "·"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
