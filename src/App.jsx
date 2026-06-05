import { useState } from "react";
import { C, FONTS, GLOBAL_CSS, SANS, RADIUS, SHADOW } from "./theme.js";
import { NORMA } from "./data/norma.js";
import { CORPUS } from "./data/corpus.js";
import BuilderView from "./components/BuilderView.jsx";
import CorpusView from "./components/CorpusView.jsx";
import AnalyticsView from "./components/AnalyticsView.jsx";
import RedesView from "./components/RedesView.jsx";

const TABS = [
  ["builder", "Gerador", "doc"],
  ["corpus", "Explorador", "compass"],
  ["analytics", "Analytics", "chart"],
  ["redes", "Redes", "net"],
];
const PAGE = {
  builder: {
    eyebrow: NORMA.programa, h1: "Gerador de Termo de Referência e Edital",
    sub: `Ancorado na norma vigente — ${NORMA.portaria} — com o corpus histórico de ${CORPUS.length} chamadas (2023–2026).`,
  },
  corpus: {
    eyebrow: "Corpus histórico", h1: "Explorador de projetos",
    sub: `${CORPUS.length} chamadas (2023–2026) raspadas do portal IPEA — filtre, busque e reaproveite.`,
  },
  analytics: {
    eyebrow: "Inteligência do corpus", h1: "Analytics dos dados",
    sub: "O que os dados sustentam — e o que não — sobre a virada PROMOB → PIPA.",
  },
  redes: {
    eyebrow: "Dependências bayesianas", h1: "Rede entre as variáveis",
    sub: "Como modalidade, tema, função, formação, cota e diretoria se condicionam no corpus — força por informação mútua e probabilidade condicional P(alvo|origem).",
  },
};

// Ícones inline (sem dependência): traço fino, estilo produto.
const PATHS = {
  doc: "M6 2h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm7 1v4.5H18M8 13h8M8 17h6",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.6-12.6-2.1 5.1-5.1 2.1 2.1-5.1 5.1-2.1Z",
  chart: "M4 20V11M9.5 20V4M15 20v-6M20.5 20V8",
  spark: "M12 3l2 5.2L19 10l-5 1.8L12 17l-2-5.2L5 10l5-1.8L12 3Z",
  net: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 13.5l6.8 3.9M15.4 6.6 8.6 10.5",
};
export function Icon({ name, size = 16, color = "currentColor", w = 1.7 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={PATHS[name]} />
    </svg>
  );
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg, ${C.azul}, ${C.brand})`,
        display: "flex", alignItems: "center", justifyContent: "center", boxShadow: SHADOW.xs,
      }}>
        <Icon name="spark" size={18} color="#fff" w={1.6} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: C.ink, letterSpacing: "-.01em" }}>idea</span>
        <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 10.5, color: C.faint, letterSpacing: ".02em" }}>gerador IPEA</span>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("builder");
  const page = PAGE[tab];
  return (
    <div style={{ background: C.paper, minHeight: "100vh", color: C.ink, fontFamily: SANS }}>
      <style>{FONTS}{GLOBAL_CSS}</style>

      {/* top bar (produto) */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30, background: "rgba(255,255,255,.82)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: `1px solid ${C.line}`,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", height: 60, display: "flex", alignItems: "center", gap: 20 }}>
          <Logo />
          <nav style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {TABS.map(([k, l, ic]) => {
              const on = tab === k;
              return (
                <button key={k} onClick={() => setTab(k)} className={on ? "" : "lk"} style={{
                  fontFamily: SANS, fontSize: 13.5, fontWeight: on ? 600 : 500, display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 13px", borderRadius: RADIUS.sm, cursor: "pointer", border: "none",
                  background: on ? C.accentSoft : "transparent", color: on ? C.azulEscuro : C.muted,
                }}><Icon name={ic} size={15} />{l}</button>
              );
            })}
          </nav>
          <div style={{
            fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: C.muted, padding: "5px 11px",
            border: `1px solid ${C.line}`, borderRadius: RADIUS.pill, background: C.card,
          }}>norma 317/2025</div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "34px 28px 80px" }}>
        <header className="fadeUp" key={tab} style={{ marginBottom: 26 }}>
          <div style={{ fontFamily: SANS, fontSize: 11.5, letterSpacing: ".1em", color: C.azul, textTransform: "uppercase", fontWeight: 600 }}>
            {page.eyebrow}
          </div>
          <h1 style={{ fontFamily: SANS, fontSize: 30, fontWeight: 700, margin: "7px 0 6px", letterSpacing: "-.02em", color: C.ink }}>
            {page.h1}
          </h1>
          <p style={{ fontFamily: SANS, color: C.muted, margin: 0, fontSize: 15, lineHeight: 1.5, maxWidth: 760 }}>{page.sub}</p>
        </header>

        {tab === "builder" ? <BuilderView /> : tab === "corpus" ? <CorpusView /> : tab === "analytics" ? <AnalyticsView /> : <RedesView />}

        <footer style={{
          marginTop: 50, paddingTop: 18, borderTop: `1px solid ${C.line}`, fontFamily: SANS,
          fontSize: 12, color: C.faint, lineHeight: 1.7, maxWidth: 820,
        }}>
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
