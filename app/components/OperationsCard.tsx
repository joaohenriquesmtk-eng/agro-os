import { Activity, BrainCircuit, FileText, RefreshCcw } from "lucide-react";
import type React from "react";

interface OperationsCardProps {
  sincronizando: boolean;
  gerandoIA: boolean;
  imagemMapa: string | null;
  vereditoDisponivel: boolean;
  reportMode: "LOCAL" | "IA_REFINADA";
  setReportMode: React.Dispatch<React.SetStateAction<"LOCAL" | "IA_REFINADA">>;
  onSincronizarMercado: () => void;
  onGerarRelatorioIA: () => void;
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
}: OperationsCardProps) {
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
            : "Modo IA refinada: usa a IA externa apenas para melhorar a redação. Se falhar, o Agro OS cai automaticamente para o modo local."}
        </p>
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
        className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
          imagemMapa
            ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
            : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20"
        }`}
      >
        {imagemMapa ? (
          <BrainCircuit className={`w-5 h-5 ${gerandoIA ? "animate-pulse" : ""}`} />
        ) : (
          <FileText className={`w-5 h-5 ${gerandoIA ? "animate-pulse" : ""}`} />
        )}

        {gerandoIA
          ? "Processando..."
          : reportMode === "LOCAL"
          ? "2. Gerar Laudo Local"
          : imagemMapa
          ? "2. Auditoria Multimodal"
          : "2. Gerar Parecer Refinado"}
      </button>
    </div>
  );
}