import type { RegiaoBrasil } from "../../store/useAgroStore";
import type { ParametrosRegionais } from "./types";

export function getRegionParameters(regiao: RegiaoBrasil): ParametrosRegionais {
  const config: Record<RegiaoBrasil, ParametrosRegionais> = {
    CENTRO_OESTE: {
      regiao: "CENTRO_OESTE",
      pCritico: 18,
      kBaixo: 0.15,
      kMedio: 0.30,
      doseMapMax: 320,
      doseMapManutencao: 90,
      fatorRiscoClimatico: 0.85,
      fatorFixacaoP: 1.0,
      descricaoRisco: "Veranicos e alta fixação de fósforo em latossolos argilosos.",
    },
    SUL: {
      regiao: "SUL",
      pCritico: 12,
      kBaixo: 0.14,
      kMedio: 0.28,
      doseMapMax: 220,
      doseMapManutencao: 70,
      fatorRiscoClimatico: 0.95,
      fatorFixacaoP: 0.75,
      descricaoRisco: "Geadas tardias e maior variabilidade térmica em fases sensíveis.",
    },
    NORTE: {
      regiao: "NORTE",
      pCritico: 15,
      kBaixo: 0.12,
      kMedio: 0.26,
      doseMapMax: 350,
      doseMapManutencao: 100,
      fatorRiscoClimatico: 0.75,
      fatorFixacaoP: 0.9,
      descricaoRisco: "Lixiviação intensa e solos de menor retenção de nutrientes.",
    },
    NORDESTE: {
      regiao: "NORDESTE",
      pCritico: 20,
      kBaixo: 0.14,
      kMedio: 0.29,
      doseMapMax: 280,
      doseMapManutencao: 85,
      fatorRiscoClimatico: 0.7,
      fatorFixacaoP: 0.85,
      descricaoRisco: "Restrição hídrica frequente e maior sensibilidade à irregularidade de chuvas.",
    },
    SUDESTE: {
      regiao: "SUDESTE",
      pCritico: 16,
      kBaixo: 0.15,
      kMedio: 0.30,
      doseMapMax: 260,
      doseMapManutencao: 80,
      fatorRiscoClimatico: 0.88,
      fatorFixacaoP: 0.8,
      descricaoRisco: "Relevo, erosão e heterogeneidade de resposta entre ambientes de produção.",
    },
  };

  return config[regiao];
}