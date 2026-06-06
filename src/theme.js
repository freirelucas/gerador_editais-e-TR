// Sistema de design "produto" (Linear/Notion-like) com âncora institucional IPEA.
// UI em Inter; o DOCUMENTO gerado usa serifa (Source Serif) para parecer o artefato oficial.
export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap');
`;

export const SANS = "'Inter', system-ui, -apple-system, Segoe UI, sans-serif";
export const SERIF = "'Source Serif 4', Georgia, 'Times New Roman', serif";
export const WORDMARK = SANS;

export const C = {
  // superfícies (claras, em camadas)
  paper: "#f6f7f9",
  card: "#ffffff",
  surface2: "#fbfcfd",
  sunken: "#eff1f5",
  // texto
  ink: "#1c2024",
  muted: "#565a61",
  faint: "#6e737b",
  line: "#e8eaef",
  lineStrong: "#d9dce3",
  // acento (índigo — produto)
  azul: "#5b5bd6",
  azulEscuro: "#4646c4",
  azulClaro: "#9b9bec",
  accentSoft: "#eeeefc",
  // marca IPEA (continuidade institucional)
  brand: "#10566a",
  brandDeep: "#0a3a47",
  // semântico
  ok: "#2f9e44", okBg: "#e9faee",
  warn: "#c8881a", warnBg: "#fff6e0",
  err: "#e03131", errBg: "#fff0f0",
  gold: "#c98a1e",
  // aliases mantidos p/ compat com componentes existentes
  cerrado: "#5b5bd6",
  terra: "#5b5bd6",
  abertaBg: "#eeeefc",
  abertaFg: "#4646c4",
};

export const RADIUS = { sm: 8, md: 12, lg: 16, pill: 999 };
export const SHADOW = {
  xs: "0 1px 2px rgba(20,28,40,.06)",
  card: "0 1px 2px rgba(20,28,40,.05), 0 2px 6px rgba(20,28,40,.04)",
  md: "0 6px 20px rgba(20,28,40,.10)",
  lg: "0 20px 48px rgba(20,28,40,.20)",
  focus: "0 0 0 3px rgba(91,91,214,.18)",
};

// CSS global: foco, hover, transições, scrollbar e microanimações (o que inline não cobre).
export const GLOBAL_CSS = `
*{box-sizing:border-box;}
html,body{margin:0;background:${C.paper};}
input,textarea,select{transition:border-color .15s, box-shadow .15s;}
input:focus,textarea:focus,select:focus{border-color:${C.azul}!important;box-shadow:${SHADOW.focus}!important;}
input::placeholder,textarea::placeholder{color:#aeb4bc;}
button{transition:background .15s,color .15s,border-color .15s,box-shadow .15s,transform .06s;}
button:active{transform:translateY(.5px);}
.lk:hover{background:${C.sunken};}
.cardhover{transition:box-shadow .18s, border-color .18s, transform .18s;}
.cardhover:hover{box-shadow:${SHADOW.md};border-color:${C.lineStrong};}
::-webkit-scrollbar{width:11px;height:11px;}
::-webkit-scrollbar-thumb{background:#d4d8df;border-radius:999px;border:3px solid transparent;background-clip:padding-box;}
::-webkit-scrollbar-thumb:hover{background:#c2c7d0;}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
@keyframes pop{0%{transform:scale(.96);}60%{transform:scale(1.015);}100%{transform:scale(1);}}
@keyframes flashbg{0%{background:rgba(91,91,214,.18);}100%{background:transparent;}}
.flash{animation:flashbg 1.1s ease-out;border-radius:6px;margin:0 -8px;padding:0 8px;}
.fadeUp{animation:fadeUp .24s cubic-bezier(.2,.7,.3,1) both;}
.fadeUp>*{animation:fadeUp .26s cubic-bezier(.2,.7,.3,1) both;}
.fadeUp>*:nth-child(2){animation-delay:.03s;}
.fadeUp>*:nth-child(3){animation-delay:.06s;}
.fadeUp>*:nth-child(4){animation-delay:.09s;}
.pop{animation:pop .2s ease;}
/* Realce e tooltip nos gráficos SVG: barras/fatias clareiam no hover; alvos transparentes
   (.chDot) dão um halo onde se pode ler o ponto. O tooltip em si é o <title> nativo do SVG. */
.chHover{transition:opacity .12s ease}
.chHover:hover{opacity:.78;cursor:default}
.chDot{fill:transparent;cursor:default;transition:fill .12s ease}
.chDot:hover{fill:rgba(91,91,214,.16)}
@media (max-width:880px){.twocol{grid-template-columns:1fr!important;}}
/* Desktop-first: o app é desenhado para tela grande; abaixo de 720px só adaptamos o cabeçalho
   (que não cabe) e folgas — sem mudar o desktop. A nav vira uma faixa própria, todas as abas
   visíveis; o selo da norma e o padding encolhem; o H1 diminui. */
@media (max-width:720px){
  .topbar{height:auto!important;flex-wrap:wrap!important;gap:10px!important;padding:9px 16px!important;}
  .topnav{order:3;width:100%;margin-left:0!important;gap:5px!important;}
  .topnav button{flex:1 1 0;min-width:0;justify-content:center;gap:5px!important;padding:8px 4px!important;font-size:11.5px!important;white-space:nowrap;}
  .topbadge{display:none!important;}
  .pagewrap{padding:22px 16px 64px!important;}
  .pageh1{font-size:23px!important;}
}
`;
