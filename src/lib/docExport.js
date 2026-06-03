// Exportação para Word (.doc) sem dependências: serializa as seções da minuta em HTML
// compatível com o Word (cabeçalho Office + @page A4). O Word abre nativamente, com
// títulos, parágrafos justificados e tabelas (quadro de vagas, cronograma) preservados.
const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function minutaToHtml(S) {
  const out = [];
  for (const s of S) {
    if (s.head) { out.push(`<h1 style="text-align:center;font-size:15pt;margin:0 0 18pt;">${esc(s.t)}</h1>`); continue; }
    if (s.p) { out.push(`<p style="text-align:justify;color:#333;margin:0 0 12pt;">${esc(s.p)}</p>`); continue; }
    if (s.sign) {
      out.push(`<div style="text-align:center;margin-top:28pt;line-height:1.9;">${
        s.b.map((l, j) => `<div${j === 1 ? ' style="font-weight:bold;"' : ""}>${esc(l)}</div>`).join("")
      }</div>`);
      continue;
    }
    if (s.n) {
      out.push(`<h2 style="font-size:11pt;color:#123c5a;margin:14pt 0 6pt;">${s.n}. ${esc(s.t)}</h2>`);
      (s.b || []).forEach((l) => out.push(`<p style="text-align:justify;margin:0 0 5pt;">${esc(l)}</p>`));
    }
    if (s.table) {
      const rows = s.table.map((r, ri) => `<tr>${
        r.map((c) => {
          const tag = ri === 0 ? "th" : "td";
          const st = `border:1px solid #999;padding:4pt 8pt;${ri === 0 ? "background:#e8eef5;text-align:left;" : ""}`;
          return `<${tag} style="${st}">${esc(c)}</${tag}>`;
        }).join("")
      }</tr>`).join("");
      out.push(`<table style="border-collapse:collapse;width:100%;font-size:10pt;margin:6pt 0;">${rows}</table>`);
    }
  }
  return out.join("\n");
}

function buildDocHtml(S, titulo) {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(titulo)}</title>
<style>
@page { size: A4; margin: 2.5cm; }
body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #111; line-height: 1.5; }
</style></head><body>${minutaToHtml(S)}</body></html>`;
}

export function downloadDoc(S, titulo, filename) {
  const blob = new Blob(["﻿", buildDocHtml(S, titulo)], { type: "application/msword" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
