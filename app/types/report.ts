export type ProviderName = "GEMINI" | "OPENROUTER" | "OPENAI";

export type ProviderHealthStatus =
  | "ONLINE"
  | "RATE_LIMITED"
  | "DEGRADED"
  | "OFFLINE";

export type ProviderHealthSnapshot = {
  provider: ProviderName;
  status: ProviderHealthStatus;
  cooldownUntil: string | null;
  consecutiveFailures: number;
  lastFailureAt: string | null;
  lastSuccessAt: string | null;
  lastHttpStatus: number | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  updatedAt: string;
};

export type ProvidersHealthMap = Partial<Record<ProviderName, ProviderHealthSnapshot>>;
export type ProvidersConfigMap = Record<ProviderName, boolean>;

export type ProviderAttemptLog = {
  provider: ProviderName;
  outcome: "SUCCESS" | "FAILED" | "SKIPPED_UNCONFIGURED" | "SKIPPED_COOLDOWN";
  modelConfigured: string | null;
  modelUsed: string | null;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
  httpStatus: number | null;
  errorCode: string | null;
  errorMessage: string | null;
};

export type RouteTelemetrySummary = {
  routeId: string;
  startedAt: string;
  finishedAt: string;
  totalDurationMs: number;
  providerUsed: ProviderName | null;
  fallback: boolean;
  attemptedProviders: ProviderAttemptLog[];
};

export type ReportRuntimeState = {
  mode: "LOCAL" | "IA_REFINADA";
  fallback: boolean;
  warning: string | null;
  providerUsed: ProviderName | null;
  attemptedProviders: ProviderAttemptLog[];
  routeTelemetry: RouteTelemetrySummary | null;
  telemetryPersisted: boolean;
};

export type HistoryEntry = {
  id: string;
  dataFormatada?: string;
  vereditoSistema?: "AUTORIZADO" | "RISCO_ELEVADO" | "BLOQUEADO" | string;
  talhao?: string;
  modo?: string;
  modoRelatorio?: string;
  parecerIA?: string;
  cultura?: string;
  regiao?: string;
  faseFenologica?: string;
  areaAfetada?: number;
  roiProjetado?: number;
  sistemaProdutivo?: string | null;
  fatorLimitanteTecnico?: string;
  fatorLimitanteEconomico?: string | null;
  severidadeContextoComplementar?: "BAIXA" | "MODERADA" | "ALTA" | null;
  providerUsed?: ProviderName | null;
  totalDurationMs?: number | null;
  telemetryPersisted?: boolean;
  [key: string]: unknown;
};