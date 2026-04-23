import { ChevronRight, Clock, FileText, RefreshCcw, X } from "lucide-react";
import type { HistoryEntry } from "../types/report";

interface HistoryDrawerProps {
  aberto: boolean;
  carregando: boolean;
  listaHistorico: HistoryEntry[];
  onFechar: () => void;
  onCarregarLaudo: (parecerIA: string) => void;
}

export default function HistoryDrawer({
  aberto,
  carregando,
  listaHistorico,
  onFechar,
  onCarregarLaudo,
}: HistoryDrawerProps) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onFechar} />
      <div className="relative w-full max-w-md bg-slate-900 h-full shadow-2xl border-l border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Memória de Safra</h2>
          </div>
          <button onClick={onFechar} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <RefreshCcw className="animate-spin w-8 h-8 text-emerald-500" />
              <p className="text-sm font-medium">Acessando arquivos do Firebase...</p>
            </div>
          ) : listaHistorico.length === 0 ? (
            <p className="text-center text-slate-500 py-10">Nenhum registro encontrado.</p>
          ) : (
            listaHistorico.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800 p-4 rounded-xl hover:border-indigo-500/50 transition-all cursor-default group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                    {item.dataFormatada}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                      item.vereditoSistema === "AUTORIZADO"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : item.vereditoSistema === "RISCO_ELEVADO"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {item.vereditoSistema}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-bold text-sm">{item.talhao}</h3>
                  {item.modo === "TECNICO" && <FileText className="w-3 h-3 text-indigo-500" />}
                </div>

                <p className="text-slate-400 text-xs line-clamp-2 italic mb-3">
                  "{item.parecerIA?.substring(0, 100)}..."
                </p>

                <div className="flex justify-between items-center pt-3 border-t border-slate-800/50">
                  <span className="text-xs text-slate-500">
                    {item.cultura} • {item.areaAfetada} ha
                  </span>

                  <button
                    onClick={() => onCarregarLaudo(item.parecerIA || "")}
                    className="text-indigo-400 text-[10px] font-bold uppercase flex items-center gap-1 hover:text-indigo-300"
                  >
                    Carregar Laudo <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-950/50 border-t border-slate-800">
          <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest">
            Exibindo os últimos 10 laudos auditados
          </p>
        </div>
      </div>
    </div>
  );
}