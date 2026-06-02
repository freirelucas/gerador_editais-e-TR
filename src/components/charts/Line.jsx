import { C } from "../../theme.js";
import { MONO, fmtInt, niceMax, ticks } from "./primitives.js";

// Linha com área. data: [{ label, value }].
export default function Line({ data, color = C.cerrado }) {
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const W = 680, H = 280, padL = 40, padR = 14, padT = 16, padB = 40;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const x = (i) => padL + (data.length === 1 ? plotW / 2 : (i * plotW) / (data.length - 1));
  const y = (v) => padT + plotH * (1 - v / max);
  const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const area = `${padL},${padT + plotH} ${pts} ${x(data.length - 1)},${padT + plotH}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img">
      {ticks(max).map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={C.line} strokeWidth="0.5" />
          <text x={padL - 6} y={y(t)} textAnchor="end" dominantBaseline="middle"
            fontFamily={MONO} fontSize="10" fill={C.muted}>{fmtInt(t)}</text>
        </g>
      ))}
      <polygon points={area} fill={color} opacity="0.1" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r="3.5" fill={color} />
          <text x={x(i)} y={y(d.value) - 9} textAnchor="middle" fontFamily={MONO} fontSize="10" fill={C.ink}>
            {fmtInt(d.value)}
          </text>
          <text x={x(i)} y={H - padB + 16} textAnchor="middle" fontFamily={MONO} fontSize="10.5" fill={C.ink}>
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
