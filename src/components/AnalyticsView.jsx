import { C } from "../theme.js";
import * as S from "../lib/stats.js";
import quality from "../data/quality.json";
import { NORMA } from "../data/norma.js";
import { COR_PROGRAMA, MONO, SERIF } from "./charts/primitives.js";
import Bars from "./charts/Bars.jsx";
import StackedBars from "./charts/StackedBars.jsx";
import Line from "./charts/Line.jsx";
import Donut from "./charts/Donut.jsx";
import SerieMensal from "./charts/SerieMensal.jsx";

function Secao({ titulo, nota, children }) {
  return (
    <section style={{ marginTop: 38 }}>
      <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>{titulo}</h2>
      <div style={{ borderTop: `2px solid ${C.ink}`, marginBottom: nota ? 12 : 20 }} />
      {nota && <p style={{ fontFamily: SERIF, fontSize: 14, color: C.muted, margin: "0 0 18px", maxWidth: 760, lineHeight: 1.5 }}>{nota}</p>}
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
  const enr = quality.enriquecimento || {};
  const dadosPrograma = S.porPrograma.map((p) => ({ label: p.programa, value: p.total, color: COR_PROGRAMA[p.programa] }));
  const reservaNorma = [
    { label: "Étnico-racial", value: NORMA.reserva.etnico_racial },
    { label: "Mulheres", value: NORMA.reserva.mulheres },
    { label: "PCD", value: NORMA.reserva.pcd },
  ];
  const projNota = S.projParcial
    ? ` 2026 é parcial (até ${S.refDate}); o projetado é pró-rata linear (real ÷ fração do ano ≈ ${Math.round(S.fracAnoCorr * 100)}%).`
    : "";

  return (
    <div style={{ fontFamily: SERIF, color: C.ink }}>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: C.muted, margin: "0 0 6px", maxWidth: 800 }}>
        Corpus de <b>{S.totalChamadas} chamadas</b> (2023–2026) raspadas do portal IPEA e enriquecidas com campos
        extraídos dos PDFs. <b>A história em uma frase:</b> o <b>PROMOB</b> dominou até 2024; a <b>Portaria Normativa
        Ipea nº 317/2025</b> o converteu no <b>PIPA</b> — e com o PIPA veio a <b>reserva de vagas</b>. O que os dados
        <i> não</i> sustentam está na nota de procedência ao final.
      </p>

      {/* ---------- 1. A VIRADA ---------- */}
      <Secao titulo="A virada PROMOB → PIPA">
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
          insight="PROMOB responde por ~76% de todo o corpus — o acervo histórico é, em essência, PROMOB.">
          <Donut data={dadosPrograma} />
        </Figura>
      </Secao>

      {/* ---------- 2. O QUE PEDEM ---------- */}
      <Secao titulo="O que as chamadas pedem"
        nota="Perfis SOLICITADOS pelas chamadas — não há dados de contratação/resultado no acervo. Classificação por regras sobre objeto+requisitos (taxonomia editável em data/taxonomia.json); rótulos múltiplos podem somar mais que o total.">
        <Figura titulo="Função do perfil (classificação)"
          insight="O que a chamada quer que a pessoa faça — derivado de objeto+requisitos.">
          <Bars data={S.porFuncao} horizontal />
        </Figura>
        <Figura titulo="Formação exigida"
          insight="Titulação mínima citada nos requisitos (multi-rótulo).">
          <Bars data={S.porFormacao} horizontal color={C.gold} />
        </Figura>
        <Figura titulo="Papel/modalidade pedido por seleção" wide
          insight="Papel nomeado em cada seleção do edital — oficial (PIPA) e legado (PROMOB). Variantes de acento/caixa foram agrupadas; só os 8 nomes oficiais entram em modalidade_canonica.">
          <Bars data={S.porPapel} horizontal />
        </Figura>
        <Figura titulo="Temas / domínios (classificação)"
          insight="Domínio temático por regras sobre objeto+projeto+requisitos — políticas públicas e avaliação dominam.">
          <Bars data={S.porTema} horizontal color={C.gold} />
        </Figura>
      </Secao>

      {/* ---------- 3. COTAS & CONFORMIDADE ---------- */}
      <Secao titulo="Cotas & conformidade — Portaria 317/2025"
        nota={`A Portaria Normativa Ipea nº 317, de 18/04/2025 — citada por todos os editais PIPA — criou o PIPA e o quadro padrão de reserva AC/ER/M/PCD + heteroidentificação. Só ${S.comReserva} de ${S.totalChamadas} chamadas (${S.cotaPctTotal}%) preveem reserva EXPLÍCITA, mas essa média global engana: ela mistura a era PROMOB, sem o quadro, com a era PIPA.`}>
        <Figura titulo="Reserva de vagas por ano — % das chamadas" wide
          insight={`A reserva era ~ausente até 2024 e salta com a 317/2025 (abr): ${S.cotaPorAnoPct.map((a) => `${a.ano} ${a.pct}%`).join(" · ")}. O degrau coincide com a entrada da portaria — não é tendência suave, é mudança de regime.`}>
          <Bars data={S.cotaPorAnoPct.map((a) => ({ label: a.ano, value: a.pct }))} unit="%"
            color={(d) => (d.label >= "2025" ? C.cerrado : C.line)} />
        </Figura>
        <Figura titulo="Adesão ao quadro de reserva — por programa (% dos analisados)"
          insight={`Conformidade ESTRUTURAL: o quadro aparece onde a 317 vale. ${S.cotaPorPrograma.map((p) => `${p.programa} ${p.pct}% (${p.comReserva}/${p.analisados})`).join("; ")}. Heteroidentificação em ${S.comHetero} chamadas — todas ${S.heteroProgramas.join("/")}.`}>
          <Bars data={S.cotaPorPrograma.map((p) => ({ label: p.programa, value: p.pct, color: COR_PROGRAMA[p.programa] }))} horizontal unit="%" />
        </Figura>
        <Figura titulo="Categorias citadas — % das chamadas com reserva"
          insight={`PRESENÇA da categoria entre as ${S.comReserva} com reserva (o edital cita o grupo), não a fatia de vagas: étnico-racial/mulheres/PCD são quase universais; indígena é citado à parte, mas na 317 entra na cota étnico-racial.`}>
          <Bars data={S.porCotaPct.map((d) => ({ label: d.label, value: d.value }))} horizontal unit="%" color={C.cerrado} />
        </Figura>
        <Figura titulo="Reserva exigida pela 317 — % do total de vagas"
          insight={`A portaria FIXA o percentual de reserva sobre o TOTAL de vagas: étnico-racial ${NORMA.reserva.etnico_racial}% (pretos, pardos e indígenas), mulheres ${NORMA.reserva.mulheres}%, PCD ${NORMA.reserva.pcd}%. Eixo distinto do gráfico ao lado — lá é a presença no texto; aqui, a fatia de vagas que a norma manda reservar. Como é fixa, o edital conforme aplica esse split; o corpus não guarda nº de vagas por categoria, então um desvio numérico edital-a-edital não é detectável aqui.`}>
          <Bars data={reservaNorma} horizontal unit="%" color={C.gold} />
        </Figura>
      </Secao>

      {/* ---------- 4. SAZONALIDADE ---------- */}
      <Secao titulo="Sazonalidade & prazos">
        <Figura titulo="Aberturas por mês — série temporal" wide
          insight={`Volume por mês de abertura das inscrições (${S.serieMensalCobertura}/${S.totalChamadas} com data): a tendência de queda e a sazonalidade aparecem no detalhe mensal; as linhas tracejadas marcam a virada de ano.`}>
          <SerieMensal data={S.serieMensal} />
        </Figura>
        <Figura titulo="Janela de inscrição (dias)"
          insight={`Mediana de ${S.janelaMediana} dias; a maioria concentra-se entre 10 e 14 dias.`}>
          <Bars data={S.histJanela.map((h) => ({ label: h.faixa, value: h.total }))} />
        </Figura>
      </Secao>

      {/* ---------- 5. PROCEDÊNCIA (apêndice) ---------- */}
      <Secao titulo="Procedência & limitações">
        <Figura titulo="Completude dos campos do corpus" wide
          insight={`${S.totalChamadas} chamadas raspadas do portal IPEA; ${enr.com_texto} com texto de PDF utilizável (${enr.texto_curto} curtos/escaneados, ${enr.pdf_404 || 0} indisponíveis). Tudo é máquina-extraído e o que falta fica explícito — modalidade (21%) e nº de bolsas (5%) são esparsos demais para sustentar análise de volume/financeira. A biblioteca de cláusulas foi de ${prov.biblioteca_antes.clausulas.toLocaleString("pt-BR")} para ${prov.biblioteca_depois.clausulas.toLocaleString("pt-BR")} após fundir chaves de OCR e remover duplicatas. Situação das chamadas é um snapshot da raspagem — não use como estado ao vivo.`}>
          <Bars data={S.completude.map((c) => ({ label: c.campo, value: c.pct }))} horizontal unit="%"
            color={(d) => (d.value < 50 ? C.terra : C.cerrado)} />
        </Figura>
      </Secao>
    </div>
  );
}
