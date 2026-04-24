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

const CULTURAS = new Set(["SOJA", "MILHO", "CANA", "ALGODAO", "TRIGO"]);
const REGIOES = new Set([
  "NORTE",
  "NORDESTE",
  "CENTRO_OESTE",
  "SUDESTE",
  "SUL",
]);
const STATUS_MERCADO = new Set(["OK", "PARTIAL", "DEGRADED"]);
const STATUS_VEREDITO = new Set(["AUTORIZADO", "RISCO_ELEVADO", "BLOQUEADO"]);
const REPORT_MODES = new Set(["LOCAL", "IA_REFINADA"]);
const MODOS_ANALISE = new Set([
  "INTERVENCAO_PROPOSTA",
  "NAO_INTERVENCAO_RECOMENDADA",
]);
const PLAUSIBILIDADES = new Set(["COERENTE", "ATENCAO", "FORA_DO_PADRAO"]);
const SEVERIDADES = new Set(["BAIXA", "MODERADA", "ALTA"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isOptionalString(value: unknown): value is string | null | undefined {
  return value === null || value === undefined || typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isCulturaBrasil(value: unknown) {
  return typeof value === "string" && CULTURAS.has(value);
}

function isRegiaoBrasil(value: unknown) {
  return typeof value === "string" && REGIOES.has(value);
}

function isStatusMercado(value: unknown) {
  return typeof value === "string" && STATUS_MERCADO.has(value);
}

function isStatusVeredito(value: unknown) {
  return typeof value === "string" && STATUS_VEREDITO.has(value);
}

function isReportMode(value: unknown) {
  return typeof value === "string" && REPORT_MODES.has(value);
}

function isModoAnalise(value: unknown) {
  return typeof value === "string" && MODOS_ANALISE.has(value);
}

function isPlausibilidade(value: unknown) {
  return typeof value === "string" && PLAUSIBILIDADES.has(value);
}

function isSeveridade(value: unknown) {
  return typeof value === "string" && SEVERIDADES.has(value);
}

function isCotacoesPayload(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    isFiniteNumber(value.SOJA) &&
    isFiniteNumber(value.MILHO) &&
    isFiniteNumber(value.CANA) &&
    isFiniteNumber(value.ALGODAO) &&
    isFiniteNumber(value.TRIGO)
  );
}

function isOperacaoPayload(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    isString(value.talhao) &&
    isRegiaoBrasil(value.regiao) &&
    isCulturaBrasil(value.cultura) &&
    isFiniteNumber(value.produtividadeAlvo) &&
    isFiniteNumber(value.fosforoMehlich) &&
    isFiniteNumber(value.potassio) &&
    isFiniteNumber(value.phSolo) &&
    isFiniteNumber(value.ctc) &&
    isFiniteNumber(value.materiaOrganica) &&
    isFiniteNumber(value.saturacaoBases) &&
    isFiniteNumber(value.teorArgila)
  );
}

function isAnalisePayload(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    isFiniteNumber(value.areaEstresseHa) &&
    isString(value.faseFenologica) &&
    isString(value.indice) &&
    isFiniteNumber(value.chuva7dMm)
  );
}

function isMercadoPayload(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    isFiniteNumber(value.dolarPtax) &&
    isCotacoesPayload(value.cotacoes) &&
    isFiniteNumber(value.custoMapTon) &&
    isFiniteNumber(value.custoKclTon) &&
    isFiniteNumber(value.custoUreaTon) &&
    isOptionalString(value.ultimaSincronizacao) &&
    isStatusMercado(value.statusMercado) &&
    isStringArray(value.avisosMercado) &&
    isOptionalString(value.origemDolar) &&
    isOptionalString(value.origemCommodities)
  );
}

function isLeituraEconomicaPayload(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    isModoAnalise(value.modoAnalise) &&
    isFiniteNumber(value.custoTotalAdubacao) &&
    isFiniteNumber(value.retornoFinanceiroEstimado) &&
    (value.margemSobreCusto === null || isFiniteNumber(value.margemSobreCusto)) &&
    isFiniteNumber(value.precoReferencia) &&
    isFiniteNumber(value.custoEvitado) &&
    (value.roiIncrementalAplicacao === null ||
      isFiniteNumber(value.roiIncrementalAplicacao)) &&
    isString(value.observacaoEconomica)
  );
}

function isDiagnosticoSoloPayload(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    isString(value.classeFosforo) &&
    isString(value.classePotassio) &&
    isString(value.pressaoNutricional) &&
    isString(value.leituraPh) &&
    isString(value.leituraCtc) &&
    isString(value.leituraMateriaOrganica) &&
    isString(value.leituraSaturacaoBases) &&
    isString(value.leituraTexturaSolo) &&
    isString(value.leituraChuvaRecente) &&
    isSeveridade(value.severidadeContextoComplementar)
  );
}

function isAnaliseSazonalPayload(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    isPlausibilidade(value.plausibilidade) &&
    isString(value.sistemaProdutivo) &&
    isString(value.janelaEsperada) &&
    isString(value.observacao)
  );
}

function isVereditoPayload(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    isStatusVeredito(value.status) &&
    isFiniteNumber(value.roiEstimado) &&
    isString(value.justificativa) &&
    isString(value.fatorLimitante) &&
    isString(value.fatorLimitanteTecnico) &&
    (value.fatorLimitanteEconomico === null ||
      isString(value.fatorLimitanteEconomico)) &&
    isFiniteNumber(value.doseMapHa) &&
    isFiniteNumber(value.doseKclHa) &&
    isFiniteNumber(value.doseUreaHa) &&
    isFiniteNumber(value.scoreConfianca) &&
    isString(value.classificacaoFinanceira) &&
    isStringArray(value.premissasCriticas) &&
    isStringArray(value.fatoresDeterminantes) &&
    isLeituraEconomicaPayload(value.leituraEconomica) &&
    isDiagnosticoSoloPayload(value.diagnosticoSolo) &&
    isAnaliseSazonalPayload(value.analiseSazonal)
  );
}

function isReportGenerationRequest(value: unknown): value is ReportGenerationRequest {
  if (!isRecord(value)) return false;

  return (
    isOperacaoPayload(value.operacao) &&
    isAnalisePayload(value.analise) &&
    isMercadoPayload(value.mercado) &&
    isVereditoPayload(value.veredito) &&
    (value.imagemBase64 === undefined ||
      value.imagemBase64 === null ||
      isString(value.imagemBase64)) &&
    (value.reportMode === undefined || isReportMode(value.reportMode))
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