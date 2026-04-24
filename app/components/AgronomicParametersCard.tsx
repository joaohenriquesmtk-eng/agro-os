import { MapPin, Upload, FlaskConical } from "lucide-react";
import type {
  RegiaoBrasil,
  CulturaBrasil,
  DadosOperacionais,
  AnaliseEspectral,
} from "../store/useAgroStore";
import { sanitizeNumberInput } from "../domain/agro/sanitize";

interface AgronomicParametersCardProps {
  operacao: DadosOperacionais;
  analise: AnaliseEspectral;
  parametrosCulturaUI: {
    unidade: string;
    produtividadeBase: number;
    fatorExtracaoP: number;
  };
  fasesFenologicas: Record<CulturaBrasil, string[]>;
  imagemMapa: string | null;
  nomeArquivo: string | null;
  onCulturaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSetOperacao: (dados: Partial<DadosOperacionais>) => void;
  onSetAnalise: (dados: Partial<AnaliseEspectral>) => void;
  onUploadMapa: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoverMapa: () => void;
}

export default function AgronomicParametersCard({
  operacao,
  analise,
  parametrosCulturaUI,
  fasesFenologicas,
  imagemMapa,
  nomeArquivo,
  onCulturaChange,
  onSetOperacao,
  onSetAnalise,
  onUploadMapa,
  onRemoverMapa,
}: AgronomicParametersCardProps) {
  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm shadow-xl">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-slate-200 border-b border-slate-800 pb-2">
        <MapPin className="w-5 h-5 text-indigo-400" /> Parâmetros Agronômicos
      </h2>

      <div className="space-y-4">
        <div className="mb-4 pb-4 border-b border-slate-800">
          <label className="block text-[10px] font-bold text-indigo-400 mb-1 uppercase tracking-wider">
            Identificador do Talhão / Gleba
          </label>
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-200"
            value={operacao.talhao || ""}
            onChange={(e) => onSetOperacao({ talhao: e.target.value })}
            placeholder="Ex: Gleba 4 - Fazenda Santa Maria"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
              Cultura
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={operacao.cultura}
              onChange={onCulturaChange}
            >
              <option value="SOJA">Soja</option>
              <option value="MILHO">Milho</option>
              <option value="TRIGO">Trigo</option>
              <option value="ALGODAO">Algodão</option>
              <option value="CANA">Cana-de-Açúcar</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
              Fase Fenológica
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={analise.faseFenologica}
              onChange={(e) => onSetAnalise({ faseFenologica: e.target.value })}
            >
              {fasesFenologicas[operacao.cultura].map((fase) => (
                <option key={fase} value={fase}>
                  {fase}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
            Região Geográfica
          </label>
          <select
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            value={operacao.regiao}
            onChange={(e) => onSetOperacao({ regiao: e.target.value as RegiaoBrasil })}
          >
            <option value="CENTRO_OESTE">Centro-Oeste (Latossolo/Fixação P)</option>
            <option value="SUL">Sul (Risco de Geada/Umidade)</option>
            <option value="NORTE">Norte (Lixiviação Extrema)</option>
            <option value="NORDESTE">Nordeste (Matopiba/Estresse Hídrico)</option>
            <option value="SUDESTE">Sudeste (Relevo/Degradação)</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-[9px] font-bold text-blue-400 mb-1 uppercase tracking-wider flex items-center gap-1">
              <FlaskConical className="w-3 h-3" /> P (mg/dm³)
            </label>
            <input
              type="number"
              min={0}
              max={120}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
              value={operacao.fosforoMehlich || ""}
              onChange={(e) =>
                onSetOperacao({
                  fosforoMehlich: sanitizeNumberInput(e.target.value, {
                    min: 0,
                    max: 120,
                    fallback: 0,
                  }),
                })
              }
              placeholder="Ex: 12"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-blue-400 mb-1 uppercase tracking-wider flex items-center gap-1">
              <FlaskConical className="w-3 h-3" /> K (cmol/dm³)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              max={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
              value={operacao.potassio || ""}
              onChange={(e) =>
                onSetOperacao({
                  potassio: sanitizeNumberInput(e.target.value, {
                    min: 0,
                    max: 2,
                    fallback: 0,
                  }),
                })
              }
              placeholder="Ex: 0.15"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-blue-400 mb-1 uppercase tracking-wider">
              Meta ({parametrosCulturaUI.unidade})
            </label>
            <input
              type="number"
              min={0}
              max={500}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
              value={operacao.produtividadeAlvo || ""}
              onChange={(e) =>
                onSetOperacao({
                  produtividadeAlvo: sanitizeNumberInput(e.target.value, {
                    min: 0,
                    max: 500,
                    fallback: 0,
                  }),
                })
              }
              placeholder={`Ex: ${parametrosCulturaUI.produtividadeBase}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
  <div>
    <label className="block text-[9px] font-bold text-cyan-400 mb-1 uppercase tracking-wider">
      pH do Solo
    </label>
    <input
      type="number"
      step="0.1"
      min={3.5}
      max={8.5}
      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-mono"
      value={operacao.phSolo || ""}
      onChange={(e) =>
        onSetOperacao({
          phSolo: sanitizeNumberInput(e.target.value, {
            min: 3.5,
            max: 8.5,
            fallback: 5.5,
          }),
        })
      }
      placeholder="Ex: 5.5"
    />
  </div>

  <div>
    <label className="block text-[9px] font-bold text-cyan-400 mb-1 uppercase tracking-wider">
      CTC
    </label>
    <input
      type="number"
      step="0.1"
      min={0}
      max={40}
      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-mono"
      value={operacao.ctc || ""}
      onChange={(e) =>
        onSetOperacao({
          ctc: sanitizeNumberInput(e.target.value, {
            min: 0,
            max: 40,
            fallback: 8,
          }),
        })
      }
      placeholder="Ex: 8"
    />
  </div>

  <div>
    <label className="block text-[9px] font-bold text-cyan-400 mb-1 uppercase tracking-wider">
      Matéria Orgânica (%)
    </label>
    <input
      type="number"
      step="0.1"
      min={0}
      max={12}
      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-mono"
      value={operacao.materiaOrganica || ""}
      onChange={(e) =>
        onSetOperacao({
          materiaOrganica: sanitizeNumberInput(e.target.value, {
            min: 0,
            max: 12,
            fallback: 2,
          }),
        })
      }
      placeholder="Ex: 2.5"
    />
  </div>

  <div>
    <label className="block text-[9px] font-bold text-cyan-400 mb-1 uppercase tracking-wider">
      Saturação por Bases (%)
    </label>
    <input
      type="number"
      step="1"
      min={0}
      max={100}
      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-mono"
      value={operacao.saturacaoBases || ""}
      onChange={(e) =>
        onSetOperacao({
          saturacaoBases: sanitizeNumberInput(e.target.value, {
            min: 0,
            max: 100,
            fallback: 50,
          }),
        })
      }
      placeholder="Ex: 50"
    />
  </div>

  <div>
    <label className="block text-[9px] font-bold text-cyan-400 mb-1 uppercase tracking-wider">
      Teor de Argila (%)
    </label>
    <input
      type="number"
      step="1"
      min={0}
      max={90}
      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-mono"
      value={operacao.teorArgila || ""}
      onChange={(e) =>
        onSetOperacao({
          teorArgila: sanitizeNumberInput(e.target.value, {
            min: 0,
            max: 90,
            fallback: 45,
          }),
        })
      }
      placeholder="Ex: 45"
    />
  </div>

  <div>
    <label className="block text-[9px] font-bold text-emerald-400 mb-1 uppercase tracking-wider">
      Chuva 7 dias (mm)
    </label>
    <input
      type="number"
      step="1"
      min={0}
      max={300}
      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
      value={analise.chuva7dMm || ""}
      onChange={(e) =>
        onSetAnalise({
          chuva7dMm: sanitizeNumberInput(e.target.value, {
            min: 0,
            max: 300,
            fallback: 10,
          }),
        })
      }
      placeholder="Ex: 20"
    />
  </div>
</div>

        <div>
          <label className="block text-[10px] font-bold text-emerald-400 mb-1 uppercase tracking-wider">
            Área de Anomalia (Hectares)
          </label>
          <input
            type="number"
            min={0}
            max={100000}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-emerald-400"
            value={analise.areaEstresseHa || ""}
            onChange={(e) =>
              onSetAnalise({
                areaEstresseHa: sanitizeNumberInput(e.target.value, {
                  min: 0,
                  max: 100000,
                  fallback: 0,
                }),
              })
            }
            placeholder="Ex: 50"
          />
        </div>

        <div className="pt-4">
          <label className="w-full relative overflow-hidden bg-slate-900 border border-dashed border-slate-600 hover:border-emerald-500 p-4 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group">
            <input type="file" accept="image/*" className="hidden" onChange={onUploadMapa} />
            <Upload
              className={`w-6 h-6 ${
                imagemMapa ? "text-emerald-500" : "text-slate-500 group-hover:text-emerald-400"
              }`}
            />
            <span className="text-xs font-medium text-slate-400 text-center">
              {nomeArquivo ? (
                <span className="text-emerald-400 font-bold">{nomeArquivo}</span>
              ) : (
                "Anexar Mapa (NDVI/NDRE)"
              )}
            </span>
          </label>

          {imagemMapa && (
            <button
              onClick={onRemoverMapa}
              className="w-full mt-2 text-[10px] text-red-500 font-bold uppercase hover:underline"
            >
              Remover Mapa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}