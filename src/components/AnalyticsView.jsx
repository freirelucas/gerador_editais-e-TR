import { C } from "../theme.js";
import * as S from "../lib/stats.js";
import quality from "../data/quality.json";
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(440px,1fr))", gap: 28 }}>
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

      {/* ---------- 3. VAGAS DE INCLUSÃO ---------- */}
      <Secao titulo="Vagas de inclusão (cotas)"
        nota={`Vagas reservadas a ação afirmativa. Das ${S.totalChamadas} chamadas, ${S.comReserva} (${S.cotaPctTotal}%) preveem reserva EXPLÍCITA — e concentram-se em PIPA 2025–2026 (ver evolução). Contamos chamadas com reserva, não o nº de vagas (não está nos editais); tema e função são multi-rótulo, somam mais que ${S.comReserva}.`}>
        <Figura titulo="Chamadas com reserva — por categoria (nº)"
          insight={`Magnitude entre as ${S.comReserva} chamadas com reserva: ${S.porCotaPct.map((d) => `${d.label} ${d.n} (${d.value}%)`).join(", ")}. Indígena é citado à parte, mas na 317 entra na cota étnico-racial.`}>
          <Bars data={S.porCotaPct.map((d) => ({ label: d.label, value: d.n }))} horizontal color={C.cerrado} />
        </Figura>
        <Figura titulo="Chamadas com reserva — por ano (nº e %)"
          insight={`A reserva era ~ausente até 2024 e salta com a 317/2025 (abr): ${S.cotaPorAnoPct.map((a) => `${a.ano} ${a.comReserva}/${a.total} (${a.pct}%)`).join(" · ")}. Mudança de regime, não tendência suave.`}>
          <Bars data={S.cotaPorAnoPct.map((a) => ({ label: a.ano, value: a.comReserva }))}
            color={(d) => (d.label >= "2025" ? C.cerrado : C.line)} />
        </Figura>
        <Figura titulo="Quais TEMAS reservam mais (nº de chamadas)" wide
          insight={`A inclusão se concentra em temas sociais: ${S.reservaPorTema.slice(0, 3).map((t) => `${t.label} ${t.value}`).join(", ")}… É onde a reserva de vagas mais aparece.`}>
          <Bars data={S.reservaPorTema} horizontal color={C.cerrado} />
        </Figura>
        <Figura titulo="Quais FUNÇÕES reservam mais (nº de chamadas)"
          insight={`Por função pedida: ${S.reservaPorFuncao.map((f) => `${f.label} ${f.value}`).join(", ")}.`}>
          <Bars data={S.reservaPorFuncao} horizontal color={C.cerrado} />
        </Figura>
        <Figura titulo="Quais DIRETORIAS reservam mais (nº de chamadas)"
          insight={`Cuidado: a diretoria só foi extraída em ${S.comReserva - S.reservaDiretoriaSem} das ${S.comReserva} (${S.reservaDiretoriaSem} não identificadas) — entre as identificadas, distribui-se por igual entre as diretorias econômicas/sociais. Sinal fraco, leia com cautela.`}>
          <Bars data={S.reservaPorDiretoria} horizontal color={C.cerrado} />
        </Figura>
      </Secao>

      {/* ---------- 4. CONFORMIDADE ---------- */}
      <Secao titulo="Conformidade — Portaria 317/2025"
        nota={`A Portaria Normativa Ipea nº 317 (18/04/2025) criou o PIPA e o quadro padrão de reserva AC/ER/M/PCD + heteroidentificação, citado por todos os editais PIPA. Só se mede no PIPA: PROMOB e PROCIN são programas anteriores que a 317 revogou/converteu — não os rege. Duas faces: a adesão estrutural (o quadro aparece) e, onde o edital traz a tabela numérica (3.1), a fração REAL de vagas reservadas — esta lida diretamente do texto dos editais.`}>
        <Figura titulo="Adesão ao quadro de reserva no PIPA — por ano (% dos editais analisados)"
          insight={`Fração dos editais PIPA analisados que trazem o quadro AC/ER/M/PCD: ${S.adesaoPipaPorAno.map((a) => `${a.ano} ${a.pct}% (${a.comReserva}/${a.analisados})`).join(" · ")}. O quadro se consolida ano a ano — não é universal porque o edital de vaga única costuma citá-lo sem aplicar split.`}>
          <Bars data={S.adesaoPipaPorAno.map((a) => ({ label: a.ano, value: a.pct }))} horizontal unit="%" color={C.azul} />
        </Figura>
        <Figura titulo="Vagas reservadas no PIPA — % do total de vagas (medido no quadro)"
          insight={`Lido do quadro numérico (seção 3.1) de ${S.vagasPipaQuadro.n} editais PIPA: ${S.vagasPipaQuadro.reservadas} de ${S.vagasPipaQuadro.total} vagas são reservadas (${S.vagasPipaQuadro.pct}%); o resto é ampla concorrência. Por categoria do total: ${S.vagasPipaQuadro.porCategoriaPct.map((c) => `${c.label} ${c.value}% (${c.n})`).join(", ")}. A norma fixa 30/40/10, mas a aplicação real difere — a reserva de PcD não foi acionada. Salto por ano: ${S.vagasPipaQuadro.porAno.map((a) => `${a.ano} ${a.pct}%`).join(" · ")}.`}>
          <Bars data={S.vagasPipaQuadro.porCategoriaPct} horizontal unit="%" color={C.cerrado} />
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
