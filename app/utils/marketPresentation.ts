import type { CulturaBrasil, MercadoFinanceiro } from "../store/useAgroStore";

export function getMarketUnit(cultura: CulturaBrasil) {
  switch (cultura) {
    case "SOJA":
    case "MILHO":
    case "TRIGO":
      return "R$/sc";
    case "ALGODAO":
      return "R$/@";
    case "CANA":
      return "R$/t";
    default:
      return "R$/un";
  }
}

export function getMarketLabel(
  cultura: CulturaBrasil,
  statusMercado: "OK" | "PARTIAL" | "DEGRADED"
) {
  if (statusMercado === "OK") {
    return `${cultura} (Mercado)`;
  }

  if (statusMercado === "PARTIAL") {
    return `${cultura} (Ref. Parametrizada)`;
  }

  return `${cultura} (Estimado)`;
}

export function buildMarketAlertText(
  mercado: MercadoFinanceiro,
  cultura: CulturaBrasil,
  precoCulturaAtual: number,
  unidadeMercadoAtual: string
) {
  if (mercado.dolarPtax > 0) {
    return `O dólar de referência está em R$ ${mercado.dolarPtax.toFixed(
      2
    )}. A cotação atual de ${cultura} está em R$ ${precoCulturaAtual.toFixed(
      2
    )}/${unidadeMercadoAtual.replace(
      "R$/",
      ""
    )}. O motor N-P-K utiliza esses valores para estimar o impacto econômico da recomendação técnica, respeitando o status atual de integridade do módulo de mercado.`;
  }

  return "O módulo de mercado aguarda a primeira sincronização. Faça a leitura dos dados antes de emitir o parecer técnico.";
}