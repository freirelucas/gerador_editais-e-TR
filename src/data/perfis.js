// Base de conhecimento CURADA para o compositor do wizard.
// Gera perfil/atividades de qualidade, ancorados na norma (modalidades) e na taxonomia
// (função/tema). NÃO usa texto de OCR do corpus (ruidoso demais) — é texto limpo, que o
// proponente edita depois. As chaves casam EXATAMENTE com data/taxonomia.json.

// Competências e atividades típicas por FUNÇÃO.
export const FUNCAO_PERFIL = {
  "Apoio à pesquisa": {
    competencia: "organização, rigor e autonomia no apoio a projetos de pesquisa",
    atividades: [
      "realizar levantamento bibliográfico e revisão de literatura",
      "coletar, organizar e sistematizar dados e informações",
      "apoiar a elaboração de notas técnicas, relatórios e demais produtos da pesquisa",
    ],
  },
  "Métodos quantitativos": {
    competencia: "domínio de métodos quantitativos — econometria, estatística e avaliação de impacto — e tratamento de microdados",
    atividades: [
      "tratar e analisar microdados de fontes oficiais",
      "especificar e estimar modelos econométricos e de avaliação de impacto",
      "produzir estimativas, indicadores e visualizações que subsidiem a análise",
      "documentar a metodologia e os resultados em notas técnicas",
    ],
  },
  "Ciência de Dados – Analytics/ML": {
    competencia: "experiência em ciência de dados — modelos preditivos, aprendizado de máquina e visualização de dados",
    atividades: [
      "desenvolver e validar modelos preditivos e de aprendizado de máquina",
      "construir análises exploratórias e visualizações de dados",
      "automatizar rotinas de processamento e análise de dados",
      "comunicar achados a públicos técnicos e a gestores",
    ],
  },
  "Ciência de Dados – Engenharia": {
    competencia: "experiência em engenharia de dados — pipelines, integração e infraestrutura de dados",
    atividades: [
      "projetar e manter pipelines de extração, transformação e carga (ETL)",
      "integrar e organizar bases de dados de múltiplas fontes",
      "assegurar qualidade, versionamento e governança dos dados",
      "dar suporte de infraestrutura de dados às análises da equipe",
    ],
  },
  "Especialista de domínio": {
    competencia: "reconhecida experiência e notório saber no domínio do projeto",
    atividades: [
      "orientar tecnicamente o desenho e a execução da pesquisa",
      "elaborar análises aprofundadas e pareceres especializados",
      "revisar criticamente os produtos e subsidiar recomendações de política",
    ],
  },
};

// Linha temática por TEMA — usada para situar perfil e atividades no domínio do projeto.
export const TEMA_LINHA = {
  "Macroeconomia e finanças": "macroeconomia, política fiscal e monetária e sistema financeiro",
  "Social, trabalho e renda": "políticas sociais, mercado de trabalho, renda e desigualdade",
  "Estado, instituições e democracia": "Estado, instituições, gestão pública e democracia",
  "Regional, urbano e ambiental": "desenvolvimento regional e urbano e questões ambientais",
  "Setorial, inovação e infraestrutura": "inovação, produtividade, indústria e infraestrutura",
  "Internacional e comércio": "comércio internacional, relações internacionais e integração regional",
};

export const FUNCOES = Object.keys(FUNCAO_PERFIL);
export const TEMAS = Object.keys(TEMA_LINHA);

// Vocabulário REAL minerado do corpus PIPA (data/pdf_text/{2025,2026}_pipa_*.txt) — termos
// efetivamente recorrentes, com a contagem de ocorrências que os ancora. Servem de "ênfases"
// selecionáveis que refinam o perfil composto (subníveis dentro de cada função). Curado:
// ruído de OCR removido; "GIS"/"SIG" consolidados em "dados georreferenciados".
export const FUNCAO_TERMOS = {
  "Apoio à pesquisa": ["revisão de literatura", "levantamento bibliográfico", "coleta de dados", "sistematização de informações", "notas técnicas", "elaboração de relatórios"],
  "Métodos quantitativos": ["econometria", "estatística", "microdados", "avaliação de políticas", "registros administrativos", "indicadores", "modelagem", "Stata", "R", "Python"],
  "Ciência de Dados – Analytics/ML": ["ciência de dados", "análise de dados", "visualização de dados", "inteligência artificial", "Python", "análise qualitativa assistida (NVivo/Atlas.ti)"],
  "Ciência de Dados – Engenharia": ["bases de dados", "banco de dados", "SQL", "ETL", "web scraping"],
  "Especialista de domínio": ["doutorado", "produção acadêmica (Lattes)", "experiência comprovada", "consultoria especializada", "pesquisador(a) sênior"],
};

// Recortes temáticos REAIS por tema (sub-tópicos recorrentes no corpus PIPA, com contagem).
// O recorte de "Estado, instituições e democracia" (DIEST) é o mais rico do corpus.
export const TEMA_SUBTEMAS = {
  "Macroeconomia e finanças": ["finanças públicas", "contas nacionais", "política fiscal", "tributação", "gastos públicos", "conjuntura econômica"],
  "Social, trabalho e renda": ["raça", "gênero", "saúde", "emprego", "mercado de trabalho", "desigualdade", "assistência social", "indicadores sociais"],
  "Estado, instituições e democracia": ["políticas públicas", "administração pública", "instituições", "regulação", "sociedade civil", "democracia", "transformação digital", "capacidade institucional"],
  "Regional, urbano e ambiental": ["dados georreferenciados (SIG/GIS)", "meio ambiente", "habitação", "sustentabilidade", "territórios", "saneamento"],
  "Setorial, inovação e infraestrutura": ["infraestrutura", "inovação", "transporte", "logística", "energia", "telecomunicações"],
  "Internacional e comércio": ["relações internacionais", "comércio exterior", "comércio internacional", "integração regional", "exportação"],
};

const uniao = (mapa, chaves) => {
  const out = [];
  for (const k of chaves) for (const v of mapa[k] || []) if (!out.includes(v)) out.push(v);
  return out;
};
export const enfasesDe = (funcoes = []) => uniao(FUNCAO_TERMOS, funcoes);
export const recortesDe = (temas = []) => uniao(TEMA_SUBTEMAS, temas);
