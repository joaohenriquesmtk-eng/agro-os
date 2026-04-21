import {
  getProviderAttemptState,
  getProvidersHealth,
  registerProviderFailure,
  registerProviderSuccess,
  type ProviderHealthSnapshot,
  type ProviderName,
} from "../providerHealth";
import {
  TECHNICAL_REPORT_PROVIDERS,
  getTechnicalReportProviderConfig,
} from "./providers";
import type {
  ReportGenerationInput,
  ReportProviderName,
} from "./providers/types";

export type ProviderAttemptOutcome =
  | "SUCCESS"
  | "FAILED"
  | "SKIPPED_UNCONFIGURED"
  | "SKIPPED_COOLDOWN";

export interface ProviderAttemptLog {
  provider: ReportProviderName;
  outcome: ProviderAttemptOutcome;
  modelConfigured: string | null;
  modelUsed: string | null;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
  httpStatus: number | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface RouteTelemetrySummary {
  routeId: string;
  startedAt: string;
  finishedAt: string;
  totalDurationMs: number;
  providerUsed: ReportProviderName | null;
  fallback: boolean;
  attemptedProviders: ProviderAttemptLog[];
}

interface OrchestratedSuccessResult {
  ok: true;
  relatorio: string;
  providerUsed: ReportProviderName;
  attemptedProviders: ProviderAttemptLog[];
  providersHealth: Partial<Record<ProviderName, ProviderHealthSnapshot>>;
  providersConfig: Record<ProviderName, boolean>;
  warning: string | null;
  routeTelemetry: RouteTelemetrySummary;
}

interface OrchestratedFailureResult {
  ok: false;
  attemptedProviders: ProviderAttemptLog[];
  providersHealth: Partial<Record<ProviderName, ProviderHealthSnapshot>>;
  providersConfig: Record<ProviderName, boolean>;
  warning: string;
  routeTelemetry: RouteTelemetrySummary;
}

export type OrchestratedTechnicalReportResult =
  | OrchestratedSuccessResult
  | OrchestratedFailureResult;

function getProviderLabel(provider: ReportProviderName) {
  switch (provider) {
    case "GEMINI":
      return "Gemini";
    case "OPENROUTER":
      return "OpenRouter";
    case "OPENAI":
      return "OpenAI";
    default:
      return provider;
  }
}

function formatCooldownUntil(value: string | null) {
  if (!value) return "horário não disponível";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "horário não disponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildSuccessWarning(
  providerUsed: ReportProviderName,
  attempts: ProviderAttemptLog[]
) {
  if (providerUsed === "GEMINI") return null;

  const previousAttempts = attempts.filter(
    (attempt) =>
      attempt.provider !== providerUsed &&
      attempt.outcome !== "SUCCESS"
  );

  if (!previousAttempts.length) {
    return `O refinamento externo foi executado via ${getProviderLabel(providerUsed)}.`;
  }

  return `Gemini indisponível nesta execução. O Agro OS roteou automaticamente o refinamento via ${getProviderLabel(
    providerUsed
  )}.`;
}

function buildFailureWarning(
  attempts: ProviderAttemptLog[],
  providersConfig: Record<ProviderName, boolean>
) {
  const anyConfigured = Object.values(providersConfig).some(Boolean);

  if (!anyConfigured) {
    return "Nenhum provedor externo está configurado. O Agro OS gerou o laudo em modo local.";
  }

  const hasCooldownOnly = attempts.every(
    (attempt) =>
      attempt.outcome === "SKIPPED_COOLDOWN" ||
      attempt.outcome === "SKIPPED_UNCONFIGURED"
  );

  if (hasCooldownOnly) {
    return "Todos os provedores externos configurados estão em cooldown preventivo. O Agro OS gerou o laudo em modo local.";
  }

  return "A rota de IA refinada foi esgotada sem sucesso. O Agro OS gerou o laudo em modo local.";
}

function buildRouteTelemetry(params: {
  routeId: string;
  routeStartedAt: string;
  routeStartedMs: number;
  attemptedProviders: ProviderAttemptLog[];
  providerUsed: ReportProviderName | null;
  fallback: boolean;
}): RouteTelemetrySummary {
  const finishedAt = new Date().toISOString();

  return {
    routeId: params.routeId,
    startedAt: params.routeStartedAt,
    finishedAt,
    totalDurationMs: Date.now() - params.routeStartedMs,
    providerUsed: params.providerUsed,
    fallback: params.fallback,
    attemptedProviders: params.attemptedProviders,
  };
}

export async function orchestrateRefinedTechnicalReport(
  input: ReportGenerationInput
): Promise<OrchestratedTechnicalReportResult> {
  const routeId = crypto.randomUUID();
  const routeStartedAt = new Date().toISOString();
  const routeStartedMs = Date.now();

  const attemptedProviders: ProviderAttemptLog[] = [];
  const providersConfig = getTechnicalReportProviderConfig();
  const providersHealth =
    await getProvidersHealth(["GEMINI", "OPENROUTER", "OPENAI"]);

  for (const providerAdapter of TECHNICAL_REPORT_PROVIDERS) {
    const provider = providerAdapter.provider;
    const modelConfigured = providerAdapter.getConfiguredModel();

    if (!providersConfig[provider]) {
      const instant = new Date().toISOString();

      attemptedProviders.push({
        provider,
        outcome: "SKIPPED_UNCONFIGURED",
        modelConfigured,
        modelUsed: null,
        durationMs: 0,
        startedAt: instant,
        finishedAt: instant,
        httpStatus: null,
        errorCode: "NOT_CONFIGURED",
        errorMessage: `${getProviderLabel(provider)} não configurado.`,
      });
      continue;
    }

    const attemptState = await getProviderAttemptState(provider);
    providersHealth[provider] = attemptState.health;

    if (!attemptState.canAttempt) {
      const instant = new Date().toISOString();

      attemptedProviders.push({
        provider,
        outcome: "SKIPPED_COOLDOWN",
        modelConfigured,
        modelUsed: null,
        durationMs: 0,
        startedAt: instant,
        finishedAt: instant,
        httpStatus: attemptState.health.lastHttpStatus,
        errorCode: attemptState.health.lastErrorCode,
        errorMessage: `${getProviderLabel(
          provider
        )} em ${attemptState.health.status} até ${formatCooldownUntil(
          attemptState.health.cooldownUntil
        )}.`,
      });
      continue;
    }

    const attemptStartedAt = new Date().toISOString();
    const attemptStartedMs = Date.now();

    const result = await providerAdapter.generate(input);

    const durationMs = Date.now() - attemptStartedMs;
    const finishedAt = new Date().toISOString();

    if (result.ok) {
      providersHealth[provider] = await registerProviderSuccess(provider);

      attemptedProviders.push({
        provider,
        outcome: "SUCCESS",
        modelConfigured,
        modelUsed: result.data.modelUsed ?? modelConfigured,
        durationMs,
        startedAt: attemptStartedAt,
        finishedAt,
        httpStatus: 200,
        errorCode: null,
        errorMessage: null,
      });

      const routeTelemetry = buildRouteTelemetry({
        routeId,
        routeStartedAt,
        routeStartedMs,
        attemptedProviders,
        providerUsed: provider,
        fallback: false,
      });

      return {
        ok: true,
        relatorio: result.data.relatorio,
        providerUsed: provider,
        attemptedProviders,
        providersHealth: await getProvidersHealth(["GEMINI", "OPENROUTER", "OPENAI"]),
        providersConfig,
        warning: buildSuccessWarning(provider, attemptedProviders),
        routeTelemetry,
      };
    }

    providersHealth[provider] = await registerProviderFailure(provider, {
      httpStatus: result.error.httpStatus ?? null,
      errorCode: result.error.errorCode ?? null,
      errorMessage: result.error.errorMessage,
    });

    attemptedProviders.push({
      provider,
      outcome: "FAILED",
      modelConfigured,
      modelUsed: null,
      durationMs,
      startedAt: attemptStartedAt,
      finishedAt,
      httpStatus: result.error.httpStatus ?? null,
      errorCode: result.error.errorCode ?? null,
      errorMessage: result.error.errorMessage,
    });
  }

  const routeTelemetry = buildRouteTelemetry({
    routeId,
    routeStartedAt,
    routeStartedMs,
    attemptedProviders,
    providerUsed: null,
    fallback: true,
  });

  return {
    ok: false,
    attemptedProviders,
    providersHealth: await getProvidersHealth(["GEMINI", "OPENROUTER", "OPENAI"]),
    providersConfig,
    warning: buildFailureWarning(attemptedProviders, providersConfig),
    routeTelemetry,
  };
}