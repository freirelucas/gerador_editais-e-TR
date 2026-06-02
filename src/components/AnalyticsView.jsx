import { C } from "../theme.js";
import * as S from "../lib/stats.js";
import quality from "../data/quality.json";
import { COR_PROGRAMA, MONO, SERIF } from "./charts/primitives.js";
import Bars from "./charts/Bars.jsx";
import StackedBars from "./charts/StackedBars.jsx";
import Line from "./charts/Line.jsx";
import Donut from "./charts/Donut.jsx";
import Heatmap from "./charts/Heatmap.jsx";

const corte = (s, n = 26) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

function Secao({ titulo, children }) {
  return (
    <section style={{ marginTop: 38 }}>
      <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>{titulo}</h2>
      <div style={{ borderTop: `2px solid ${C.ink}`, marginBottom: 20 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 28 }}>
        {children}
      </div>
    </section>
  );
}

function Figura({ titulo, insight, children, wide }) {
  return (
    <figure style={{ margin: 0, gridColumn: wide ? "1 / -1" : "auto" }}>
      <figcaption style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase", color: C.cerrado, fontWeight: 600 }}>{titulo}</div>
        {insight && <div style={{ fontFamily: SERIF, fontSize: 13.5, color: C.muted, fontStyle: "italic", marginTop: 3, lineHeight: 1.4 }}>{insight}</div>}
      </figcaption>
      <div style={{ background: "#ffffff", border: `1px solid ${C.line}`, borderRadius: 2, padding: "14px 16px" }}>
        {children}
      </div>
    </figure>
  );
}

export default function AnalyticsView() {
  const prov = quality.proveniencia;
  const bib = quality.biblioteca;

  const dadosPrograma = S.porPrograma.map((p) => ({ label: p.programa, value: p.total, color: COR_PROGRAMA[p.programa] }));
  const dadosSituacao = S.porSituacao.map((s) => ({ label: s.situacao, value: s.total, color: s.situacao === "ABERTA" ? C.cerrado : C.line }));
  const topCat = bib.top_categorias.map(([cat, n]) => ({ label: corte(cat), value: n }));
  const dupCat = bib.duplicacao_por_categoria.slice(0, 10).map(([cat, f]) => ({ label: corte(cat), value: Math.round(f * 100) }));
  const tamHist = Object.entries(bib.tamanho_hist).map(([b, n]) => ({ label: b === "2000" ? "2000+" : b, value: n }));
  const idioma = [
    { label: "Português", value: bib.idioma.pt, color: C.cerrado },
    { label: "Inglês", value: bib.idioma.en, color: C.terra },
  ];

  return (
    <div style={{ fontFamily: SERIF, color: C.ink }}>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: C.muted, margin: "0 0 6px", maxWidth: 760 }}>
        Análise do corpus de <b>{S.totalChamadas} chamadas</b> (2023–2026) e da biblioteca de cláusulas.
        Os dados vêm de uma raspagem do portal IPEA — começamos pelo que <i>não</i> dá para afirmar.
      </p>

      {/* ---------- QUALIDADE PRIMEIRO ---------- */}
      <Secao titulo="Qualidade & limitações dos dados">
        <Figura titulo="Completude dos campos do corpus"
          insight="modalidade (21%) e qtd. de bolsas (5%) são quase ausentes — por isso NÃO há análise de volume de bolsas nem financeira aqui.">
          <Bars data={S.completude.map((c) => ({ label: c.campo, value: c.pct }))} horizontal unit="%"
            color={(d) => (d.value < 50 ? C.terra : C.cerrado)} />
        </Figura>
        {S.flagsCount.length > 0 && (
          <Figura titulo="Sinalizações de qualidade por registro"
            insight="Anomalias detectadas e marcadas pelo pipeline (não corrigidas às cegas).">
            <Bars data={S.flagsCount.map((f) => ({ label: f.flag, value: f.total }))} horizontal color={C.terra} />
          </Figura>
        )}
        <Figura titulo="Limpeza da biblioteca de cláusulas" wide
          insight={`A semente tinha ${prov.biblioteca_antes.clausulas.toLocaleString("pt-BR")} cláusulas em ${prov.biblioteca_antes.categorias} categorias; após fundir chaves de OCR e remover duplicatas/quebras de PDF, ficaram ${prov.biblioteca_depois.clausulas.toLocaleString("pt-BR")} em ${prov.biblioteca_depois.categorias}. A semente bruta está preservada em data/raw/.`}>
          <Bars horizontal
            data={[
              { label: "categorias (antes)", value: prov.biblioteca_antes.categorias, color: C.line },
              { label: "categorias (depois)", value: prov.biblioteca_depois.categorias, color: C.cerrado },
              { label: "cláusulas (antes)", value: prov.biblioteca_antes.clausulas, color: C.line },
              { label: "cláusulas (depois)", value: prov.biblioteca_depois.clausulas, color: C.cerrado },
            ]} />
        </Figura>
      </Secao>

      {/* ---------- TEMPO E PROGRAMAS ---------- */}
      <Secao titulo="Programas ao longo do tempo">
        <Figura titulo="Programa × ano — a virada estrutural" wide
          insight="O achado mais forte: PROMOB domina 2023–2024 (90, 73) e some em 2026; PIPA só aparece em 2025 (37) e cresce. A Portaria 317/2025 converteu PROMOB/PROCIN no PIPA (Anexo II) — por isso o gerador é, corretamente, PIPA-only.">
          <StackedBars data={S.programaPorAno} xKey="ano" keys={["PROMOB", "PIPA", "PROCIN"]} cores={COR_PROGRAMA} />
        </Figura>
        <Figura titulo="Chamadas por ano"
          insight="Tendência de queda no nº de chamadas; 2026 é parcial (snapshot ~junho/2026).">
          <Line data={S.porAno.map((a) => ({ label: a.ano, value: a.total }))} />
        </Figura>
        <Figura titulo="Participação por programa"
          insight="PROMOB responde por ~76% de todo o corpus.">
          <Donut data={dadosPrograma} />
        </Figura>
      </Secao>

      {/* ---------- PRAZOS E SAZONALIDADE ---------- */}
      <Secao titulo="Prazos & sazonalidade">
        <Figura titulo="Janela de inscrição (dias)"
          insight={`Mediana de ${S.janelaMediana} dias; a maioria concentra-se entre 10 e 14 dias.`}>
          <Bars data={S.histJanela.map((h) => ({ label: h.faixa, value: h.total }))} />
        </Figura>
        <Figura titulo="Abertura de chamadas — mês × ano" wide
          insight="Quando as inscrições abrem ao longo do calendário; sem um padrão sazonal forte, com leve concentração no 1º semestre.">
          <Heatmap data={S.heatmapMesAno} />
        </Figura>
      </Secao>

      {/* ---------- CONTEÚDO ---------- */}
      <Secao titulo="Conteúdo das chamadas">
        <Figura titulo="Temas mais frequentes nos projetos"
          insight="Políticas públicas, avaliação e análise dominam — perfil de economia aplicada / políticas.">
          <Bars data={S.topTemas.map((t) => ({ label: t.tema, value: t.total }))} horizontal color={C.terra} />
        </Figura>
        <Figura titulo="Situação (snapshot)"
          insight="Atenção: situação é um retrato congelado da raspagem; as 'abertas' caducam — não use como estado ao vivo.">
          <Donut data={dadosSituacao} />
        </Figura>
      </Secao>

      {/* ---------- BIBLIOTECA ---------- */}
      <Secao titulo="Biblioteca de cláusulas">
        <Figura titulo="Categorias com mais cláusulas"
          insight="As seções recorrentes (requisitos, reserva, cronograma) aparecem em quase todas as chamadas.">
          <Bars data={topCat} horizontal />
        </Figura>
        <Figura titulo="Duplicação na semente, por categoria (%)"
          insight="Quanto de cada categoria era cópia exata antes da limpeza — várias passavam de 90%.">
          <Bars data={dupCat} horizontal unit="%" color={C.terra} />
        </Figura>
        <Figura titulo="Tamanho das cláusulas (caracteres)"
          insight={`Mediana ${bib.tamanho_resumo.mediana} · média ${bib.tamanho_resumo.media} · máx ${bib.tamanho_resumo.max.toLocaleString("pt-BR")}.`}>
          <Bars data={tamHist} />
        </Figura>
        <Figura titulo="Idioma das categorias"
          insight="Há categorias em inglês — vestígio das chamadas bilíngues do PROMOB.">
          <Donut data={idioma} />
        </Figura>
      </Secao>
    </div>
  );
}
