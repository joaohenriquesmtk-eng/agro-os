import { AlertOctagon, CheckCircle2, ShieldAlert } from "lucide-react";
import type { VereditoFinal } from "../types/agronomy";

interface DecisionVerdictCardProps {
  veredito: VereditoFinal | null;
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/D";
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/D";
  return `${value.toFixed(1)}%`;
}

function getRoiHeadline(veredito: VereditoFinal) {
  const modo = veredito.leituraEconomica?.modoAnalise;

  if (modo === "NAO_INTERVENCAO_RECOMENDADA") {
    return {
      label: "Intervenção incremental",
      value: "N/A",
      sublabel: "não proposta",
      className: "text-slate-200",
    };
  }

  return {
    label: "ROI incremental da intervenção",
    value: `R$ ${veredito.roiEstimado.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    sublabel: "",
    className: veredito.roiEstimado >= 0 ? "text-white" : "text-red-400",
  };
}

function renderSeasonalLabel(
  plausibilidade?: VereditoFinal["analiseSazonal"]["plausibilidade"]
) {
  if (plausibilidade === "COERENTE") return "Coerente";
  if (plausibilidade === "ATENCAO") return "Atenção";
  if (plausibilidade === "FORA_DO_PADRAO") return "Fora do padrão";
  return "N/D";
}

export default function DecisionVerdictCard({ veredito }: DecisionVerdictCardProps) {
  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8 backdrop-blur-sm shadow-xl min-h-[200px] flex flex-col justify-center relative overflow-hidden">
      {!veredito ? (
        <div className="text-center text-slate-500 flex flex-col items-center gap-3">
          <ShieldAlert className="w-12 h-12 text-slate-700" />
          <p>Preencha a Área de Anomalia e Sincronize o Mercado para ativar a Telemetria.</p>
        </div>
      ) : (
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            {veredito.status === "AUTORIZADO" && (
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            )}
            {veredito.status === "RISCO_ELEVADO" && (
              <AlertOctagon className="w-8 h-8 text-yellow-500" />
            )}
            {veredito.status === "BLOQUEADO" && (
              <AlertOctagon className="w-8 h-8 text-red-500" />
            )}

            <h2
              className={`text-2xl font-bold tracking-tight uppercase ${
                veredito.status === "AUTORIZADO"
                  ? "text-emerald-400"
                  : veredito.status === "RISCO_ELEVADO"
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {veredito.status.replace("_", " ")}
            </h2>
          </div>

          {(() => {
            const roiHeadline = getRoiHeadline(veredito);

            return (
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  {roiHeadline.label}
                </p>
                <div className="flex items-end gap-3">
                  <p className={`text-5xl font-mono font-bold tracking-tighter ${roiHeadline.className}`}>
                    {roiHeadline.value}
                  </p>
                  {roiHeadline.sublabel && (
                    <span className="text-sm text-slate-500 mb-2 uppercase tracking-wider">
                      {roiHeadline.sublabel}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
            <p className="text-slate-300 leading-relaxed text-sm md:text-base">
              <span className="font-semibold text-white">Justificativa:</span>{" "}
              {veredito.justificativa}
            </p>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
              <span className="font-semibold text-slate-300">Fator Pedoclimático:</span>{" "}
              {veredito.fatorLimitante}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Auditoria Econômica
              </p>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between gap-3">
                  <span className="text-slate-400">Modo econômico</span>
                  <span className="text-slate-200 font-medium">
                    {veredito.leituraEconomica.modoAnalise === "NAO_INTERVENCAO_RECOMENDADA"
                      ? "Não intervenção"
                      : "Intervenção proposta"}
                  </span>
                </p>

                <p className="flex justify-between gap-3">
                  <span className="text-slate-400">Custo total estimado</span>
                  <span className="text-slate-200 font-mono">
                    {formatCurrency(veredito.leituraEconomica.custoTotalAdubacao)}
                  </span>
                </p>

                <p className="flex justify-between gap-3">
                  <span className="text-slate-400">Retorno estimado</span>
                  <span className="text-slate-200 font-mono">
                    {formatCurrency(veredito.leituraEconomica.retornoFinanceiroEstimado)}
                  </span>
                </p>

                <p className="flex justify-between gap-3">
                  <span className="text-slate-400">ROI incremental</span>
                  <span className="text-slate-200 font-mono">
                    {veredito.leituraEconomica.modoAnalise === "NAO_INTERVENCAO_RECOMENDADA"
                      ? "N/A"
                      : formatCurrency(veredito.leituraEconomica.roiIncrementalAplicacao)}
                  </span>
                </p>

                <p className="flex justify-between gap-3">
                  <span className="text-slate-400">Margem sobre custo</span>
                  <span className="text-slate-200 font-mono">
                    {veredito.leituraEconomica.modoAnalise === "NAO_INTERVENCAO_RECOMENDADA"
                      ? "N/A"
                      : formatPercent(veredito.leituraEconomica.margemSobreCusto)}
                  </span>
                </p>

                <p className="flex justify-between gap-3">
                  <span className="text-slate-400">Custo evitado</span>
                  <span className="text-slate-200 font-mono">
                    {formatCurrency(veredito.leituraEconomica.custoEvitado)}
                  </span>
                </p>

                <p className="flex justify-between gap-3">
                  <span className="text-slate-400">Preço referência</span>
                  <span className="text-slate-200 font-mono">
                    {formatCurrency(veredito.leituraEconomica.precoReferencia)}
                  </span>
                </p>

                <p className="pt-2 text-xs text-slate-500 leading-relaxed">
                  {veredito.leituraEconomica.observacaoEconomica || "Sem observação econômica."}
                </p>
              </div>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Diagnóstico do Solo
              </p>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between gap-3">
                  <span className="text-slate-400">Classe de fósforo</span>
                  <span className="text-slate-200 font-medium">
                    {veredito.diagnosticoSolo.classeFosforo || "N/D"}
                  </span>
                </p>
                <p className="flex justify-between gap-3">
                  <span className="text-slate-400">Classe de potássio</span>
                  <span className="text-slate-200 font-medium">
                    {veredito.diagnosticoSolo.classePotassio || "N/D"}
                  </span>
                </p>
                <p className="flex justify-between gap-3">
                  <span className="text-slate-400">Pressão nutricional</span>
                  <span className="text-slate-200 font-medium">
                    {veredito.diagnosticoSolo.pressaoNutricional || "N/D"}
                  </span>
                </p>
                <p className="flex justify-between gap-3">
                  <span className="text-slate-400">Classificação financeira</span>
                  <span className="text-slate-200 font-medium">
                    {veredito.classificacaoFinanceira || "N/D"}
                  </span>
                </p>
                <p className="flex justify-between gap-3">
                  <span className="text-slate-400">Confiança do motor</span>
                  <span className="text-slate-200 font-medium">
                    {typeof veredito.scoreConfianca === "number"
                      ? `${veredito.scoreConfianca.toFixed(1)} / 10`
                      : "N/D"}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Coerência Sazonal
              </p>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between gap-3">
                  <span className="text-slate-400">Plausibilidade</span>
                  <span className="text-slate-200 font-medium">
                    {renderSeasonalLabel(veredito.analiseSazonal?.plausibilidade)}
                  </span>
                </p>
                <p className="flex justify-between gap-3">
                  <span className="text-slate-400">Sistema</span>
                  <span className="text-slate-200 font-medium text-right">
                    {veredito.analiseSazonal?.sistemaProdutivo || "N/D"}
                  </span>
                </p>
                <p className="flex justify-between gap-3">
                  <span className="text-slate-400">Janela padrão</span>
                  <span className="text-slate-200 font-medium text-right">
                    {veredito.analiseSazonal?.janelaEsperada || "N/D"}
                  </span>
                </p>
                <p className="pt-2 text-xs text-slate-500 leading-relaxed">
                  {veredito.analiseSazonal?.observacao || "Sem observação sazonal."}
                </p>
              </div>
            </div>
          </div>

          {Array.isArray(veredito.fatoresDeterminantes) && veredito.fatoresDeterminantes.length > 0 && (
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Fatores Determinantes da Decisão
              </p>
              <div className="space-y-2">
                {veredito.fatoresDeterminantes.slice(0, 7).map((fator, index) => (
                  <p key={index} className="text-sm text-slate-300">
                    • {fator}
                  </p>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(veredito.premissasCriticas) && veredito.premissasCriticas.length > 0 && (
            <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Premissas Críticas do Motor
              </p>
              <div className="space-y-2">
                {veredito.premissasCriticas.slice(0, 7).map((premissa, index) => (
                  <p key={index} className="text-sm text-slate-400">
                    • {premissa}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {veredito && (
        <div
          className={`absolute -right-20 -top-20 w-64 h-64 blur-3xl opacity-10 pointer-events-none rounded-full ${
            veredito.status === "AUTORIZADO"
              ? "bg-emerald-500"
              : veredito.status === "RISCO_ELEVADO"
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
        />
      )}
    </div>
  );
}