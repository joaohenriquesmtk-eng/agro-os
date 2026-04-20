import type { AnaliseEspectral, DadosOperacionais } from "../../store/useAgroStore";
import { getNitrogenNeed, getStageResponseFactor } from "./cropRules";
import type {
  ParametrosCultura,
  ParametrosRegionais,
  SoilAssessment,
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function calculatePDeficiency(pAtual: number, pCritico: number): number {
  if (pCritico <= 0) return 0;
  return clamp((pCritico - pAtual) / pCritico, 0, 1);
}

function calculateKDeficiency(
  potassio: number,
  kBaixo: number,
  kMedio: number
): number {
  if (potassio < kBaixo) return 1;
  if (potassio < kMedio) return 0.5;
  return 0.15;
}

function calculatePFixationPenalty(
  teorArgila: number,
  phSolo: number,
  fatorRegional: number
): number {
  const clayFactor = clamp(teorArgila / 70, 0, 1);
  const phPenalty = clamp(Math.abs(phSolo - 5.8) / 2.2, 0, 1);
  return clamp((clayFactor * 0.7 + phPenalty * 0.3) * fatorRegional, 0, 1);
}

function calculateWaterPenalty(chuva7dMm: number, riscoRegional: number): number {
  if (chuva7dMm >= 25) return clamp(0.1 * (2 - riscoRegional), 0.05, 0.2);
  if (chuva7dMm >= 10) return clamp(0.25 * (2 - riscoRegional), 0.1, 0.35);
  if (chuva7dMm >= 5) return clamp(0.45 * (2 - riscoRegional), 0.2, 0.55);
  return clamp(0.65 * (2 - riscoRegional), 0.35, 0.8);
}

function calculateConfidence(params: {
  pDeficiencyIndex: number;
  kDeficiencyIndex: number;
  pFixationPenalty: number;
  waterPenalty: number;
  ctc: number;
  materiaOrganica: number;
  saturacaoBases: number;
  stageFactor: number;
}): number {
  const fertilitySignal =
    params.pDeficiencyIndex * 0.35 + params.kDeficiencyIndex * 0.2;
  const soilSupport =
    clamp(params.ctc / 20, 0, 1) * 0.15 +
    clamp(params.materiaOrganica / 5, 0, 1) * 0.1 +
    clamp(params.saturacaoBases / 70, 0, 1) * 0.1;

  const penalties =
    params.pFixationPenalty * 0.25 + params.waterPenalty * 0.25;

  return clamp(
    0.35 + fertilitySignal + soilSupport + params.stageFactor * 0.2 - penalties,
    0.2,
    0.95
  );
}

export function assessSoilAndRecommendation(
  operacao: DadosOperacionais,
  analise: AnaliseEspectral,
  region: ParametrosRegionais,
  crop: ParametrosCultura
): SoilAssessment {
  const pDeficiencyIndex = calculatePDeficiency(
    operacao.fosforoMehlich,
    region.pCritico
  );

  const kDeficiencyIndex = calculateKDeficiency(
    operacao.potassio,
    region.kBaixo,
    region.kMedio
  );

  const pFixationPenalty = calculatePFixationPenalty(
    operacao.teorArgila,
    operacao.phSolo,
    region.fatorFixacaoP
  );

  const waterPenalty = calculateWaterPenalty(
    analise.chuva7dMm,
    region.fatorRiscoClimatico
  );

  const stageFactor = getStageResponseFactor(analise.faseFenologica);

  const produtividadeFactor =
    operacao.produtividadeAlvo / Math.max(crop.produtividadeBase, 1);

  const baseMap =
    region.doseMapManutencao +
    pDeficiencyIndex * (region.doseMapMax - region.doseMapManutencao);

  const mapDoseHa = Math.max(
    40,
    baseMap *
      produtividadeFactor *
      crop.fatorExtracaoP *
      (1 + pFixationPenalty * 0.35)
  );

  let baseKcl = 40;
  if (kDeficiencyIndex >= 1) baseKcl = 150;
  else if (kDeficiencyIndex >= 0.5) baseKcl = 80;

  const kclDoseHa = baseKcl * produtividadeFactor * crop.fatorDemandaK;

  const ureaDoseHa = getNitrogenNeed(
    operacao.cultura,
    operacao.produtividadeAlvo,
    crop.fatorDemandaN
  );

  const responseConfidence = calculateConfidence({
    pDeficiencyIndex,
    kDeficiencyIndex,
    pFixationPenalty,
    waterPenalty,
    ctc: operacao.ctc,
    materiaOrganica: operacao.materiaOrganica,
    saturacaoBases: operacao.saturacaoBases,
    stageFactor,
  });

  const limitingFactors: string[] = [];

  if (pFixationPenalty > 0.55) limitingFactors.push("Fixação de fósforo");
  if (waterPenalty > 0.45) limitingFactors.push("Restrição hídrica recente");
  if (stageFactor < 0.4) limitingFactors.push("Janela fenológica reduzida");
  if (operacao.ctc < 8) limitingFactors.push("Baixa CTC");
  if (operacao.saturacaoBases < 45) limitingFactors.push("Baixa saturação por bases");

  if (limitingFactors.length === 0) {
    limitingFactors.push(region.descricaoRisco);
  }

  return {
    pDeficiencyIndex,
    kDeficiencyIndex,
    pFixationPenalty,
    waterPenalty,
    stageFactor,
    responseConfidence,
    mapDoseHa,
    kclDoseHa,
    ureaDoseHa,
    limitingFactors,
  };
}