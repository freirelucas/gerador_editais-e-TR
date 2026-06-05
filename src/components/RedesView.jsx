import { useState, useMemo } from "react";
import { C, SANS, RADIUS, SHADOW } from "../theme.js";
import { redeDependencias, cpt, NOME } from "../lib/bayes.js";

// Mistura branco→índigo conforme a intensidade (0..1) — heatmap das probabilidades.
const heat = (t) => {
  const a = Math.min(1, Math.max(0, t));
  const mix = (c1, c2) => Math.round(c1 + (c2 - c1) * a);
  return `rgb(${mix(255, 91)},${mix(255, 91)},${mix(255, 214)})`;
};

export default function RedesView() {
  const [escopo, setEscopo] = useState("todos");
  const rede = useMemo(() => redeDependencias(escopo), [escopo]);
  const [selKey, setSelKey] = useState(null);
  const [flip, setFlip] = useState(false);
  const [hover, setHover] = useState(null);

  const edge = useMemo(() => {
    const byKey = rede.edges.find((e) => `${e.a}-${e.b}` === selKey);
    return byKey || rede.edges[0] || null;
  }, [rede, selKey]);

  const src = edge ? (flip ? edge.b : edge.a) : null;
  const tgt = edge ? (flip ? edge.a : edge.b) : null;
  const tbl = useMemo(() => (edge ? cpt(escopo, src, tgt) : null), [escopo, src, tgt, edge]);

  // Layout circular determinístico.
  const W = 540, H = 440, cx = W / 2, cy = H / 2, R = 165;
  const pos = {};
  rede.nodes.forEach((nd, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / rede.nodes.length;
    pos[nd.id] = { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang), ang };
  });
  const maxNmi = Math.max(...rede.edges.map((e) => e.nmi), 0.001);
  const activeNode = hover || (edge ? [edge.a, edge.b] : []);
  const touches = (id) => edge && (edge.a === id || edge.b === id);

  const seg = (k, l) => (
    <button key={k} onClick={() => { setEscopo(k); setSelKey(null); }} style={{
      fontFamily: SANS, fontSize: 12.5, padding: "6px 14px", cursor: "pointer", borderRadius: 7, border: "none",
      background: escopo === k ? C.card : "transparent", color: escopo === k ? C.azulEscuro : C.muted,
      fontWeight: 600, boxShadow: escopo === k ? SHADOW.xs : "none",
    }}>{l}</button>
  );

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* controles + resumo */}
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", background: C.sunken, borderRadius: RADIUS.sm, padding: 3, gap: 3 }}>
          {seg("todos", `Todo o corpus (${253})`)}{seg("pipa", "Só PIPA")}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 13, color: C.muted }}>
          <b style={{ color: C.ink }}>{rede.total}</b> chamadas · <b style={{ color: C.ink }}>{rede.nodes.length}</b> variáveis ·
          <b style={{ color: C.ink }}> {rede.edges.length}</b> dependências (NMI ≥ 0,05)
        </div>
      </div>

      <div className="twocol" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(320px,400px)", gap: 18, alignItems: "start" }}>
        {/* rede */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.card, padding: "16px 16px 6px" }}>
          <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: C.faint, padding: "4px 6px 10px" }}>
            Rede de dependências — espessura ∝ força (NMI)
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            {rede.edges.map((e) => {
              const on = edge && edge.a === e.a && edge.b === e.b;
              const dim = (hover && !(e.a === hover[0] || e.b === hover[0])) || (!hover && edge && !on);
              const p1 = pos[e.a], p2 = pos[e.b];
              return (
                <line key={`${e.a}-${e.b}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke={on ? C.azul : C.azulClaro}
                  strokeWidth={1 + (e.nmi / maxNmi) * 7}
                  strokeOpacity={dim ? 0.12 : on ? 0.95 : 0.4}
                  strokeLinecap="round" style={{ cursor: "pointer", transition: "stroke-opacity .15s" }}
                  onClick={() => { setSelKey(`${e.a}-${e.b}`); setFlip(false); }}
                  onMouseEnter={() => setHover([e.a, e.b === e.a ? e.b : e.b])} onMouseLeave={() => setHover(null)} />
              );
            })}
            {rede.nodes.map((nd) => {
              const p = pos[nd.id];
              const hot = touches(nd.id) || (hover && hover.includes(nd.id));
              const right = p.x >= cx - 4;
              return (
                <g key={nd.id} style={{ cursor: "pointer" }}
                  onClick={() => {
                    const best = rede.edges.find((e) => e.a === nd.id || e.b === nd.id);
                    if (best) { setSelKey(`${best.a}-${best.b}`); setFlip(false); }
                  }}
                  onMouseEnter={() => setHover([nd.id])} onMouseLeave={() => setHover(null)}>
                  <circle cx={p.x} cy={p.y} r={hot ? 24 : 21} fill={hot ? C.azul : C.accentSoft}
                    stroke={C.azul} strokeWidth={hot ? 0 : 1.5} style={{ transition: "all .15s" }} />
                  <text x={p.x} y={p.y + 4} textAnchor="middle" fontFamily={SANS} fontSize="10.5" fontWeight="700"
                    fill={hot ? "#fff" : C.azulEscuro}>{nd.k}</text>
                  <text x={p.x + (right ? 28 : -28)} y={p.y + 4} textAnchor={right ? "start" : "end"}
                    fontFamily={SANS} fontSize="12.5" fontWeight={hot ? 700 : 500} fill={hot ? C.ink : C.muted}>{nd.nome}</text>
                </g>
              );
            })}
          </svg>
          <div style={{ fontFamily: SANS, fontSize: 11, color: C.faint, padding: "0 8px 10px", lineHeight: 1.5 }}>
            Nº no nó = quantas categorias. Clique numa aresta para ver a probabilidade condicional.
            Dependência por <b>informação mútua normalizada</b>; tema/função reduzidos à categoria principal.
            NMI mede associação estatística, <b>não causalidade</b>.
          </div>
        </div>

        {/* painel: dependências fortes + CPT */}
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.card, padding: "16px 18px" }}>
            <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: C.faint, marginBottom: 10 }}>
              Dependências mais fortes
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              {rede.edges.slice(0, 7).map((e) => {
                const on = edge && edge.a === e.a && edge.b === e.b;
                return (
                  <button key={`${e.a}-${e.b}`} onClick={() => { setSelKey(`${e.a}-${e.b}`); setFlip(false); }} style={{
                    display: "flex", alignItems: "center", gap: 10, textAlign: "left", cursor: "pointer",
                    background: on ? C.accentSoft : "transparent", border: "none", borderRadius: RADIUS.sm, padding: "8px 10px",
                  }}>
                    <div style={{ flex: 1, fontFamily: SANS, fontSize: 13, color: C.ink, fontWeight: on ? 600 : 500 }}>
                      {NOME[e.a]} <span style={{ color: C.faint }}>↔</span> {NOME[e.b]}
                    </div>
                    <div style={{ width: 56, height: 6, borderRadius: 3, background: C.sunken, overflow: "hidden" }}>
                      <div style={{ width: `${(e.nmi / maxNmi) * 100}%`, height: "100%", background: C.azul }} />
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 12, color: C.azulEscuro, fontWeight: 600, fontVariantNumeric: "tabular-nums", width: 34, textAlign: "right" }}>
                      {e.nmi.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {edge && tbl && (
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.card, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: C.ink }}>
                  P({NOME[tgt]} <span style={{ color: C.faint, fontWeight: 500 }}>|</span> {NOME[src]})
                </div>
                <button onClick={() => setFlip((v) => !v)} title="Inverter direção" style={{
                  fontFamily: SANS, fontSize: 11.5, fontWeight: 600, cursor: "pointer", color: C.azul,
                  background: C.accentSoft, border: "none", borderRadius: RADIUS.pill, padding: "4px 10px",
                }}>⇄ inverter</button>
                <span style={{ marginLeft: "auto", fontFamily: SANS, fontSize: 11.5, color: C.faint }}>n = {tbl.n}</span>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 11.5, color: C.muted, marginBottom: 12, lineHeight: 1.45 }}>
                Cada linha (uma categoria de <b>{NOME[src]}</b>) soma 100%. Célula mais escura = mais provável.
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "separate", borderSpacing: 0, fontFamily: SANS, fontSize: 11.5 }}>
                  <thead>
                    <tr>
                      <th style={{ position: "sticky", left: 0, background: C.card }} />
                      {tbl.cols.map((cc) => (
                        <th key={cc} style={{ padding: "0 6px 8px", color: C.muted, fontWeight: 600, textAlign: "center", maxWidth: 84 }}>
                          <div style={{ writingMode: tbl.cols.length > 4 ? "vertical-rl" : "horizontal-tb", transform: tbl.cols.length > 4 ? "rotate(180deg)" : "none", whiteSpace: "nowrap", margin: "0 auto", maxHeight: 90, overflow: "hidden", textOverflow: "ellipsis" }}>{cc}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tbl.matrix.map((row) => (
                      <tr key={row.r}>
                        <td style={{ padding: "3px 10px 3px 0", color: C.ink, fontWeight: 500, whiteSpace: "nowrap", position: "sticky", left: 0, background: C.card, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }} title={`${row.r} (n=${row.tot})`}>
                          {row.r} <span style={{ color: C.faint }}>·{row.tot}</span>
                        </td>
                        {row.probs.map((p, ci) => (
                          <td key={ci} title={`${(p * 100).toFixed(0)}%`} style={{
                            background: heat(p), color: p > 0.5 ? "#fff" : p > 0.06 ? C.azulEscuro : C.faint,
                            textAlign: "center", padding: "7px 8px", minWidth: 40, fontWeight: p > 0.5 ? 700 : 400,
                            border: `1px solid ${C.card}`, fontVariantNumeric: "tabular-nums",
                          }}>{p > 0.005 ? Math.round(p * 100) : "·"}</td>
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
