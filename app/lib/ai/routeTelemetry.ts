import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebaseAdmin";
import type { AnaliseEspectral, DadosOperacionais, VereditoFinal } from "../../types/agronomy";
import type {
  ProvidersConfigMap,
  ProvidersHealthMap,
  RouteTelemetrySummary,
} from "../../types/report";

const COLLECTION_NAME = "telemetria_rotas_ia";

interface PersistTechnicalRouteTelemetryInput {
  routeTelemetry: RouteTelemetrySummary | null;
  requestedMode: "IA_REFINADA";
  finalMode: "IA_REFINADA" | "LOCAL";
  warning: string | null;
  providersConfig: ProvidersConfigMap;
  providersHealth: ProvidersHealthMap | null;
  operacao: DadosOperacionais;
  analise: AnaliseEspectral;
  veredito: VereditoFinal;
  possuiMapa: boolean;
}

export async function persistTechnicalRouteTelemetry(
  input: PersistTechnicalRouteTelemetryInput
) {
  try {
    const {
      routeTelemetry,
      requestedMode,
      finalMode,
      warning,
      providersConfig,
      providersHealth,
      operacao,
      analise,
      veredito,
      possuiMapa,
    } = input;

    if (!routeTelemetry?.routeId) {
      return false;
    }

    await getAdminDb()
      .collection(COLLECTION_NAME)
      .doc(routeTelemetry.routeId)
      .set(
        {
          routeId: routeTelemetry.routeId,
          requestedMode,
          finalMode,
          fallback: !!routeTelemetry.fallback,
          providerUsed: routeTelemetry.providerUsed || null,
          totalDurationMs: routeTelemetry.totalDurationMs ?? null,
          startedAt: routeTelemetry.startedAt || null,
          finishedAt: routeTelemetry.finishedAt || null,
          attemptedProviders: routeTelemetry.attemptedProviders || [],
          warning: warning || null,
          providersConfig,
          providersHealth: providersHealth || null,
          contextoOperacional: {
            cultura: operacao.cultura || null,
            regiao: operacao.regiao || null,
            talhao: operacao.talhao || null,
            faseFenologica: analise.faseFenologica || null,
            possuiMapa,
            statusVeredito: veredito.status || null,
            sistemaProdutivo: veredito.analiseSazonal?.sistemaProdutivo || null,
          },
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return true;
  } catch (error) {
    console.error("Falha ao persistir telemetria da rota de IA:", error);
    return false;
  }
}