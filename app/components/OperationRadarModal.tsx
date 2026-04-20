import { Activity, X } from "lucide-react";

interface OperationRadarModalProps {
  aberto: boolean;
  cidadeUsuario: string;
  alertaClimaDinamico: string;
  alertaMercadoDinamico: string;
  avisosMercado: string[];
  onFechar: () => void;
}

export default function OperationRadarModal({
  aberto,
  cidadeUsuario,
  alertaClimaDinamico,
  alertaMercadoDinamico,
  avisosMercado,
  onFechar,
}: OperationRadarModalProps) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onFechar} />

      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-yellow-500" /> Radar de Operação
          </h3>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-xl shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest">
                Alerta para {cidadeUsuario}
              </span>
              <span className="text-[9px] text-yellow-600 font-medium">
                Satélite (Tempo Real)
              </span>
            </div>
            <p className="text-sm text-yellow-900 leading-relaxed font-medium">
              {alertaClimaDinamico}
            </p>
          </div>

          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                Boletim de Mercado
              </span>
              <span className="text-[9px] text-emerald-600 font-medium">
                Mercado & Câmbio
              </span>
            </div>
            <p className="text-sm text-emerald-900 leading-relaxed font-medium">
              {alertaMercadoDinamico}
            </p>
          </div>

          {avisosMercado?.length > 0 && (
            <div className="bg-slate-100 border-l-4 border-slate-500 p-4 rounded-r-xl shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                  Integridade dos Dados
                </span>
                <span className="text-[9px] text-slate-600 font-medium">
                  Auditoria Interna
                </span>
              </div>

              <div className="space-y-2">
                {avisosMercado.map((aviso, index) => (
                  <p key={index} className="text-sm text-slate-800 leading-relaxed font-medium">
                    • {aviso}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}