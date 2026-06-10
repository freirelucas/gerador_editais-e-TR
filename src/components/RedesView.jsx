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

  // Nó = caixa com o rótulo INTEIRO (sem código de 3 letras). Largura ∝ tamanho do texto.
  const LABEL = (n) => NOME[n].replace(" (grupo)", "");
  const box = {};
  dag.nodes.forEach((n) => { box[n] = { w: Math.min(140, Math.max(64, LABEL(n).length * 7.2 + 24)), h: 34 }; });
  // Ponto onde a reta centro→alvo cruza a borda da caixa (folga p/ acomodar a seta).
  const onRect = (cx, cy, hw, hh, tx, ty) => {
    const dx = tx - cx, dy = ty - cy;
    if (!dx && !dy) return { x: cx, y: cy };
    const s = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
    return { x: cx + dx * s, y: cy + dy * s };
  };

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
    <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
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
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.card, padding: "16px 18px 10px", minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.faint, marginBottom: 3 }}>
            Mapa de dependências
          </div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.45 }}>
            Uma seta <b style={{ color: C.ink }}>A → B</b> significa que conhecer <b style={{ color: C.ink }}>A</b> ajuda a prever <b style={{ color: C.ink }}>B</b>. Clique numa seta para ver a tabela de probabilidades. A <b>espessura</b> indica a estabilidade.
          </div>
          <svg viewBox={`0 0 ${W} ${H + 34}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <defs>
              {[["aOn", C.azul], ["aOff", C.azulClaro]].map(([id, col]) => (
                <marker key={id} id={id} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
                  <path d="M0 0L10 5L0 10z" fill={col} />
                </marker>
              ))}
            </defs>
            {domain && tiers.map((t) => (
              <text key={t} x={colX[t]} y={13} textAnchor="middle" fontFamily={SANS} fontSize="10" fontWeight="700" letterSpacing=".05em" fill={C.faint}>
                {TIER_LABEL[t].split(" (")[0].toUpperCase()}
              </text>
            ))}
            <g transform="translate(0,28)">
              {dag.edges.map((e) => {
                const p1 = pos[e.from], p2 = pos[e.to];
                if (!p1 || !p2) return null;
                const on = isOn(e);
                const dim = selKey !== null && !on; // só esmaece os demais depois de um clique
                const a = onRect(p1.x, p1.y, box[e.from].w / 2, box[e.from].h / 2, p2.x, p2.y);
                const b = onRect(p2.x, p2.y, box[e.to].w / 2 + 7, box[e.to].h / 2 + 7, p1.x, p1.y);
                return (
                  <g key={`${e.from}->${e.to}`} style={{ cursor: "pointer" }} onClick={() => { setSelKey(`${e.from}->${e.to}`); setFlip(false); }}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={16} />
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke={on ? C.azul : C.azulClaro} strokeOpacity={dim ? 0.3 : 1}
                      strokeWidth={1.6 + (e.conf / maxConf) * 5.5} strokeLinecap="round"
                      markerEnd={`url(#${on ? "aOn" : "aOff"})`} />
                  </g>
                );
              })}
              {dag.nodes.map((n) => {
                const p = pos[n], w = box[n].w, h = box[n].h, hot = edge && (edge.from === n || edge.to === n);
                const dim = selKey !== null && !hot;
                return (
                  <g key={n} opacity={dim ? 0.45 : 1} style={{ transition: "opacity .15s" }}>
                    <rect x={p.x - w / 2} y={p.y - h / 2} width={w} height={h} rx={9}
                      fill={hot ? C.azul : C.card} stroke={hot ? C.azul : C.azulClaro} strokeWidth={1.5} />
                    <text x={p.x} y={p.y + 4.5} textAnchor="middle" fontFamily={SANS} fontSize="12.5" fontWeight={hot ? 700 : 600} fill={hot ? "#fff" : C.azulEscuro}>
                      {LABEL(n)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
          <div style={{ fontFamily: SANS, fontSize: 11, color: C.faint, padding: "4px 2px 8px", lineHeight: 1.5 }}>
            Aresta = dependência no melhor modelo (Hill-Climbing/BIC). A <b>direção</b> nem sempre é identificável só
            com dados (classes de equivalência); a ordem temporal de domínio ajuda a orientar. Estabilidade = fração
            de {dag.B} reamostragens (bootstrap) em que a aresta reapareceu. Associação ≠ causalidade.
          </div>
        </div>

        {/* painel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
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
