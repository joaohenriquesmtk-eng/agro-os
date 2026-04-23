"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProvidersConfigMap, ProvidersHealthMap } from "../types/report";

const defaultProvidersConfig: ProvidersConfigMap = {
  GEMINI: false,
  OPENROUTER: false,
  OPENAI: false,
};

export function useProviderHealth(reportMode: "LOCAL" | "IA_REFINADA") {
  const [providersHealth, setProvidersHealth] = useState<ProvidersHealthMap | null>(null);
  const [providersConfig, setProvidersConfig] = useState<ProvidersConfigMap>(
    defaultProvidersConfig
  );
  const [providerHealthLoading, setProviderHealthLoading] = useState(false);

  const refreshProviderHealth = useCallback(async () => {
    setProviderHealthLoading(true);

    try {
      const response = await fetch("/api/relatorio", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok) {
        if (data?.providersHealth) {
          setProvidersHealth(data.providersHealth);
        }

        if (data?.providersConfig) {
          setProvidersConfig(data.providersConfig);
        }
      }
    } catch (error) {
      console.error("Falha ao atualizar saúde dos provedores:", error);
    } finally {
      setProviderHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProviderHealth();
  }, [refreshProviderHealth]);

  useEffect(() => {
    if (reportMode === "IA_REFINADA") {
      void refreshProviderHealth();
    }
  }, [reportMode, refreshProviderHealth]);

  return {
    providersHealth,
    providersConfig,
    providerHealthLoading,
    setProvidersHealth,
    setProvidersConfig,
    refreshProviderHealth,
  };
}