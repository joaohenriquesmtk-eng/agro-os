import { buildImageDataUrl, buildTechnicalReportPrompt } from "../reportPrompt";
import type {
  ReportProviderAdapter,
  ReportProviderExecutionResult,
  ReportGenerationInput,
} from "./types";

function getOpenAIModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
}

function extractOpenAIErrorMessage(result: any) {
  return (
    result?.error?.message ||
    result?.error?.code ||
    "Falha não detalhada da OpenAI."
  );
}

async function safeReadJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractOpenAIText(result: any) {
  if (typeof result?.output_text === "string" && result.output_text.trim()) {
    return result.output_text.trim();
  }

  const joined = (result?.output || [])
    .flatMap((item: any) => item?.content || [])
    .map((content: any) => content?.text || content?.output_text || "")
    .filter(Boolean)
    .join("\n")
    .trim();

  return joined || "";
}

async function generateWithOpenAI(
  input: ReportGenerationInput
): Promise<ReportProviderExecutionResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = getOpenAIModel();

  if (!apiKey) {
    return {
      ok: false,
      error: {
        provider: "OPENAI",
        errorCode: "NOT_CONFIGURED",
        errorMessage: "OPENAI_API_KEY não configurada.",
      },
    };
  }

  const promptMaster = buildTechnicalReportPrompt(input);
  const imageDataUrl = buildImageDataUrl(input.imagemBase64);

  const content: any[] = [
    {
      type: "input_text",
      text: promptMaster,
    },
  ];

  if (imageDataUrl) {
    content.push({
      type: "input_image",
      image_url: imageDataUrl,
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
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
          provider: "OPENAI",
          httpStatus: response.status,
          errorCode: result?.error?.code ?? null,
          errorMessage: extractOpenAIErrorMessage(result),
        },
      };
    }

    const textoRelatorio = extractOpenAIText(result);

    if (!textoRelatorio) {
      return {
        ok: false,
        error: {
          provider: "OPENAI",
          errorCode: "EMPTY_RESPONSE",
          errorMessage: "OpenAI retornou resposta vazia.",
        },
      };
    }

    return {
      ok: true,
      data: {
        provider: "OPENAI",
        relatorio: textoRelatorio,
        modelUsed: model,
        rawResponse: result,
      },
    };
  } catch (error: any) {
    return {
      ok: false,
      error: {
        provider: "OPENAI",
        errorCode: error?.name ?? "OPENAI_REQUEST_ERROR",
        errorMessage: error?.message ?? "Falha de rede ao chamar a OpenAI.",
      },
    };
  }
}

export const openaiReportProvider: ReportProviderAdapter = {
  provider: "OPENAI",
  isConfigured() {
    return !!process.env.OPENAI_API_KEY?.trim();
  },
  getConfiguredModel() {
    return getOpenAIModel();
  },
  generate: generateWithOpenAI,
};