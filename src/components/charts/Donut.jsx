import { C } from "../../theme.js";
import { MONO, PALETA, fmtInt } from "./primitives.js";

// Rosca (donut). data: [{ label, value, color? }].
// Interatividade (opcional): onSelect(label) + selected (label|null).
export default function Donut({ data, onSelect = null, selected = null }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const W = 420, H = 240, cx = 120, cy = 120, r = 92, ri = 54;
  const clk = typeof onSelect === "function";
  const isSel = (d) => selected != null && d.label === selected;
  const isDim = (d) => selected != null && !isSel(d);
  let ang = -Math.PI / 2;
  const arc = (frac) => {
    const a0 = ang, a1 = ang + frac * 2 * Math.PI;
    ang = a1;
    const large = frac > 0.5 ? 1 : 0;
    const p = (a, rad) => `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
    return `M ${p(a0, r)} A ${r} ${r} 0 ${large} 1 ${p(a1, r)} L ${p(a1, ri)} A ${ri} ${ri} 0 ${large} 0 ${p(a0, ri)} Z`;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", maxWidth: 420 }} role="img">
      {data.map((d, i) => (
        <path key={i} className="chHover" d={arc(d.value / total)} fill={d.color || PALETA[i % PALETA.length]}
          onClick={clk ? () => onSelect(d.label) : undefined} style={clk ? { cursor: "pointer" } : undefined}
          opacity={isDim(d) ? 0.4 : 1} stroke={isSel(d) ? C.ink : "none"} strokeWidth={isSel(d) ? 1.5 : 0}>
          <title>{`${d.label}: ${fmtInt(d.value)} (${Math.round((100 * d.value) / total)}%)${clk ? " · clique para filtrar" : ""}`}</title>
        </path>
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fontFamily={MONO} fontSize="22" fontWeight="600" fill={C.ink}>
        {fmtInt(total)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={C.muted}>TOTAL</text>
      {data.map((d, i) => (
        <g key={i} transform={`translate(250, ${44 + i * 24})`}
          onClick={clk ? () => onSelect(d.label) : undefined} style={clk ? { cursor: "pointer" } : undefined}
          opacity={isDim(d) ? 0.4 : 1}>
          {clk && <rect x="-4" y="-3" width="170" height="20" fill="transparent" />}
          <rect width="12" height="12" rx="1" fill={d.color || PALETA[i % PALETA.length]} />
          <text x="18" y="10.5" fontFamily={MONO} fontSize="11.5" fill={C.ink} fontWeight={isSel(d) ? 700 : 400}>
            {d.label} · {fmtInt(d.value)} ({Math.round((100 * d.value) / total)}%)
          </text>
        </g>
      ))}
    </svg>
  );
}
