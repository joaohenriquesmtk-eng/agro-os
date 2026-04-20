import type { CulturaBrasil } from "../../store/useAgroStore";
import type { ParametrosCultura } from "./types";

export function getCropParameters(cultura: CulturaBrasil): ParametrosCultura {
  const config: Record<CulturaBrasil, ParametrosCultura> = {
    SOJA: {
      cultura: "SOJA",
      unidade: "sc/ha",
      produtividadeBase: 60,
      fatorExtracaoP: 1.0,
      fatorDemandaK: 1.0,
      fatorDemandaN: 0,
      maxRecoverableFraction: 0.18,
    },
    MILHO: {
      cultura: "MILHO",
      unidade: "sc/ha",
      produtividadeBase: 100,
      fatorExtracaoP: 0.6,
      fatorDemandaK: 1.1,
      fatorDemandaN: 1.0,
      maxRecoverableFraction: 0.22,
    },
    TRIGO: {
      cultura: "TRIGO",
      unidade: "sc/ha",
      produtividadeBase: 60,
      fatorExtracaoP: 0.7,
      fatorDemandaK: 0.8,
      fatorDemandaN: 0.9,
      maxRecoverableFraction: 0.16,
    },
    ALGODAO: {
      cultura: "ALGODAO",
      unidade: "@ / ha",
      produtividadeBase: 250,
      fatorExtracaoP: 0.85,
      fatorDemandaK: 1.15,
      fatorDemandaN: 0.95,
      maxRecoverableFraction: 0.15,
    },
    CANA: {
      cultura: "CANA",
      unidade: "TCH",
      produtividadeBase: 90,
      fatorExtracaoP: 0.4,
      fatorDemandaK: 1.2,
      fatorDemandaN: 0.85,
      maxRecoverableFraction: 0.12,
    },
  };

  return config[cultura];
}

export function getStageResponseFactor(fase: string): number {
  const faseNormalizada = fase.toUpperCase();

  if (
    faseNormalizada.includes("EMERGÊNCIA") ||
    faseNormalizada.includes("VEGETATIVO") ||
    faseNormalizada.includes("BROTAÇÃO") ||
    faseNormalizada.includes("GERMINAÇÃO")
  ) {
    return 1.0;
  }

  if (
    faseNormalizada.includes("FLORAÇÃO") ||
    faseNormalizada.includes("PENDOAMENTO") ||
    faseNormalizada.includes("CRESCIMENTO") ||
    faseNormalizada.includes("BOTÃO FLORAL") ||
    faseNormalizada.includes("PERFILHAMENTO")
  ) {
    return 0.65;
  }

  if (
    faseNormalizada.includes("ENCHIMENTO") ||
    faseNormalizada.includes("MAÇÃ") ||
    faseNormalizada.includes("ELONGAÇÃO")
  ) {
    return 0.3;
  }

  if (
    faseNormalizada.includes("MATURAÇÃO") ||
    faseNormalizada.includes("ESPIGAMENTO")
  ) {
    return 0.05;
  }

  return 0.75;
}

export function getNitrogenNeed(
  cultura: CulturaBrasil,
  produtividadeAlvo: number,
  fatorDemandaN: number
): number {
  if (cultura === "SOJA") return 0;

  const demandaBase = produtividadeAlvo * 0.6 * 1.5 * fatorDemandaN;
  return Math.min(demandaBase, 350);
}