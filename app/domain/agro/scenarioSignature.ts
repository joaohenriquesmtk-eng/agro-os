type Primitive = string | number | boolean | null | undefined;

function normalizeNumber(value: unknown, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(decimals));
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(",")}}`;
}

async function sha256(input: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface ScenarioSignatureInput {
  operacao: {
    cultura: Primitive;
    regiao: Primitive;
    talhao?: Primitive;
    fosforoMehlich: Primitive;
    potassio: Primitive;
    produtividadeAlvo: Primitive;
    phSolo: Primitive;
    ctc: Primitive;
    materiaOrganica: Primitive;
    saturacaoBases: Primitive;
    teorArgila: Primitive;
  };
  analise: {
    faseFenologica: Primitive;
    areaEstresseHa: Primitive;
    indice?: Primitive;
    chuva7dMm: Primitive;
  };
  mercado: {
    dolarPtax: Primitive;
    custoMapTon: Primitive;
    custoKclTon: Primitive;
    custoUreaTon: Primitive;
    statusMercado?: Primitive;
    cotacoes?: Record<string, unknown>;
  };
  veredito: {
    status: Primitive;
    roiEstimado: Primitive;
    doseMapHa: Primitive;
    doseKclHa: Primitive;
    doseUreaHa: Primitive;
    classificacaoFinanceira?: Primitive;
    fatorLimitanteTecnico?: Primitive;
    fatorLimitanteEconomico?: Primitive;
    analiseSazonal?: {
      plausibilidade?: Primitive;
      sistemaProdutivo?: Primitive;
      janelaEsperada?: Primitive;
    };
    diagnosticoSolo?: {
      severidadeContextoComplementar?: Primitive;
    };
  };
}

export function buildScenarioFingerprint(input: ScenarioSignatureInput) {
  const culturaNormalizada = normalizeText(input.operacao.cultura);

  return {
    cultura: culturaNormalizada,
    regiao: normalizeText(input.operacao.regiao),
    talhao: normalizeText(input.operacao.talhao),

    faseFenologica: normalizeText(input.analise.faseFenologica),
    indice: normalizeText(input.analise.indice),
    areaEstresseHa: normalizeNumber(input.analise.areaEstresseHa, 2),
    chuva7dMm: normalizeNumber(input.analise.chuva7dMm, 2),

    fosforoMehlich: normalizeNumber(input.operacao.fosforoMehlich, 2),
    potassio: normalizeNumber(input.operacao.potassio, 3),
    produtividadeAlvo: normalizeNumber(input.operacao.produtividadeAlvo, 2),
    phSolo: normalizeNumber(input.operacao.phSolo, 2),
    ctc: normalizeNumber(input.operacao.ctc, 2),
    materiaOrganica: normalizeNumber(input.operacao.materiaOrganica, 2),
    saturacaoBases: normalizeNumber(input.operacao.saturacaoBases, 2),
    teorArgila: normalizeNumber(input.operacao.teorArgila, 2),

    dolarPtax: normalizeNumber(input.mercado.dolarPtax, 4),
    custoMapTon: normalizeNumber(input.mercado.custoMapTon, 2),
    custoKclTon: normalizeNumber(input.mercado.custoKclTon, 2),
    custoUreaTon: normalizeNumber(input.mercado.custoUreaTon, 2),
    statusMercado: normalizeText(input.mercado.statusMercado),
    cotacaoCultura: normalizeNumber(input.mercado.cotacoes?.[culturaNormalizada], 2),

    status: normalizeText(input.veredito.status),
    roiEstimado: normalizeNumber(input.veredito.roiEstimado, 2),
    doseMapHa: normalizeNumber(input.veredito.doseMapHa, 2),
    doseKclHa: normalizeNumber(input.veredito.doseKclHa, 2),
    doseUreaHa: normalizeNumber(input.veredito.doseUreaHa, 2),
    classificacaoFinanceira: normalizeText(input.veredito.classificacaoFinanceira),
    fatorLimitanteTecnico: normalizeText(input.veredito.fatorLimitanteTecnico),
    fatorLimitanteEconomico: normalizeText(input.veredito.fatorLimitanteEconomico),
    plausibilidadeSazonal: normalizeText(input.veredito.analiseSazonal?.plausibilidade),
    sistemaProdutivo: normalizeText(input.veredito.analiseSazonal?.sistemaProdutivo),
    janelaEsperada: normalizeText(input.veredito.analiseSazonal?.janelaEsperada),
    severidadeContextoComplementar: normalizeText(
      input.veredito.diagnosticoSolo?.severidadeContextoComplementar
    ),
  };
}

export async function buildScenarioSignature(input: ScenarioSignatureInput) {
  const fingerprint = buildScenarioFingerprint(input);
  const serialized = stableStringify(fingerprint);
  const hash = await sha256(serialized);

  return {
    signature: `scenario_${hash}`,
    fingerprint,
    serialized,
  };
}