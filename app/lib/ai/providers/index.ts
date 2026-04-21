import { geminiReportProvider } from "./geminiProvider";
import { openrouterReportProvider } from "./openrouterProvider";
import { openaiReportProvider } from "./openaiProvider";
import type { ReportProviderAdapter, ReportProviderName } from "./types";

export const TECHNICAL_REPORT_PROVIDERS: ReportProviderAdapter[] = [
  geminiReportProvider,
  openrouterReportProvider,
  openaiReportProvider,
];

export function getTechnicalReportProviderConfig(): Record<
  ReportProviderName,
  boolean
> {
  return {
    GEMINI: geminiReportProvider.isConfigured(),
    OPENROUTER: openrouterReportProvider.isConfigured(),
    OPENAI: openaiReportProvider.isConfigured(),
  };
}