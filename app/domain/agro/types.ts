import type {
  AnaliseEspectral,
  CulturaBrasil,
  DadosOperacionais,
  RegiaoBrasil,
} from "../../store/useAgroStore";

export interface ParametrosRegionais {
  regiao: RegiaoBrasil;
  pCritico: number;
  kBaixo: number;
  kMedio: number;
  doseMapMax: number;
  doseMapManutencao: number;
  fatorRiscoClimatico: number;
  fatorFixacaoP: number;
  descricaoRisco: string;
}

export interface ParametrosCultura {
  cultura: CulturaBrasil;
  unidade: string;
  produtividadeBase: number;
  fatorExtracaoP: number;
  fatorDemandaK: number;
  fatorDemandaN: number;
  maxRecoverableFraction: number;
}

export interface SoilAssessment {
  pDeficiencyIndex: number;
  kDeficiencyIndex: number;
  pFixationPenalty: number;
  waterPenalty: number;
  stageFactor: number;
  responseConfidence: number;
  mapDoseHa: number;
  kclDoseHa: number;
  ureaDoseHa: number;
  limitingFactors: string[];
}

export interface EconomicAssessment {
  custoTotal: number;
  retornoEsperado: number;
  roi: number;
  paybackRatio: number;
  marketConfidence: number;
  estimatedRecoverableYieldPerHa: number;
}

export interface DecisionAssessment {
  status: "AUTORIZADO" | "RISCO_ELEVADO" | "BLOQUEADO";
  justificativa: string;
  fatorLimitante: string;
}

export interface VereditoFinal {
  status: "AUTORIZADO" | "RISCO_ELEVADO" | "BLOQUEADO";
  roiEstimado: number;
  justificativa: string;
  fatorLimitante: string;
  doseMapHa: number;
  doseKclHa: number;
  doseUreaHa: number;
}

export interface EngineContext {
  operacao: DadosOperacionais;
  analise: AnaliseEspectral;
}