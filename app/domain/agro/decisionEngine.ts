import type { DecisionAssessment, EconomicAssessment, SoilAssessment } from "./types";

export function decideOperation(
  soil: SoilAssessment,
  economic: EconomicAssessment
): DecisionAssessment {
  const strongestLimiter =
    soil.limitingFactors[0] || "Conjunto de fatores agronômicos e econômicos";

  if (soil.stageFactor <= 0.08) {
    return {
      status: "BLOQUEADO",
      justificativa:
        "A janela fenológica atual reduz de forma relevante a probabilidade de retorno operacional da adubação via solo.",
      fatorLimitante: strongestLimiter,
    };
  }

  if (economic.marketConfidence < 0.6) {
    return {
      status: "RISCO_ELEVADO",
      justificativa:
        "A leitura econômica encontra-se limitada pela baixa confiabilidade do módulo de mercado no momento.",
      fatorLimitante: strongestLimiter,
    };
  }

  if (economic.roi <= 0 || economic.paybackRatio < 1) {
    return {
      status: "BLOQUEADO",
      justificativa:
        "O custo total da intervenção supera o retorno esperado nas condições atuais de preço, resposta provável e ambiente.",
      fatorLimitante: strongestLimiter,
    };
  }

  if (
    economic.paybackRatio < 1.35 ||
    soil.responseConfidence < 0.58 ||
    soil.waterPenalty > 0.5
  ) {
    return {
      status: "RISCO_ELEVADO",
      justificativa:
        "A intervenção apresenta potencial de retorno, mas com margem estreita e sensibilidade elevada a fatores de solo, clima ou resposta agronômica.",
      fatorLimitante: strongestLimiter,
    };
  }

  return {
    status: "AUTORIZADO",
    justificativa:
      "A recomendação apresenta retorno esperado compatível com o custo da intervenção, dentro de uma janela operacional ainda responsiva.",
    fatorLimitante: strongestLimiter,
  };
}