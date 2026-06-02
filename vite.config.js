import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// Base relativa ("./") em produção: os assets resolvem em relação à página, então o app
// funciona em /<repo>/ independentemente da caixa (gerador_editais-e-TR) — evita a tela
// branca por 404 de asset no GitHub Pages. App de página única (sem roteador), então a
// base relativa é segura. Em dev, raiz.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "./" : "/",
  // data do build como referência determinística p/ a projeção pró-rata de 2026
  define: { __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)) },
  plugins: [react()],
}));
