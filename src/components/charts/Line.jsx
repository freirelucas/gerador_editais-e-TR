import { C } from "../../theme.js";
import { MONO, fmtInt, niceMax, ticks } from "./primitives.js";

// Linha com área. data: [{ label, value }].
// projected (opcional): array paralelo a data com o valor projetado (ou null) por ponto;
// desenha um traço tracejado do real até o projetado (convenção "2026 projetado").
export default function Line({ data, color = C.cerrado, projected = null }) {
  const projVals = projected || data.map(() => null);
  const max = niceMax(Math.max(1, ...data.map((d) => d.value), ...projVals.filter((v) => v != null)));
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
      {/* projeção: traço tracejado do real até o projetado, marcador vazado */}
      {data.map((d, i) =>
        projVals[i] != null && projVals[i] > d.value ? (
          <g key={"proj" + i}>
            <line x1={x(i)} x2={x(i)} y1={y(d.value)} y2={y(projVals[i])} stroke={color}
              strokeWidth="2" strokeDasharray="5 4" opacity="0.75" />
            <circle cx={x(i)} cy={y(projVals[i])} r="3.5" fill={C.card} stroke={color} strokeWidth="2" />
            <text x={x(i)} y={y(projVals[i]) - 9} textAnchor="middle" fontFamily={MONO} fontSize="10" fill={C.muted}>
              {fmtInt(projVals[i])}*
            </text>
          </g>
        ) : null
      )}
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
