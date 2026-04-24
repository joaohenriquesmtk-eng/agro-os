"use client";

import { useEffect, useRef, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { buildLocalTechnicalReport } from "../domain/agro/localReportBuilder";
import { buildScenarioSignature } from "../domain/agro/scenarioSignature";
import { readCachedReport, writeCachedReport } from "../lib/reportCache";
import type {
  CachedReportMetadata,
  HistoryEntryMode,
  HistoryFirestoreEntry,
} from "../types/persistence";
import type { DadosOperacionais, AnaliseEspectral, MercadoFinanceiro, VereditoFinal } from "../types/agronomy";
import type {
  ProviderAttemptLog,
  ProviderName,
  ProvidersConfigMap,
  ProvidersHealthMap,
  ReportRuntimeState,
  RouteTelemetrySummary,
} from "../types/report";
import type {
  RelatorioApiErrorResponse,
  RelatorioApiSuccessResponse,
  ReportMode,
} from "../types/relatorioApi";

function buildCacheMetadata(params: {
  operacao: DadosOperacionais;
  analise: AnaliseEspectral;
  veredito: VereditoFinal;
  reportMode: ReportMode;
  imagemMapa: string | null;
  fallback: boolean;
  modeReturned: ReportMode;
  providerUsed: ProviderName | null;
  attemptedProviders: ProviderAttemptLog[];
  routeTelemetry: RouteTelemetrySummary | null;
  telemetryPersisted: boolean;
}): CachedReportMetadata {
  const {
    operacao,
    analise,
    veredito,
    reportMode,
    imagemMapa,
    fallback,
    modeReturned,
    providerUsed,
    attemptedProviders,
    routeTelemetry,
    telemetryPersisted,
  } = params;

  return {
    cultura: operacao.cultura,
    regiao: operacao.regiao,
    faseFenologica: analise.faseFenologica,
    statusVeredito: veredito.status,
    sistemaProdutivo: veredito.analiseSazonal?.sistemaProdutivo || null,

    phSolo: operacao.phSolo,
    ctc: operacao.ctc,
    materiaOrganica: operacao.materiaOrganica,
    saturacaoBases: operacao.saturacaoBases,
    teorArgila: operacao.teorArgila,
    chuva7dMm: analise.chuva7dMm,

    fatorLimitanteTecnico:
      veredito.fatorLimitanteTecnico || veredito.fatorLimitante,
    fatorLimitanteEconomico: veredito.fatorLimitanteEconomico ?? null,
    severidadeContextoComplementar:
      veredito.diagnosticoSolo?.severidadeContextoComplementar ?? null,

    modoRelatorio: reportMode,
    possuiMapa: !!imagemMapa,
    fallback,
    modeReturned,
    providerUsed,
    attemptedProviders,
    routeTelemetry,
    telemetryPersisted,
  };
}

function buildHistoryEntry(params: {
  operacao: DadosOperacionais;
  analise: AnaliseEspectral;
  veredito: VereditoFinal;
  parecerIA: string;
  modo: HistoryEntryMode;
  reportMode: ReportMode;
  providerUsed: ProviderName | null;
  attemptedProviders: ProviderAttemptLog[];
  routeTelemetry: RouteTelemetrySummary | null;
  telemetryPersisted: boolean;
  cacheKey: string;
}): HistoryFirestoreEntry {
  const {
    operacao,
    analise,
    veredito,
    parecerIA,
    modo,
    reportMode,
    providerUsed,
    attemptedProviders,
    routeTelemetry,
    telemetryPersisted,
    cacheKey,
  } = params;

  return {
    talhao: operacao.talhao || "Talhão Não Identificado",
    cultura: operacao.cultura,
    regiao: operacao.regiao,
    faseFenologica: analise.faseFenologica,

    fosforo: operacao.fosforoMehlich,
    potassio: operacao.potassio,
    phSolo: operacao.phSolo,
    ctc: operacao.ctc,
    materiaOrganica: operacao.materiaOrganica,
    saturacaoBases: operacao.saturacaoBases,
    teorArgila: operacao.teorArgila,
    chuva7dMm: analise.chuva7dMm,

    areaAfetada: analise.areaEstresseHa,
    roiProjetado: veredito.roiEstimado,
    vereditoSistema: veredito.status,

    fatorLimitanteTecnico:
      veredito.fatorLimitanteTecnico || veredito.fatorLimitante,
    fatorLimitanteEconomico: veredito.fatorLimitanteEconomico ?? null,
    severidadeContextoComplementar:
      veredito.diagnosticoSolo?.severidadeContextoComplementar ?? null,

    parecerIA,
    modo,
    modoRelatorio: reportMode,
    providerUsed,
    attemptedProviders,
    routeId: routeTelemetry?.routeId || null,
    totalDurationMs: routeTelemetry?.totalDurationMs || null,
    telemetryPersisted,
    assinaturaCenario: cacheKey,
    sistemaProdutivo: veredito.analiseSazonal?.sistemaProdutivo || null,
    dataRegistro: serverTimestamp(),
  };
}

interface UseReportGenerationParams {
  operacao: DadosOperacionais;
  analise: AnaliseEspectral;
  mercado: MercadoFinanceiro;
  veredito: VereditoFinal | null;
  imagemMapa: string | null;
  reportMode: ReportMode;
  onProvidersUpdate: (input: {
    providersHealth?: ProvidersHealthMap | null;
    providersConfig?: ProvidersConfigMap;
  }) => void;
}

export function useReportGeneration({
  operacao,
  analise,
  mercado,
  veredito,
  imagemMapa,
  reportMode,
  onProvidersUpdate,
}: UseReportGenerationParams) {
  const [gerandoIA, setGerandoIA] = useState(false);
  const [relatorioExecutivo, setRelatorioExecutivo] = useState<string | null>(null);
  const [reportRuntime, setReportRuntime] = useState<ReportRuntimeState | null>(null);
  const scenarioStateKey = JSON.stringify({
    operacao,
    analise,
    mercado,
    imagemMapa,
    reportMode,
    veredito,
  });

  const latestScenarioKeyRef = useRef(scenarioStateKey);

  useEffect(() => {
    if (latestScenarioKeyRef.current !== scenarioStateKey) {
      latestScenarioKeyRef.current = scenarioStateKey;
      setRelatorioExecutivo(null);
      setReportRuntime(null);
    }
  }, [scenarioStateKey]);

  const handleGerarRelatorioIA = async () => {
    if (!veredito || gerandoIA) return;

    setGerandoIA(true);
    const scenarioKeyAtRequestStart = latestScenarioKeyRef.current;

    const fatorLimitanteTecnico =
      veredito.fatorLimitanteTecnico || veredito.fatorLimitante;

    const fatorLimitanteEconomico =
      veredito.fatorLimitanteEconomico ?? null;

    const severidadeContextoComplementar =
      veredito.diagnosticoSolo?.severidadeContextoComplementar ?? null;

    try {
      const { signature, fingerprint } = await buildScenarioSignature({
        operacao,
        analise,
        mercado,
        veredito,
      });

      const cacheKey = `${signature}_${reportMode}`;
      const cached = await readCachedReport(cacheKey);

      const cachedIsUsable =
        reportMode === "LOCAL"
          ? !!cached?.relatorio
          : cached?.source === "IA_EXTERNA";

      if (cachedIsUsable && cached?.relatorio) {
        const routeTelemetry =
          (cached.metadata?.routeTelemetry as RouteTelemetrySummary | undefined) ?? null;

        const providerUsed =
          (cached.metadata?.providerUsed as ProviderName | undefined) ??
          routeTelemetry?.providerUsed ??
          null;

        const attemptedProviders =
          (cached.metadata?.attemptedProviders as ProviderAttemptLog[] | undefined) ??
          routeTelemetry?.attemptedProviders ??
          [];

        const telemetryPersisted = !!cached.metadata?.telemetryPersisted;

        if (latestScenarioKeyRef.current !== scenarioKeyAtRequestStart) {
          return;
        }

        setRelatorioExecutivo(cached.relatorio);
        setReportRuntime({
          mode: reportMode === "LOCAL" ? "LOCAL" : "IA_REFINADA",
          fallback: false,
          warning: null,
          providerUsed,
          attemptedProviders,
          routeTelemetry,
          telemetryPersisted,
        });

        try {
          const historyEntry = buildHistoryEntry({
            operacao,
            analise,
            veredito,
            parecerIA: cached.relatorio,
            modo: "CACHE",
            reportMode,
            providerUsed,
            attemptedProviders,
            routeTelemetry,
            telemetryPersisted,
            cacheKey,
          });

          await addDoc(collection(db, "historico_talhoes"), historyEntry);
        } catch (dbError) {
          console.error("Erro ao gravar histórico do cache:", dbError);
        }

        alert(`Laudo recuperado do cache técnico do Agro OS (${reportMode}).`);
        return;
      }

      if (reportMode === "LOCAL") {
        const relatorioLocal = buildLocalTechnicalReport({
          operacao,
          analise,
          mercado,
          veredito,
          origem: "MOTOR LOCAL (ACIONAMENTO DIRETO)",
        });

        if (latestScenarioKeyRef.current !== scenarioKeyAtRequestStart) {
          return;
        }

        setRelatorioExecutivo(relatorioLocal);
        setReportRuntime({
          mode: "LOCAL",
          fallback: false,
          warning: null,
          providerUsed: null,
          attemptedProviders: [],
          routeTelemetry: null,
          telemetryPersisted: false,
        });

        try {
          await writeCachedReport({
            signature: cacheKey,
            relatorio: relatorioLocal,
            source: "LOCAL_FALLBACK",
            fingerprint,
            metadata: buildCacheMetadata({
              operacao,
              analise,
              veredito,
              reportMode,
              imagemMapa,
              fallback: false,
              modeReturned: "LOCAL",
              providerUsed: null,
              attemptedProviders: [],
              routeTelemetry: null,
              telemetryPersisted: false,
            }),
          });
        } catch (cacheError) {
          console.error("Erro ao gravar cache local:", cacheError);
        }

        try {
          const historyEntry = buildHistoryEntry({
            operacao,
            analise,
            veredito,
            parecerIA: relatorioLocal,
            modo: "LOCAL_DIRETO",
            reportMode,
            providerUsed: null,
            attemptedProviders: [],
            routeTelemetry: null,
            telemetryPersisted: false,
            cacheKey,
          });

          await addDoc(collection(db, "historico_talhoes"), historyEntry);
        } catch (dbError) {
          console.error("Erro ao gravar histórico local:", dbError);
        }

        return;
      }

      const response = await fetch("/api/relatorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operacao,
          analise,
          mercado,
          veredito,
          imagemBase64: imagemMapa || null,
          possuiMapa: !!imagemMapa,
          reportMode,
        }),
      });

      const data = ((await response.json()) as RelatorioApiSuccessResponse | RelatorioApiErrorResponse);

    if (!("error" in data)) {
    onProvidersUpdate({
        providersHealth: data.providersHealth,
        providersConfig: data.providersConfig,
    });
    }

      if (!response.ok) {
        alert("error" in data ? data.error : "Erro desconhecido na API.");
        return;
      }

      if (!("relatorio" in data) || !data.relatorio) {
        alert("error" in data ? data.error : "Erro desconhecido na API.");
        return;
      }

      const attemptedProviders: ProviderAttemptLog[] = data.attemptedProviders || [];
      const providerUsed: ProviderName | null = data.providerUsed || null;
      const routeTelemetry: RouteTelemetrySummary | null = data.routeTelemetry || null;
      const telemetryPersisted = !!data.telemetryPersisted;

      if (latestScenarioKeyRef.current !== scenarioKeyAtRequestStart) {
        return;
      }

      setRelatorioExecutivo(data.relatorio);
      setReportRuntime({
        mode: data.mode === "IA_REFINADA" ? "IA_REFINADA" : "LOCAL",
        fallback: !!data.fallback,
        warning: data.warning || null,
        providerUsed,
        attemptedProviders,
        routeTelemetry,
        telemetryPersisted,
      });

      if (!data.fallback) {
        try {
          await writeCachedReport({
            signature: cacheKey,
            relatorio: data.relatorio,
            source: "IA_EXTERNA",
            fingerprint,
            metadata: buildCacheMetadata({
              operacao,
              analise,
              veredito,
              reportMode,
              imagemMapa,
              fallback: false,
              modeReturned: data.mode || "IA_REFINADA",
              providerUsed,
              attemptedProviders,
              routeTelemetry,
              telemetryPersisted,
            }),
          });
        } catch (cacheError) {
          console.error("Erro ao gravar cache do relatório:", cacheError);
        }
      }

      try {
        const historyEntry: HistoryFirestoreEntry = {
            talhao: operacao.talhao || "Talhão Não Identificado",
            cultura: operacao.cultura,
            regiao: operacao.regiao,
            faseFenologica: analise.faseFenologica,
            fosforo: operacao.fosforoMehlich,
            potassio: operacao.potassio,
            phSolo: operacao.phSolo,
            ctc: operacao.ctc,
            materiaOrganica: operacao.materiaOrganica,
            saturacaoBases: operacao.saturacaoBases,
            teorArgila: operacao.teorArgila,
            chuva7dMm: analise.chuva7dMm,
            areaAfetada: analise.areaEstresseHa,
            roiProjetado: veredito.roiEstimado,
            vereditoSistema: veredito.status,
            fatorLimitanteTecnico,
            fatorLimitanteEconomico,
            severidadeContextoComplementar,
            parecerIA: data.relatorio,
            modo: data.fallback ? "LOCAL_FALLBACK" : imagemMapa ? "MULTIMODAL" : "TECNICO",
            modoRelatorio: reportMode,
            providerUsed,
            attemptedProviders,
            routeId: routeTelemetry?.routeId || null,
            totalDurationMs: routeTelemetry?.totalDurationMs || null,
            telemetryPersisted,
            assinaturaCenario: cacheKey,
            sistemaProdutivo: veredito.analiseSazonal?.sistemaProdutivo || null,
            dataRegistro: serverTimestamp(),
            };

            await addDoc(collection(db, "historico_talhoes"), historyEntry);
      } catch (dbError) {
        console.error("Erro ao gravar histórico no banco:", dbError);
      }
    } catch (error) {
      console.error("Falha ao gerar relatório:", error);
      alert("Falha de conexão com a API do relatório.");
    } finally {
      setGerandoIA(false);
    }
  };

  return {
    gerandoIA,
    relatorioExecutivo,
    reportRuntime,
    setRelatorioExecutivo,
    setReportRuntime,
    handleGerarRelatorioIA,
  };
}