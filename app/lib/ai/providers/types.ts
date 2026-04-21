export type ReportProviderName = "GEMINI" | "OPENROUTER" | "OPENAI";

export interface ReportGenerationInput {
  operacao: any;
  analise: any;
  mercado: any;
  veredito: any;
  imagemBase64?: string | null;
}

export interface ReportProviderSuccess {
  provider: ReportProviderName;
  relatorio: string;
  modelUsed: string | null;
  rawResponse?: unknown;
}

export interface ReportProviderFailure {
  provider: ReportProviderName;
  httpStatus?: number | null;
  errorCode?: string | null;
  errorMessage: string;
}

export type ReportProviderExecutionResult =
  | { ok: true; data: ReportProviderSuccess }
  | { ok: false; error: ReportProviderFailure };

export interface ReportProviderAdapter {
  provider: ReportProviderName;
  isConfigured(): boolean;
  getConfiguredModel(): string | null;
  generate(input: ReportGenerationInput): Promise<ReportProviderExecutionResult>;
}