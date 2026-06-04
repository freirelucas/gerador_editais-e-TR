// Diretorias de pesquisa (substantivas) do IPEA e o tema correspondente na taxonomia.
// Fonte dos nomes: scripts/enrich_corpus.py › DIRETORIAS. O mapa diretoria→tema permite
// otimizar o wizard por área — ex.: DIEST ⇒ "Estado, instituições e democracia": ao escolher
// a diretoria, o gerador já pré-seleciona o tema e prioriza as sugestões ancoradas no corpus
// daquela área. DIEST vem primeiro (área em foco). DIDES (institucional) fica fora — não é
// diretoria substantiva de pesquisa.
export const DIRETORIAS = [
  { sigla: "DIEST", nome: "Diretoria de Estudos e Políticas do Estado, das Instituições e da Democracia", tema: "Estado, instituições e democracia" },
  { sigla: "DIMAC", nome: "Diretoria de Estudos e Políticas Macroeconômicas", tema: "Macroeconomia e finanças" },
  { sigla: "DISOC", nome: "Diretoria de Estudos e Políticas Sociais", tema: "Social, trabalho e renda" },
  { sigla: "DIRUR", nome: "Diretoria de Estudos e Políticas Regionais, Urbanas e Ambientais", tema: "Regional, urbano e ambiental" },
  { sigla: "DISET", nome: "Diretoria de Estudos e Políticas Setoriais de Inovação e Infraestrutura", tema: "Setorial, inovação e infraestrutura" },
  { sigla: "DINTE", nome: "Diretoria de Estudos e Relações Econômicas e Políticas Internacionais", tema: "Internacional e comércio" },
];

export const DIRETORIA_TEMA = Object.fromEntries(DIRETORIAS.map((d) => [d.sigla, d.tema]));
export const PADRAO_DIRETORIA = "DIEST";
export const acharDiretoria = (sigla) => DIRETORIAS.find((d) => d.sigla === sigla) || null;
// Rótulo institucional para o cabeçalho do TR/edital (campo "Unidade responsável").
export const rotuloUnidade = (sigla) => {
  const d = acharDiretoria(sigla);
  return d ? `${d.nome} (${d.sigla})` : "";
};
