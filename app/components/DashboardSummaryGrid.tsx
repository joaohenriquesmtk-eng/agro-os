import type { CulturaBrasil, MercadoFinanceiro } from "../store/useAgroStore";
import type { VereditoFinal } from "../types/agronomy";

interface DashboardSummaryGridProps {
  mercado: MercadoFinanceiro;
  operacaoCultura: CulturaBrasil;
  precoCulturaAtual: number;
  unidadeMercadoAtual: string;
  labelMercadoAtual: string;
  veredito: VereditoFinal | null;
}

export default function DashboardSummaryGrid({
  mercado,
  operacaoCultura,
  precoCulturaAtual,
  unidadeMercadoAtual,
  labelMercadoAtual,
  veredito,
}: DashboardSummaryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex justify-between items-center mb-1">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            Dólar PTAX
          </span>
        </div>
        <p className="text-2xl font-mono font-bold text-white">
          R$ {mercado.dolarPtax.toFixed(2)}
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex justify-between items-center mb-1">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            {labelMercadoAtual}
          </span>
        </div>
        <p className="text-2xl font-mono font-bold text-white">
          R$ {precoCulturaAtual.toFixed(2)}
          <span className="text-xs text-slate-500 font-sans ml-1">
            /{unidadeMercadoAtual.replace("R$/", "")}
          </span>
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex justify-between items-center mb-1">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            Insumos (FOB/t)
          </span>
        </div>
        <div className="flex flex-col mt-1">
          <p className="text-[10px] font-mono text-slate-300 flex justify-between">
            <span>MAP:</span> <span>R$ {mercado.custoMapTon.toFixed(0)}</span>
          </p>
          <p className="text-[10px] font-mono text-slate-300 flex justify-between">
            <span>KCL:</span> <span>R$ {mercado.custoKclTon.toFixed(0)}</span>
          </p>
          <p className="text-[10px] font-mono text-slate-300 flex justify-between">
            <span>UREIA:</span> <span>R$ {mercado.custoUreaTon.toFixed(0)}</span>
          </p>
        </div>
      </div>

      <div className="bg-blue-950/30 border border-blue-900/50 rounded-2xl p-3 shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-blue-400 text-[9px] font-bold uppercase tracking-wider">
            Doses Calc. (kg/ha)
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div className="bg-blue-950/40 p-1.5 rounded border border-blue-900/30 text-center">
            <span className="text-[7px] text-blue-400 font-bold block mb-0.5">
              MAP
            </span>
            <p className="text-xs font-mono font-bold text-blue-100">
              {veredito?.doseMapHa.toFixed(0) || "0"}
            </p>
          </div>

          <div className="bg-blue-950/40 p-1.5 rounded border border-blue-900/30 text-center">
            <span className="text-[7px] text-blue-400 font-bold block mb-0.5">
              KCL
            </span>
            <p className="text-xs font-mono font-bold text-blue-100">
              {veredito?.doseKclHa.toFixed(0) || "0"}
            </p>
          </div>

          <div className="bg-blue-950/40 p-1.5 rounded border border-blue-900/30 text-center flex flex-col justify-center items-center">
            <span className="text-[7px] text-blue-400 font-bold block mb-0.5">
              UREIA
            </span>
            <p
              className={`font-mono font-bold text-blue-100 ${
                operacaoCultura === "SOJA" ? "text-[8px]" : "text-xs"
              }`}
            >
              {operacaoCultura === "SOJA"
                ? "FIX."
                : veredito?.doseUreaHa.toFixed(0) || "0"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}