import { C } from "../theme.js";
import * as S from "../lib/stats.js";
import quality from "../data/quality.json";
import { COR_PROGRAMA, PALETA, MONO, SERIF } from "./charts/primitives.js";
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
  const enr = quality.enriquecimento || {};
  const coberturaData = [
    { label: "com texto (PDF)", value: enr.com_texto },
    { label: "objeto", value: enr.objeto },
    { label: "papel/modalidade", value: enr.papel },
    { label: "formação", value: enr.formacao },
    { label: "requisitos", value: enr.requisitos },
    { label: "diretoria", value: enr.diretoria },
    { label: "função (classif.)", value: enr.categoria_funcao },
    { label: "tema (classif.)", value: enr.categoria_tema },
  ];
  const coresFunc = Object.fromEntries(S.funcoesLabels.map((f, i) => [f, PALETA[i % PALETA.length]]));
  const projNota = S.projParcial
    ? ` 2026 é parcial (até ${S.refDate}); o projetado é pró-rata linear (real ÷ fração do ano decorrida ≈ ${Math.round(S.fracAnoCorr * 100)}%).`
    : "";

  return (
    <div style={{ fontFamily: SERIF, color: C.ink }}>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: C.muted, margin: "0 0 6px", maxWidth: 760 }}>
        Análise do corpus de <b>{S.totalChamadas} chamadas</b> (2023–2026), agora <b>enriquecido</b> com
        campos extraídos dos PDFs dos editais (objeto, perfil, formação, diretoria, tema). Os dados vêm de
        uma raspagem do portal IPEA — começamos pelo que <i>não</i> dá para afirmar.
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
        <Figura titulo="Cobertura do enriquecimento (extraído dos PDFs)" wide
          insight={`De ${enr.total} chamadas, ${enr.com_texto} tiveram texto utilizável (${enr.texto_curto} eram PDFs curtos/escaneados, ${enr.pdf_404 || 0} indisponíveis). Tudo é máquina-extraído e imperfeito — a diretoria é o campo mais esparso e fica explícito quando ausente.`}>
          <Bars data={coberturaData} horizontal color={C.cerrado} />
        </Figura>
      </Secao>

      {/* ---------- TEMPO E PROGRAMAS ---------- */}
      <Secao titulo="Programas ao longo do tempo">
        <Figura titulo="Programa × ano — a virada estrutural" wide
          insight={"PROMOB domina 2023–2024 (90, 73) e some em 2026; PIPA cresce. A Portaria 317/2025 converteu PROMOB/PROCIN no PIPA — por isso o gerador é PIPA-only. A fatia hachurada de 2026 é o projetado." + projNota}>
          <StackedBars data={S.programaPorAnoProj} xKey="ano" keys={["PROMOB", "PIPA", "PROCIN"]} cores={COR_PROGRAMA} projected />
        </Figura>
        <Figura titulo="Chamadas por ano — real e projetado"
          insight={"Tendência de queda no nº de chamadas." + (projNota || " 2026 é parcial.")}>
          <Line data={S.porAnoProjetado.map((a) => ({ label: a.ano, value: a.total }))}
            projected={S.porAnoProjetado.map((a) => a.projetado)} />
        </Figura>
        <Figura titulo="Participação por programa"
          insight="PROMOB responde por ~76% de todo o corpus.">
          <Donut data={dadosPrograma} />
        </Figura>
      </Secao>

      {/* ---------- PERFIS SOLICITADOS ---------- */}
      <Secao titulo="Perfis solicitados nas chamadas">
        <Figura titulo="Função do perfil (classificação)"
          insight="São perfis SOLICITADOS pelas chamadas — não há dados de contratação/resultado no acervo. Classificação por regras sobre objeto+requisitos (taxonomia editável em data/taxonomia.json).">
          <Bars data={S.porFuncao} horizontal />
        </Figura>
        <Figura titulo="Função × ano"
          insight="Como a composição de perfis pedidos evolve no tempo (multi-rótulo, então as séries podem somar mais que o total de chamadas).">
          <StackedBars data={S.perfilPorAno} xKey="ano" keys={S.funcoesLabels} cores={coresFunc} />
        </Figura>
        <Figura titulo="Papel/modalidade pedido por seleção" wide
          insight="Papel nomeado em cada seleção do edital — oficial (PIPA) e legado (PROMOB). Variantes de acento/caixa foram agrupadas; só os 8 nomes oficiais entram em modalidade_canonica.">
          <Bars data={S.porPapel} horizontal />
        </Figura>
        <Figura titulo="Formação exigida"
          insight="Titulação mínima citada nos requisitos (multi-rótulo).">
          <Bars data={S.porFormacao} horizontal color={C.gold} />
        </Figura>
      </Secao>

      {/* ---------- DIRETORIA & TEMAS ---------- */}
      <Secao titulo="Diretoria & temas">
        <Figura titulo="Chamadas por diretoria (substantiva)"
          insight={`Diretoria de pesquisa identificada no texto em ${enr.diretoria}/${enr.total} chamadas — a DIDES (que aprova o programa) é excluída por aparecer em quase todas. As 'não identificadas' ficam explícitas, não imputadas.`}>
          <Bars data={S.porDiretoria} horizontal />
        </Figura>
        <Figura titulo="Temas / domínios (classificação)"
          insight="Domínio temático por regras sobre objeto+projeto+requisitos — complementa os 'temas' lexicais brutos da seção de conteúdo.">
          <Bars data={S.porTema} horizontal color={C.gold} />
        </Figura>
      </Secao>

      {/* ---------- RESERVA DE VAGAS (COTAS) ---------- */}
      <Secao titulo="Reserva de vagas (cotas)">
        <Figura titulo="Reserva por categoria — nº de chamadas"
          insight={`${S.comReserva} de ${S.totalChamadas} chamadas preveem reserva EXPLÍCITA de vagas (menção a reserva/cota/ação afirmativa no edital). É presença por categoria — não o nº de vagas: o quadro AC/ER/M/PCD varia demais entre editais para extrair com confiança.`}>
          <Bars data={S.porCota} horizontal color={C.cerrado} />
        </Figura>
        <Figura titulo="Reserva por ano — institucionalização com o PIPA"
          insight="Quase ausente até 2024; salta em 2025–2026, quando o PIPA passa a padronizar a reserva de vagas nas chamadas.">
          <Bars data={S.cotaPorAno.map((a) => ({ label: a.ano, value: a.total }))} />
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
