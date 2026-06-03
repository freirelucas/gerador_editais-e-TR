import { useState, useMemo } from "react";
import { C, SANS } from "../theme.js";
import { CORPUS } from "../data/corpus.js";
import Pill from "./Pill.jsx";

// Aba "Explorador de projetos": busca e filtra as chamadas (2023–2026) com os campos
// enriquecidos dos editais (objeto, papel, formação, diretoria, função/tema, requisitos).
const uniq = (xs) => Array.from(new Set(xs.filter(Boolean)));
const flat = (campo) => uniq(CORPUS.flatMap((c) => c[campo] || []));

export default function CorpusView() {
  const [q, setQ] = useState("");
  const [ano, setAno] = useState("Todos");
  const [prog, setProg] = useState("Todos");
  const [sit, setSit] = useState("Todas");
  const [dir, setDir] = useState("Todas");
  const [func, setFunc] = useState("Todas");
  const [tema, setTema] = useState("Todos");
  const [cota, setCota] = useState("Todas");
  const [abertos, setAbertos] = useState(() => new Set());

  const anos = ["Todos", ...uniq(CORPUS.map((c) => c.ano)).sort().reverse()];
  const progs = ["Todos", ...uniq(CORPUS.map((c) => c.programa))];
  const dirs = ["Todas", ...uniq(CORPUS.map((c) => c.diretoria)).sort(), "—"];
  const funcs = ["Todas", ...flat("categoria_funcao").sort()];
  const temas = ["Todos", ...flat("categoria_tema").sort()];
  const cotaCats = uniq(CORPUS.flatMap((c) => (c.vagas_por_cota || {}).categorias || [])).sort();
  const cotas = ["Todas", "Com reserva", ...cotaCats];

  const rows = useMemo(
    () =>
      CORPUS.filter((c) => {
        if (ano !== "Todos" && c.ano !== ano) return false;
        if (prog !== "Todos" && c.programa !== prog) return false;
        if (sit !== "Todas" && (c.situacao || "").toUpperCase() !== sit) return false;
        if (dir === "—" ? c.diretoria : dir !== "Todas" && c.diretoria !== dir) return false;
        if (func !== "Todas" && !(c.categoria_funcao || []).includes(func)) return false;
        if (tema !== "Todos" && !(c.categoria_tema || []).includes(tema)) return false;
        if (cota === "Com reserva" && !(c.vagas_por_cota || {}).tem_reserva) return false;
        if (cota !== "Todas" && cota !== "Com reserva" && !((c.vagas_por_cota || {}).categorias || []).includes(cota)) return false;
        if (q) {
          const s = [c.titulo, c.projeto, c.objeto, c.papel, c.diretoria,
            (c.modalidades_extraidas || []).join(" "), (c.categoria_tema || []).join(" ")]
            .join(" ").toLowerCase();
          if (!s.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [q, ano, prog, sit, dir, func, tema, cota]
  );

  const enriquecidas = CORPUS.filter((c) => c.enriquecido).length;
  const sel = {
    fontFamily: SANS, fontSize: 12, padding: "7px 10px", background: C.paper,
    border: `1px solid ${C.line}`, color: C.ink, borderRadius: 2, outline: "none",
  };
  const chip = (txt, cor) => (
    <span style={{ fontFamily: SANS, fontSize: 10.5, padding: "1px 7px", borderRadius: 10,
      background: cor + "1f", color: cor, border: `1px solid ${cor}40`, whiteSpace: "nowrap" }}>{txt}</span>
  );
  const toggle = (k) =>
    setAbertos((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 14 }}>
        <input placeholder="Buscar por título, objeto, papel, diretoria…" value={q}
          onChange={(e) => setQ(e.target.value)} style={{ ...sel, flex: "1 1 260px", minWidth: 180 }} />
        <select value={ano} onChange={(e) => setAno(e.target.value)} style={sel}>{anos.map((a) => <option key={a}>{a}</option>)}</select>
        <select value={prog} onChange={(e) => setProg(e.target.value)} style={sel}>{progs.map((p) => <option key={p}>{p}</option>)}</select>
        <select value={sit} onChange={(e) => setSit(e.target.value)} style={sel}>{["Todas", "ABERTA", "FECHADA"].map((s) => <option key={s}>{s}</option>)}</select>
        <select value={dir} onChange={(e) => setDir(e.target.value)} style={sel} title="Diretoria">
          {dirs.map((d) => <option key={d} value={d}>{d === "—" ? "Diretoria: n/d" : d === "Todas" ? "Diretoria: todas" : d}</option>)}
        </select>
        <select value={func} onChange={(e) => setFunc(e.target.value)} style={sel} title="Função">
          {funcs.map((f) => <option key={f} value={f}>{f === "Todas" ? "Função: todas" : f}</option>)}
        </select>
        <select value={tema} onChange={(e) => setTema(e.target.value)} style={sel} title="Tema">
          {temas.map((t) => <option key={t} value={t}>{t === "Todos" ? "Tema: todos" : t}</option>)}
        </select>
        <select value={cota} onChange={(e) => setCota(e.target.value)} style={sel} title="Reserva de vagas">
          {cotas.map((x) => <option key={x} value={x}>{x === "Todas" ? "Cotas: todas" : x === "Com reserva" ? "Com reserva" : "Cota: " + x}</option>)}
        </select>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: C.muted, marginBottom: 12, letterSpacing: ".04em" }}>
        {rows.length} de {CORPUS.length} chamadas · {enriquecidas} enriquecidas a partir do PDF
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {rows.map((c) => {
          const aberto = abertos.has(c.url);
          const temDetalhe = (c.requisitos || []).length || (c.atividades || []).length;
          return (
            <div key={c.url} style={{ border: `1px solid ${C.line}`,
              borderLeft: `3px solid ${(c.situacao || "").toUpperCase() === "ABERTA" ? C.azul : C.line}`,
              background: C.card, padding: "13px 16px", borderRadius: 2, display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
                <a href={c.url} target="_blank" rel="noreferrer"
                  style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: C.ink, textDecoration: "none" }}>{c.titulo}</a>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {c.diretoria && <Pill tone="prog">{c.diretoria}</Pill>}
                  <Pill tone="prog">{c.programa}</Pill>
                  <Pill tone={(c.situacao || "").toUpperCase() === "ABERTA" ? "aberta" : "fechada"}>{c.situacao || "—"}</Pill>
                </div>
              </div>
              {(c.objeto || c.projeto) && (
                <div style={{ fontFamily: SANS, fontSize: 14, color: C.ink, lineHeight: 1.5 }}>
                  {c.projeto && <span style={{ fontStyle: "italic" }}>“{c.projeto}”. </span>}
                  {c.objeto && c.objeto !== c.projeto && <span style={{ color: C.muted }}>{c.objeto}</span>}
                </div>
              )}
              {((c.categoria_funcao || []).length || (c.categoria_tema || []).length || ((c.vagas_por_cota || {}).categorias || []).length) > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(c.categoria_funcao || []).map((f) => <span key={f}>{chip(f, C.azul)}</span>)}
                  {(c.categoria_tema || []).map((t) => <span key={t}>{chip(t, C.gold)}</span>)}
                  {((c.vagas_por_cota || {}).categorias || []).map((x) => <span key={"k" + x}>{chip("reserva: " + x, "#3f7d54")}</span>)}
                </div>
              )}
              <div style={{ fontFamily: SANS, fontSize: 11, color: C.muted, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                <span>{c.ano}</span>
                {c.papel && <span>· {c.papel}</span>}
                {(c.formacao || []).length > 0 && <span>· {c.formacao.join(", ")}</span>}
                {(c.valores_brl || []).length > 0 && <span>· R$ {c.valores_brl.map((v) => v.toLocaleString("pt-BR")).join(" / ")}</span>}
                {temDetalhe ? (
                  <button onClick={() => toggle(c.url)} style={{ fontFamily: SANS, fontSize: 11, color: C.azul,
                    background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    {aberto ? "▴ ocultar requisitos" : "▾ requisitos e atividades"}
                  </button>
                ) : null}
                {c.pdf && <a href={c.pdf} target="_blank" rel="noreferrer" style={{ color: C.terra, textDecoration: "none", marginLeft: "auto" }}>↓ PDF do edital</a>}
              </div>
              {aberto && temDetalhe ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 4,
                  paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
                  {[["Requisitos", c.requisitos], ["Atividades", c.atividades]].map(([t, list]) =>
                    (list || []).length ? (
                      <div key={t}>
                        <div style={{ fontFamily: SANS, fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase", color: C.azul, fontWeight: 600, marginBottom: 4 }}>{t}</div>
                        <ul style={{ margin: 0, paddingLeft: 16, fontFamily: SANS, fontSize: 12.5, color: C.ink, lineHeight: 1.5 }}>
                          {list.slice(0, 5).map((x, j) => <li key={j} style={{ marginBottom: 3 }}>{x}</li>)}
                        </ul>
                      </div>
                    ) : null
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
