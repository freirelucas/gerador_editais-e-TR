import { useState } from "react";
import { C, FONTS, SANS, WORDMARK } from "./theme.js";
import { NORMA } from "./data/norma.js";
import { CORPUS } from "./data/corpus.js";
import BuilderView from "./components/BuilderView.jsx";
import CorpusView from "./components/CorpusView.jsx";
import AnalyticsView from "./components/AnalyticsView.jsx";

// Logotipo "ipea" (wordmark) + quadradinhos institucionais.
function Wordmark() {
  const cores = [C.azulClaro, C.gold, "#5a9e6f", "#ffffff"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontFamily: WORDMARK, fontWeight: 700, fontSize: 30, color: "#fff", letterSpacing: "-.01em", lineHeight: 1 }}>
        ipea
      </span>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        {cores.map((c, i) => <span key={i} style={{ width: 7, height: 7, background: c, borderRadius: 1 }} />)}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("builder");
  return (
    <div style={{ background: C.paper, minHeight: "100vh", color: C.ink, fontFamily: SANS }}>
      <style>{FONTS}</style>

      {/* faixa institucional IPEA */}
      <div style={{ background: C.azulEscuro }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", gap: 16 }}>
          <Wordmark />
          <span style={{ fontFamily: SANS, fontSize: 12.5, color: "rgba(255,255,255,.82)", borderLeft: "1px solid rgba(255,255,255,.3)", paddingLeft: 16 }}>
            Instituto de Pesquisa Econômica Aplicada
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "30px 28px 70px" }}>
        {/* header */}
        <header style={{ borderBottom: `2px solid ${C.azul}`, paddingBottom: 16, marginBottom: 8 }}>
          <div style={{ fontFamily: SANS, fontSize: 11.5, letterSpacing: ".16em", color: C.azul, textTransform: "uppercase", fontWeight: 600 }}>
            {NORMA.programa}
          </div>
          <h1 style={{ fontFamily: SANS, fontSize: 34, fontWeight: 700, margin: "6px 0 4px", letterSpacing: "-.01em", color: C.azulEscuro }}>
            Gerador de Termo de Referência e Edital
          </h1>
          <p style={{ fontFamily: SANS, color: C.muted, margin: 0, fontSize: 15 }}>
            Ancorado na norma vigente — {NORMA.portaria} — com o corpus histórico de {CORPUS.length} chamadas (2023–2026).
          </p>
        </header>

        {/* tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: `1px solid ${C.line}` }}>
          {[
            ["builder", "Gerador"],
            ["corpus", "Corpus de editais"],
            ["analytics", "Analytics dos dados"],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              fontFamily: SANS, fontSize: 13.5, letterSpacing: ".02em", padding: "11px 20px",
              background: "transparent", border: "none", cursor: "pointer",
              color: tab === k ? C.azul : C.muted, fontWeight: tab === k ? 700 : 400,
              borderBottom: tab === k ? `2px solid ${C.azul}` : "2px solid transparent", marginBottom: -1,
            }}>{l}</button>
          ))}
        </div>

        {tab === "builder" ? <BuilderView /> : tab === "corpus" ? <CorpusView /> : <AnalyticsView />}

        <footer style={{ marginTop: 46, paddingTop: 16, borderTop: `1px solid ${C.line}`, fontFamily: SANS,
          fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
          Modalidades e valores conforme o Anexo I da {NORMA.portaria}, que institui o PIPA e converteu as
          modalidades das portarias anteriores (PROMOB/PNPD, PROCIN). As cláusulas dos modelos antigos são
          usadas apenas como <b>padrões de descrição</b> de projetos e atividades — fora do núcleo regulado.
          O documento gerado é um <b>rascunho de trabalho</b>: a revisão jurídica e a conferência com a versão
          vigente da norma são obrigatórias antes da publicação.
        </footer>
      </div>
    </div>
  );
}
