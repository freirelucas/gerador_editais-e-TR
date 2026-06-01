import { useState, useMemo } from "react";
import { C } from "../theme.js";
import { CORPUS } from "../data/corpus.js";
import Pill from "./Pill.jsx";

// Aba "Corpus de editais": busca e filtra as chamadas raspadas (2023–2026).
export default function CorpusView() {
  const [q, setQ] = useState("");
  const [ano, setAno] = useState("Todos");
  const [prog, setProg] = useState("Todos");
  const [sit, setSit] = useState("Todas");
  const anos = ["Todos", ...Array.from(new Set(CORPUS.map((c) => c.ano))).sort().reverse()];
  const progs = ["Todos", ...Array.from(new Set(CORPUS.map((c) => c.programa)))];
  const rows = useMemo(
    () =>
      CORPUS.filter((c) => {
        if (ano !== "Todos" && c.ano !== ano) return false;
        if (prog !== "Todos" && c.programa !== prog) return false;
        if (sit !== "Todas" && (c.situacao || "").toUpperCase() !== sit) return false;
        if (q) {
          const s = (c.titulo + " " + c.projeto + " " + c.modalidade).toLowerCase();
          if (!s.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [q, ano, prog, sit]
  );

  const selStyle = {
    fontFamily: "'IBM Plex Mono',monospace",
    fontSize: 12,
    padding: "7px 10px",
    background: C.paper,
    border: `1px solid ${C.line}`,
    color: C.ink,
    borderRadius: 2,
    outline: "none",
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 18 }}>
        <input
          placeholder="Buscar por título, projeto ou modalidade…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ ...selStyle, flex: "1 1 280px", minWidth: 200 }}
        />
        <select value={ano} onChange={(e) => setAno(e.target.value)} style={selStyle}>
          {anos.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <select value={prog} onChange={(e) => setProg(e.target.value)} style={selStyle}>
          {progs.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select value={sit} onChange={(e) => setSit(e.target.value)} style={selStyle}>
          {["Todas", "ABERTA", "FECHADA"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 11,
          color: C.muted,
          marginBottom: 12,
          letterSpacing: ".04em",
        }}
      >
        {rows.length} de {CORPUS.length} chamadas · corpus raspado 2023–2026
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {rows.map((c, i) => (
          <div
            key={i}
            style={{
              border: `1px solid ${C.line}`,
              borderLeft: `3px solid ${(c.situacao || "").toUpperCase() === "ABERTA" ? C.cerrado : C.line}`,
              background: "#faf7ef",
              padding: "13px 16px",
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
              <a
                href={c.url}
                target="_blank"
                rel="noreferrer"
                style={{ fontFamily: "Spectral,serif", fontSize: 16, fontWeight: 600, color: C.ink, textDecoration: "none" }}
              >
                {c.titulo}
              </a>
              <div style={{ display: "flex", gap: 6 }}>
                <Pill tone="prog">{c.programa}</Pill>
                <Pill tone={(c.situacao || "").toUpperCase() === "ABERTA" ? "aberta" : "fechada"}>{c.situacao || "—"}</Pill>
              </div>
            </div>
            {c.projeto && (
              <div style={{ fontFamily: "Spectral,serif", fontStyle: "italic", fontSize: 14, color: C.ink }}>“{c.projeto}”</div>
            )}
            <div
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 11,
                color: C.muted,
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <span>{c.ano}</span>
              {c.modalidade && <span>· {c.modalidade}</span>}
              {c.qtd && <span>· {c.qtd} bolsa(s)</span>}
              {c.pdf && (
                <a
                  href={c.pdf}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: C.terra, textDecoration: "none", marginLeft: "auto" }}
                >
                  ↓ PDF do edital
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
