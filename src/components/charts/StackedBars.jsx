import { C } from "../../theme.js";
import { MONO, fmtInt, niceMax, ticks } from "./primitives.js";

// Barras empilhadas. data: [{ [xKey]: rótulo, ...séries }]; keys: nomes das séries; cores: {série: cor}.
// projected (opcional): se true, empilha por cima o incremento projetado d[`${k}_proj`]
// com hachura (convenção "projetado", pró-rata linear).
// Interatividade (opcional): onSelect(x, serie) torna cada segmento clicável; `selected` ({x, k}|null)
// destaca o segmento ativo e esmaece os demais.
export default function StackedBars({ data, xKey, keys, cores, projected = false, onSelect = null, selected = null }) {
  const valOf = (d) => keys.reduce((s, k) => s + (d[k] || 0) + (projected ? d[`${k}_proj`] || 0 : 0), 0);
  const totais = data.map(valOf);
  const max = niceMax(Math.max(1, ...totais));
  const W = 680, H = 320, padL = 40, padR = 12, padT = 14, padB = 60;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const x = (i) => padL + ((i + 0.5) * plotW) / data.length;
  const yOf = (v) => plotH * (v / max);
  const bw = (plotW / data.length) * 0.6;
  const clk = typeof onSelect === "function";
  const isSel = (xv, k) => selected && selected.x === xv && selected.k === k;
  const isDim = (xv, k) => selected && !isSel(xv, k);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img">
      <defs>
        <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke={C.card} strokeWidth="2.2" />
        </pattern>
      </defs>
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
              return h > 0 ? (
                <rect key={k} className="chHover" x={x(i) - bw / 2} y={yTop} width={bw} height={h} fill={cores[k]}
                  onClick={clk ? () => onSelect(d[xKey], k) : undefined} style={clk ? { cursor: "pointer" } : undefined}
                  opacity={isDim(d[xKey], k) ? 0.4 : 1} stroke={isSel(d[xKey], k) ? C.ink : "none"} strokeWidth={isSel(d[xKey], k) ? 1.5 : 0}>
                  <title>{`${d[xKey]} · ${k}: ${fmtInt(d[k] || 0)}${clk ? " · clique para filtrar" : ""}`}</title>
                </rect>
              ) : null;
            })}
            {projected &&
              keys.map((k) => {
                const h = yOf(d[`${k}_proj`] || 0);
                if (h <= 0) return null;
                const yTop = padT + plotH - acc - h;
                acc += h;
                return (
                  <g key={k + "p"}>
                    <rect x={x(i) - bw / 2} y={yTop} width={bw} height={h} fill={cores[k]} fillOpacity="0.45" />
                    <rect x={x(i) - bw / 2} y={yTop} width={bw} height={h} fill="url(#hatch)" />
                  </g>
                );
              })}
            <text x={x(i)} y={padT + plotH + 15} textAnchor="middle" fontFamily={MONO} fontSize="11" fill={C.ink}>
              {d[xKey]}
            </text>
          </g>
        );
      })}
      {/* legenda — espaçamento conforme o tamanho do rótulo (evita sobreposição) */}
      {(() => {
        let lx = padL;
        return keys.map((k) => {
          const el = (
            <g key={k} transform={`translate(${lx}, ${H - 18})`}>
              <rect width="11" height="11" fill={cores[k]} rx="1" />
              <text x="16" y="9.5" fontFamily={MONO} fontSize="11" fill={C.ink}>{k}</text>
            </g>
          );
          lx += 26 + k.length * 6.3;
          return el;
        });
      })()}
    </svg>
  );
}
