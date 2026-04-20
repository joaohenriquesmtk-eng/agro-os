export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { buildLocalTechnicalReport } from "../../domain/agro/localReportBuilder";

type StatusSistema = "AUTORIZADO" | "RISCO_ELEVADO" | "BLOQUEADO";

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

function getParecerOperacionalFinal(status: StatusSistema): string {
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

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const dados = await req.json();

    const {
      operacao,
      analise,
      mercado,
      veredito,
      imagemBase64,
      reportMode = "IA_REFINADA",
    } = dados;

    if (reportMode === "LOCAL") {
      const relatorio = buildLocalTechnicalReport({
        operacao,
        analise,
        mercado,
        veredito,
        origem: "MOTOR LOCAL",
      });

      return NextResponse.json({
        relatorio,
        mode: "LOCAL",
        fallback: false,
      });
    }

    if (!apiKey) {
      const relatorio = buildLocalTechnicalReport({
        operacao,
        analise,
        mercado,
        veredito,
        origem: "MOTOR LOCAL (SEM CHAVE EXTERNA)",
      });

      return NextResponse.json({
        relatorio,
        mode: "LOCAL",
        fallback: true,
        warning:
          "Chave da IA externa não encontrada. O Agro OS gerou o laudo em modo local.",
      });
    }

    const dataAtual = new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const instrucaoVisual = imagemBase64
      ? `Analise a imagem anexa apenas como apoio complementar. Não invente diagnóstico visual específico sem base consistente.`
      : `O usuário não forneceu mapa visual. Baseie-se apenas nos dados numéricos, econômicos e sazonais.`;

    const promptMaster = `
Você é o redator técnico do Agro OS.
Refine a redação de um laudo técnico executivo já fundamentado pelo motor interno.

REGRAS:
- Use bullets com "•"
- Use negrito com **texto**
- Não altere o status final do sistema
- Não invente causalidade forte
- Não floreie
- Não contradiga os dados do motor
- Escreva como parecer técnico sóbrio

DADOS:
- Data: ${dataAtual}
- Cultura: ${toLine(operacao.cultura)}
- Fase: ${toLine(analise.faseFenologica)}
- Região: ${toLine(operacao.regiao)}
- Área: ${toLine(analise.areaEstresseHa)} ha
- P: ${toLine(operacao.fosforoMehlich)} mg/dm³
- K: ${toLine(operacao.potassio)} cmolc/dm³
- Produtividade alvo: ${toLine(operacao.produtividadeAlvo)}
- Dólar: ${toCurrency(mercado.dolarPtax)}
- MAP: ${toCurrency(mercado.custoMapTon)}/t
- KCL: ${toCurrency(mercado.custoKclTon)}/t
- UREIA: ${toCurrency(mercado.custoUreaTon)}/t
- Status do sistema: ${toLine(veredito?.status)}
- Justificativa: ${toLine(veredito?.justificativa)}
- Fator limitante: ${toLine(veredito?.fatorLimitante)}
- Sistema produtivo: ${toLine(veredito?.analiseSazonal?.sistemaProdutivo)}
- Plausibilidade sazonal: ${toLine(veredito?.analiseSazonal?.plausibilidade)}
- Janela padrão: ${toLine(veredito?.analiseSazonal?.janelaEsperada)}
- Observação sazonal: ${toLine(veredito?.analiseSazonal?.observacao)}
- Classificação financeira: ${toLine(veredito?.classificacaoFinanceira)}
- Custo total: ${toCurrency(veredito?.leituraEconomica?.custoTotalAdubacao)}
- Retorno estimado: ${toCurrency(veredito?.leituraEconomica?.retornoFinanceiroEstimado)}
- ROI incremental: ${
      veredito?.leituraEconomica?.modoAnalise === "NAO_INTERVENCAO_RECOMENDADA"
        ? "N/A"
        : toCurrency(veredito?.leituraEconomica?.roiIncrementalAplicacao)
    }

INSTRUÇÃO VISUAL:
${instrucaoVisual}

FORMATO:
- Inicie com "LAUDO TÉCNICO EXECUTIVO - ${dataAtual}"
- Depois faça:
  **1. Fatos observados**
  **2. Interpretação técnica**
  **3. Leitura econômica**
  **4. Conclusão técnica**
- Finalize com:
  PARECER OPERACIONAL:
  **${getParecerOperacionalFinal((veredito?.status || "BLOQUEADO") as StatusSistema)}**
`;

    const parts: any[] = [{ text: promptMaster }];

    if (imagemBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imagemBase64,
        },
      });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Falha Gemini:", result);

      const relatorioFallback = buildLocalTechnicalReport({
        operacao,
        analise,
        mercado,
        veredito,
        origem: "FALLBACK LOCAL APÓS FALHA EXTERNA",
      });

      return NextResponse.json({
        relatorio: relatorioFallback,
        mode: "LOCAL",
        fallback: true,
        warning:
          response.status === 429
            ? "Cota temporariamente excedida na IA externa. O Agro OS gerou um laudo local de contingência."
            : "A IA externa falhou. O Agro OS gerou um laudo local de contingência.",
      });
    }

    const textoRelatorio =
      result?.candidates?.[0]?.content?.parts?.[0]?.text ||
      buildLocalTechnicalReport({
        operacao,
        analise,
        mercado,
        veredito,
        origem: "FALLBACK LOCAL POR RESPOSTA VAZIA",
      });

    return NextResponse.json({
      relatorio: textoRelatorio,
      mode: "IA_REFINADA",
      fallback: false,
    });
  } catch (error: any) {
    console.error("Erro interno no servidor Agro OS:", error);

    try {
      const dados = await req.clone().json();
      const relatorio = buildLocalTechnicalReport({
        operacao: dados.operacao,
        analise: dados.analise,
        mercado: dados.mercado,
        veredito: dados.veredito,
        origem: "FALLBACK LOCAL POR EXCEÇÃO INTERNA",
      });

      return NextResponse.json({
        relatorio,
        mode: "LOCAL",
        fallback: true,
        warning:
          "O Agro OS encontrou uma falha interna na rota externa e retornou para o modo local.",
      });
    } catch {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}