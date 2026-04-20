import type { CulturaBrasil, RegiaoBrasil } from "../../store/useAgroStore";

export type ProductionSystem =
  | "GRAO_PRINCIPAL"
  | "MILHO_VERAO"
  | "MILHO_SAFRINHA"
  | "TRIGO_INVERNO"
  | "ALGODAO_PRINCIPAL"
  | "CANA_PERENE";

export interface CultureProfile {
  cultura: CulturaBrasil;
  productionSystem: ProductionSystem;
  productionLabel: string;
  nutrientPriority: {
    p: number;
    k: number;
    n: number;
  };
  annualCycleType: "ANUAL" | "PERENE";
  productivityBase: number;
  tetoGanhoRelativo: number;
  baseResponse: {
    p: number;
    k: number;
    n: number;
  };
  phaseWeights: {
    inicial: number;
    vegetativo: number;
    reprodutivo: number;
    enchimento: number;
    maturacao: number;
  };
  adequacyCaps: {
    mapAdequado: number;
    kclAdequado: number;
  };
  baseDoses: {
    pMuitoBaixo: number;
    pBaixo: number;
    pMedio: number;
    pAdequado: number;
    kMuitoBaixo: number;
    kBaixo: number;
    kMedio: number;
    kAdequado: number;
    nBase: number;
  };
  economicSensitivity: number;
}

function isMilhoSafrinhaMonth(regiao: RegiaoBrasil, month: number) {
  if (regiao === "CENTRO_OESTE") return [0, 1, 2, 3, 4, 5, 6].includes(month);
  if (regiao === "SUDESTE") return [0, 1, 2, 3, 4, 5].includes(month);
  if (regiao === "SUL") return [0, 1, 2, 3].includes(month);
  return [0, 1, 2, 3].includes(month);
}

function buildSojaProfile(): CultureProfile {
  return {
    cultura: "SOJA",
    productionSystem: "GRAO_PRINCIPAL",
    productionLabel: "Soja primeira safra",
    nutrientPriority: { p: 1.0, k: 0.82, n: 0.1 },
    annualCycleType: "ANUAL",
    productivityBase: 60,
    tetoGanhoRelativo: 0.22,
    baseResponse: { p: 1.0, k: 0.82, n: 0.08 },
    phaseWeights: {
      inicial: 1.0,
      vegetativo: 0.9,
      reprodutivo: 0.55,
      enchimento: 0.2,
      maturacao: 0.05,
    },
    adequacyCaps: {
      mapAdequado: 12,
      kclAdequado: 12,
    },
    baseDoses: {
      pMuitoBaixo: 190,
      pBaixo: 130,
      pMedio: 80,
      pAdequado: 18,
      kMuitoBaixo: 140,
      kBaixo: 100,
      kMedio: 60,
      kAdequado: 15,
      nBase: 0,
    },
    economicSensitivity: 1,
  };
}

function buildMilhoProfile(system: ProductionSystem): CultureProfile {
  const isSafrinha = system === "MILHO_SAFRINHA";

  return {
    cultura: "MILHO",
    productionSystem: system,
    productionLabel: isSafrinha ? "Milho safrinha" : "Milho verão",
    nutrientPriority: {
      p: isSafrinha ? 0.8 : 0.9,
      k: isSafrinha ? 0.95 : 1.0,
      n: 1.2,
    },
    annualCycleType: "ANUAL",
    productivityBase: isSafrinha ? 95 : 110,
    tetoGanhoRelativo: isSafrinha ? 0.14 : 0.2,
    baseResponse: {
      p: isSafrinha ? 0.72 : 0.82,
      k: isSafrinha ? 0.86 : 0.96,
      n: isSafrinha ? 0.95 : 1.05,
    },
    phaseWeights: {
      inicial: isSafrinha ? 0.92 : 1.0,
      vegetativo: isSafrinha ? 1.0 : 0.96,
      reprodutivo: isSafrinha ? 0.58 : 0.65,
      enchimento: isSafrinha ? 0.22 : 0.28,
      maturacao: 0.05,
    },
    adequacyCaps: {
      mapAdequado: isSafrinha ? 8 : 12,
      kclAdequado: isSafrinha ? 14 : 18,
    },
    baseDoses: {
      pMuitoBaixo: isSafrinha ? 125 : 150,
      pBaixo: isSafrinha ? 95 : 120,
      pMedio: isSafrinha ? 48 : 65,
      pAdequado: isSafrinha ? 8 : 12,
      kMuitoBaixo: isSafrinha ? 110 : 125,
      kBaixo: isSafrinha ? 78 : 92,
      kMedio: isSafrinha ? 40 : 52,
      kAdequado: isSafrinha ? 14 : 18,
      nBase: isSafrinha ? 90 : 115,
    },
    economicSensitivity: isSafrinha ? 1.08 : 1,
  };
}

function buildTrigoProfile(): CultureProfile {
  return {
    cultura: "TRIGO",
    productionSystem: "TRIGO_INVERNO",
    productionLabel: "Trigo de inverno",
    nutrientPriority: { p: 0.9, k: 0.72, n: 1.05 },
    annualCycleType: "ANUAL",
    productivityBase: 60,
    tetoGanhoRelativo: 0.16,
    baseResponse: { p: 0.84, k: 0.7, n: 0.95 },
    phaseWeights: {
      inicial: 0.92,
      vegetativo: 1.0,
      reprodutivo: 0.62,
      enchimento: 0.24,
      maturacao: 0.05,
    },
    adequacyCaps: {
      mapAdequado: 10,
      kclAdequado: 12,
    },
    baseDoses: {
      pMuitoBaixo: 135,
      pBaixo: 100,
      pMedio: 55,
      pAdequado: 10,
      kMuitoBaixo: 90,
      kBaixo: 65,
      kMedio: 38,
      kAdequado: 12,
      nBase: 80,
    },
    economicSensitivity: 1.02,
  };
}

function buildAlgodaoProfile(): CultureProfile {
  return {
    cultura: "ALGODAO",
    productionSystem: "ALGODAO_PRINCIPAL",
    productionLabel: "Algodão principal",
    nutrientPriority: { p: 0.95, k: 1.05, n: 0.95 },
    annualCycleType: "ANUAL",
    productivityBase: 250,
    tetoGanhoRelativo: 0.14,
    baseResponse: { p: 0.9, k: 0.95, n: 0.88 },
    phaseWeights: {
      inicial: 0.9,
      vegetativo: 1.0,
      reprodutivo: 0.72,
      enchimento: 0.3,
      maturacao: 0.08,
    },
    adequacyCaps: {
      mapAdequado: 14,
      kclAdequado: 18,
    },
    baseDoses: {
      pMuitoBaixo: 160,
      pBaixo: 120,
      pMedio: 70,
      pAdequado: 14,
      kMuitoBaixo: 130,
      kBaixo: 92,
      kMedio: 55,
      kAdequado: 18,
      nBase: 70,
    },
    economicSensitivity: 1.06,
  };
}

function buildCanaProfile(): CultureProfile {
  return {
    cultura: "CANA",
    productionSystem: "CANA_PERENE",
    productionLabel: "Cana-de-açúcar perene",
    nutrientPriority: { p: 0.62, k: 0.95, n: 0.88 },
    annualCycleType: "PERENE",
    productivityBase: 90,
    tetoGanhoRelativo: 0.12,
    baseResponse: { p: 0.58, k: 0.86, n: 0.8 },
    phaseWeights: {
      inicial: 0.88,
      vegetativo: 1.0,
      reprodutivo: 0.72,
      enchimento: 0.45,
      maturacao: 0.25,
    },
    adequacyCaps: {
      mapAdequado: 16,
      kclAdequado: 20,
    },
    baseDoses: {
      pMuitoBaixo: 120,
      pBaixo: 88,
      pMedio: 48,
      pAdequado: 16,
      kMuitoBaixo: 150,
      kBaixo: 110,
      kMedio: 72,
      kAdequado: 20,
      nBase: 65,
    },
    economicSensitivity: 1,
  };
}

export function resolveCultureProfile(
  cultura: CulturaBrasil,
  regiao: RegiaoBrasil,
  currentDate = new Date()
): CultureProfile {
  const month = currentDate.getMonth();

  switch (cultura) {
    case "SOJA":
      return buildSojaProfile();
    case "MILHO":
      return buildMilhoProfile(
        isMilhoSafrinhaMonth(regiao, month) ? "MILHO_SAFRINHA" : "MILHO_VERAO"
      );
    case "TRIGO":
      return buildTrigoProfile();
    case "ALGODAO":
      return buildAlgodaoProfile();
    case "CANA":
      return buildCanaProfile();
    default:
      return buildSojaProfile();
  }
}