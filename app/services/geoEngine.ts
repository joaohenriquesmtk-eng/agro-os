import {
  RegiaoBrasil,
  CulturaBrasil,
  DadosOperacionais,
  MercadoFinanceiro,
  AnaliseEspectral,
} from "../store/useAgroStore";
import {
  evaluateSeasonalPlausibility,
  SeasonalAnalysis,
} from "../domain/agro/seasonality";
import { resolveCultureProfile, type CultureProfile } from "../domain/agro/cultureProfiles";
import type {
  ModoAnaliseEconomica,
  StatusVeredito,
  VereditoFinal,
} from "../types/agronomy";

type ClasseNutriente =
  | "MUITO_BAIXO"
  | "BAIXO"
  | "MEDIO"
  | "ADEQUADO"
  | "ALTO"
  | "MUITO_ALTO";

interface ParametrosRegionais {
  eficienciaBase: number;
  risco: string;
  penalidadeClimatica: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const safe = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const round2 = (value: number) => Number(value.toFixed(2));

const formatClasse = (classe: ClasseNutriente) => classe.replaceAll("_", " ");

function normalizeOperacao(operacao: DadosOperacionais): DadosOperacionais {
  return {
    ...operacao,
    talhao: (operacao.talhao || "").trim(),
    produtividadeAlvo: clamp(safe(operacao.produtividadeAlvo, 0), 0, 500),
    fosforoMehlich: clamp(safe(operacao.fosforoMehlich, 0), 0, 200),
    potassio: clamp(safe(operacao.potassio, 0), 0, 3),
  };
}

function normalizeAnalise(analise: AnaliseEspectral): AnaliseEspectral {
  return {
    ...analise,
    areaEstresseHa: clamp(safe(analise.areaEstresseHa, 0), 0, 100000),
    faseFenologica: (analise.faseFenologica || "").trim(),
    indice: (analise.indice || "").trim(),
  };
}

function getMarketConfidence(mercado: MercadoFinanceiro): number {
  const status = mercado.statusMercado;
  if (status === "OK") return 1;
  if (status === "PARTIAL") return 0.82;
  return 0.62;
}

function getClasseFosforo(cultura: CulturaBrasil, p: number): ClasseNutriente {
  const thresholds: Record<CulturaBrasil, number[]> = {
    SOJA: [8, 12, 18, 25, 40],
    MILHO: [6, 10, 16, 24, 35],
    TRIGO: [8, 12, 18, 25, 35],
    ALGODAO: [10, 16, 24, 32, 45],
    CANA: [8, 14, 20, 28, 40],
  };

  const [a, b, c, d, e] = thresholds[cultura];

  if (p < a) return "MUITO_BAIXO";
  if (p < b) return "BAIXO";
  if (p < c) return "MEDIO";
  if (p < d) return "ADEQUADO";
  if (p < e) return "ALTO";
  return "MUITO_ALTO";
}

function getClassePotassio(cultura: CulturaBrasil, k: number): ClasseNutriente {
  const thresholds: Record<CulturaBrasil, number[]> = {
    SOJA: [0.12, 0.18, 0.3, 0.45, 0.65],
    MILHO: [0.1, 0.16, 0.28, 0.4, 0.6],
    TRIGO: [0.1, 0.16, 0.25, 0.38, 0.55],
    ALGODAO: [0.12, 0.2, 0.35, 0.5, 0.75],
    CANA: [0.1, 0.18, 0.3, 0.45, 0.7],
  };

  const [a, b, c, d, e] = thresholds[cultura];

  if (k < a) return "MUITO_BAIXO";
  if (k < b) return "BAIXO";
  if (k < c) return "MEDIO";
  if (k < d) return "ADEQUADO";
  if (k < e) return "ALTO";
  return "MUITO_ALTO";
}

function getNeedIndex(classe: ClasseNutriente): number {
  const map: Record<ClasseNutriente, number> = {
    MUITO_BAIXO: 1,
    BAIXO: 0.78,
    MEDIO: 0.48,
    ADEQUADO: 0.18,
    ALTO: 0.05,
    MUITO_ALTO: 0,
  };
  return map[classe];
}

function getBaseResponseByClass(classe: ClasseNutriente): number {
  const map: Record<ClasseNutriente, number> = {
    MUITO_BAIXO: 0.95,
    BAIXO: 0.82,
    MEDIO: 0.58,
    ADEQUADO: 0.22,
    ALTO: 0.08,
    MUITO_ALTO: 0.02,
  };
  return map[classe];
}

function detectPhaseBucket(fase: string) {
  const f = fase.toUpperCase();

  if (f.includes("EMERGÊNCIA") || f.includes("VE-VC") || f.includes("GERMINAÇÃO")) {
    return "inicial" as const;
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
    return "vegetativo" as const;
  }

  if (
    f.includes("FLORAÇÃO") ||
    f.includes("R1") ||
    f.includes("R2") ||
    f.includes("PENDOAMENTO") ||
    f.includes("BOTÃO FLORAL")
  ) {
    return "reprodutivo" as const;
  }

  if (
    f.includes("ENCHIMENTO") ||
    f.includes("R3") ||
    f.includes("R4") ||
    f.includes("R5") ||
    f.includes("ELONGAÇÃO") ||
    f.includes("MAÇÃ")
  ) {
    return "enchimento" as const;
  }

  return "maturacao" as const;
}

function getRegionalParams(regiao: RegiaoBrasil) {
  const map: Record<RegiaoBrasil, ParametrosRegionais> = {
    CENTRO_OESTE: {
      eficienciaBase: 0.86,
      risco: "Veranicos e alta fixação de fósforo em latossolos argilosos.",
      penalidadeClimatica: 0.82,
    },
    SUL: {
      eficienciaBase: 0.94,
      risco: "Geadas tardias e variações térmicas em fases sensíveis.",
      penalidadeClimatica: 0.9,
    },
    NORTE: {
      eficienciaBase: 0.78,
      risco: "Lixiviação elevada e baixa estabilidade química do solo.",
      penalidadeClimatica: 0.76,
    },
    NORDESTE: {
      eficienciaBase: 0.8,
      risco: "Restrição hídrica e maior variabilidade de resposta.",
      penalidadeClimatica: 0.74,
    },
    SUDESTE: {
      eficienciaBase: 0.88,
      risco: "Perda estrutural do solo e heterogeneidade de resposta.",
      penalidadeClimatica: 0.84,
    },
  };

  return map[regiao];
}

function getFinancialClassification(
  modo: ModoAnaliseEconomica,
  roi: number,
  margin: number | null
): string {
  if (modo === "NAO_INTERVENCAO_RECOMENDADA") return "SEM INTERVENÇÃO";
  if (roi <= 0) return "NEGATIVO";
  if (margin === null) return "INDETERMINADO";
  if (margin < 20) return "FRÁGIL";
  if (margin < 60) return "MODERADO";
  return "ROBUSTO";
}

function getConfidenceScore(input: {
  mercado: MercadoFinanceiro;
  operacao: DadosOperacionais;
  analise: AnaliseEspectral;
  responseGlobal: number;
  needGlobal: number;
  status: StatusVeredito;
  modoAnalise: ModoAnaliseEconomica;
  margemSobreCusto: number | null;
  analiseSazonal: SeasonalAnalysis;
  cultureSpecificityBonus: number;
}) {
  const {
    mercado,
    operacao,
    analise,
    responseGlobal,
    needGlobal,
    status,
    modoAnalise,
    margemSobreCusto,
    analiseSazonal,
    cultureSpecificityBonus,
  } = input;

  let score = 5.5;

  const marketStatus = mercado.statusMercado;
  if (marketStatus === "OK") score += 1.4;
  else if (marketStatus === "PARTIAL") score += 0.8;
  else score += 0.2;

  if (analise.areaEstresseHa > 0) score += 0.5;
  if ((analise.indice || "").trim()) score += 0.3;
  if ((operacao.talhao || "").trim()) score += 0.2;

  if (analiseSazonal.plausibilidade === "COERENTE") score += 0.55;
  else if (analiseSazonal.plausibilidade === "ATENCAO") score -= 0.35;
  else score -= 1.15;

  score += cultureSpecificityBonus;

  if (modoAnalise === "NAO_INTERVENCAO_RECOMENDADA") {
    score += 0.4;
    if (needGlobal <= 0.1) score += 0.4;
    if (responseGlobal <= 0.12) score += 0.3;
  } else {
    if (status === "AUTORIZADO") {
      if ((margemSobreCusto ?? 0) >= 60) score += 0.5;
      else score += 0.15;
    }

    if (status === "RISCO_ELEVADO") {
      score -= 0.25;
      if (responseGlobal < 0.35) score -= 0.25;
      if ((margemSobreCusto ?? 0) < 25) score -= 0.25;
    }

    if (status === "BLOQUEADO" && (margemSobreCusto ?? -1) < 0) {
      score += 0.05;
    }
  }

  return round2(clamp(score, 4.8, 9.4));
}

export const GeoEngine = {
  getParametrosCultura(cultura: CulturaBrasil, regiao: RegiaoBrasil = "CENTRO_OESTE"): CultureProfile {
    return resolveCultureProfile(cultura, regiao, new Date());
  },

  processarROI(
    operacaoBruta: DadosOperacionais,
    analiseBruta: AnaliseEspectral,
    mercado: MercadoFinanceiro
  ): VereditoFinal {
    const currentDate = new Date();
    const operacao = normalizeOperacao(operacaoBruta);
    const analise = normalizeAnalise(analiseBruta);

    const profile = resolveCultureProfile(operacao.cultura, operacao.regiao, currentDate);
    const regiao = getRegionalParams(operacao.regiao);
    const analiseSazonal = evaluateSeasonalPlausibility(
      operacao.regiao,
      operacao.cultura,
      analise.faseFenologica,
      currentDate
    );

    const classeP = getClasseFosforo(operacao.cultura, operacao.fosforoMehlich);
    const classeK = getClassePotassio(operacao.cultura, operacao.potassio);

    const needP = getNeedIndex(classeP);
    const needK = getNeedIndex(classeK);

    const baseResponseP = getBaseResponseByClass(classeP) * profile.baseResponse.p;
    const baseResponseK = getBaseResponseByClass(classeK) * profile.baseResponse.k;

    const phaseBucket = detectPhaseBucket(analise.faseFenologica);
    const phaseWeight = profile.phaseWeights[phaseBucket];

    const marketConfidence = getMarketConfidence(mercado);

    const produtividadePressao = clamp(
      safe(operacao.produtividadeAlvo, profile.productivityBase) /
        Math.max(profile.productivityBase, 1),
      0.75,
      1.4
    );

    const seasonalPenalty =
      analiseSazonal.plausibilidade === "COERENTE"
        ? 1
        : analiseSazonal.plausibilidade === "ATENCAO"
        ? 0.9
        : 0.7;

    const responseMarginalP = clamp(
      baseResponseP *
        phaseWeight *
        regiao.eficienciaBase *
        regiao.penalidadeClimatica *
        marketConfidence *
        seasonalPenalty,
      0,
      1
    );

    const responseMarginalK = clamp(
      baseResponseK *
        phaseWeight *
        regiao.eficienciaBase *
        regiao.penalidadeClimatica *
        marketConfidence *
        seasonalPenalty,
      0,
      1
    );

    const baseDosePByClass =
      classeP === "MUITO_BAIXO"
        ? profile.baseDoses.pMuitoBaixo
        : classeP === "BAIXO"
        ? profile.baseDoses.pBaixo
        : classeP === "MEDIO"
        ? profile.baseDoses.pMedio
        : classeP === "ADEQUADO"
        ? profile.baseDoses.pAdequado
        : 0;

    const baseDoseKByClass =
      classeK === "MUITO_BAIXO"
        ? profile.baseDoses.kMuitoBaixo
        : classeK === "BAIXO"
        ? profile.baseDoses.kBaixo
        : classeK === "MEDIO"
        ? profile.baseDoses.kMedio
        : classeK === "ADEQUADO"
        ? profile.baseDoses.kAdequado
        : 0;

    let doseMapHa =
      baseDosePByClass *
      produtividadePressao *
      responseMarginalP *
      profile.nutrientPriority.p;

    let doseKclHa =
      baseDoseKByClass *
      produtividadePressao *
      responseMarginalK *
      profile.nutrientPriority.k;

    if (classeP === "ADEQUADO") doseMapHa = Math.min(doseMapHa, profile.adequacyCaps.mapAdequado);
    if (classeP === "ALTO" || classeP === "MUITO_ALTO") doseMapHa = 0;

    if (classeK === "ADEQUADO") doseKclHa = Math.min(doseKclHa, profile.adequacyCaps.kclAdequado);
    if (classeK === "ALTO" || classeK === "MUITO_ALTO") doseKclHa = 0;

    if (responseMarginalP < 0.12) doseMapHa *= 0.3;
    if (responseMarginalK < 0.12) doseKclHa *= 0.3;

    doseMapHa = round2(clamp(doseMapHa, 0, 260));
    doseKclHa = round2(clamp(doseKclHa, 0, 240));

    let doseUreaHa = 0;
    if (operacao.cultura !== "SOJA") {
      const nNeed =
        profile.baseDoses.nBase *
        produtividadePressao *
        phaseWeight *
        regiao.eficienciaBase *
        marketConfidence *
        seasonalPenalty *
        profile.baseResponse.n;

      if (operacao.cultura === "MILHO") {
        doseUreaHa = round2(clamp(nNeed, 20, 180));
      } else if (operacao.cultura === "TRIGO") {
        doseUreaHa = round2(clamp(nNeed, 18, 120));
      } else if (operacao.cultura === "ALGODAO") {
        doseUreaHa = round2(clamp(nNeed, 15, 110));
      } else if (operacao.cultura === "CANA") {
        doseUreaHa = round2(clamp(nNeed, 12, 95));
      }
    }

    const precoReferencia = safe(mercado.cotacoes?.[operacao.cultura], 0);

    const custoPorHa =
      doseMapHa * (safe(mercado.custoMapTon, 0) / 1000) +
      doseKclHa * (safe(mercado.custoKclTon, 0) / 1000) +
      doseUreaHa * (safe(mercado.custoUreaTon, 0) / 1000);

    const custoTotalAdubacaoPotencial = custoPorHa * analise.areaEstresseHa;

    const nutrientWeightTotal =
      profile.nutrientPriority.p + profile.nutrientPriority.k;

    const needGlobal =
      (needP * profile.nutrientPriority.p + needK * profile.nutrientPriority.k) /
      nutrientWeightTotal;

    const responseGlobal =
      (responseMarginalP * profile.nutrientPriority.p +
        responseMarginalK * profile.nutrientPriority.k) /
      nutrientWeightTotal;

    const ganhoPotencialPorHa =
      operacao.produtividadeAlvo *
      profile.tetoGanhoRelativo *
      needGlobal *
      responseGlobal;

    const retornoFinanceiroEstimadoPotencial =
      ganhoPotencialPorHa *
      precoReferencia *
      analise.areaEstresseHa /
      profile.economicSensitivity;

    const roiIncrementalPotencial =
      retornoFinanceiroEstimadoPotencial - custoTotalAdubacaoPotencial;

    const margemSobreCustoPotencial =
      custoTotalAdubacaoPotencial > 0
        ? (roiIncrementalPotencial / custoTotalAdubacaoPotencial) * 100
        : null;

    const soloJaSuprido =
      (classeP === "ALTO" || classeP === "MUITO_ALTO" || classeP === "ADEQUADO") &&
      (classeK === "ALTO" || classeK === "MUITO_ALTO" || classeK === "ADEQUADO") &&
      needGlobal <= 0.18;

    const respostaMarginalMuitoBaixa = responseGlobal < 0.16;
    const semDoseRelevante = doseMapHa + doseKclHa + doseUreaHa < 10;

    let status: StatusVeredito = "BLOQUEADO";
    let justificativa = "";
    let modoAnalise: ModoAnaliseEconomica = "INTERVENCAO_PROPOSTA";

    let doseMapHaFinal = doseMapHa;
    let doseKclHaFinal = doseKclHa;
    let doseUreaHaFinal = doseUreaHa;

    let custoTotalAdubacao = custoTotalAdubacaoPotencial;
    let retornoFinanceiroEstimado = retornoFinanceiroEstimadoPotencial;
    let roi = roiIncrementalPotencial;
    let margemSobreCusto = margemSobreCustoPotencial;

    const fatoresDeterminantes: string[] = [];
    const premissasCriticas: string[] = [];

    if (soloJaSuprido && (respostaMarginalMuitoBaixa || semDoseRelevante)) {
      status = "BLOQUEADO";
      modoAnalise = "NAO_INTERVENCAO_RECOMENDADA";

      justificativa =
        "O solo já se encontra em faixa de suprimento suficiente para P e K, com baixa resposta marginal esperada para aporte adicional.";

      doseMapHaFinal = 0;
      doseKclHaFinal = 0;
      doseUreaHaFinal = operacao.cultura === "SOJA" ? 0 : doseUreaHa;
      custoTotalAdubacao = 0;
      retornoFinanceiroEstimado = 0;
      roi = 0;
      margemSobreCusto = null;

      fatoresDeterminantes.push(`Classe de fósforo: ${formatClasse(classeP)}.`);
      fatoresDeterminantes.push(`Classe de potássio: ${formatClasse(classeK)}.`);
      fatoresDeterminantes.push(
        "Resposta marginal estimada muito baixa para adubação adicional."
      );
    } else if (roi <= 0) {
      status = "BLOQUEADO";
      modoAnalise = "INTERVENCAO_PROPOSTA";

      justificativa =
        "O custo total da intervenção supera o retorno incremental esperado nas condições atuais de preço, resposta provável e ambiente.";

      fatoresDeterminantes.push(`ROI incremental projetado negativo (${round2(roi)}).`);
      fatoresDeterminantes.push(
        "Relação de troca desfavorável entre custo da intervenção e ganho marginal esperado."
      );
    } else if (responseGlobal < 0.38 || (margemSobreCusto ?? 0) < 35) {
      status = "RISCO_ELEVADO";
      modoAnalise = "INTERVENCAO_PROPOSTA";

      if ((margemSobreCusto ?? 0) < 35) {
        justificativa =
          "A intervenção apresenta viabilidade positiva, porém com margem econômica limitada.";
        fatoresDeterminantes.push(
          `Margem sobre custo restrita (${round2(margemSobreCusto ?? 0)}%).`
        );
      } else {
        justificativa =
          "A intervenção apresenta viabilidade positiva, porém com resposta agronômica esperada apenas moderada.";
        fatoresDeterminantes.push(
          `Resposta marginal global moderada (${round2(responseGlobal * 100)}%).`
        );
      }
    } else {
      status = "AUTORIZADO";
      modoAnalise = "INTERVENCAO_PROPOSTA";

      justificativa = `Recomendação ${profile.productionLabel} viável: MAP(${round2(
        doseMapHaFinal
      )}kg), KCL(${round2(doseKclHaFinal)}kg)${
        doseUreaHaFinal > 0
          ? `, UREIA(${round2(doseUreaHaFinal)}kg)`
          : operacao.cultura === "SOJA"
          ? " com Fixação de N"
          : ""
      }.`;

      fatoresDeterminantes.push(`ROI incremental projetado positivo (${round2(roi)}).`);
      fatoresDeterminantes.push(
        `Resposta marginal global favorável (${round2(responseGlobal * 100)}%).`
      );
    }

    if (analiseSazonal.plausibilidade === "ATENCAO") {
      fatoresDeterminantes.push(
        "Combinação cultura/fase/data próxima, mas não totalmente aderente ao calendário agrícola padrão regional."
      );
    }

    if (analiseSazonal.plausibilidade === "FORA_DO_PADRAO") {
      fatoresDeterminantes.push(
        "Combinação cultura/fase/data fora do calendário agrícola padrão regional modelado."
      );

      if (status === "AUTORIZADO") {
        status = "RISCO_ELEVADO";
        justificativa =
          "A intervenção mantém sinais positivos, porém a combinação cultura, fase e data atual está fora do calendário agrícola padrão da região, reduzindo a confiabilidade operacional.";
      } else if (status === "RISCO_ELEVADO") {
        justificativa =
          "A intervenção apresenta sinais mistos e a combinação cultura, fase e data atual está fora do calendário agrícola padrão da região, reforçando a necessidade de cautela.";
      }
    }

    if (operacao.cultura === "MILHO" && profile.productionSystem === "MILHO_SAFRINHA") {
      fatoresDeterminantes.push(
        "Lógica do milho safrinha aplicada, com maior sensibilidade econômica e menor teto de ganho relativo."
      );
    }

    if (operacao.cultura === "CANA") {
      fatoresDeterminantes.push(
        "Lógica perene aplicada para cana, com menor rigidez sazonal e maior peso do estado fisiológico."
      );
    }

    premissasCriticas.push(
      "A leitura econômica depende de dólar real e commodities ainda parametrizadas quando o módulo de mercado estiver em status PARTIAL."
    );
    premissasCriticas.push(
      `O motor aplicou lógica específica para ${profile.productionLabel}.`
    );
    premissasCriticas.push(
      "A resposta marginal foi reduzida agressivamente em classes de fertilidade ADEQUADO, ALTO e MUITO_ALTO."
    );
    premissasCriticas.push(
      "A fase fenológica pesa de forma distinta por cultura e sistema produtivo."
    );
    premissasCriticas.push(
      "A coerência sazonal usa calendário agrícola padrão simplificado por cultura, sistema e região, servindo como camada de plausibilidade e não como bloqueio absoluto."
    );

    if (needP <= 0.18) {
      fatoresDeterminantes.push(
        `Probabilidade de resposta a fósforo limitada pela classe ${formatClasse(classeP)}.`
      );
    }
    if (needK <= 0.18) {
      fatoresDeterminantes.push(
        `Probabilidade de resposta a potássio limitada pela classe ${formatClasse(classeK)}.`
      );
    }

    const cultureSpecificityBonus =
      operacao.cultura === "SOJA"
        ? 0.45
        : operacao.cultura === "MILHO"
        ? 0.35
        : operacao.cultura === "CANA"
        ? 0.3
        : operacao.cultura === "TRIGO"
        ? 0.28
        : 0.25;

    const scoreConfianca = getConfidenceScore({
      mercado,
      operacao,
      analise,
      responseGlobal,
      needGlobal,
      status,
      modoAnalise,
      margemSobreCusto,
      analiseSazonal,
      cultureSpecificityBonus,
    });

    const classificacaoFinanceira = getFinancialClassification(
      modoAnalise,
      roi,
      margemSobreCusto
    );

    const observacaoEconomica =
      modoAnalise === "NAO_INTERVENCAO_RECOMENDADA"
        ? "Intervenção incremental não proposta; sem ROI incremental aplicável para novas doses."
        : roi <= 0
        ? "Intervenção proposta com retorno incremental inferior ao custo."
        : status === "RISCO_ELEVADO"
        ? "Intervenção com retorno positivo, porém sujeita a maior sensibilidade agronômica, econômica ou sazonal."
        : "Intervenção proposta com retorno incremental positivo e margem operacional favorável.";

    return {
      status,
      roiEstimado: round2(roi),
      justificativa,
      fatorLimitante: regiao.risco,
      doseMapHa: round2(doseMapHaFinal),
      doseKclHa: round2(doseKclHaFinal),
      doseUreaHa: round2(doseUreaHaFinal),
      scoreConfianca,
      classificacaoFinanceira,
      premissasCriticas,
      fatoresDeterminantes,
      leituraEconomica: {
        modoAnalise,
        custoTotalAdubacao: round2(custoTotalAdubacao),
        retornoFinanceiroEstimado: round2(retornoFinanceiroEstimado),
        margemSobreCusto:
          margemSobreCusto === null ? null : round2(margemSobreCusto),
        precoReferencia: round2(precoReferencia),
        custoEvitado:
          modoAnalise === "NAO_INTERVENCAO_RECOMENDADA"
            ? round2(custoTotalAdubacaoPotencial)
            : 0,
        roiIncrementalAplicacao:
          modoAnalise === "NAO_INTERVENCAO_RECOMENDADA"
            ? null
            : round2(roi),
        observacaoEconomica,
      },
      diagnosticoSolo: {
        classeFosforo: formatClasse(classeP),
        classePotassio: formatClasse(classeK),
        pressaoNutricional:
          needGlobal >= 0.75
            ? "ALTA"
            : needGlobal >= 0.4
            ? "MODERADA"
            : needGlobal >= 0.15
            ? "BAIXA"
            : "MUITO BAIXA",
      },
      analiseSazonal,
    };
  },
};