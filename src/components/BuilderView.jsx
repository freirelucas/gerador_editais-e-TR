import { useState, useMemo } from "react";
import { C } from "../theme.js";
import { MODALIDADES } from "../data/modalidades.js";
import { BRL } from "../lib/format.js";
import { buildMinuta, minutaToText } from "../lib/minuta.js";

// Aba "Construtor de minuta": formulário à esquerda, pré-visualização à direita.
export default function BuilderView() {
  const [f, setF] = useState({
    numero: "",
    projeto: "",
    modalidade: "Assistente de Pesquisa II",
    qtd: "1",
    duracao: "12",
    requisitos: "",
    criterios: "",
    diretoria: "",
    dataPub: "",
    inscIni: "",
    inscFim: "",
    resultado: "",
    inicio: "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const minuta = useMemo(() => buildMinuta(f), [f]);
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
    a.download = `Chamada_PIPA_${(f.numero || "minuta").replace(/\//g, "-")}.txt`;
    a.click();
  };
  const inp = {
    fontFamily: "'IBM Plex Mono',monospace",
    fontSize: 12,
    padding: "8px 10px",
    background: "#faf7ef",
    border: `1px solid ${C.line}`,
    color: C.ink,
    borderRadius: 2,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };
  const lab = {
    fontFamily: "'IBM Plex Mono',monospace",
    fontSize: 10,
    letterSpacing: ".08em",
    textTransform: "uppercase",
    color: C.muted,
    marginBottom: 4,
    display: "block",
  };
  const Field = ({ l, children }) => (
    <div>
      <label style={lab}>{l}</label>
      {children}
    </div>
  );
  const mod = MODALIDADES.find((m) => m.nome === f.modalidade);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,360px) 1fr", gap: 24, alignItems: "start" }}>
      {/* FORM */}
      <div style={{ display: "grid", gap: 13, position: "sticky", top: 12 }}>
        <Field l="Número da Chamada">
          <input style={inp} placeholder="020/2026" value={f.numero} onChange={set("numero")} />
        </Field>
        <Field l="Título do projeto">
          <input style={inp} placeholder="Desigualdade e mudança estrutural" value={f.projeto} onChange={set("projeto")} />
        </Field>
        <Field l="Modalidade da bolsa">
          <select style={inp} value={f.modalidade} onChange={set("modalidade")}>
            {MODALIDADES.map((m) => (
              <option key={m.nome}>{m.nome}</option>
            ))}
          </select>
        </Field>
        {mod && (
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.cerrado, marginTop: -6 }}>
            valor mensal: <b>{BRL(mod.valor)}</b> · Port. 262/2023
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          <Field l="Qtd. bolsas">
            <input style={inp} type="number" min="1" value={f.qtd} onChange={set("qtd")} />
          </Field>
          <Field l="Duração (meses)">
            <input style={inp} type="number" min="1" value={f.duracao} onChange={set("duracao")} />
          </Field>
        </div>
        <Field l="Requisitos (1 por linha)">
          <textarea
            style={{ ...inp, minHeight: 70, resize: "vertical" }}
            placeholder={"Possuir título de Mestre em…\nExperiência comprovada em…"}
            value={f.requisitos}
            onChange={set("requisitos")}
          />
        </Field>
        <Field l="Critérios de julgamento">
          <textarea
            style={{ ...inp, minHeight: 60, resize: "vertical" }}
            placeholder="Deixe em branco para usar o texto-padrão"
            value={f.criterios}
            onChange={set("criterios")}
          />
        </Field>
        <Field l="Diretoria responsável">
          <input
            style={inp}
            placeholder="Diretoria de Estudos e Políticas Setoriais — DISET"
            value={f.diretoria}
            onChange={set("diretoria")}
          />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          <Field l="Publicação">
            <input style={inp} type="date" value={f.dataPub} onChange={set("dataPub")} />
          </Field>
          <Field l="Início atividades">
            <input style={inp} type="date" value={f.inicio} onChange={set("inicio")} />
          </Field>
          <Field l="Inscrição início">
            <input style={inp} type="date" value={f.inscIni} onChange={set("inscIni")} />
          </Field>
          <Field l="Inscrição fim">
            <input style={inp} type="date" value={f.inscFim} onChange={set("inscFim")} />
          </Field>
          <Field l="Resultado">
            <input style={inp} type="date" value={f.resultado} onChange={set("resultado")} />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button
            onClick={copy}
            style={{
              flex: 1,
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 11,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              padding: "10px",
              background: C.cerrado,
              color: "#f4f0e6",
              border: "none",
              borderRadius: 2,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {copied ? "copiado ✓" : "copiar minuta"}
          </button>
          <button
            onClick={dl}
            style={{
              flex: 1,
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 11,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              padding: "10px",
              background: "transparent",
              color: C.ink,
              border: `1px solid ${C.ink}`,
              borderRadius: 2,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            baixar .txt
          </button>
        </div>
      </div>

      {/* PREVIEW */}
      <div
        style={{
          background: "#fffdf7",
          border: `1px solid ${C.line}`,
          boxShadow: "0 1px 0 rgba(0,0,0,.04), 8px 8px 0 -4px rgba(60,90,61,.07)",
          padding: "46px 52px",
          fontFamily: "Spectral,serif",
          color: C.ink,
          fontSize: 13.5,
          lineHeight: 1.65,
          minHeight: 600,
        }}
      >
        {minuta.map((s, i) => {
          if (s.head)
            return (
              <h1 key={i} style={{ fontSize: 16, textAlign: "center", lineHeight: 1.4, margin: "0 0 26px", letterSpacing: ".01em" }}>
                {s.t}
              </h1>
            );
          if (s.p)
            return (
              <p key={i} style={{ textAlign: "justify", margin: "0 0 20px" }}>
                {s.p}
              </p>
            );
          if (s.sign)
            return (
              <div key={i} style={{ textAlign: "center", marginTop: 38, lineHeight: 2 }}>
                {s.b.map((l, j) => (
                  <div key={j} style={{ fontWeight: j > 0 ? 600 : 400 }}>
                    {l}
                  </div>
                ))}
              </div>
            );
          if (s.table)
            return (
              <table key={i} style={{ width: "100%", borderCollapse: "collapse", margin: "0 0 20px", fontSize: 12.5 }}>
                <tbody>
                  {s.table.map((r, ri) => (
                    <tr key={ri}>
                      {r.map((cell, ci) => (
                        <td
                          key={ci}
                          style={{
                            border: `1px solid ${C.line}`,
                            padding: "6px 10px",
                            fontWeight: ri === 0 ? 600 : 400,
                            background: ri === 0 ? "#f0ead9" : "transparent",
                            fontFamily: ri === 0 ? "'IBM Plex Mono',monospace" : "Spectral,serif",
                            fontSize: ri === 0 ? 10.5 : 12.5,
                            textTransform: ri === 0 ? "uppercase" : "none",
                            letterSpacing: ri === 0 ? ".06em" : 0,
                          }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          return (
            <div key={i} style={{ margin: "0 0 20px" }}>
              <h2
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 12,
                  letterSpacing: ".05em",
                  color: C.cerrado,
                  margin: "0 0 8px",
                  fontWeight: 600,
                }}
              >
                {s.n}. {s.t}
              </h2>
              {(s.b || []).map((l, j) => (
                <p key={j} style={{ textAlign: "justify", margin: "0 0 7px" }}>
                  {l}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
