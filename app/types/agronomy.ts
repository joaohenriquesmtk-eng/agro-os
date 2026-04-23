export type {
  AnaliseEspectral,
  DadosOperacionais,
  MercadoFinanceiro,
} from "../store/useAgroStore";

import type {
  AnaliseEspectral,
  DadosOperacionais,
  MercadoFinanceiro,
} from "../store/useAgroStore";
import type { SeasonalAnalysis } from "../domain/agro/seasonality";

export type StatusVeredito = "AUTORIZADO" | "RISCO_ELEVADO" | "BLOQUEADO";

export type ModoAnaliseEconomica =
  | "INTERVENCAO_PROPOSTA"
  | "NAO_INTERVENCAO_RECOMENDADA";

export interface VereditoLeituraEconomica {
  modoAnalise: ModoAnaliseEconomica;
  custoTotalAdubacao: number;
  retornoFinanceiroEstimado: number;
  margemSobreCusto: number | null;
  precoReferencia: number;
  custoEvitado: number;
  roiIncrementalAplicacao: number | null;
  observacaoEconomica: string;
}

export interface VereditoDiagnosticoSolo {
  classeFosforo: string;
  classePotassio: string;
  pressaoNutricional: string;
}

export interface VereditoFinal {
  status: StatusVeredito;
  roiEstimado: number;
  justificativa: string;
  fatorLimitante: string;
  doseMapHa: number;
  doseKclHa: number;
  doseUreaHa: number;
  scoreConfianca: number;
  classificacaoFinanceira: string;
  premissasCriticas: string[];
  fatoresDeterminantes: string[];
  leituraEconomica: VereditoLeituraEconomica;
  diagnosticoSolo: VereditoDiagnosticoSolo;
  analiseSazonal: SeasonalAnalysis;
}

export interface TechnicalReportScenario {
  operacao: DadosOperacionais;
  analise: AnaliseEspectral;
  mercado: MercadoFinanceiro;
  veredito: VereditoFinal;
}