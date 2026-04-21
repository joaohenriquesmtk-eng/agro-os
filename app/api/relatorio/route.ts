export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { buildLocalTechnicalReport } from "../../domain/agro/localReportBuilder";
import { getProvidersHealth } from "../../lib/providerHealth";
import { getTechnicalReportProviderConfig } from "../../lib/ai/providers";
import { orchestrateRefinedTechnicalReport } from "../../lib/ai/providerOrchestrator";
import { persistTechnicalRouteTelemetry } from "../../lib/ai/routeTelemetry";

type ReportMode = "LOCAL" | "IA_REFINADA";

function buildLocalResponse(input: {
  operacao: any;
  analise: any;
  mercado: any;
  veredito: any;
  origem: string;
  fallback: boolean;
  warning?: string | null;
  attemptedProviders?: any[];
  routeTelemetry?: any | null;
  telemetryPersisted?: boolean;
  providersHealth?: any;
  providersConfig?: any;
}) {
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

  return NextResponse.json({
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
  });
}

export async function GET() {
  return NextResponse.json({
    providersHealth: await getProvidersHealth(["GEMINI", "OPENROUTER", "OPENAI"]),
    providersConfig: getTechnicalReportProviderConfig(),
  });
}

export async function POST(req: Request) {
  let dados: any = null;

  try {
    dados = await req.json();

    const {
      operacao,
      analise,
      mercado,
      veredito,
      imagemBase64,
      reportMode = "IA_REFINADA",
    } = dados as {
      operacao: any;
      analise: any;
      mercado: any;
      veredito: any;
      imagemBase64?: string | null;
      reportMode?: ReportMode;
    };

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
      providersHealth: orchestration.providersHealth as Record<string, unknown>,
      operacao,
      analise,
      veredito,
      possuiMapa: !!imagemBase64,
    });

    if (orchestration.ok) {
      return NextResponse.json({
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
      });
    }

    const relatorioLocal = buildLocalTechnicalReport({
      operacao,
      analise,
      mercado,
      veredito,
      origem: "FALLBACK LOCAL APÓS ESGOTAR ROTA EXTERNA",
    });

    return NextResponse.json({
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
    });
  } catch (error: any) {
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

    return NextResponse.json(
      {
        error: error?.message || "Falha interna ao processar a solicitação.",
      },
      { status: 500 }
    );
  }
}