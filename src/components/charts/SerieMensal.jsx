import { C } from "../../theme.js";
import { MONO, fmtInt, niceMax, ticks } from "./primitives.js";

// Série temporal mensal: linha + área. data: [{ ym, ano, mes, value }].
// Rótulos do eixo x só nas viradas de ano (mes === 1) para não poluir com ~40 pontos.
export default function SerieMensal({ data, color = C.cerrado }) {
  if (!data || !data.length) return null;
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const W = 680, H = 260, padL = 34, padR = 12, padT = 16, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const x = (i) => padL + (data.length === 1 ? plotW / 2 : (i * plotW) / (data.length - 1));
  const y = (v) => padT + plotH * (1 - v / max);
  const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const area = `${padL},${padT + plotH} ${pts} ${x(data.length - 1)},${padT + plotH}`;
  const anoStarts = data.map((d, i) => (d.mes === 1 || i === 0 ? i : -1)).filter((i) => i >= 0);
  const picoI = data.reduce((bi, d, i) => (d.value > data[bi].value ? i : bi), 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img">
      {ticks(max).map((t, i) => (
        <g key={"t" + i}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={C.line} strokeWidth="0.5" />
          <text x={padL - 6} y={y(t)} textAnchor="end" dominantBaseline="middle"
            fontFamily={MONO} fontSize="10" fill={C.muted}>{fmtInt(t)}</text>
        </g>
      ))}
      {anoStarts.map((i) => (
        <g key={"y" + i}>
          <line x1={x(i)} x2={x(i)} y1={padT} y2={padT + plotH} stroke={C.line} strokeWidth="0.5" strokeDasharray="3 3" />
          <text x={x(i)} y={H - padB + 16} textAnchor="middle" fontFamily={MONO} fontSize="10.5" fill={C.ink}>{data[i].ano}</text>
        </g>
      ))}
      <polygon points={area} fill={color} opacity="0.12" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {/* marca o pico para dar referência sem rotular todos os pontos */}
      <circle cx={x(picoI)} cy={y(data[picoI].value)} r="3.5" fill={color} />
      <text x={x(picoI)} y={y(data[picoI].value) - 9} textAnchor="middle" fontFamily={MONO} fontSize="10" fill={C.ink}>
        {data[picoI].value} ({data[picoI].ym})
      </text>
    </svg>
  );
}
