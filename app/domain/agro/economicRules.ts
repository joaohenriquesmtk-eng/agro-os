import type {
  AnaliseEspectral,
  DadosOperacionais,
  MercadoFinanceiro,
} from "../../store/useAgroStore";
import type {
  EconomicAssessment,
  ParametrosCultura,
  ParametrosRegionais,
  SoilAssessment,
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getMarketConfidence(statusMercado: "OK" | "PARTIAL" | "DEGRADED"): number {
  if (statusMercado === "OK") return 1;
  if (statusMercado === "PARTIAL") return 0.78;
  return 0.55;
}

export function assessEconomics(
  operacao: DadosOperacionais,
  analise: AnaliseEspectral,
  mercado: MercadoFinanceiro,
  crop: ParametrosCultura,
  region: ParametrosRegionais,
  soil: SoilAssessment
): EconomicAssessment {
  const custoTotal =
    analise.areaEstresseHa *
    ((soil.mapDoseHa * (mercado.custoMapTon / 1000)) +
      (soil.kclDoseHa * (mercado.custoKclTon / 1000)) +
      (soil.ureaDoseHa * (mercado.custoUreaTon / 1000)));

  const marketConfidence = getMarketConfidence(mercado.statusMercado);
  const precoRealMercado = mercado.cotacoes?.[operacao.cultura] || 0;

  const recoverableYieldPerHa =
    operacao.produtividadeAlvo *
    crop.maxRecoverableFraction *
    soil.stageFactor *
    soil.responseConfidence *
    (1 - soil.waterPenalty * 0.7) *
    (1 - soil.pFixationPenalty * 0.35) *
    region.fatorRiscoClimatico;

  const estimatedRecoverableYieldPerHa = clamp(
    recoverableYieldPerHa,
    0,
    operacao.produtividadeAlvo * crop.maxRecoverableFraction
  );

  const retornoEsperado =
    estimatedRecoverableYieldPerHa *
    analise.areaEstresseHa *
    precoRealMercado *
    marketConfidence;

  const roi = retornoEsperado - custoTotal;
  const paybackRatio = custoTotal > 0 ? retornoEsperado / custoTotal : 0;

  return {
    custoTotal,
    retornoEsperado,
    roi,
    paybackRatio,
    marketConfidence,
    estimatedRecoverableYieldPerHa,
  };
}