import { describe, expect, it } from "vitest";
import { GeoEngine } from "./geoEngine";
import type {
  AnaliseEspectral,
  DadosOperacionais,
  MercadoFinanceiro,
} from "../types/agronomy";

describe("GeoEngine.processarROI", () => {
  it("recomenda não intervenção em cenário de soja com solo já suprido", () => {
    const operacao: DadosOperacionais = {
      talhao: "Talhão A",
      regiao: "CENTRO_OESTE",
      cultura: "SOJA",
      produtividadeAlvo: 60,
      fosforoMehlich: 55,
      potassio: 1.1,
      phSolo: 5.8,
      ctc: 12,
      materiaOrganica: 3.2,
      saturacaoBases: 62,
      teorArgila: 48,
    };

    const analise: AnaliseEspectral = {
      areaEstresseHa: 12,
      faseFenologica: "Floração (R1-R2)",
      indice: "NDVI (Padrão)",
      chuva7dMm: 15,
    };

    const mercado: MercadoFinanceiro = {
      dolarPtax: 5.4,
      cotacoes: {
        SOJA: 145,
        MILHO: 70,
        CANA: 120,
        ALGODAO: 160,
        TRIGO: 85,
      },
      custoMapTon: 4200,
      custoKclTon: 3100,
      custoUreaTon: 2800,
      ultimaSincronizacao: "2026-04-01T10:00:00.000Z",
      statusMercado: "OK",
      avisosMercado: [],
      origemDolar: "HG Brasil",
      origemCommodities: "Parametrizado",
    };

    const result = GeoEngine.processarROI(operacao, analise, mercado);

    expect(result.leituraEconomica.modoAnalise).toBe("NAO_INTERVENCAO_RECOMENDADA");
    expect(result.doseMapHa).toBe(0);
    expect(result.doseKclHa).toBe(0);
    expect(result.doseUreaHa).toBe(0);
    expect(result.status).toBe("BLOQUEADO");
  });

  it("sempre retorna um veredito completo e estruturado", () => {
    const operacao: DadosOperacionais = {
      talhao: "Talhão B",
      regiao: "CENTRO_OESTE",
      cultura: "CANA",
      produtividadeAlvo: 100,
      fosforoMehlich: 6,
      potassio: 0.12,
      phSolo: 5.3,
      ctc: 9,
      materiaOrganica: 2.1,
      saturacaoBases: 45,
      teorArgila: 35,
    };

    const analise: AnaliseEspectral = {
      areaEstresseHa: 20,
      faseFenologica: "Crescimento de Colmos",
      indice: "NDRE",
      chuva7dMm: 22,
    };

    const mercado: MercadoFinanceiro = {
      dolarPtax: 5.35,
      cotacoes: {
        SOJA: 145,
        MILHO: 70,
        CANA: 118,
        ALGODAO: 160,
        TRIGO: 85,
      },
      custoMapTon: 4200,
      custoKclTon: 3100,
      custoUreaTon: 2800,
      ultimaSincronizacao: "2026-04-01T10:00:00.000Z",
      statusMercado: "OK",
      avisosMercado: [],
      origemDolar: "HG Brasil",
      origemCommodities: "Parametrizado",
    };

    const result = GeoEngine.processarROI(operacao, analise, mercado);

    expect(["AUTORIZADO", "RISCO_ELEVADO", "BLOQUEADO"]).toContain(result.status);
    expect(result.analiseSazonal.plausibilidade).toBe("COERENTE");
    expect(result.leituraEconomica.precoReferencia).toBe(118);
    expect(result.premissasCriticas.length).toBeGreaterThan(0);
    expect(result.fatoresDeterminantes.length).toBeGreaterThan(0);
  });

    it("reduz a confiança e explicita restrições complementares quando o contexto químico e hídrico é frágil", () => {
    const mercado: MercadoFinanceiro = {
      dolarPtax: 5.4,
      cotacoes: {
        SOJA: 145,
        MILHO: 70,
        CANA: 120,
        ALGODAO: 160,
        TRIGO: 85,
      },
      custoMapTon: 4200,
      custoKclTon: 3100,
      custoUreaTon: 2800,
      ultimaSincronizacao: "2026-04-01T10:00:00.000Z",
      statusMercado: "OK",
      avisosMercado: [],
      origemDolar: "HG Brasil",
      origemCommodities: "Parametrizado",
    };

    const operacaoFavoravel: DadosOperacionais = {
      talhao: "Talhão C",
      regiao: "CENTRO_OESTE",
      cultura: "MILHO",
      produtividadeAlvo: 120,
      fosforoMehlich: 7,
      potassio: 0.14,
      phSolo: 5.9,
      ctc: 16,
      materiaOrganica: 4.2,
      saturacaoBases: 68,
      teorArgila: 38,
    };

    const operacaoFragil: DadosOperacionais = {
      ...operacaoFavoravel,
      phSolo: 4.7,
      ctc: 4.5,
      materiaOrganica: 1.2,
      saturacaoBases: 32,
      teorArgila: 12,
    };

    const analiseFavoravel: AnaliseEspectral = {
      areaEstresseHa: 18,
      faseFenologica: "Vegetativo (V4-V8)",
      indice: "NDVI (Padrão)",
      chuva7dMm: 28,
    };

    const analiseFragil: AnaliseEspectral = {
      ...analiseFavoravel,
      chuva7dMm: 4,
    };

    const favoravel = GeoEngine.processarROI(
      operacaoFavoravel,
      analiseFavoravel,
      mercado
    );

    const fragil = GeoEngine.processarROI(
      operacaoFragil,
      analiseFragil,
      mercado
    );

    expect(fragil.scoreConfianca).toBeLessThan(favoravel.scoreConfianca);
    expect(
      fragil.fatoresDeterminantes.some((fator) => fator.includes("pH"))
    ).toBe(true);
    expect(
      fragil.fatoresDeterminantes.some((fator) => fator.includes("Chuva"))
    ).toBe(true);
    expect(
      fragil.premissasCriticas.some((premissa) =>
        premissa.includes("condição química do solo")
      )
    ).toBe(true);
  });

  it("reduz a dose de ureia no milho quando o ambiente complementar é adverso", () => {
    const mercado: MercadoFinanceiro = {
      dolarPtax: 5.4,
      cotacoes: {
        SOJA: 145,
        MILHO: 70,
        CANA: 120,
        ALGODAO: 160,
        TRIGO: 85,
      },
      custoMapTon: 4200,
      custoKclTon: 3100,
      custoUreaTon: 2800,
      ultimaSincronizacao: "2026-04-01T10:00:00.000Z",
      statusMercado: "OK",
      avisosMercado: [],
      origemDolar: "HG Brasil",
      origemCommodities: "Parametrizado",
    };

    const operacaoBase: DadosOperacionais = {
      talhao: "Talhão D",
      regiao: "CENTRO_OESTE",
      cultura: "MILHO",
      produtividadeAlvo: 125,
      fosforoMehlich: 6,
      potassio: 0.12,
      phSolo: 5.8,
      ctc: 15,
      materiaOrganica: 4,
      saturacaoBases: 66,
      teorArgila: 35,
    };

    const operacaoAdversa: DadosOperacionais = {
      ...operacaoBase,
      phSolo: 4.8,
      ctc: 5,
      materiaOrganica: 1.1,
      saturacaoBases: 35,
      teorArgila: 10,
    };

    const analiseBase: AnaliseEspectral = {
      areaEstresseHa: 20,
      faseFenologica: "Vegetativo (V4-V8)",
      indice: "NDVI (Padrão)",
      chuva7dMm: 30,
    };

    const analiseAdversa: AnaliseEspectral = {
      ...analiseBase,
      chuva7dMm: 3,
    };

    const favoravel = GeoEngine.processarROI(operacaoBase, analiseBase, mercado);
    const adverso = GeoEngine.processarROI(
      operacaoAdversa,
      analiseAdversa,
      mercado
    );

    expect(adverso.doseUreaHa).toBeLessThan(favoravel.doseUreaHa);
  });
});