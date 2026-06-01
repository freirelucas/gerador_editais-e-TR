import { C } from "../theme.js";

// Etiqueta colorida usada para programa e situação das chamadas.
export default function Pill({ children, tone }) {
  const map = {
    aberta: { bg: C.abertaBg, fg: C.abertaFg, bd: "#9bb389" },
    fechada: { bg: "#ece6da", fg: C.muted, bd: C.line },
    prog: { bg: "#efe7d3", fg: C.terra, bd: "#d8c08f" },
  };
  const s = map[tone] || map.fechada;
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.bd}`,
        padding: "1px 8px",
        borderRadius: 2,
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize: 10,
        letterSpacing: ".06em",
        textTransform: "uppercase",
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}
