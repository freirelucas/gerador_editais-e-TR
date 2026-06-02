import { useState } from "react";
import { C, FONTS } from "./theme.js";
import { CORPUS } from "./data/corpus.js";
import BuilderView from "./components/BuilderView.jsx";
import CorpusView from "./components/CorpusView.jsx";
import AnalyticsView from "./components/AnalyticsView.jsx";

// Raiz da aplicação: cabeçalho, abas (construtor / corpus) e rodapé.
export default function App() {
  const [tab, setTab] = useState("builder");
  return (
    <div
      style={{
        background: C.paper,
        minHeight: "100vh",
        color: C.ink,
        backgroundImage: "radial-gradient(rgba(60,90,61,.04) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <style>{FONTS}</style>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 28px 70px" }}>
        {/* header */}
        <header style={{ borderBottom: `2px solid ${C.ink}`, paddingBottom: 18, marginBottom: 8 }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 10.5,
              letterSpacing: ".22em",
              color: C.terra,
              textTransform: "uppercase",
            }}
          >
            IPEA · Programa de Incentivo à Pesquisa Aplicada
          </div>
          <h1 style={{ fontFamily: "Spectral,serif", fontSize: 38, fontWeight: 700, margin: "6px 0 4px", letterSpacing: "-.01em" }}>
            Construtor de Chamadas Públicas
          </h1>
          <p style={{ fontFamily: "Spectral,serif", fontStyle: "italic", color: C.muted, margin: 0, fontSize: 15 }}>
            Corpus de {CORPUS.length} chamadas (2023–2026) e gerador de minutas com base na regulamentação vigente.
          </p>
        </header>
        {/* tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: `1px solid ${C.line}` }}>
          {[
            ["builder", "Construtor de minuta"],
            ["corpus", "Corpus de editais"],
            ["analytics", "Analytics dos dados"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 12,
                letterSpacing: ".04em",
                padding: "11px 20px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: tab === k ? C.ink : C.muted,
                fontWeight: tab === k ? 600 : 400,
                borderBottom: tab === k ? `2px solid ${C.cerrado}` : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {l}
            </button>
          ))}
        </div>
        {tab === "builder" ? <BuilderView /> : tab === "corpus" ? <CorpusView /> : <AnalyticsView />}
        <footer
          style={{
            marginTop: 46,
            paddingTop: 16,
            borderTop: `1px solid ${C.line}`,
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 10,
            color: C.muted,
            lineHeight: 1.7,
          }}
        >
          Cláusulas-padrão extraídas dos editais raspados do portal IPEA. Valores conforme Portaria Normativa IPEA nº 262/2023
          (altera a Portaria nº 492/2010). Minuta gerada é um rascunho de trabalho — revisão jurídica e adequação à versão
          vigente do regulamento PIPA são obrigatórias antes da publicação.
        </footer>
      </div>
    </div>
  );
}
