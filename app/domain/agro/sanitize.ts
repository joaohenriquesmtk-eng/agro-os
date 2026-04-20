import type { AnaliseEspectral, DadosOperacionais } from "../../store/useAgroStore";

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function sanitizeOperacao(operacao: DadosOperacionais): DadosOperacionais {
  return {
    ...operacao,
    talhao: (operacao.talhao || "").trim(),
    fosforoMehlich: clamp(toFiniteNumber(operacao.fosforoMehlich, 0), 0, 120),
    potassio: clamp(toFiniteNumber(operacao.potassio, 0), 0, 2),
    produtividadeAlvo: clamp(toFiniteNumber(operacao.produtividadeAlvo, 0), 0, 500),
    phSolo: clamp(toFiniteNumber(operacao.phSolo, 5.5), 3.5, 8.5),
    ctc: clamp(toFiniteNumber(operacao.ctc, 8), 0, 40),
    materiaOrganica: clamp(toFiniteNumber(operacao.materiaOrganica, 2), 0, 15),
    saturacaoBases: clamp(toFiniteNumber(operacao.saturacaoBases, 50), 0, 100),
    teorArgila: clamp(toFiniteNumber(operacao.teorArgila, 45), 0, 100),
  };
}

export function sanitizeAnalise(analise: AnaliseEspectral): AnaliseEspectral {
  return {
    ...analise,
    faseFenologica: (analise.faseFenologica || "").trim(),
    indice: (analise.indice || "").trim(),
    areaEstresseHa: clamp(toFiniteNumber(analise.areaEstresseHa, 0), 0, 100000),
    chuva7dMm: clamp(toFiniteNumber(analise.chuva7dMm, 10), 0, 500),
  };
}

export function sanitizeNumberInput(
  rawValue: string,
  options?: { min?: number; max?: number; fallback?: number }
): number {
  const fallback = options?.fallback ?? 0;
  const min = options?.min ?? 0;
  const max = options?.max ?? Number.MAX_SAFE_INTEGER;

  const trimmed = rawValue.trim();

  if (trimmed === "") return fallback;

  const parsed = Number(trimmed.replace(",", "."));

  if (!Number.isFinite(parsed)) return fallback;

  return clamp(parsed, min, max);
}