import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type {
  ProviderAttemptLog,
  ProviderName,
  ReportRuntimeState,
} from "../types/report";

type AccentVariant = "emerald" | "indigo" | "amber" | "slate";

function getProviderLabel(provider: ProviderName | null) {
  if (!provider) return null;

  switch (provider) {
    case "GEMINI":
      return "Gemini";
    case "OPENROUTER":
      return "OpenRouter";
    case "OPENAI":
      return "OpenAI";
    default:
      return provider;
  }
}

function formatDuration(durationMs: number | null | undefined) {
  if (typeof durationMs !== "number" || Number.isNaN(durationMs)) return "N/D";

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(durationMs / 1000).toFixed(2)} s`;
}

function getAttemptUi(outcome: ProviderAttemptLog["outcome"]) {
  switch (outcome) {
    case "SUCCESS":
      return {
        label: "SUCESSO",
        badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        icon: CheckCircle2,
        iconClass: "text-emerald-400",
      };
    case "FAILED":
      return {
        label: "FALHOU",
        badgeClass: "bg-red-500/15 text-red-300 border-red-500/30",
        icon: XCircle,
        iconClass: "text-red-400",
      };
    case "SKIPPED_COOLDOWN":
      return {
        label: "COOLDOWN",
        badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        icon: Clock3,
        iconClass: "text-amber-400",
      };
    case "SKIPPED_UNCONFIGURED":
    default:
      return {
        label: "SEM CHAVE",
        badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
        icon: AlertTriangle,
        iconClass: "text-slate-400",
      };
  }
}

function renderRelatorioSeguro(texto: string, accent: AccentVariant) {
  const accentMap: Record<
    AccentVariant,
    { destaqueClass: string; bulletClass: string }
  > = {
    emerald: {
      destaqueClass: "text-emerald-400",
      bulletClass: "text-emerald-500",
    },
    indigo: {
      destaqueClass: "text-indigo-400",
      bulletClass: "text-indigo-500",
    },
    amber: {
      destaqueClass: "text-amber-300",
      bulletClass: "text-amber-400",
    },
    slate: {
      destaqueClass: "text-slate-100",
      bulletClass: "text-slate-400",
    },
  };

  const { destaqueClass, bulletClass } = accentMap[accent];
  const linhas = texto.split("\n").filter((linha) => linha.trim() !== "");

  return linhas.map((linha, index) => {
    const isBullet = linha.trim().startsWith("•");
    const conteudoLimpo = isBullet ? linha.trim().replace(/^•\s*/, "") : linha;
    const partes = conteudoLimpo.split(/(\*\*.*?\*\*)/g);

    return (
      <p
        key={`${index}-${conteudoLimpo.slice(0, 20)}`}
        className="mb-3 text-slate-300 leading-relaxed text-sm md:text-base"
      >
        {isBullet && <span className={`${bulletClass} mr-2 font-bold`}>•</span>}

        {partes.map((parte, parteIndex) => {
          const isBold = parte.startsWith("**") && parte.endsWith("**");

          if (isBold) {
            const textoNegrito = parte.slice(2, -2);
            return (
              <strong key={parteIndex} className={destaqueClass}>
                {textoNegrito}
              </strong>
            );
          }

          return <span key={parteIndex}>{parte}</span>;
        })}
      </p>
    );
  });
}

function getVisualConfig(reportRuntime: ReportRuntimeState | null, imagemMapa: boolean) {
  if (!reportRuntime) {
    return {
      accent: "slate" as AccentVariant,
      containerClass: "bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700",
      titleClass: "text-slate-200 border-slate-800",
      heading: "Laudo Técnico Agronômico",
      icon: FileText,
    };
  }

  if (reportRuntime.mode === "LOCAL" && reportRuntime.fallback) {
    return {
      accent: "amber" as AccentVariant,
      containerClass: "bg-gradient-to-br from-amber-950/30 to-slate-900 border-amber-500/30",
      titleClass: "text-amber-300 border-amber-900/50",
      heading: "Laudo Técnico Agronômico (Fallback Local)",
      icon: AlertTriangle,
    };
  }

  if (reportRuntime.mode === "LOCAL") {
    return {
      accent: "emerald" as AccentVariant,
      containerClass: "bg-gradient-to-br from-emerald-950/30 to-slate-900 border-emerald-500/30",
      titleClass: "text-emerald-400 border-emerald-900/50",
      heading: "Laudo Técnico Agronômico (Motor Local)",
      icon: ShieldCheck,
    };
  }

  if (imagemMapa) {
    return {
      accent: "emerald" as AccentVariant,
      containerClass: "bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500/30",
      titleClass: "text-emerald-400 border-emerald-900/50",
      heading: "Auditoria de Precisão (IA Refinada)",
      icon: BrainCircuit,
    };
  }

  return {
    accent: "indigo" as AccentVariant,
    containerClass: "bg-gradient-to-br from-indigo-950/40 to-slate-900 border-indigo-500/30",
    titleClass: "text-indigo-400 border-indigo-900/50",
    heading: "Parecer Técnico Agronômico (IA Refinada)",
    icon: FileText,
  };
}

interface TechnicalReportCardProps {
  relatorioExecutivo: string | null;
  imagemMapa: string | null;
  reportRuntime: ReportRuntimeState | null;
}

export default function TechnicalReportCard({
  relatorioExecutivo,
  imagemMapa,
  reportRuntime,
}: TechnicalReportCardProps) {
  if (!relatorioExecutivo) return null;

  const visual = getVisualConfig(reportRuntime, !!imagemMapa);
  const Icon = visual.icon;
  const providerLabel = getProviderLabel(reportRuntime?.providerUsed ?? null);
  const routeTelemetry = reportRuntime?.routeTelemetry ?? null;

  return (
    <div
      className={`rounded-2xl border p-6 shadow-2xl shadow-slate-950/20 ${visual.containerClass}`}
    >
      <h3
        className={`font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm border-b pb-2 ${visual.titleClass}`}
      >
        <Icon className="w-5 h-5" />
        {visual.heading}
      </h3>

      {reportRuntime?.mode === "IA_REFINADA" && providerLabel && (
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Provedor Utilizado
          </p>
          <p className="mt-1 text-sm text-slate-200">{providerLabel}</p>
        </div>
      )}

      {routeTelemetry && (
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Telemetria da Rota
          </p>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Route ID
              </p>
              <p className="mt-1 text-sm text-slate-200 break-all">
                {routeTelemetry.routeId}
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Tempo Total
              </p>
              <p className="mt-1 text-sm text-slate-200">
                {formatDuration(routeTelemetry.totalDurationMs)}
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Persistência
              </p>
              <p className="mt-1 text-sm text-slate-200">
                {reportRuntime?.telemetryPersisted
                  ? "Registrada no Firestore"
                  : "Não confirmada"}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {routeTelemetry.attemptedProviders.map((attempt, index) => {
              const ui = getAttemptUi(attempt.outcome);
              const AttemptIcon = ui.icon;

              return (
                <div
                  key={`${attempt.provider}-${index}-${attempt.startedAt}`}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-3"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AttemptIcon className={`w-4 h-4 ${ui.iconClass}`} />
                      <span className="text-sm font-semibold text-slate-200">
                        {getProviderLabel(attempt.provider)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${ui.badgeClass}`}
                      >
                        {ui.label}
                      </span>

                      <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase border bg-slate-800 text-slate-200 border-slate-700">
                        {formatDuration(attempt.durationMs)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        Modelo Configurado
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        {attempt.modelConfigured || "N/D"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        Modelo Usado
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        {attempt.modelUsed || "N/D"}
                      </p>
                    </div>
                  </div>

                  {(attempt.errorCode || attempt.errorMessage || attempt.httpStatus) && (
                    <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        Detalhe Operacional
                      </p>
                      <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                        HTTP: {attempt.httpStatus ?? "N/D"} | Código:{" "}
                        {attempt.errorCode || "N/D"} | Mensagem:{" "}
                        {attempt.errorMessage || "N/D"}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reportRuntime?.warning && (
        <div className="mb-4 rounded-xl border border-amber-900/50 bg-amber-950/30 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-300" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Observação Operacional
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-100">
                {reportRuntime.warning}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-none whitespace-pre-wrap">
        {renderRelatorioSeguro(relatorioExecutivo, visual.accent)}
      </div>
    </div>
  );
}