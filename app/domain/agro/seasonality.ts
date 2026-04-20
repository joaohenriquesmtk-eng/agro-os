import type { CulturaBrasil, RegiaoBrasil } from "../../store/useAgroStore";
import { resolveCultureProfile } from "./cultureProfiles";

export type SeasonalPlausibility = "COERENTE" | "ATENCAO" | "FORA_DO_PADRAO";
type PhaseGroup =
  | "INICIAL"
  | "VEGETATIVO"
  | "REPRODUTIVO"
  | "ENCHIMENTO"
  | "MATURACAO"
  | "PERENE";

export interface SeasonalAnalysis {
  plausibilidade: SeasonalPlausibility;
  grupoFase: PhaseGroup;
  mesAtual: number;
  janelaEsperada: string;
  observacao: string;
  sistemaProdutivo: string;
}

interface SeasonProfile {
  inicial: number[];
  vegetativo: number[];
  reprodutivo: number[];
  enchimento: number[];
  maturacao: number[];
  label: {
    inicial: string;
    vegetativo: string;
    reprodutivo: string;
    enchimento: string;
    maturacao: string;
  };
}

const monthNames = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function includesMonth(months: number[], month: number) {
  return months.includes(month);
}

function normalizePhaseGroup(cultura: CulturaBrasil, fase: string): PhaseGroup {
  if (cultura === "CANA") return "PERENE";

  const f = (fase || "").toUpperCase();

  if (f.includes("EMERGÊNCIA") || f.includes("VE-VC") || f.includes("GERMINAÇÃO")) {
    return "INICIAL";
  }

  if (
    f.includes("VEGETATIVO") ||
    f.includes("V1") ||
    f.includes("V2") ||
    f.includes("V3") ||
    f.includes("V4") ||
    f.includes("V5") ||
    f.includes("V6") ||
    f.includes("V7") ||
    f.includes("V8") ||
    f.includes("BROTAÇÃO") ||
    f.includes("PERFILHAMENTO")
  ) {
    return "VEGETATIVO";
  }

  if (
    f.includes("FLORAÇÃO") ||
    f.includes("R1") ||
    f.includes("R2") ||
    f.includes("PENDOAMENTO") ||
    f.includes("BOTÃO FLORAL")
  ) {
    return "REPRODUTIVO";
  }

  if (
    f.includes("ENCHIMENTO") ||
    f.includes("R3") ||
    f.includes("R4") ||
    f.includes("R5") ||
    f.includes("ELONGAÇÃO") ||
    f.includes("MAÇÃ")
  ) {
    return "ENCHIMENTO";
  }

  return "MATURACAO";
}

function getSeasonProfile(
  regiao: RegiaoBrasil,
  cultura: CulturaBrasil,
  productionSystem: string
): SeasonProfile | null {
  if (cultura === "CANA") return null;

  if (cultura === "MILHO" && productionSystem === "Milho safrinha") {
    const common: Record<RegiaoBrasil, SeasonProfile> = {
      CENTRO_OESTE: {
        inicial: [0, 1],
        vegetativo: [1, 2, 3],
        reprodutivo: [3, 4],
        enchimento: [4, 5],
        maturacao: [5, 6],
        label: {
          inicial: "janeiro a fevereiro",
          vegetativo: "fevereiro a abril",
          reprodutivo: "abril a maio",
          enchimento: "maio a junho",
          maturacao: "junho a julho",
        },
      },
      SUDESTE: {
        inicial: [0, 1],
        vegetativo: [1, 2, 3],
        reprodutivo: [3, 4],
        enchimento: [4, 5],
        maturacao: [5, 6],
        label: {
          inicial: "janeiro a fevereiro",
          vegetativo: "fevereiro a abril",
          reprodutivo: "abril a maio",
          enchimento: "maio a junho",
          maturacao: "junho a julho",
        },
      },
      SUL: {
        inicial: [0, 1],
        vegetativo: [1, 2, 3],
        reprodutivo: [3, 4],
        enchimento: [4, 5],
        maturacao: [5, 6],
        label: {
          inicial: "janeiro a fevereiro",
          vegetativo: "fevereiro a abril",
          reprodutivo: "abril a maio",
          enchimento: "maio a junho",
          maturacao: "junho a julho",
        },
      },
      NORDESTE: {
        inicial: [0, 1],
        vegetativo: [1, 2, 3],
        reprodutivo: [3, 4],
        enchimento: [4, 5],
        maturacao: [5, 6],
        label: {
          inicial: "janeiro a fevereiro",
          vegetativo: "fevereiro a abril",
          reprodutivo: "abril a maio",
          enchimento: "maio a junho",
          maturacao: "junho a julho",
        },
      },
      NORTE: {
        inicial: [0, 1],
        vegetativo: [1, 2, 3],
        reprodutivo: [3, 4],
        enchimento: [4, 5],
        maturacao: [5, 6],
        label: {
          inicial: "janeiro a fevereiro",
          vegetativo: "fevereiro a abril",
          reprodutivo: "abril a maio",
          enchimento: "maio a junho",
          maturacao: "junho a julho",
        },
      },
    };

    return common[regiao];
  }

  const profiles: Record<RegiaoBrasil, Partial<Record<CulturaBrasil, SeasonProfile>>> = {
    CENTRO_OESTE: {
      SOJA: {
        inicial: [9, 10, 11],
        vegetativo: [10, 11, 0],
        reprodutivo: [0, 1],
        enchimento: [1, 2],
        maturacao: [2, 3],
        label: {
          inicial: "outubro a dezembro",
          vegetativo: "novembro a janeiro",
          reprodutivo: "janeiro a fevereiro",
          enchimento: "fevereiro a março",
          maturacao: "março a abril",
        },
      },
      MILHO: {
        inicial: [8, 9],
        vegetativo: [9, 10, 11],
        reprodutivo: [11, 0],
        enchimento: [0, 1],
        maturacao: [1, 2],
        label: {
          inicial: "setembro a outubro",
          vegetativo: "outubro a dezembro",
          reprodutivo: "dezembro a janeiro",
          enchimento: "janeiro a fevereiro",
          maturacao: "fevereiro a março",
        },
      },
      TRIGO: {
        inicial: [3, 4],
        vegetativo: [4, 5, 6],
        reprodutivo: [6, 7],
        enchimento: [7, 8],
        maturacao: [8, 9],
        label: {
          inicial: "abril a maio",
          vegetativo: "maio a julho",
          reprodutivo: "julho a agosto",
          enchimento: "agosto a setembro",
          maturacao: "setembro a outubro",
        },
      },
      ALGODAO: {
        inicial: [10, 11],
        vegetativo: [11, 0, 1],
        reprodutivo: [1, 2, 3],
        enchimento: [3, 4, 5],
        maturacao: [5, 6, 7],
        label: {
          inicial: "novembro a dezembro",
          vegetativo: "dezembro a fevereiro",
          reprodutivo: "fevereiro a abril",
          enchimento: "abril a junho",
          maturacao: "junho a agosto",
        },
      },
    },
    SUL: {
      SOJA: {
        inicial: [9, 10, 11],
        vegetativo: [10, 11, 0],
        reprodutivo: [0, 1],
        enchimento: [1, 2],
        maturacao: [2, 3, 4],
        label: {
          inicial: "outubro a dezembro",
          vegetativo: "novembro a janeiro",
          reprodutivo: "janeiro a fevereiro",
          enchimento: "fevereiro a março",
          maturacao: "março a maio",
        },
      },
      MILHO: {
        inicial: [7, 8, 9],
        vegetativo: [8, 9, 10, 11],
        reprodutivo: [11, 0],
        enchimento: [0, 1],
        maturacao: [1, 2, 3],
        label: {
          inicial: "agosto a outubro",
          vegetativo: "setembro a dezembro",
          reprodutivo: "dezembro a janeiro",
          enchimento: "janeiro a fevereiro",
          maturacao: "fevereiro a abril",
        },
      },
      TRIGO: {
        inicial: [4, 5],
        vegetativo: [5, 6, 7],
        reprodutivo: [7, 8],
        enchimento: [8, 9],
        maturacao: [9, 10],
        label: {
          inicial: "maio a junho",
          vegetativo: "junho a agosto",
          reprodutivo: "agosto a setembro",
          enchimento: "setembro a outubro",
          maturacao: "outubro a novembro",
        },
      },
    },
    SUDESTE: {
      SOJA: {
        inicial: [9, 10, 11],
        vegetativo: [10, 11, 0],
        reprodutivo: [0, 1],
        enchimento: [1, 2],
        maturacao: [2, 3],
        label: {
          inicial: "outubro a dezembro",
          vegetativo: "novembro a janeiro",
          reprodutivo: "janeiro a fevereiro",
          enchimento: "fevereiro a março",
          maturacao: "março a abril",
        },
      },
      MILHO: {
        inicial: [8, 9],
        vegetativo: [9, 10, 11],
        reprodutivo: [11, 0],
        enchimento: [0, 1],
        maturacao: [1, 2],
        label: {
          inicial: "setembro a outubro",
          vegetativo: "outubro a dezembro",
          reprodutivo: "dezembro a janeiro",
          enchimento: "janeiro a fevereiro",
          maturacao: "fevereiro a março",
        },
      },
      TRIGO: {
        inicial: [3, 4],
        vegetativo: [4, 5, 6],
        reprodutivo: [6, 7],
        enchimento: [7, 8],
        maturacao: [8, 9],
        label: {
          inicial: "abril a maio",
          vegetativo: "maio a julho",
          reprodutivo: "julho a agosto",
          enchimento: "agosto a setembro",
          maturacao: "setembro a outubro",
        },
      },
      ALGODAO: {
        inicial: [10, 11],
        vegetativo: [11, 0, 1],
        reprodutivo: [1, 2, 3],
        enchimento: [3, 4, 5],
        maturacao: [5, 6],
        label: {
          inicial: "novembro a dezembro",
          vegetativo: "dezembro a fevereiro",
          reprodutivo: "fevereiro a abril",
          enchimento: "abril a junho",
          maturacao: "junho a julho",
        },
      },
    },
    NORDESTE: {
      SOJA: {
        inicial: [10, 11],
        vegetativo: [11, 0, 1],
        reprodutivo: [1, 2],
        enchimento: [2, 3],
        maturacao: [3, 4],
        label: {
          inicial: "novembro a dezembro",
          vegetativo: "dezembro a fevereiro",
          reprodutivo: "fevereiro a março",
          enchimento: "março a abril",
          maturacao: "abril a maio",
        },
      },
      MILHO: {
        inicial: [11, 0],
        vegetativo: [0, 1, 2],
        reprodutivo: [2, 3],
        enchimento: [3, 4],
        maturacao: [4, 5],
        label: {
          inicial: "dezembro a janeiro",
          vegetativo: "janeiro a março",
          reprodutivo: "março a abril",
          enchimento: "abril a maio",
          maturacao: "maio a junho",
        },
      },
      ALGODAO: {
        inicial: [11, 0],
        vegetativo: [0, 1, 2],
        reprodutivo: [2, 3, 4],
        enchimento: [4, 5],
        maturacao: [5, 6, 7],
        label: {
          inicial: "dezembro a janeiro",
          vegetativo: "janeiro a março",
          reprodutivo: "março a maio",
          enchimento: "maio a junho",
          maturacao: "junho a agosto",
        },
      },
    },
    NORTE: {
      SOJA: {
        inicial: [10, 11],
        vegetativo: [11, 0, 1],
        reprodutivo: [1, 2],
        enchimento: [2, 3],
        maturacao: [3, 4],
        label: {
          inicial: "novembro a dezembro",
          vegetativo: "dezembro a fevereiro",
          reprodutivo: "fevereiro a março",
          enchimento: "março a abril",
          maturacao: "abril a maio",
        },
      },
      MILHO: {
        inicial: [11, 0],
        vegetativo: [0, 1, 2],
        reprodutivo: [2, 3],
        enchimento: [3, 4],
        maturacao: [4, 5],
        label: {
          inicial: "dezembro a janeiro",
          vegetativo: "janeiro a março",
          reprodutivo: "março a abril",
          enchimento: "abril a maio",
          maturacao: "maio a junho",
        },
      },
    },
  };

  return profiles[regiao][cultura] || null;
}

function getAdjacentMonths(profile: SeasonProfile, group: PhaseGroup) {
  if (group === "INICIAL") return [...profile.vegetativo];
  if (group === "VEGETATIVO") return [...profile.inicial, ...profile.reprodutivo];
  if (group === "REPRODUTIVO") return [...profile.vegetativo, ...profile.enchimento];
  if (group === "ENCHIMENTO") return [...profile.reprodutivo, ...profile.maturacao];
  return [...profile.enchimento];
}

export function evaluateSeasonalPlausibility(
  regiao: RegiaoBrasil,
  cultura: CulturaBrasil,
  faseFenologica: string,
  currentDate = new Date()
): SeasonalAnalysis {
  const mesAtual = currentDate.getMonth();
  const grupoFase = normalizePhaseGroup(cultura, faseFenologica);
  const profile = resolveCultureProfile(cultura, regiao, currentDate);

  if (profile.annualCycleType === "PERENE") {
    return {
      plausibilidade: "COERENTE",
      grupoFase: "PERENE",
      mesAtual,
      janelaEsperada: "ciclo mais contínuo ao longo do ano",
      observacao:
        "A cultura possui comportamento mais perene no modelo, com menor restrição sazonal rígida.",
      sistemaProdutivo: profile.productionLabel,
    };
  }

  const seasonProfile = getSeasonProfile(regiao, cultura, profile.productionLabel);

  if (!seasonProfile) {
    return {
      plausibilidade: "ATENCAO",
      grupoFase,
      mesAtual,
      janelaEsperada: "sem calendário padrão detalhado para esta combinação",
      observacao:
        "A combinação cultura/sistema/região não possui calendário detalhado no motor. Interpretação sazonal com cautela.",
      sistemaProdutivo: profile.productionLabel,
    };
  }

  const monthsForGroup =
    grupoFase === "INICIAL"
      ? seasonProfile.inicial
      : grupoFase === "VEGETATIVO"
      ? seasonProfile.vegetativo
      : grupoFase === "REPRODUTIVO"
      ? seasonProfile.reprodutivo
      : grupoFase === "ENCHIMENTO"
      ? seasonProfile.enchimento
      : seasonProfile.maturacao;

  const groupLabel =
    grupoFase === "INICIAL"
      ? seasonProfile.label.inicial
      : grupoFase === "VEGETATIVO"
      ? seasonProfile.label.vegetativo
      : grupoFase === "REPRODUTIVO"
      ? seasonProfile.label.reprodutivo
      : grupoFase === "ENCHIMENTO"
      ? seasonProfile.label.enchimento
      : seasonProfile.label.maturacao;

  if (includesMonth(monthsForGroup, mesAtual)) {
    return {
      plausibilidade: "COERENTE",
      grupoFase,
      mesAtual,
      janelaEsperada: groupLabel,
      observacao:
        "A fase informada está compatível com a janela agrícola padrão da cultura e do sistema produtivo para a região selecionada.",
      sistemaProdutivo: profile.productionLabel,
    };
  }

  const adjacentMonths = getAdjacentMonths(seasonProfile, grupoFase);

  if (includesMonth(adjacentMonths, mesAtual)) {
    return {
      plausibilidade: "ATENCAO",
      grupoFase,
      mesAtual,
      janelaEsperada: groupLabel,
      observacao:
        "A fase informada está próxima da janela agrícola padrão e merece validação operacional para a data atual.",
      sistemaProdutivo: profile.productionLabel,
    };
  }

  return {
    plausibilidade: "FORA_DO_PADRAO",
    grupoFase,
    mesAtual,
    janelaEsperada: groupLabel,
    observacao:
      "A combinação cultura, fase e data atual está fora do calendário agrícola padrão modelado para a região selecionada.",
    sistemaProdutivo: profile.productionLabel,
  };
}