// Exportação sem dependências. Word (.doc) via HTML compatível com Office (@page A4) e
// PDF via janela de impressão (o usuário escolhe "Salvar como PDF"). Ambos com timbre IPEA.
const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function minutaToHtml(S, serif) {
  const ff = serif ? "Georgia, 'Times New Roman', serif" : "Calibri, Arial, sans-serif";
  const out = [];
  for (const s of S) {
    if (s.head) { out.push(`<h1 style="text-align:center;font-size:15pt;font-family:${ff};margin:0 0 18pt;">${esc(s.t)}</h1>`); continue; }
    if (s.p) { out.push(`<p style="text-align:justify;font-family:${ff};color:#333;margin:0 0 12pt;">${esc(s.p)}</p>`); continue; }
    if (s.sign) {
      out.push(`<div style="text-align:center;font-family:${ff};margin-top:28pt;line-height:1.9;">${
        s.b.map((l, j) => `<div${j === 1 ? ' style="font-weight:bold;"' : ""}>${esc(l)}</div>`).join("")
      }</div>`);
      continue;
    }
    if (s.n) {
      out.push(`<h2 style="font-size:11pt;color:#3a3aa0;font-family:Calibri,Arial,sans-serif;margin:14pt 0 6pt;">${s.n}. ${esc(s.t)}</h2>`);
      (s.b || []).forEach((l) => out.push(`<p style="text-align:justify;font-family:${ff};margin:0 0 5pt;">${esc(l)}</p>`));
    }
    if (s.table) {
      const rows = s.table.map((r, ri) => `<tr>${
        r.map((c) => {
          const tag = ri === 0 ? "th" : "td";
          const st = `border:1px solid #999;padding:4pt 8pt;font-family:Calibri,Arial,sans-serif;${ri === 0 ? "background:#eeeefc;text-align:left;" : ""}`;
          return `<${tag} style="${st}">${esc(c)}</${tag}>`;
        }).join("")
      }</tr>`).join("");
      out.push(`<table style="border-collapse:collapse;width:100%;font-size:10pt;margin:6pt 0;">${rows}</table>`);
    }
  }
  return out.join("\n");
}

// Timbre institucional (cabeçalho do documento).
function timbre(sub) {
  return `<div style="text-align:center;border-bottom:2px solid #0a3a47;padding-bottom:8pt;margin-bottom:18pt;font-family:Calibri,Arial,sans-serif;">
  <div style="font-size:14pt;font-weight:bold;letter-spacing:2pt;color:#0a3a47;">ipea</div>
  <div style="font-size:8.5pt;color:#444;">Instituto de Pesquisa Econômica Aplicada</div>
  ${sub ? `<div style="font-size:8pt;color:#777;margin-top:3pt;text-transform:uppercase;letter-spacing:.5pt;">${esc(sub)}</div>` : ""}
</div>`;
}

function buildDocHtml(S, titulo, sub) {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(titulo)}</title>
<style>@page { size: A4; margin: 2.5cm; } body { font-size: 11pt; color: #111; line-height: 1.5; }</style></head>
<body>${timbre(sub)}${minutaToHtml(S, false)}</body></html>`;
}

export function downloadDoc(S, titulo, filename, sub) {
  const blob = new Blob(["﻿", buildDocHtml(S, titulo, sub)], { type: "application/msword" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// PDF: abre uma janela com o documento (serifado, A4) e dispara a impressão.
export function printDoc(S, titulo, sub) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(titulo)}</title>
<style>
@page { size: A4; margin: 2.4cm; }
body { font-family: Georgia, 'Times New Roman', serif; font-size: 11.5pt; color: #16181d; line-height: 1.6; max-width: 760px; margin: 24px auto; padding: 0 16px; }
@media print { body { margin: 0; max-width: none; } }
</style></head><body onload="setTimeout(function(){window.focus();window.print();},250)">
${timbre(sub)}${minutaToHtml(S, true)}</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}
