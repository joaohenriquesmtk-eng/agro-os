import { buildImageDataUrl, buildTechnicalReportPrompt } from "../reportPrompt";
import type {
  ReportProviderAdapter,
  ReportProviderExecutionResult,
  ReportGenerationInput,
} from "./types";

function getOpenRouterModel() {
  return process.env.OPENROUTER_MODEL?.trim() || "openrouter/auto";
}

function extractOpenRouterErrorMessage(result: any) {
  return (
    result?.error?.message ||
    result?.error?.code ||
    "Falha não detalhada do OpenRouter."
  );
}

async function safeReadJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractOpenRouterText(result: any) {
  const content = result?.choices?.[0]?.message?.content;

  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const joined = content
      .map((item: any) => item?.text || "")
      .filter(Boolean)
      .join("\n")
      .trim();

    return joined || "";
  }

  return "";
}

async function generateWithOpenRouter(
  input: ReportGenerationInput
): Promise<ReportProviderExecutionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = getOpenRouterModel();

  if (!apiKey) {
    return {
      ok: false,
      error: {
        provider: "OPENROUTER",
        errorCode: "NOT_CONFIGURED",
        errorMessage: "OPENROUTER_API_KEY não configurada.",
      },
    };
  }

  const promptMaster = buildTechnicalReportPrompt(input);
  const imageDataUrl = buildImageDataUrl(input.imagemBase64);

  const content: any[] = [
    {
      type: "text",
      text: promptMaster,
    },
  ];

  if (imageDataUrl) {
    content.push({
      type: "image_url",
      image_url: {
        url: imageDataUrl,
      },
    });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content,
          },
        ],
      }),
    });

    const result = await safeReadJson(response);

    if (!response.ok) {
      return {
        ok: false,
        error: {
          provider: "OPENROUTER",
          httpStatus: response.status,
          errorCode: result?.error?.code ?? null,
          errorMessage: extractOpenRouterErrorMessage(result),
        },
      };
    }

    const textoRelatorio = extractOpenRouterText(result);

    if (!textoRelatorio) {
      return {
        ok: false,
        error: {
          provider: "OPENROUTER",
          errorCode: "EMPTY_RESPONSE",
          errorMessage: "OpenRouter retornou resposta vazia.",
        },
      };
    }

    return {
      ok: true,
      data: {
        provider: "OPENROUTER",
        relatorio: textoRelatorio,
        modelUsed: model,
        rawResponse: result,
      },
    };
  } catch (error: any) {
    return {
      ok: false,
      error: {
        provider: "OPENROUTER",
        errorCode: error?.name ?? "OPENROUTER_REQUEST_ERROR",
        errorMessage: error?.message ?? "Falha de rede ao chamar o OpenRouter.",
      },
    };
  }
}

export const openrouterReportProvider: ReportProviderAdapter = {
  provider: "OPENROUTER",
  isConfigured() {
    return !!process.env.OPENROUTER_API_KEY?.trim();
  },
  getConfiguredModel() {
    return getOpenRouterModel();
  },
  generate: generateWithOpenRouter,
};