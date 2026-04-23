import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  FileText,
  RefreshCcw,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import type React from "react";
import type {
  ProviderHealthSnapshot,
  ProvidersConfigMap,
  ProvidersHealthMap,
  ProviderName,
} from "../types/report";

interface OperationsCardProps {
  sincronizando: boolean;
  gerandoIA: boolean;
  imagemMapa: string | null;
  vereditoDisponivel: boolean;
  reportMode: "LOCAL" | "IA_REFINADA";
  setReportMode: React.Dispatch<React.SetStateAction<"LOCAL" | "IA_REFINADA">>;
  onSincronizarMercado: () => void;
  onGerarRelatorioIA: () => void;
  providersHealth: ProvidersHealthMap | null;
  providersConfig: ProvidersConfigMap;
  providerHealthLoading: boolean;
}

function getProviderLabel(provider: ProviderName) {
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

function formatCooldownUntil(cooldownUntil: string | null) {
  if (!cooldownUntil) return null;

  const date = new Date(cooldownUntil);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getProviderUi(snapshot: ProviderHealthSnapshot | undefined) {
  if (!snapshot) {
    return {
      badge: "SEM LEITURA",
      badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
      icon: AlertTriangle,
      iconClass: "text-slate-400",
    };
  }

  switch (snapshot.status) {
    case "ONLINE":
      return {
        badge: "ONLINE",
        badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        icon: ShieldCheck,
        iconClass: "text-emerald-400",
      };

    case "RATE_LIMITED":
      return {
        badge: "RATE LIMITED",
        badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        icon: AlertTriangle,
        iconClass: "text-amber-400",
      };

    case "DEGRADED":
      return {
        badge: "DEGRADED",
        badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        icon: AlertTriangle,
        iconClass: "text-amber-400",
      };

    case "OFFLINE":
    default:
      return {
        badge: "OFFLINE",
        badgeClass: "bg-red-500/15 text-red-300 border-red-500/30",
        icon: WifiOff,
        iconClass: "text-red-400",
      };
  }
}

export default function OperationsCard({
  sincronizando,
  gerandoIA,
  imagemMapa,
  vereditoDisponivel,
  reportMode,
  setReportMode,
  onSincronizarMercado,
  onGerarRelatorioIA,
  providersHealth,
  providersConfig,
  providerHealthLoading,
}: OperationsCardProps) {
  const providerOrder: ProviderName[] = ["GEMINI", "OPENROUTER", "OPENAI"];

  const hasAnyConfiguredExternal = providerOrder.some(
    (provider) => providersConfig[provider]
  );

  const allConfiguredBlocked =
    hasAnyConfiguredExternal &&
    providerOrder
      .filter((provider) => providersConfig[provider])
      .every((provider) => {
        const snapshot = providersHealth?.[provider];
        return !!snapshot && snapshot.status !== "ONLINE";
      });

  const reportButtonLabel = gerandoIA
    ? "Processando..."
    : reportMode === "LOCAL"
    ? "2. Gerar Laudo Local"
    : !hasAnyConfiguredExternal || allConfiguredBlocked
    ? "2. Gerar Laudo com Fallback Local"
    : imagemMapa
    ? "2. Rodar Orquestração Multimodal"
    : "2. Rodar Orquestração IA";

  const reportButtonClass =
    reportMode === "LOCAL"
      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
      : !hasAnyConfiguredExternal || allConfiguredBlocked
      ? "bg-amber-600 hover:bg-amber-500 shadow-amber-900/20"
      : imagemMapa
      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
      : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20";

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 shadow-xl">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-slate-200">
        <Activity className="w-5 h-5 text-blue-400" /> Operações
      </h2>

      <div className="mb-4 p-3 rounded-xl border border-slate-800 bg-slate-950/60">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Modo do Laudo
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setReportMode("LOCAL")}
            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
              reportMode === "LOCAL"
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:border-emerald-500/50"
            }`}
          >
            Local
          </button>

          <button
            type="button"
            onClick={() => setReportMode("IA_REFINADA")}
            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
              reportMode === "IA_REFINADA"
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:border-indigo-500/50"
            }`}
          >
            IA Refinada
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
          {reportMode === "LOCAL"
            ? "Modo local: usa somente o motor interno, com custo zero e resposta imediata."
            : "Modo IA refinada: o Agro OS tenta a rota Gemini → OpenRouter → OpenAI → Local, sem depender de um único provedor."}
        </p>

        {reportMode === "IA_REFINADA" && (
          <div className="mt-3 p-3 rounded-xl border border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Rota de Orquestração
              </p>

              {providerHealthLoading && (
                <span className="text-[10px] text-slate-400 uppercase">
                  Atualizando...
                </span>
              )}
            </div>

            <p className="mt-2 text-[11px] text-slate-300 leading-relaxed">
              Ordem de tentativa: <strong className="text-indigo-300">Gemini</strong>{" "}
              → <strong className="text-cyan-300">OpenRouter</strong> →{" "}
              <strong className="text-indigo-300">OpenAI</strong> →{" "}
              <strong className="text-emerald-300">Local</strong>
            </p>

            <div className="mt-3 grid grid-cols-1 gap-2">
              {providerOrder.map((provider) => {
                const configured = providersConfig[provider];
                const snapshot = providersHealth?.[provider];
                const providerUi = getProviderUi(snapshot);
                const ProviderIcon = providerUi.icon;
                const cooldownLabel = formatCooldownUntil(
                  snapshot?.cooldownUntil ?? null
                );

                return (
                  <div
                    key={provider}
                    className="rounded-xl border border-slate-800 bg-slate-900 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ProviderIcon className={`w-4 h-4 ${providerUi.iconClass}`} />
                        <span className="text-sm font-semibold text-slate-200">
                          {getProviderLabel(provider)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            configured
                              ? "bg-slate-800 text-slate-200 border-slate-700"
                              : "bg-slate-950 text-slate-500 border-slate-800"
                          }`}
                        >
                          {configured ? "CONFIGURADO" : "SEM CHAVE"}
                        </span>

                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${providerUi.badgeClass}`}
                        >
                          {providerUi.badge}
                        </span>
                      </div>
                    </div>

                    {configured && cooldownLabel && snapshot?.status !== "ONLINE" && (
                      <p className="mt-2 text-[11px] text-amber-300">
                        Cooldown até {cooldownLabel}.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onSincronizarMercado}
        disabled={sincronizando}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        <RefreshCcw className={`w-5 h-5 ${sincronizando ? "animate-spin" : ""}`} />
        {sincronizando ? "Buscando Cotações..." : "1. Sincronizar Mercado"}
      </button>

      <button
        onClick={onGerarRelatorioIA}
        disabled={!vereditoDisponivel || gerandoIA}
        className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${reportButtonClass}`}
      >
        {reportMode === "IA_REFINADA" && imagemMapa ? (
          <BrainCircuit className={`w-5 h-5 ${gerandoIA ? "animate-pulse" : ""}`} />
        ) : (
          <FileText className={`w-5 h-5 ${gerandoIA ? "animate-pulse" : ""}`} />
        )}

        {reportButtonLabel}
      </button>
    </div>
  );
}