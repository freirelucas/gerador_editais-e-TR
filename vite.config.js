import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// Em produção (build p/ GitHub Pages) o app é servido em /<repo>/; em dev fica na raiz.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/gerador_editais-e-tr/" : "/",
  plugins: [react()],
}));
