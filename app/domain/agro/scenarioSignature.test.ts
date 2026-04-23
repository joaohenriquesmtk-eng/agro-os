import { describe, expect, it } from "vitest";
import { buildScenarioSignature } from "./scenarioSignature";

describe("buildScenarioSignature", () => {
  const baseScenario = {
    operacao: {
      cultura: "SOJA",
      regiao: "CENTRO_OESTE",
      talhao: "Talhão 01",
      fosforoMehlich: 12,
      potassio: 0.15,
      produtividadeAlvo: 75,
    },
    analise: {
      faseFenologica: "Floração (R1-R2)",
      areaEstresseHa: 10,
      indice: "NDVI (Padrão)",
    },
    mercado: {
      dolarPtax: 5.42,
      custoMapTon: 4200,
      custoKclTon: 3100,
      custoUreaTon: 2800,
      statusMercado: "OK",
      cotacoes: {
        SOJA: 145,
      },
    },
    veredito: {
      status: "AUTORIZADO",
      roiEstimado: 8500,
      doseMapHa: 80,
      doseKclHa: 60,
      doseUreaHa: 0,
      classificacaoFinanceira: "ROBUSTO",
      analiseSazonal: {
        plausibilidade: "COERENTE",
        sistemaProdutivo: "Soja primeira safra",
        janelaEsperada: "janeiro a fevereiro",
      },
    },
  } as const;

  it("gera a mesma assinatura para entradas equivalentes em texto", async () => {
    const resultA = await buildScenarioSignature(baseScenario);

    const resultB = await buildScenarioSignature({
      ...baseScenario,
      operacao: {
        ...baseScenario.operacao,
        talhao: "  talhão 01  ",
        cultura: "soja",
      },
    });

    expect(resultA.signature).toBe(resultB.signature);
  });

  it("gera assinatura diferente quando o cenário muda", async () => {
    const resultA = await buildScenarioSignature(baseScenario);

    const resultB = await buildScenarioSignature({
      ...baseScenario,
      veredito: {
        ...baseScenario.veredito,
        status: "BLOQUEADO",
      },
    });

    expect(resultA.signature).not.toBe(resultB.signature);
  });
});