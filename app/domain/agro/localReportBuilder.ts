import type { TechnicalReportScenario, StatusVeredito } from "../../types/agronomy";

function toLine(value: unknown, fallback = "N/D") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return fallback;
    return String(value);
  }
  const text = String(value).trim();
  return text || fallback;
}

function toCurrency(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/D";
  return `R$ ${num.toFixed(2)}`;
}

function getParecerOperacionalFinal(status: StatusVeredito): string {
  switch (status) {
    case "AUTORIZADO":
      return "AUTORIZADO";
    case "RISCO_ELEVADO":
      return "RISCO ELEVADO";
    case "BLOQUEADO":
    default:
      return "BLOQUEADO";
  }
}

interface LocalTechnicalReportInput extends TechnicalReportScenario {
  origem?: string;
}

export function buildLocalTechnicalReport(input: LocalTechnicalReportInput) {
  const { operacao, analise, mercado, veredito, origem = "MOTOR INTERNO" } = input;

  const dataAtual = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const statusSistema: StatusVeredito = veredito.status || "BLOQUEADO";
  const parecerFinal = getParecerOperacionalFinal(statusSistema);

  const sistemaProdutivo = veredito.analiseSazonal?.sistemaProdutivo || "N/D";
  const plausibilidadeSazonal = veredito.analiseSazonal?.plausibilidade || "N/D";
  const janelaPadrao = veredito.analiseSazonal?.janelaEsperada || "N/D";
  const observacaoSazonal = veredito.analiseSazonal?.observacao || "N/D";
  const fatorLimitanteTecnico =
    veredito.fatorLimitanteTecnico || veredito.fatorLimitante || "N/D";
  const fatorLimitanteEconomico =
    veredito.fatorLimitanteEconomico || "Sem limitante econômico crítico identificado.";
  const diagnosticoSolo = veredito.diagnosticoSolo;
  const leituraPh = diagnosticoSolo?.leituraPh || "N/D";
  const leituraCtc = diagnosticoSolo?.leituraCtc || "N/D";
  const leituraMateriaOrganica = diagnosticoSolo?.leituraMateriaOrganica || "N/D";
  const leituraSaturacaoBases =
    diagnosticoSolo?.leituraSaturacaoBases || "N/D";
  const leituraTexturaSolo = diagnosticoSolo?.leituraTexturaSolo || "N/D";
  const leituraChuvaRecente = diagnosticoSolo?.leituraChuvaRecente || "N/D";
  const severidadeComplementar =
    diagnosticoSolo?.severidadeContextoComplementar || "N/D";

  const modoEconomico = veredito.leituraEconomica?.modoAnalise || "N/D";
  const custoTotal = veredito.leituraEconomica?.custoTotalAdubacao ?? 0;
  const retornoEstimado = veredito.leituraEconomica?.retornoFinanceiroEstimado ?? 0;
  const roiIncremental = veredito.leituraEconomica?.roiIncrementalAplicacao;
  const margemSobreCusto = veredito.leituraEconomica?.margemSobreCusto;
  const custoEvitado = veredito.leituraEconomica?.custoEvitado ?? 0;

  return [
    `LAUDO TÉCNICO EXECUTIVO - ${dataAtual}`,
    "",
    "**1. Fatos observados**",
    `• Cultura **${toLine(operacao.cultura)}** em fase **${toLine(analise.faseFenologica)}**.`,
    `• Região operacional: **${toLine(operacao.regiao)}**.`,
    `• Área de anomalia: **${toLine(analise.areaEstresseHa)} ha**.`,
    `• Fósforo (P): **${toLine(operacao.fosforoMehlich)} mg/dm³**.`,
    `• Potássio (K): **${toLine(operacao.potassio)} cmolc/dm³**.`,
    `• Sistema produtivo interpretado pelo motor: **${sistemaProdutivo}**.`,
    "",
    "**2. Interpretação técnica**",
    `• O fator limitante técnico/pedoclimático apontado pelo motor foi **${toLine(fatorLimitanteTecnico)}**.`,
    `• O fator limitante econômico foi **${toLine(fatorLimitanteEconomico)}**.`,
    `• A plausibilidade sazonal foi classificada como **${plausibilidadeSazonal}**, com janela padrão **${janelaPadrao}**.`,
    `• Observação sazonal do sistema: ${observacaoSazonal}.`,
    `• As doses calculadas foram **MAP ${Number(veredito.doseMapHa || 0).toFixed(0)} kg/ha**, **KCL ${Number(veredito.doseKclHa || 0).toFixed(0)} kg/ha** e **UREIA ${Number(veredito.doseUreaHa || 0).toFixed(0)} kg/ha**.`,
    "",
    "**3. Diagnóstico complementar do contexto**",
    `• Leitura de pH: **${leituraPh}**.`,
    `• Leitura de CTC: **${leituraCtc}**.`,
    `• Matéria orgânica: **${leituraMateriaOrganica}**.`,
    `• Saturação por bases: **${leituraSaturacaoBases}**.`,
    `• Textura do solo: **${leituraTexturaSolo}**.`,
    `• Chuva recente: **${leituraChuvaRecente}**.`,
    `• Severidade complementar do cenário: **${severidadeComplementar}**.`,
    "",
    "**4. Leitura econômica**",
    `• Modo econômico: **${modoEconomico}**.`,
    `• Custo total estimado: **${toCurrency(custoTotal)}**.`,
    `• Retorno financeiro estimado: **${toCurrency(retornoEstimado)}**.`,
    `• ROI incremental: **${modoEconomico === "NAO_INTERVENCAO_RECOMENDADA" ? "N/A" : toCurrency(roiIncremental)}**.`,
    `• Margem sobre custo: **${modoEconomico === "NAO_INTERVENCAO_RECOMENDADA" ? "N/A" : typeof margemSobreCusto === "number" ? `${margemSobreCusto.toFixed(2)}%` : "N/D"}**.`,
    `• Custo evitado: **${toCurrency(custoEvitado)}**.`,
    `• Dólar PTAX de referência: **${toCurrency(mercado.dolarPtax)}**.`,
    "",
    "**5. Conclusão técnica**",
    `• O status final calculado pelo motor foi **${statusSistema}**.`,
    `• A justificativa central do sistema foi: **${toLine(veredito.justificativa)}**.`,
    `• Este laudo foi emitido em **modo local**, com origem **${origem}**.`,
    "",
    "PARECER OPERACIONAL:",
    `**${parecerFinal}**`,
  ].join("\n");
}