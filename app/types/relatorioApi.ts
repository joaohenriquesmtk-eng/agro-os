import type { TechnicalReportScenario } from "./agronomy";
import type {
  ProviderAttemptLog,
  ProviderName,
  ProvidersConfigMap,
  ProvidersHealthMap,
  RouteTelemetrySummary,
} from "./report";

export type ReportMode = "LOCAL" | "IA_REFINADA";

export interface ReportGenerationRequest extends TechnicalReportScenario {
  imagemBase64?: string | null;
  reportMode?: ReportMode;
  possuiMapa?: boolean;
}

export interface RelatorioApiSuccessResponse {
  relatorio: string;
  mode: ReportMode;
  fallback: boolean;
  warning: string | null;
  providerUsed: ProviderName | null;
  attemptedProviders: ProviderAttemptLog[];
  routeTelemetry: RouteTelemetrySummary | null;
  telemetryPersisted: boolean;
  providersHealth: ProvidersHealthMap | null;
  providersConfig: ProvidersConfigMap;
}

export interface RelatorioApiErrorResponse {
  error: string;
}