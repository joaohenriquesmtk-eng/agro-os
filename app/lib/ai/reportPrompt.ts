import type { ReportGenerationInput } from "./providers/types";

type StatusSistema = "AUTORIZADO" | "RISCO_ELEVADO" | "BLOQUEADO";

function toLine(value: unknown, fallback = "N/D") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return fallback;
    return String(value);
  }
  const text = String(value).trim();
  return text || fallback;
}

function toCurrency(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/D";
  return `R$ ${num.toFixed(2)}`;
}

function getParecerOperacionalFinal(status: StatusSistema): string {
  switch (status) {
    case "AUTORIZADO":
      return "AUTORIZADO";
    case "RISCO_ELEVADO":
      return "RISCO ELEVADO";
    case "BLOQUEADO":
    default:
      return "BLOQUEADO";
  }
}

export function buildImageDataUrl(imagemBase64?: string | null) {
  if (!imagemBase64) return null;
  return `data:image/jpeg;base64,${imagemBase64}`;
}

export function buildTechnicalReportPrompt(input: ReportGenerationInput) {
  const { operacao, analise, mercado, veredito, imagemBase64 } = input;
  const fatorLimitanteTecnico = toLine(
    veredito?.fatorLimitanteTecnico || veredito?.fatorLimitante
  );
  const fatorLimitanteEconomico = toLine(
    veredito?.fatorLimitanteEconomico ||
      "Sem limitante econômico crítico identificado."
  );
  const diagnosticoSolo = veredito?.diagnosticoSolo;
  const leituraPh = toLine(diagnosticoSolo?.leituraPh);
  const leituraCtc = toLine(diagnosticoSolo?.leituraCtc);
  const leituraMateriaOrganica = toLine(diagnosticoSolo?.leituraMateriaOrganica);
  const leituraSaturacaoBases = toLine(diagnosticoSolo?.leituraSaturacaoBases);
  const leituraTexturaSolo = toLine(diagnosticoSolo?.leituraTexturaSolo);
  const leituraChuvaRecente = toLine(diagnosticoSolo?.leituraChuvaRecente);
  const severidadeComplementar = toLine(
    diagnosticoSolo?.severidadeContextoComplementar
  );

  const dataAtual = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const instrucaoVisual = imagemBase64
    ? `Analise a imagem anexa apenas como apoio complementar. Não invente diagnóstico visual específico sem base consistente.`
    : `O usuário não forneceu mapa visual. Baseie-se apenas nos dados numéricos, econômicos e sazonais.`;

  return `
Você é o redator técnico do Agro OS.
Refine a redação de um laudo técnico executivo já fundamentado pelo motor interno.

REGRAS:
- Use bullets com "•"
- Use negrito com **texto**
- Não altere o status final do sistema
- Não invente causalidade forte
- Não floreie
- Não contradiga os dados do motor
- Quando houver dois fatores limitantes, diferencie explicitamente o técnico/pedoclimático do econômico
- Escreva como parecer técnico sóbrio

DADOS:
- Data: ${dataAtual}
- Cultura: ${toLine(operacao.cultura)}
- Fase: ${toLine(analise.faseFenologica)}
- Região: ${toLine(operacao.regiao)}
- Área: ${toLine(analise.areaEstresseHa)} ha
- P: ${toLine(operacao.fosforoMehlich)} mg/dm³
- K: ${toLine(operacao.potassio)} cmolc/dm³
- pH do solo: ${toLine(operacao.phSolo)}
- CTC: ${toLine(operacao.ctc)}
- Matéria orgânica: ${toLine(operacao.materiaOrganica)}%
- Saturação por bases: ${toLine(operacao.saturacaoBases)}%
- Teor de argila: ${toLine(operacao.teorArgila)}%
- Chuva 7 dias: ${toLine(analise.chuva7dMm)} mm
- Produtividade alvo: ${toLine(operacao.produtividadeAlvo)}
- Dólar: ${toCurrency(mercado.dolarPtax)}
- MAP: ${toCurrency(mercado.custoMapTon)}/t
- KCL: ${toCurrency(mercado.custoKclTon)}/t
- UREIA: ${toCurrency(mercado.custoUreaTon)}/t
- Status do sistema: ${toLine(veredito?.status)}
- Justificativa: ${toLine(veredito?.justificativa)}
- Fator limitante técnico/pedoclimático: ${fatorLimitanteTecnico}
- Fator limitante econômico: ${fatorLimitanteEconomico}
- Sistema produtivo: ${toLine(veredito?.analiseSazonal?.sistemaProdutivo)}
- Plausibilidade sazonal: ${toLine(veredito?.analiseSazonal?.plausibilidade)}
- Janela padrão: ${toLine(veredito?.analiseSazonal?.janelaEsperada)}
- Observação sazonal: ${toLine(veredito?.analiseSazonal?.observacao)}
- Classificação financeira: ${toLine(veredito?.classificacaoFinanceira)}
- Leitura de pH: ${leituraPh}
- Leitura de CTC: ${leituraCtc}
- Leitura de matéria orgânica: ${leituraMateriaOrganica}
- Leitura de saturação por bases: ${leituraSaturacaoBases}
- Leitura de textura do solo: ${leituraTexturaSolo}
- Leitura de chuva recente: ${leituraChuvaRecente}
- Severidade complementar: ${severidadeComplementar}
- Custo total: ${toCurrency(veredito?.leituraEconomica?.custoTotalAdubacao)}
- Retorno estimado: ${toCurrency(veredito?.leituraEconomica?.retornoFinanceiroEstimado)}
- ROI incremental: ${
    veredito?.leituraEconomica?.modoAnalise === "NAO_INTERVENCAO_RECOMENDADA"
      ? "N/A"
      : toCurrency(veredito?.leituraEconomica?.roiIncrementalAplicacao)
  }

INSTRUÇÃO VISUAL:
${instrucaoVisual}

FORMATO:
- Inicie com "LAUDO TÉCNICO EXECUTIVO - ${dataAtual}"
- Depois faça:
  **1. Fatos observados**
  **2. Interpretação técnica**
  **3. Diagnóstico complementar do contexto**
  **4. Leitura econômica**
  **5. Conclusão técnica**
- Finalize com:
  PARECER OPERACIONAL:
  **${getParecerOperacionalFinal((veredito?.status || "BLOQUEADO") as StatusSistema)}**
`.trim();
}