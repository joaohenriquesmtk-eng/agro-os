import { Globe2 } from "lucide-react";
import type { MercadoFinanceiro } from "../store/useAgroStore";

function getMarketStatusClasses(status: "OK" | "PARTIAL" | "DEGRADED" | undefined) {
  switch (status) {
    case "OK":
      return {
        badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        dot: "bg-emerald-400",
        label: "Operação confiável",
      };
    case "PARTIAL":
      return {
        badge: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
        dot: "bg-yellow-400",
        label: "Dados parciais",
      };
    case "DEGRADED":
    default:
      return {
        badge: "bg-red-500/10 text-red-400 border border-red-500/20",
        dot: "bg-red-400",
        label: "Fallback ativo",
      };
  }
}

interface MarketModuleCardProps {
  mercado: MercadoFinanceiro;
}

export default function MarketModuleCard({ mercado }: MarketModuleCardProps) {
  const marketStatusUI = getMarketStatusClasses(mercado.statusMercado);

  return (
    <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-4 py-3 rounded-lg shadow-inner min-w-[280px]">
      <Globe2
        className={`w-5 h-5 ${
          mercado.dolarPtax > 0 ? "text-blue-400" : "text-slate-600 animate-pulse"
        }`}
      />

      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 font-semibold uppercase">
          Módulo de Mercado
        </span>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${marketStatusUI.badge}`}
          >
            <span className={`w-2 h-2 rounded-full ${marketStatusUI.dot}`} />
            {mercado.statusMercado || "DEGRADED"}
          </span>

          <span className="text-[11px] text-slate-400">{marketStatusUI.label}</span>
        </div>

        <span className="text-[11px] text-slate-400">
          Dólar:{" "}
          <span className="text-slate-200 font-medium">
            {mercado.origemDolar || "N/D"}
          </span>
        </span>

        <span className="text-[11px] text-slate-400">
          Commodities:{" "}
          <span className="text-slate-200 font-medium">
            {mercado.origemCommodities || "N/D"}
          </span>
        </span>

        <span className="text-[11px] font-mono text-slate-300">
          {mercado.ultimaSincronizacao || "Aguardando sincronização..."}
        </span>
      </div>
    </div>
  );
}