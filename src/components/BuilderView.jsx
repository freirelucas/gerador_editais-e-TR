import { useState, useMemo } from "react";
import { C, SANS } from "../theme.js";
import { MODALIDADES } from "../data/modalidades.js";
import { NORMA } from "../data/norma.js";
import { fmtValor } from "../lib/format.js";
import { buildTR, buildEdital, minutaToText } from "../lib/minuta.js";
import { clausulasDe } from "../data/clausulas.js";

// Chips de "padrões de descrição" (cláusulas dos modelos antigos) — só para campos
// descritivos, FORA do núcleo regulado. Clicar preenche o campo.
function Padroes({ rotulo, onEscolher }) {
  const opcoes = clausulasDe(rotulo).slice(0, 4);
  if (!opcoes.length) return null;
  return (
    <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      <span style={{ fontFamily: SANS, fontSize: 9.5, letterSpacing: ".06em", textTransform: "uppercase", color: C.muted }}>
        padrões (modelos antigos):
      </span>
      {opcoes.map((c, i) => (
        <button key={i} type="button" title={c} onClick={() => onEscolher(c)}
          style={{ fontFamily: SANS, fontSize: 11, border: `1px solid ${C.line}`, background: C.paper,
            color: C.azul, borderRadius: 3, padding: "2px 8px", cursor: "pointer", maxWidth: 240,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {c.slice(0, 42)}…
        </button>
      ))}
    </div>
  );
}

export default function BuilderView() {
  const [doc, setDoc] = useState("tr"); // "tr" | "edital"
  const [f, setF] = useState({
    numero: "", unidade: "", coordenador: "", projeto: "", perfil: "",
    modalidade: MODALIDADES[0].nome, qtd: "1", cadastroReserva: false, reservaVagas: "",
    duracaoBolsa: "12", duracaoPesquisa: "12", atividades: "", criterios: "",
    cartaIntencoes: false, comissao: "", diretoria: "",
    dataPub: "", inscIni: "", inscFim: "", resultado: "", inicio: "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setVal = (k, v) => setF({ ...f, [k]: v });
  const toggle = (k) => (e) => setF({ ...f, [k]: e.target.checked });

  const minuta = useMemo(() => (doc === "tr" ? buildTR(f) : buildEdital(f)), [f, doc]);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(minutaToText(minuta));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  const dl = () => {
    const blob = new Blob([minutaToText(minuta)], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const pref = doc === "tr" ? "TR_PIPA" : "Chamada_PIPA";
    a.download = `${pref}_${(f.numero || "minuta").replace(/\//g, "-")}.txt`;
    a.click();
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
  const mod = MODALIDADES.find((m) => m.nome === f.modalidade);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(300px,380px) 1fr", gap: 26, alignItems: "start" }}>
      {/* ---------- FORM ---------- */}
      <div style={{ display: "grid", gap: 13, position: "sticky", top: 12 }}>
        <Field l="Nº da chamada / TR"><input style={inp} placeholder="020/2026" value={f.numero} onChange={set("numero")} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          <Field l="Unidade responsável"><input style={inp} placeholder="DISET" value={f.unidade} onChange={set("unidade")} /></Field>
          <Field l="Coordenação"><input style={inp} placeholder="Nome do coordenador" value={f.coordenador} onChange={set("coordenador")} /></Field>
        </div>

        <Field l="Definição do projeto de pesquisa">
          <textarea style={{ ...inp, minHeight: 64, resize: "vertical" }} placeholder="Objeto, justificativa e objetivos do projeto…" value={f.projeto} onChange={set("projeto")} />
          <Padroes rotulo="DEFINIÇÃO DO PROJETO" onEscolher={(c) => setVal("projeto", c)} />
        </Field>
        <Field l="Perfil do bolsista desejado">
          <textarea style={{ ...inp, minHeight: 56, resize: "vertical" }} placeholder="Titulação, conhecimentos e experiência…" value={f.perfil} onChange={set("perfil")} />
          <Padroes rotulo="PERFIL E REQUISITOS" onEscolher={(c) => setVal("perfil", c)} />
        </Field>

        <Field l="Modalidade da bolsa (Portaria 317/2025)">
          <select style={inp} value={f.modalidade} onChange={set("modalidade")}>
            {MODALIDADES.map((m) => <option key={m.nome}>{m.nome}</option>)}
          </select>
        </Field>
        {mod && (
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.azul, marginTop: -6 }}>
            valor mensal: <b>{fmtValor(mod.valor, mod.moeda)}</b> · Anexo I
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 13 }}>
          <Field l="Qtd. bolsas"><input style={inp} type="number" min="1" value={f.qtd} onChange={set("qtd")} /></Field>
          <Field l="Bolsa (meses)"><input style={inp} type="number" min="1" value={f.duracaoBolsa} onChange={set("duracaoBolsa")} /></Field>
          <Field l="Pesquisa (meses)"><input style={inp} type="number" min="1" value={f.duracaoPesquisa} onChange={set("duracaoPesquisa")} /></Field>
        </div>
        <Check k="cadastroReserva" l="Prever cadastro reserva (Art. 9º, §2º)" />
        <Field l="Reserva de vagas / público-alvo (Art. 25) — opcional">
          <input style={inp} placeholder="Ex.: reserva para pessoas negras…" value={f.reservaVagas} onChange={set("reservaVagas")} />
        </Field>

        <Field l="Atividades a desenvolver">
          <textarea style={{ ...inp, minHeight: 56, resize: "vertical" }} placeholder="Atividades de pesquisa do bolsista…" value={f.atividades} onChange={set("atividades")} />
          <Padroes rotulo="ATIVIDADES" onEscolher={(c) => setVal("atividades", c)} />
        </Field>
        <Field l="Critérios de seleção">
          <textarea style={{ ...inp, minHeight: 56, resize: "vertical" }} placeholder="Em branco usa o critério-padrão da norma…" value={f.criterios} onChange={set("criterios")} />
          <Padroes rotulo="CRITÉRIOS DE SELEÇÃO" onEscolher={(c) => setVal("criterios", c)} />
        </Field>
        <Check k="cartaIntencoes" l="Exigir carta de intenções (Art. 8º, §1º)" />

        <Field l="Diretor(a) que aprova o TR"><input style={inp} placeholder="Diretor da área" value={f.diretoria} onChange={set("diretoria")} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          <Field l="Publicação"><input style={inp} type="date" value={f.dataPub} onChange={set("dataPub")} /></Field>
          <Field l="Início atividades"><input style={inp} type="date" value={f.inicio} onChange={set("inicio")} /></Field>
          <Field l="Inscrição início"><input style={inp} type="date" value={f.inscIni} onChange={set("inscIni")} /></Field>
          <Field l="Inscrição fim"><input style={inp} type="date" value={f.inscFim} onChange={set("inscFim")} /></Field>
          <Field l="Resultado"><input style={inp} type="date" value={f.resultado} onChange={set("resultado")} /></Field>
        </div>
      </div>

      {/* ---------- PREVIEW ---------- */}
      <div>
        <div style={{ display: "flex", gap: 0, marginBottom: 14, alignItems: "center" }}>
          {[["tr", "Termo de Referência"], ["edital", "Minuta de Chamada"]].map(([k, l]) => (
            <button key={k} onClick={() => setDoc(k)} style={{
              fontFamily: SANS, fontSize: 12.5, letterSpacing: ".03em", padding: "8px 16px", cursor: "pointer",
              background: doc === k ? C.azul : C.card, color: doc === k ? "#fff" : C.muted,
              border: `1px solid ${doc === k ? C.azul : C.line}`, fontWeight: 600,
            }}>{l}</button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button onClick={copy} style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".04em", textTransform: "uppercase",
              padding: "8px 14px", background: C.azul, color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", fontWeight: 600 }}>
              {copied ? "copiado ✓" : "copiar"}
            </button>
            <button onClick={dl} style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".04em", textTransform: "uppercase",
              padding: "8px 14px", background: "transparent", color: C.ink, border: `1px solid ${C.ink}`, borderRadius: 3, cursor: "pointer", fontWeight: 600 }}>
              baixar .txt
            </button>
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
