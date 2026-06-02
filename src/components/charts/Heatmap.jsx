import { C } from "../../theme.js";
import { MONO } from "./primitives.js";

const MESES = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

// Heatmap mês × ano. data: [{ ano, meses: number[12] }].
export default function Heatmap({ data }) {
  const max = Math.max(1, ...data.flatMap((d) => d.meses));
  const W = 680, padL = 52, padT = 22, cell = 44, gap = 3;
  const H = padT + data.length * (cell + gap) + 6;
  // interpola papel -> cerrado
  const cor = (v) => {
    if (!v) return "#efece1";
    const t = v / max;
    const lerp = (a, b) => Math.round(a + (b - a) * t);
    return `rgb(${lerp(244, 61)},${lerp(240, 90)},${lerp(230, 61)})`;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img">
      {MESES.map((m, i) => (
        <text key={i} x={padL + i * (cell + gap) + cell / 2} y={14} textAnchor="middle"
          fontFamily={MONO} fontSize="10" fill={C.muted}>{m}</text>
      ))}
      {data.map((linha, r) => (
        <g key={linha.ano}>
          <text x={padL - 8} y={padT + r * (cell + gap) + cell / 2} textAnchor="end" dominantBaseline="middle"
            fontFamily={MONO} fontSize="11" fill={C.ink}>{linha.ano}</text>
          {linha.meses.map((v, c) => (
            <g key={c}>
              <rect x={padL + c * (cell + gap)} y={padT + r * (cell + gap)} width={cell} height={cell}
                fill={cor(v)} rx="1.5" />
              {v > 0 && (
                <text x={padL + c * (cell + gap) + cell / 2} y={padT + r * (cell + gap) + cell / 2}
                  textAnchor="middle" dominantBaseline="middle" fontFamily={MONO} fontSize="11"
                  fill={v / max > 0.55 ? "#f4f0e6" : C.ink}>{v}</text>
              )}
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}
