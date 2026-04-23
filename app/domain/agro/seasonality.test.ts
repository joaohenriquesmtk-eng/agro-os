import { describe, expect, it } from "vitest";
import { evaluateSeasonalPlausibility } from "./seasonality";

describe("evaluateSeasonalPlausibility", () => {
  it("classifica soja em floração no centro-oeste em janeiro como coerente", () => {
    const result = evaluateSeasonalPlausibility(
      "CENTRO_OESTE",
      "SOJA",
      "Floração (R1-R2)",
      new Date(2026, 0, 15)
    );

    expect(result.plausibilidade).toBe("COERENTE");
    expect(result.sistemaProdutivo).toBe("Soja primeira safra");
  });

  it("trata cana como ciclo perene com coerência sazonal", () => {
    const result = evaluateSeasonalPlausibility(
      "CENTRO_OESTE",
      "CANA",
      "Crescimento de Colmos",
      new Date(2026, 6, 10)
    );

    expect(result.plausibilidade).toBe("COERENTE");
    expect(result.grupoFase).toBe("PERENE");
    expect(result.sistemaProdutivo).toBe("Cana-de-açúcar perene");
  });
});