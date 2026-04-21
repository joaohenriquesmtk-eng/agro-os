import { buildTechnicalReportPrompt } from "../reportPrompt";
import type {
  ReportProviderAdapter,
  ReportProviderExecutionResult,
  ReportGenerationInput,
} from "./types";

function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3-flash-preview";
}

function extractGeminiText(result: any) {
  return result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

function extractGeminiErrorMessage(result: any) {
  return (
    result?.error?.message ||
    result?.promptFeedback?.blockReason ||
    "Falha não detalhada do Gemini."
  );
}

async function safeReadJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function generateWithGemini(
  input: ReportGenerationInput
): Promise<ReportProviderExecutionResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = getGeminiModel();

  if (!apiKey) {
    return {
      ok: false,
      error: {
        provider: "GEMINI",
        errorCode: "NOT_CONFIGURED",
        errorMessage: "GEMINI_API_KEY não configurada.",
      },
    };
  }

  const promptMaster = buildTechnicalReportPrompt(input);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const parts: any[] = [{ text: promptMaster }];

  if (input.imagemBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: input.imagemBase64,
      },
    });
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
      }),
    });

    const result = await safeReadJson(response);

    if (!response.ok) {
      return {
        ok: false,
        error: {
          provider: "GEMINI",
          httpStatus: response.status,
          errorCode: result?.error?.status ?? null,
          errorMessage: extractGeminiErrorMessage(result),
        },
      };
    }

    const textoRelatorio = extractGeminiText(result);

    if (!textoRelatorio) {
      return {
        ok: false,
        error: {
          provider: "GEMINI",
          errorCode: "EMPTY_RESPONSE",
          errorMessage: "Gemini retornou resposta vazia.",
        },
      };
    }

    return {
      ok: true,
      data: {
        provider: "GEMINI",
        relatorio: textoRelatorio,
        modelUsed: model,
        rawResponse: result,
      },
    };
  } catch (error: any) {
    return {
      ok: false,
      error: {
        provider: "GEMINI",
        errorCode: error?.name ?? "GEMINI_REQUEST_ERROR",
        errorMessage: error?.message ?? "Falha de rede ao chamar o Gemini.",
      },
    };
  }
}

export const geminiReportProvider: ReportProviderAdapter = {
  provider: "GEMINI",
  isConfigured() {
    return !!process.env.GEMINI_API_KEY?.trim();
  },
  getConfiguredModel() {
    return getGeminiModel();
  },
  generate: generateWithGemini,
};