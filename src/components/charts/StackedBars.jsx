import { C } from "../../theme.js";
import { MONO, fmtInt, niceMax, ticks } from "./primitives.js";

// Barras empilhadas. data: [{ [xKey]: rótulo, ...séries }]; keys: nomes das séries; cores: {série: cor}.
export default function StackedBars({ data, xKey, keys, cores }) {
  const totais = data.map((d) => keys.reduce((s, k) => s + (d[k] || 0), 0));
  const max = niceMax(Math.max(1, ...totais));
  const W = 680, H = 320, padL = 40, padR = 12, padT = 14, padB = 60;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const x = (i) => padL + ((i + 0.5) * plotW) / data.length;
  const yOf = (v) => plotH * (v / max);
  const bw = (plotW / data.length) * 0.6;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img">
      {ticks(max).map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={padT + plotH - yOf(t)} y2={padT + plotH - yOf(t)}
            stroke={C.line} strokeWidth="0.5" />
          <text x={padL - 6} y={padT + plotH - yOf(t)} textAnchor="end" dominantBaseline="middle"
            fontFamily={MONO} fontSize="10" fill={C.muted}>{fmtInt(t)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        let acc = 0;
        return (
          <g key={i}>
            {keys.map((k) => {
              const h = yOf(d[k] || 0);
              const yTop = padT + plotH - acc - h;
              acc += h;
              return h > 0 ? <rect key={k} x={x(i) - bw / 2} y={yTop} width={bw} height={h} fill={cores[k]} /> : null;
            })}
            <text x={x(i)} y={padT + plotH + 15} textAnchor="middle" fontFamily={MONO} fontSize="11" fill={C.ink}>
              {d[xKey]}
            </text>
          </g>
        );
      })}
      {/* legenda */}
      {keys.map((k, i) => (
        <g key={k} transform={`translate(${padL + i * 110}, ${H - 18})`}>
          <rect width="11" height="11" fill={cores[k]} rx="1" />
          <text x="16" y="9.5" fontFamily={MONO} fontSize="11" fill={C.ink}>{k}</text>
        </g>
      ))}
    </svg>
  );
}
