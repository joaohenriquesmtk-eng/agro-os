export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { buildLocalTechnicalReport } from "../../domain/agro/localReportBuilder";
import { getProvidersHealth } from "../../lib/providerHealth";
import { getTechnicalReportProviderConfig } from "../../lib/ai/providers";
import { orchestrateRefinedTechnicalReport } from "../../lib/ai/providerOrchestrator";
import { persistTechnicalRouteTelemetry } from "../../lib/ai/routeTelemetry";
import type { TechnicalReportScenario } from "../../types/agronomy";
import type {
  ProviderAttemptLog,
  ProvidersConfigMap,
  ProvidersHealthMap,
  RouteTelemetrySummary,
} from "../../types/report";
import type {
  ReportGenerationRequest,
  ReportMode,
  RelatorioApiErrorResponse,
  RelatorioApiSuccessResponse,
} from "../../types/relatorioApi";

interface LocalResponseInput extends TechnicalReportScenario {
  origem: string;
  fallback: boolean;
  warning?: string | null;
  attemptedProviders?: ProviderAttemptLog[];
  routeTelemetry?: RouteTelemetrySummary | null;
  telemetryPersisted?: boolean;
  providersHealth?: ProvidersHealthMap | null;
  providersConfig?: ProvidersConfigMap;
}

function isReportGenerationRequest(value: unknown): value is ReportGenerationRequest {
  if (!value || typeof value !== "object") return false;

  const payload = value as Partial<ReportGenerationRequest>;

  return Boolean(
    payload.operacao &&
      payload.analise &&
      payload.mercado &&
      payload.veredito
  );
}

function buildLocalResponse(input: LocalResponseInput) {
  const {
    operacao,
    analise,
    mercado,
    veredito,
    origem,
    fallback,
    warning = null,
    attemptedProviders = [],
    routeTelemetry = null,
    telemetryPersisted = false,
    providersHealth = null,
    providersConfig = getTechnicalReportProviderConfig(),
  } = input;

  const relatorio = buildLocalTechnicalReport({
    operacao,
    analise,
    mercado,
    veredito,
    origem,
  });

  const response: RelatorioApiSuccessResponse = {
    relatorio,
    mode: "LOCAL",
    fallback,
    warning,
    providerUsed: null,
    attemptedProviders,
    routeTelemetry,
    telemetryPersisted,
    providersHealth,
    providersConfig,
  };

  return NextResponse.json(response);
}

export async function GET() {
  return NextResponse.json({
    providersHealth: await getProvidersHealth(["GEMINI", "OPENROUTER", "OPENAI"]),
    providersConfig: getTechnicalReportProviderConfig(),
  });
}

export async function POST(req: Request) {
  let dados: ReportGenerationRequest | null = null;

  try {
    const body = (await req.json()) as unknown;

    if (!isReportGenerationRequest(body)) {
      const response: RelatorioApiErrorResponse = {
        error: "Payload inválido para geração do relatório.",
      };

      return NextResponse.json(response, { status: 400 });
    }

    dados = body;

    const {
      operacao,
      analise,
      mercado,
      veredito,
      imagemBase64,
      reportMode = "IA_REFINADA",
    } = dados;

    if (reportMode === "LOCAL") {
      return buildLocalResponse({
        operacao,
        analise,
        mercado,
        veredito,
        origem: "MOTOR LOCAL",
        fallback: false,
      });
    }

    const orchestration = await orchestrateRefinedTechnicalReport({
      operacao,
      analise,
      mercado,
      veredito,
      imagemBase64: imagemBase64 || null,
    });

    const telemetryPersisted = await persistTechnicalRouteTelemetry({
      routeTelemetry: orchestration.routeTelemetry,
      requestedMode: "IA_REFINADA",
      finalMode: orchestration.ok ? "IA_REFINADA" : "LOCAL",
      warning: orchestration.warning || null,
      providersConfig: orchestration.providersConfig,
      providersHealth: orchestration.providersHealth,
      operacao,
      analise,
      veredito,
      possuiMapa: !!imagemBase64,
    });

    if (orchestration.ok) {
      const response: RelatorioApiSuccessResponse = {
        relatorio: orchestration.relatorio,
        mode: "IA_REFINADA",
        fallback: false,
        warning: orchestration.warning,
        providerUsed: orchestration.providerUsed,
        attemptedProviders: orchestration.attemptedProviders,
        routeTelemetry: orchestration.routeTelemetry,
        telemetryPersisted,
        providersHealth: orchestration.providersHealth,
        providersConfig: orchestration.providersConfig,
      };

      return NextResponse.json(response);
    }

    const relatorioLocal = buildLocalTechnicalReport({
      operacao,
      analise,
      mercado,
      veredito,
      origem: "FALLBACK LOCAL APÓS ESGOTAR ROTA EXTERNA",
    });

    const response: RelatorioApiSuccessResponse = {
      relatorio: relatorioLocal,
      mode: "LOCAL",
      fallback: true,
      warning: orchestration.warning,
      providerUsed: null,
      attemptedProviders: orchestration.attemptedProviders,
      routeTelemetry: orchestration.routeTelemetry,
      telemetryPersisted,
      providersHealth: orchestration.providersHealth,
      providersConfig: orchestration.providersConfig,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Erro interno no servidor Agro OS:", error);

    if (dados?.operacao && dados?.analise && dados?.mercado && dados?.veredito) {
      return buildLocalResponse({
        operacao: dados.operacao,
        analise: dados.analise,
        mercado: dados.mercado,
        veredito: dados.veredito,
        origem: "FALLBACK LOCAL POR EXCEÇÃO INTERNA",
        fallback: true,
        warning:
          "O Agro OS encontrou uma falha interna na rota de IA refinada e retornou para o modo local.",
      });
    }

    const response: RelatorioApiErrorResponse = {
      error:
        error instanceof Error
          ? error.message
          : "Falha interna ao processar a solicitação.",
    };

    return NextResponse.json(response, { status: 500 });
  }
}