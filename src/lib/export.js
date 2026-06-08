// Exportação client-side, sem dependências: CSV (dados) e PNG (gráficos SVG).
// CSV leva BOM p/ o Excel ler acentos; PNG rasteriza o <svg> inline num canvas
// (sem recursos externos → canvas não fica "tainted", toDataURL/toBlob funcionam).

function baixar(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const escapaCampo = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n\r;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

// linhas: array de arrays (a primeira costuma ser o cabeçalho)
export function toCsv(linhas) {
  return linhas.map((l) => l.map(escapaCampo).join(",")).join("\r\n");
}

export function baixarCsv(filename, linhas) {
  const texto = "﻿" + toCsv(linhas); // BOM UTF-8
  const blob = new Blob([texto], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  baixar(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function baixarSvgPng(svg, { filename = "grafico.png", scale = 2, bg = "#ffffff" } = {}) {
  if (!svg) return;
  const vb = svg.viewBox && svg.viewBox.baseVal;
  const w = (vb && vb.width) || svg.clientWidth || 800;
  const h = (vb && vb.height) || svg.clientHeight || 400;
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", w);
  clone.setAttribute("height", h);
  // encodeURIComponent (não btoa) p/ sobreviver a acentos nos rótulos
  const xml = new XMLSerializer().serializeToString(clone);
  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      baixar(url, filename);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }, "image/png");
  };
  img.onerror = () => alert("Não foi possível exportar o PNG neste navegador.");
  img.src = src;
}

// slug seguro p/ nomes de arquivo (sem acento/espaço)
export function slugArquivo(s) {
  return String(s)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "dados";
}
