import { useState, useMemo } from "react";
import { C, SANS } from "../theme.js";
import { MODALIDADES } from "../data/modalidades.js";
import { fmtValor } from "../lib/format.js";
import { buildTR, buildEdital, minutaToText } from "../lib/minuta.js";
import { conformidade, resumoConf, diffDias } from "../lib/conformidade.js";
import { downloadDoc } from "../lib/docExport.js";
import { FUNCOES, TEMAS, enfasesDe, recortesDe } from "../data/perfis.js";
import { comporPerfil, comporAtividades, comporObjeto, sugerirCriterios } from "../lib/perfil.js";
import { DIRETORIAS, DIRETORIA_TEMA, PADRAO_DIRETORIA, rotuloUnidade } from "../data/diretorias.js";
import { exemplosPorTema } from "../data/objetos.js";

const STEPS = ["Identificação", "Projeto", "Bolsa", "Perfil", "Vagas & cotas", "Seleção", "Cronograma", "Conformidade & exportar"];
const SEVC = { ok: "#3f7d54", warn: C.gold, err: "#c0392b", info: C.azul };
const SEVI = { ok: "✓", warn: "!", err: "✕", info: "ℹ" };

export default function BuilderView() {
  const [doc, setDoc] = useState("tr"); // "tr" | "edital"
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    numero: "", diretoriaSel: PADRAO_DIRETORIA, unidade: rotuloUnidade(PADRAO_DIRETORIA),
    coordenador: "", projetoNome: "", projeto: "", perfil: "",
    temas: [DIRETORIA_TEMA[PADRAO_DIRETORIA]], funcoes: [], enfases: [], recortes: [], experiencia: "",
    modalidade: MODALIDADES[0].nome, qtd: "1", cadastroReserva: false, reservaVagas: "",
    cotasOn: false, cotaER: "0", cotaM: "0", cotaPCD: "0", heteroident: false, fundamentoCotas: "",
    duracaoBolsa: "12", duracaoPesquisa: "12", atividades: "", criterios: "",
    cartaIntencoes: false, comissao: "", diretoria: "",
    dataPub: "", inscIni: "", inscFim: "", resultado: "", inicio: "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setVal = (k, v) => setF({ ...f, [k]: v });
  const toggle = (k) => (e) => setF({ ...f, [k]: e.target.checked });
  const toggleIn = (k, v) => setF((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));
  // Escolher a diretoria otimiza o fluxo: pré-seleciona o tema da área e preenche o cabeçalho.
  const setDiretoria = (sigla) => setF((p) => ({
    ...p, diretoriaSel: sigla,
    temas: DIRETORIA_TEMA[sigla] ? [DIRETORIA_TEMA[sigla]] : p.temas,
    unidade: rotuloUnidade(sigla) || p.unidade,
  }));

  const minuta = useMemo(() => (doc === "tr" ? buildTR(f) : buildEdital(f)), [f, doc]);
  const conf = useMemo(() => conformidade(f), [f]);
  const resumo = resumoConf(conf);

  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(minutaToText(minuta));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  const nomeArq = (ext) => {
    const pref = doc === "tr" ? "TR_PIPA" : "Chamada_PIPA";
    return `${pref}_${(f.numero || "minuta").replace(/\//g, "-")}.${ext}`;
  };
  const dlTxt = () => {
    const blob = new Blob([minutaToText(minuta)], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nomeArq("txt");
    a.click();
  };
  const dlDoc = () => {
    const titulo = doc === "tr" ? "Termo de Referência — PIPA" : "Chamada Pública — PIPA";
    downloadDoc(minuta, titulo, nomeArq("doc"));
  };

  const inp = {
    fontFamily: SANS, fontSize: 14, padding: "8px 10px", background: C.card,
    border: `1px solid ${C.line}`, color: C.ink, borderRadius: 3, outline: "none",
    width: "100%", boxSizing: "border-box",
  };
  const lab = {
    fontFamily: SANS, fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase",
    color: C.muted, marginBottom: 4, display: "block", fontWeight: 600,
  };
  const Field = ({ l, children }) => (<div><label style={lab}>{l}</label>{children}</div>);
  const Check = ({ k, l }) => (
    <label style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: SANS, fontSize: 13, color: C.ink, cursor: "pointer" }}>
      <input type="checkbox" checked={f[k]} onChange={toggle(k)} style={{ accentColor: C.azul, width: 15, height: 15 }} />
      {l}
    </label>
  );
  const chipStyle = (on) => ({
    fontFamily: SANS, fontSize: 12, padding: "5px 11px", borderRadius: 14, cursor: "pointer", fontWeight: 600,
    background: on ? C.azul : C.card, color: on ? "#fff" : C.ink, border: `1px solid ${on ? C.azul : C.line}`,
  });
  const ChipsMulti = ({ campo, opcoes }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {opcoes.map((o) => (
        <button key={o} type="button" onClick={() => toggleIn(campo, o)} style={chipStyle(f[campo].includes(o))}>{o}</button>
      ))}
    </div>
  );
  // Exemplos REAIS de projetos PIPA do(s) tema(s) selecionado(s) — ponto de partida editável.
  const ExemplosPipa = ({ temas, onUsar }) => {
    const ex = exemplosPorTema(temas);
    if (!ex.length) return null;
    return (
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 6, padding: "9px 11px", background: C.card }}>
        <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", color: C.muted, marginBottom: 7 }}>
          EXEMPLOS REAIS DE PROJETOS PIPA · {temas.join(" · ")}
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {ex.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
              <button type="button" onClick={() => onUsar(e.proposito)} style={{ ...compBtn, flexShrink: 0, padding: "3px 9px" }}>usar</button>
              <div style={{ fontFamily: SANS, fontSize: 12, color: C.ink, lineHeight: 1.4 }}>
                <b>{e.projeto}</b> <span style={{ color: C.muted }}>— {e.proposito.slice(0, 104)}… <i>({e.fonte})</i></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  const compBtn = {
    fontFamily: SANS, fontSize: 11.5, fontWeight: 700, letterSpacing: ".03em", padding: "7px 12px",
    borderRadius: 3, cursor: "pointer", background: C.abertaBg, color: C.azulEscuro, border: `1px solid ${C.azul}`,
    justifySelf: "start",
  };
  const mod = MODALIDADES.find((m) => m.nome === f.modalidade);
  const q = parseInt(f.qtd) || 1;
  const reservaLive = (parseInt(f.cotaER) || 0) + (parseInt(f.cotaM) || 0) + (parseInt(f.cotaPCD) || 0);
  const acLive = Math.max(q - reservaLive, 0);
  const dInsc = diffDias(f.inscIni, f.inscFim);

  const btn = (primary) => ({
    fontFamily: SANS, fontSize: 12, letterSpacing: ".04em", textTransform: "uppercase",
    padding: "8px 14px", borderRadius: 3, cursor: "pointer", fontWeight: 600,
    background: primary ? C.azul : "transparent", color: primary ? "#fff" : C.ink,
    border: primary ? "none" : `1px solid ${C.ink}`,
  });

  function stepBody() {
    switch (step) {
      case 0: return (<>
        <Field l="Diretoria (área de pesquisa) — pré-seleciona o tema e prioriza sugestões da área">
          <select style={inp} value={f.diretoriaSel} onChange={(e) => setDiretoria(e.target.value)}>
            {DIRETORIAS.map((d) => <option key={d.sigla} value={d.sigla}>{d.sigla} — {d.nome}</option>)}
          </select>
        </Field>
        <Field l="Nº da chamada / TR"><input style={inp} placeholder="020/2026" value={f.numero} onChange={set("numero")} /></Field>
        <Field l="Unidade responsável (preenchida pela diretoria; edite p/ coordenação específica)">
          <input style={inp} placeholder="Diretoria / unidade responsável" value={f.unidade} onChange={set("unidade")} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          <Field l="Coordenação do projeto"><input style={inp} placeholder="Nome do coordenador" value={f.coordenador} onChange={set("coordenador")} /></Field>
          <Field l="Diretor(a) que assina o TR"><input style={inp} placeholder="Nome do(a) diretor(a)" value={f.diretoria} onChange={set("diretoria")} /></Field>
        </div>
      </>);
      case 1: return (<>
        <Field l="Tema / domínio do projeto — escolha um ou mais">
          <ChipsMulti campo="temas" opcoes={TEMAS} />
        </Field>
        <Field l="Nome do projeto — entra na fórmula do objeto">
          <input style={inp} placeholder="Ex.: Macroeconomia sob incerteza forte" value={f.projetoNome} onChange={set("projetoNome")} />
        </Field>
        <Field l="Definição do projeto de pesquisa">
          <textarea style={{ ...inp, minHeight: 120, resize: "vertical" }} placeholder="Objeto, justificativa e objetivos do projeto…" value={f.projeto} onChange={set("projeto")} />
          <div style={{ marginTop: 6 }}>
            <button type="button" style={compBtn} onClick={() => setVal("projeto", comporObjeto({ projetoNome: f.projetoNome }))}>
              ✦ Compor objeto (estrutura real PIPA)
            </button>
          </div>
        </Field>
        <ExemplosPipa temas={f.temas} onUsar={(p) => setVal("projeto", p)} />
      </>);
      case 2: return (<>
        <Field l="Modalidade da bolsa (Portaria 317/2025)">
          <select style={inp} value={f.modalidade} onChange={set("modalidade")}>
            {MODALIDADES.map((m) => <option key={m.nome}>{m.nome}</option>)}
          </select>
        </Field>
        {mod && (
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.azul, marginTop: -6, lineHeight: 1.55 }}>
            valor mensal: <b>{fmtValor(mod.valor, mod.moeda)}</b> · Anexo I<br />
            formação: <b>{mod.formacao}</b><br />
            <span style={{ color: C.muted }}>requisito (Art. 4º): {mod.requisito}</span>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 13 }}>
          <Field l="Qtd. bolsas"><input style={inp} type="number" min="1" value={f.qtd} onChange={set("qtd")} /></Field>
          <Field l="Bolsa (meses)"><input style={inp} type="number" min="1" value={f.duracaoBolsa} onChange={set("duracaoBolsa")} /></Field>
          <Field l="Pesquisa (meses)"><input style={inp} type="number" min="1" value={f.duracaoPesquisa} onChange={set("duracaoPesquisa")} /></Field>
        </div>
        <Check k="cadastroReserva" l="Prever cadastro reserva (Art. 9º, §2º)" />
      </>);
      case 3: return (<>
        <Field l="Função do perfil — o que a pessoa vai fazer (uma ou mais)">
          <ChipsMulti campo="funcoes" opcoes={FUNCOES} />
        </Field>
        {enfasesDe(f.funcoes).length > 0 && (
          <Field l="Ênfases técnicas (vocabulário real do corpus PIPA) — opcional">
            <ChipsMulti campo="enfases" opcoes={enfasesDe(f.funcoes)} />
          </Field>
        )}
        {recortesDe(f.temas).length > 0 && (
          <Field l="Recortes temáticos (do corpus) — opcional">
            <ChipsMulti campo="recortes" opcoes={recortesDe(f.temas)} />
          </Field>
        )}
        <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.azul, lineHeight: 1.5 }}>
          formação (da modalidade): <b>{mod ? mod.formacao : "—"}</b>
          {f.temas.length > 0 && <><br />temas: <b>{f.temas.join(", ")}</b></>}
        </div>
        <Field l="Experiência / habilidades desejáveis — opcional">
          <input style={inp} placeholder="Ex.: experiência com Stata/R/Python; publicações na área…" value={f.experiencia} onChange={set("experiencia")} />
        </Field>
        <button type="button" style={compBtn}
          onClick={() => setVal("perfil", comporPerfil({ modalidade: f.modalidade, funcoes: f.funcoes, temas: f.temas, experiencia: f.experiencia, enfases: f.enfases, recortes: f.recortes }))}>
          ✦ Compor perfil a partir das escolhas
        </button>
        <Field l="Perfil do bolsista desejado (editável)">
          <textarea style={{ ...inp, minHeight: 110, resize: "vertical" }} placeholder="Use ‘Compor perfil’ acima, ou escreva livremente…" value={f.perfil} onChange={set("perfil")} />
        </Field>
      </>);
      case 4: return (<>
        <Field l="Público-alvo / reserva de vagas (Art. 25) — texto livre, opcional">
          <input style={inp} placeholder="Ex.: prioridade a pesquisadores de instituições do Norte/Nordeste…" value={f.reservaVagas} onChange={set("reservaVagas")} />
        </Field>
        <Check k="cotasOn" l="Prever reserva de vagas por cota (quadro AC/ER/M/PCD)" />
        {f.cotasOn && (<>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 13 }}>
            <Field l="Étnico-racial (ER)"><input style={inp} type="number" min="0" value={f.cotaER} onChange={set("cotaER")} /></Field>
            <Field l="Mulheres (M)"><input style={inp} type="number" min="0" value={f.cotaM} onChange={set("cotaM")} /></Field>
            <Field l="PCD"><input style={inp} type="number" min="0" value={f.cotaPCD} onChange={set("cotaPCD")} /></Field>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: reservaLive > q ? "#c0392b" : C.azul }}>
            ampla concorrência (AC): <b>{acLive}</b> · reservadas: <b>{reservaLive}</b> · total: <b>{q}</b>
            {reservaLive > q && <span style={{ fontWeight: 600 }}> — excede o total de vagas</span>}
          </div>
          <Check k="heteroident" l="Exigir procedimento de heteroidentificação" />
          <Field l="Fundamento legal das cotas — opcional">
            <input style={inp} placeholder="Ex.: Lei nº 12.990/2014; Decreto nº 9.508/2018…" value={f.fundamentoCotas} onChange={set("fundamentoCotas")} />
          </Field>
        </>)}
      </>);
      case 5: return (<>
        <Field l="Atividades a desenvolver">
          <textarea style={{ ...inp, minHeight: 88, resize: "vertical" }} placeholder="Atividades de pesquisa do bolsista…" value={f.atividades} onChange={set("atividades")} />
          <div style={{ marginTop: 6 }}>
            <button type="button" style={compBtn}
              onClick={() => setVal("atividades", comporAtividades({ funcoes: f.funcoes, temas: f.temas }))}>
              ✦ Compor atividades (das funções do perfil)
            </button>
          </div>
        </Field>
        <Field l="Critérios de seleção">
          <textarea style={{ ...inp, minHeight: 96, resize: "vertical" }} placeholder="Em branco usa o critério-padrão da norma; ou gere pelos critérios reais da modalidade…" value={f.criterios} onChange={set("criterios")} />
          <div style={{ marginTop: 6 }}>
            <button type="button" style={compBtn} onClick={() => setVal("criterios", sugerirCriterios({ modalidade: f.modalidade, funcoes: f.funcoes }))}>
              ✦ Sugerir critérios (padrão real da modalidade)
            </button>
          </div>
        </Field>
        <Check k="cartaIntencoes" l="Exigir carta de intenções (Art. 8º, §1º)" />
        <Field l="Composição da comissão julgadora — opcional">
          <textarea style={{ ...inp, minHeight: 56, resize: "vertical" }} placeholder="Em branco usa a composição-padrão (mín. 3 + 1 suplente, Art. 9º)…" value={f.comissao} onChange={set("comissao")} />
        </Field>
      </>);
      case 6: return (<>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          <Field l="Publicação"><input style={inp} type="date" value={f.dataPub} onChange={set("dataPub")} /></Field>
          <Field l="Início atividades"><input style={inp} type="date" value={f.inicio} onChange={set("inicio")} /></Field>
          <Field l="Inscrição início"><input style={inp} type="date" value={f.inscIni} onChange={set("inscIni")} /></Field>
          <Field l="Inscrição fim"><input style={inp} type="date" value={f.inscFim} onChange={set("inscFim")} /></Field>
          <Field l="Resultado"><input style={inp} type="date" value={f.resultado} onChange={set("resultado")} /></Field>
        </div>
        {dInsc != null && (
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: dInsc >= 10 ? "#3f7d54" : "#c0392b", fontWeight: 600 }}>
            prazo de inscrição: {dInsc} dia(s) {dInsc >= 10 ? "✓" : "✕ abaixo do mínimo de 10 (Art. 8º, §4º)"}
          </div>
        )}
      </>);
      case 7: return (<>
        <div style={{ display: "flex", gap: 14, fontFamily: SANS, fontSize: 12.5, fontWeight: 600 }}>
          <span style={{ color: SEVC.ok }}>✓ {resumo.ok} ok</span>
          <span style={{ color: SEVC.warn }}>! {resumo.warn} avisos</span>
          <span style={{ color: SEVC.err }}>✕ {resumo.err} erros</span>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {conf.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", fontFamily: SANS, fontSize: 13 }}>
              <span style={{ color: SEVC[c.sev], fontWeight: 800, width: 12, flexShrink: 0 }}>{SEVI[c.sev]}</span>
              <div><b>{c.label}</b> <span style={{ color: C.muted }}>— {c.detail}</span></div>
            </div>
          ))}
        </div>
        <button onClick={dlDoc} style={{ ...btn(true), padding: "11px 16px", fontSize: 12.5, marginTop: 4 }}>
          ⬇ Baixar Word (.doc) — {doc === "tr" ? "Termo de Referência" : "Minuta de Chamada"}
        </button>
        <div style={{ fontFamily: SANS, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
          Rascunho de trabalho — revisão jurídica obrigatória antes da publicação no SEI/DOU.
        </div>
      </>);
      default: return null;
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(330px,420px) 1fr", gap: 26, alignItems: "start" }}>
      {/* ---------- WIZARD ---------- */}
      <div style={{ display: "grid", gap: 14, position: "sticky", top: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              fontFamily: SANS, fontSize: 11, padding: "5px 9px", borderRadius: 3, cursor: "pointer", fontWeight: 600,
              background: step === i ? C.azul : C.card, color: step === i ? "#fff" : C.muted,
              border: `1px solid ${step === i ? C.azul : C.line}`,
            }}>{i + 1}. {s}</button>
          ))}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderTop: `3px solid ${C.azul}`, borderRadius: 3, padding: "18px 18px 20px" }}>
          <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 700, color: C.azulEscuro, marginBottom: 14 }}>
            Passo {step + 1} de {STEPS.length} · {STEPS[step]}
          </div>
          <div style={{ display: "grid", gap: 13 }}>{stepBody()}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}
            style={{ ...btn(false), opacity: step === 0 ? 0.4 : 1, cursor: step === 0 ? "default" : "pointer" }}>← Voltar</button>
          {step < STEPS.length - 1
            ? <button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} style={btn(true)}>Avançar →</button>
            : <button onClick={dlDoc} style={btn(true)}>⬇ Word</button>}
        </div>
      </div>

      {/* ---------- PREVIEW ---------- */}
      <div>
        <div style={{ display: "flex", gap: 0, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
          {[["tr", "Termo de Referência"], ["edital", "Minuta de Chamada"]].map(([k, l]) => (
            <button key={k} onClick={() => setDoc(k)} style={{
              fontFamily: SANS, fontSize: 12.5, letterSpacing: ".03em", padding: "8px 16px", cursor: "pointer",
              background: doc === k ? C.azul : C.card, color: doc === k ? "#fff" : C.muted,
              border: `1px solid ${doc === k ? C.azul : C.line}`, fontWeight: 600,
            }}>{l}</button>
          ))}
          <button onClick={() => setStep(STEPS.length - 1)} title="Ver conformidade" style={{
            marginLeft: 12, fontFamily: SANS, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
            background: "transparent", border: `1px solid ${C.line}`, borderRadius: 3, padding: "6px 10px",
            color: resumo.err ? SEVC.err : resumo.warn ? SEVC.warn : SEVC.ok,
          }}>
            {resumo.err ? `✕ ${resumo.err} erro(s)` : resumo.warn ? `! ${resumo.warn} aviso(s)` : "✓ conforme"}
          </button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={copy} style={btn(true)}>{copied ? "copiado ✓" : "copiar"}</button>
            <button onClick={dlTxt} style={btn(false)}>.txt</button>
            <button onClick={dlDoc} style={btn(false)}>Word</button>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderTop: `3px solid ${C.azul}`,
          padding: "44px 50px", fontFamily: SANS, color: C.ink, fontSize: 14, lineHeight: 1.6, minHeight: 600 }}>
          {minuta.map((s, i) => {
            if (s.head) return <h1 key={i} style={{ fontSize: 17, textAlign: "center", lineHeight: 1.4, margin: "0 0 24px", color: C.azulEscuro }}>{s.t}</h1>;
            if (s.p) return <p key={i} style={{ textAlign: "justify", margin: "0 0 20px", color: C.muted }}>{s.p}</p>;
            if (s.sign) return <div key={i} style={{ textAlign: "center", marginTop: 36, lineHeight: 1.9 }}>{s.b.map((l, j) => <div key={j} style={{ fontWeight: j === 1 ? 600 : 400 }}>{l}</div>)}</div>;
            return (
              <div key={i} style={{ margin: "0 0 20px" }}>
                {s.n && <h2 style={{ fontFamily: SANS, fontSize: 13, letterSpacing: ".04em", color: C.azul, margin: "0 0 8px", fontWeight: 700 }}>{s.n}. {s.t}</h2>}
                {(s.b || []).map((l, j) => <p key={j} style={{ textAlign: "justify", margin: "0 0 7px" }}>{l}</p>)}
                {s.table && (
                  <table style={{ width: "100%", borderCollapse: "collapse", margin: "8px 0 0", fontSize: 13 }}>
                    <tbody>{s.table.map((r, ri) => (
                      <tr key={ri}>{r.map((cell, ci) => (
                        <td key={ci} style={{ border: `1px solid ${C.line}`, padding: "6px 10px",
                          fontWeight: ri === 0 ? 700 : 400, background: ri === 0 ? C.abertaBg : "transparent",
                          textTransform: ri === 0 ? "uppercase" : "none", fontSize: ri === 0 ? 11 : 13,
                          letterSpacing: ri === 0 ? ".05em" : 0, color: ri === 0 ? C.azul : C.ink }}>{cell}</td>
                      ))}</tr>
                    ))}</tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
