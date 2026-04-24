import type { CulturaBrasil, RegiaoBrasil } from "../store/useAgroStore";
import type { StatusVeredito } from "./agronomy";
import type {
  ProviderAttemptLog,
  ProviderName,
  RouteTelemetrySummary,
} from "./report";
import type { ReportMode } from "./relatorioApi";

export type CachedReportSource = "IA_EXTERNA" | "LOCAL_FALLBACK" | "CACHE";

export interface CachedReportMetadata {
  cultura: CulturaBrasil;
  regiao: RegiaoBrasil;
  faseFenologica: string;
  statusVeredito: StatusVeredito;
  sistemaProdutivo: string | null;

  phSolo: number;
  ctc: number;
  materiaOrganica: number;
  saturacaoBases: number;
  teorArgila: number;
  chuva7dMm: number;

  fatorLimitanteTecnico: string;
  fatorLimitanteEconomico: string | null;
  severidadeContextoComplementar: "BAIXA" | "MODERADA" | "ALTA" | null;

  modoRelatorio: ReportMode;
  possuiMapa: boolean;
  fallback: boolean;
  modeReturned: ReportMode;
  providerUsed: ProviderName | null;
  attemptedProviders: ProviderAttemptLog[];
  routeTelemetry: RouteTelemetrySummary | null;
  telemetryPersisted: boolean;
}

export interface CachedReportRecord {
  signature: string;
  relatorio: string;
  source: CachedReportSource;
  createdAt?: unknown;
  updatedAt?: unknown;
  fingerprint: Record<string, unknown>;
  metadata?: CachedReportMetadata;
}

export type HistoryEntryMode =
  | "CACHE"
  | "LOCAL_DIRETO"
  | "LOCAL_FALLBACK"
  | "MULTIMODAL"
  | "TECNICO";

export interface HistoryFirestoreEntry {
  talhao: string;
  cultura: CulturaBrasil;
  regiao: RegiaoBrasil;
  faseFenologica: string;

  fosforo: number;
  potassio: number;
  phSolo: number;
  ctc: number;
  materiaOrganica: number;
  saturacaoBases: number;
  teorArgila: number;
  chuva7dMm: number;

  areaAfetada: number;
  roiProjetado: number;
  vereditoSistema: StatusVeredito;

  fatorLimitanteTecnico: string;
  fatorLimitanteEconomico: string | null;
  severidadeContextoComplementar: "BAIXA" | "MODERADA" | "ALTA" | null;

  parecerIA: string;
  modo: HistoryEntryMode;
  modoRelatorio: ReportMode;
  providerUsed: ProviderName | null;
  attemptedProviders: ProviderAttemptLog[];
  routeId: string | null;
  totalDurationMs: number | null;
  telemetryPersisted: boolean;
  assinaturaCenario: string;
  sistemaProdutivo: string | null;
  dataRegistro?: unknown;
}