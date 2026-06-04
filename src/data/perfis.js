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
