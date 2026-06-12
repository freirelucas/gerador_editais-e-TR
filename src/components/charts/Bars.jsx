import { C } from "../../theme.js";
import { MONO, fmtInt, niceMax, ticks } from "./primitives.js";

// Barras simples — vertical (padrão) ou horizontal (`horizontal`, ideal p/ rótulos longos).
// data: [{ label, value, color? }]
// Interatividade (opcional): onSelect(label) torna as barras clicáveis; `selected` (label|null)
// destaca a barra ativa e esmaece as demais. Sem onSelect o comportamento é idêntico ao antigo.
const trunc = (s) => (String(s).length > 34 ? String(s).slice(0, 33) + "…" : s);
export default function Bars({ data, color = C.cerrado, horizontal = false, unit = "", onSelect = null, selected = null }) {
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const corDe = (d, i) => d.color || (typeof color === "function" ? color(d, i) : color);
  const clk = typeof onSelect === "function";
  const isSel = (d) => selected != null && d.label === selected;
  const isDim = (d) => selected != null && !isSel(d);
  const hint = clk ? " · clique para detalhar" : "";

  if (horizontal) {
    const W = 700, padL = 234, padR = 48, padT = 6, rowH = 30;
    const H = padT + data.length * rowH + 6;
    const plotW = W - padL - padR;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img">
        {data.map((d, i) => {
          const y = padT + i * rowH;
          const w = (d.value / max) * plotW;
          return (
            <g key={i} onClick={clk ? () => onSelect(d.label) : undefined}
              style={clk ? { cursor: "pointer" } : undefined} opacity={isDim(d) ? 0.4 : 1}>
              <title>{`${d.label}: ${fmtInt(d.value)}${unit}${hint}`}</title>
              {clk && <rect x="0" y={y} width={W} height={rowH} fill="transparent" />}
              <text x={padL - 8} y={y + rowH / 2} textAnchor="end" dominantBaseline="middle"
                fontFamily={MONO} fontSize="13" fill={C.ink} fontWeight={isSel(d) ? 700 : 400}>{trunc(d.label)}</text>
              <rect className="chHover" x={padL} y={y + 5} width={Math.max(w, 1)} height={rowH - 12}
                fill={corDe(d, i)} rx="1" stroke={isSel(d) ? C.ink : "none"} strokeWidth={isSel(d) ? 1.5 : 0} />
              <text x={padL + w + 6} y={y + rowH / 2} dominantBaseline="middle"
                fontFamily={MONO} fontSize="12.5" fill={C.muted}>{fmtInt(d.value)}{unit}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  const W = 680, H = 300, padL = 44, padR = 12, padT = 16, padB = 46;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const x = (i) => padL + ((i + 0.5) * plotW) / data.length;
  const y = (v) => padT + plotH * (1 - v / max);
  const bw = (plotW / data.length) * 0.62;
  const colW = plotW / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img">
      {ticks(max).map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={C.line} strokeWidth="0.5" />
          <text x={padL - 6} y={y(t)} textAnchor="end" dominantBaseline="middle"
            fontFamily={MONO} fontSize="12" fill={C.muted}>{fmtInt(t)}</text>
        </g>
      ))}
      {data.map((d, i) => (
        <g key={i} onClick={clk ? () => onSelect(d.label) : undefined}
          style={clk ? { cursor: "pointer" } : undefined} opacity={isDim(d) ? 0.4 : 1}>
          <title>{`${d.label}: ${fmtInt(d.value)}${unit}${hint}`}</title>
          {clk && <rect x={x(i) - colW / 2} y={padT} width={colW} height={plotH} fill="transparent" />}
          <rect className="chHover" x={x(i) - bw / 2} y={y(d.value)} width={bw} height={Math.max(plotH * (d.value / max), 0)}
            fill={corDe(d, i)} rx="1" stroke={isSel(d) ? C.ink : "none"} strokeWidth={isSel(d) ? 1.5 : 0} />
          <text x={x(i)} y={y(d.value) - 6} textAnchor="middle" fontFamily={MONO} fontSize="12.5" fill={C.muted}>
            {fmtInt(d.value)}{unit}
          </text>
          <text x={x(i)} y={H - padB + 18} textAnchor="middle" fontFamily={MONO} fontSize="13" fill={C.ink} fontWeight={isSel(d) ? 700 : 400}>
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
