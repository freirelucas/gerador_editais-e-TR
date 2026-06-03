import { C } from "../../theme.js";
import { MONO, fmtInt, niceMax, ticks } from "./primitives.js";

// Barras simples — vertical (padrão) ou horizontal (`horizontal`, ideal p/ rótulos longos).
// data: [{ label, value, color? }]
const trunc = (s) => (String(s).length > 30 ? String(s).slice(0, 29) + "…" : s);
export default function Bars({ data, color = C.cerrado, horizontal = false, unit = "" }) {
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const corDe = (d, i) => d.color || (typeof color === "function" ? color(d, i) : color);

  if (horizontal) {
    const W = 700, padL = 222, padR = 48, padT = 6, rowH = 30;
    const H = padT + data.length * rowH + 6;
    const plotW = W - padL - padR;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img">
        {data.map((d, i) => {
          const y = padT + i * rowH;
          const w = (d.value / max) * plotW;
          return (
            <g key={i}>
              <title>{`${d.label}: ${fmtInt(d.value)}${unit}`}</title>
              <text x={padL - 8} y={y + rowH / 2} textAnchor="end" dominantBaseline="middle"
                fontFamily={MONO} fontSize="13" fill={C.ink}>{trunc(d.label)}</text>
              <rect x={padL} y={y + 5} width={Math.max(w, 1)} height={rowH - 12} fill={corDe(d, i)} rx="1" />
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
        <g key={i}>
          <rect x={x(i) - bw / 2} y={y(d.value)} width={bw} height={Math.max(plotH * (d.value / max), 0)}
            fill={corDe(d, i)} rx="1" />
          <text x={x(i)} y={y(d.value) - 6} textAnchor="middle" fontFamily={MONO} fontSize="12.5" fill={C.muted}>
            {fmtInt(d.value)}{unit}
          </text>
          <text x={x(i)} y={H - padB + 18} textAnchor="middle" fontFamily={MONO} fontSize="13" fill={C.ink}>
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
