"use client";

import { useState } from "react";
import MarketModuleCard from "./components/MarketModuleCard";
import TechnicalReportCard from "./components/TechnicalReportCard";
import DecisionVerdictCard from "./components/DecisionVerdictCard";
import HistoryDrawer from "./components/HistoryDrawer";
import AgronomicParametersCard from "./components/AgronomicParametersCard";
import OperationsCard from "./components/OperationsCard";
import OperationRadarModal from "./components/OperationRadarModal";
import ProfileModal from "./components/ProfileModal";
import { useClimateTelemetry } from "./hooks/useClimateTelemetry";
import { useProviderHealth } from "./hooks/useProviderHealth";
import { useHistoryLoader } from "./hooks/useHistoryLoader";
import { useReportGeneration } from "./hooks/useReportGeneration";
import {
  getMarketUnit,
  getMarketLabel,
  buildMarketAlertText,
} from "./utils/marketPresentation";
import { useAgroStore, RegiaoBrasil, CulturaBrasil } from "./store/useAgroStore";
import { GeoEngine } from "./services/geoEngine";
import { ServicoMercado } from "./services/apiMercado";
import { fasesFenologicas, unidadePorCultura, fatorExtracaoPMap } from "./constants/agro";
import { Tractor, History, Bell, UserCircle } from "lucide-react";
import DashboardSummaryGrid from "./components/DashboardSummaryGrid";

export default function AgroOSDashboard() {
  const { operacao, analise, mercado, setOperacao, setAnalise, setMercado } =
    useAgroStore();

  const [sincronizando, setSincronizando] = useState(false);
  const [reportMode, setReportMode] = useState<"LOCAL" | "IA_REFINADA">("LOCAL");
  const [imagemMapa, setImagemMapa] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const [modalAlerta, setModalAlerta] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);

  const { cidadeUsuario, alertaClimaDinamico } = useClimateTelemetry();

  const {
    providersHealth,
    providersConfig,
    providerHealthLoading,
    setProvidersHealth,
    setProvidersConfig,
  } = useProviderHealth(reportMode);

  const {
    modalHistorico,
    listaHistorico,
    carregandoHistorico,
    handleVerHistorico,
    fecharHistorico,
    setModalHistorico,
  } = useHistoryLoader();

  const handleCulturaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novaCultura = e.target.value as CulturaBrasil;
    setOperacao({ cultura: novaCultura });
    setAnalise({ faseFenologica: fasesFenologicas[novaCultura][0] });
  };

  const handleUploadMapa = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setNomeArquivo(arquivo.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      setImagemMapa(base64);
    };
    reader.readAsDataURL(arquivo);
  };

  const veredito =
    analise.areaEstresseHa > 0 && mercado.dolarPtax > 0
      ? GeoEngine.processarROI(operacao, analise, mercado)
      : null;

  const {
    gerandoIA,
    relatorioExecutivo,
    reportRuntime,
    setRelatorioExecutivo,
    setReportRuntime,
    handleGerarRelatorioIA,
  } = useReportGeneration({
    operacao,
    analise,
    mercado,
    veredito,
    imagemMapa,
    reportMode,
    onProvidersUpdate: ({ providersHealth, providersConfig }) => {
      if (providersHealth) setProvidersHealth(providersHealth);
      if (providersConfig) setProvidersConfig(providersConfig);
    },
  });

  const handleSincronizarMercado = async () => {
    setSincronizando(true);

    try {
      const dadosMercadoReal = await ServicoMercado.sincronizarB3();
      setMercado(dadosMercadoReal);
    } catch (error) {
      console.error("Falha ao sincronizar", error);
    } finally {
      setSincronizando(false);
    }
  };

  const cultureProfile = GeoEngine.getParametrosCultura(
    operacao.cultura,
    operacao.regiao
  );

  const parametrosCulturaUI = {
    unidade: unidadePorCultura[operacao.cultura],
    produtividadeBase: cultureProfile.productivityBase,
    fatorExtracaoP: fatorExtracaoPMap[operacao.cultura],
  };

  const precoCulturaAtual = mercado.cotacoes?.[operacao.cultura] || 0;
  const unidadeMercadoAtual = getMarketUnit(operacao.cultura);
  const labelMercadoAtual = getMarketLabel(operacao.cultura, mercado.statusMercado);

  const alertaMercadoDinamico = buildMarketAlertText(
    mercado,
    operacao.cultura,
    precoCulturaAtual,
    unidadeMercadoAtual
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-sans selection:bg-emerald-500/30 flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
            <Tractor className="text-emerald-400 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Agro OS</h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">
              GeoEngine & Inteligência de Safra
            </p>
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-4">
          <button
            onClick={handleVerHistorico}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg transition-all border border-slate-700 shadow-lg"
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold">Histórico</span>
          </button>

          <MarketModuleCard mercado={mercado} />

          <div className="flex items-center gap-3 border-l border-slate-800/60 pl-4">
            <button
              onClick={() => setModalAlerta(true)}
              className="relative p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-all border border-slate-700 shadow-lg group"
              title="Radar de Mercado"
            >
              <Bell className="w-5 h-5 group-hover:text-yellow-400 transition-colors" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-slate-800" />
            </button>

            <button
              onClick={() => setModalPerfil(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-all border border-slate-700 shadow-lg group"
              title="Arquiteto do Sistema"
            >
              <UserCircle className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        <div className="lg:col-span-4 space-y-6">
          <AgronomicParametersCard
            operacao={operacao}
            analise={analise}
            parametrosCulturaUI={parametrosCulturaUI}
            fasesFenologicas={fasesFenologicas}
            imagemMapa={imagemMapa}
            nomeArquivo={nomeArquivo}
            onCulturaChange={handleCulturaChange}
            onSetOperacao={setOperacao}
            onSetAnalise={setAnalise}
            onUploadMapa={handleUploadMapa}
            onRemoverMapa={() => {
              setImagemMapa(null);
              setNomeArquivo(null);
            }}
          />

          <OperationsCard
            sincronizando={sincronizando}
            gerandoIA={gerandoIA}
            imagemMapa={imagemMapa}
            vereditoDisponivel={!!veredito}
            reportMode={reportMode}
            setReportMode={setReportMode}
            onSincronizarMercado={handleSincronizarMercado}
            onGerarRelatorioIA={handleGerarRelatorioIA}
            providersHealth={providersHealth}
            providersConfig={providersConfig}
            providerHealthLoading={providerHealthLoading}
          />
        </div>

        <div className="lg:col-span-8 space-y-6">
          <DashboardSummaryGrid
            mercado={mercado}
            operacaoCultura={operacao.cultura}
            precoCulturaAtual={precoCulturaAtual}
            unidadeMercadoAtual={unidadeMercadoAtual}
            labelMercadoAtual={labelMercadoAtual}
            veredito={veredito}
          />

          <DecisionVerdictCard veredito={veredito} />

          <TechnicalReportCard
            relatorioExecutivo={relatorioExecutivo}
            imagemMapa={imagemMapa}
            reportRuntime={reportRuntime}
          />
        </div>
      </div>

      <footer className="mt-12 pt-6 border-t border-slate-800/60 text-center flex flex-col items-center justify-center pb-8">
        <p className="text-slate-400 text-sm">
          Idealizado e desenvolvido por{" "}
          <a
            href="https://www.linkedin.com/in/joaohenriquedasilva-agronomo/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Eng. Agr. João Henrique da Silva
          </a>
        </p>
        <p className="text-slate-500 text-xs mt-1">
          &copy; 2026 Agro OS. Todos os direitos reservados.
        </p>
      </footer>

      <HistoryDrawer
        aberto={modalHistorico}
        carregando={carregandoHistorico}
        listaHistorico={listaHistorico}
        onFechar={fecharHistorico}
        onCarregarLaudo={(parecerIA) => {
          setRelatorioExecutivo(parecerIA);
          setReportRuntime(null);
          setModalHistorico(false);
        }}
      />

      <OperationRadarModal
        aberto={modalAlerta}
        cidadeUsuario={cidadeUsuario}
        alertaClimaDinamico={alertaClimaDinamico}
        alertaMercadoDinamico={alertaMercadoDinamico}
        avisosMercado={mercado.avisosMercado}
        onFechar={() => setModalAlerta(false)}
      />

      <ProfileModal aberto={modalPerfil} onFechar={() => setModalPerfil(false)} />
    </div>
  );
}