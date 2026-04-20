"use client";

import { useState, useEffect } from 'react';
import MarketModuleCard from "./components/MarketModuleCard";
import TechnicalReportCard from "./components/TechnicalReportCard";
import DecisionVerdictCard from "./components/DecisionVerdictCard";
import HistoryDrawer from "./components/HistoryDrawer";
import AgronomicParametersCard from "./components/AgronomicParametersCard";
import OperationsCard from "./components/OperationsCard";
import OperationRadarModal from "./components/OperationRadarModal";
import ProfileModal from "./components/ProfileModal";
import { useClimateTelemetry } from "./hooks/useClimateTelemetry";
import {
  getMarketUnit,
  getMarketLabel,
  buildMarketAlertText,
} from "./utils/marketPresentation";
import { useAgroStore, RegiaoBrasil, CulturaBrasil } from './store/useAgroStore';
import { buildLocalTechnicalReport } from './domain/agro/localReportBuilder';
import { GeoEngine } from './services/geoEngine';
import { ServicoMercado } from './services/apiMercado';
import { db } from './lib/firebase';
import { collection, addDoc, serverTimestamp, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { buildScenarioSignature } from './domain/agro/scenarioSignature';
import { readCachedReport, writeCachedReport } from './lib/reportCache';
import { 
  Tractor, Globe2, Activity, 
  BrainCircuit, AlertOctagon, CheckCircle2, 
  RefreshCcw, MapPin, ShieldAlert, Upload, FlaskConical,
  History, Clock, ChevronRight, X, FileText,
  Bell, UserCircle, MessageCircle 
} from 'lucide-react';

const fasesFenologicas: Record<CulturaBrasil, string[]> = {
  "SOJA": ["Emergência (VE-VC)", "Vegetativo (V1-Vn)", "Floração (R1-R2)", "Enchimento (R5-R6)", "Maturação (R7-R8)"],
  "MILHO": ["Emergência (VE)", "Vegetativo (V4-V8)", "Pendoamento (VT-R1)", "Enchimento (R2-R5)", "Maturação (R6)"],
  "CANA": ["Brotação", "Perfilhamento", "Crescimento de Colmos", "Maturação"],
  "ALGODAO": ["Emergência (V0)", "Vegetativo (V1-Vn)", "Botão Floral (B1-Bn)", "Florescimento (F1-Fn)", "Maçã (M1-Mn)", "Maturação"],
  "TRIGO": ["Germinação", "Perfilhamento", "Elongação", "Espigamento", "Maturação"]
};

export default function AgroOSDashboard() {
  const { 
    operacao, analise, mercado, 
    setOperacao, setAnalise, setMercado 
  } = useAgroStore();

  const [sincronizando, setSincronizando] = useState(false);
  const [gerandoIA, setGerandoIA] = useState(false);
  const [relatorioExecutivo, setRelatorioExecutivo] = useState<string | null>(null);
  const [reportMode, setReportMode] = useState<"LOCAL" | "IA_REFINADA">("LOCAL");
  
  const [imagemMapa, setImagemMapa] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);

  const [modalHistorico, setModalHistorico] = useState(false);
  const [listaHistorico, setListaHistorico] = useState<any[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  const [modalAlerta, setModalAlerta] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const { cidadeUsuario, alertaClimaDinamico } = useClimateTelemetry();

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

  const veredito = (analise.areaEstresseHa > 0 && mercado.dolarPtax > 0) 
    ? GeoEngine.processarROI(operacao, analise, mercado) 
    : null;

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

  const handleGerarRelatorioIA = async () => {
  if (!veredito || gerandoIA) return;

  setGerandoIA(true);

  try {
    const { signature, fingerprint } = await buildScenarioSignature({
      operacao,
      analise,
      mercado,
      veredito,
    });

    const cacheKey = `${signature}_${reportMode}`;
    const cached = await readCachedReport(cacheKey);

    if (cached?.relatorio) {
      setRelatorioExecutivo(cached.relatorio);

      try {
        await addDoc(collection(db, "historico_talhoes"), {
          talhao: operacao.talhao || "Talhão Não Identificado",
          cultura: operacao.cultura,
          regiao: operacao.regiao,
          faseFenologica: analise.faseFenologica,
          fosforo: operacao.fosforoMehlich,
          areaAfetada: analise.areaEstresseHa,
          roiProjetado: veredito.roiEstimado,
          vereditoSistema: veredito.status,
          parecerIA: cached.relatorio,
          modo: "CACHE",
          modoRelatorio: reportMode,
          assinaturaCenario: cacheKey,
          sistemaProdutivo: veredito.analiseSazonal?.sistemaProdutivo || null,
          dataRegistro: serverTimestamp(),
        });
      } catch (dbError) {
        console.error("Erro ao gravar histórico do cache:", dbError);
      }

      alert(`Laudo recuperado do cache técnico do Agro OS (${reportMode}).`);
      return;
    }

    if (reportMode === "LOCAL") {
      const relatorioLocal = buildLocalTechnicalReport({
        operacao,
        analise,
        mercado,
        veredito,
        origem: "MOTOR LOCAL (ACIONAMENTO DIRETO)",
      });

      setRelatorioExecutivo(relatorioLocal);

      try {
        await writeCachedReport({
          signature: cacheKey,
          relatorio: relatorioLocal,
          source: "LOCAL_FALLBACK",
          fingerprint,
          metadata: {
            cultura: operacao.cultura,
            regiao: operacao.regiao,
            faseFenologica: analise.faseFenologica,
            statusVeredito: veredito.status,
            sistemaProdutivo: veredito.analiseSazonal?.sistemaProdutivo || null,
            modoRelatorio: reportMode,
            possuiMapa: !!imagemMapa,
          },
        });
      } catch (cacheError) {
        console.error("Erro ao gravar cache local:", cacheError);
      }

      try {
        await addDoc(collection(db, "historico_talhoes"), {
          talhao: operacao.talhao || "Talhão Não Identificado",
          cultura: operacao.cultura,
          regiao: operacao.regiao,
          faseFenologica: analise.faseFenologica,
          fosforo: operacao.fosforoMehlich,
          areaAfetada: analise.areaEstresseHa,
          roiProjetado: veredito.roiEstimado,
          vereditoSistema: veredito.status,
          parecerIA: relatorioLocal,
          modo: "LOCAL_DIRETO",
          modoRelatorio: reportMode,
          assinaturaCenario: cacheKey,
          sistemaProdutivo: veredito.analiseSazonal?.sistemaProdutivo || null,
          dataRegistro: serverTimestamp()
        });
      } catch (dbError) {
        console.error("Erro ao gravar histórico local:", dbError);
      }

      return;
    }

    const response = await fetch('/api/relatorio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operacao,
        analise,
        mercado,
        veredito,
        imagemBase64: imagemMapa || null,
        possuiMapa: !!imagemMapa,
        reportMode,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Erro desconhecido na API.");
      return;
    }

    if (!data.relatorio) {
      alert(data.error || "Erro desconhecido na API.");
      return;
    }

    setRelatorioExecutivo(data.relatorio);

    try {
      await writeCachedReport({
        signature: cacheKey,
        relatorio: data.relatorio,
        source: data.fallback ? "LOCAL_FALLBACK" : "IA_EXTERNA",
        fingerprint,
        metadata: {
          cultura: operacao.cultura,
          regiao: operacao.regiao,
          faseFenologica: analise.faseFenologica,
          statusVeredito: veredito.status,
          sistemaProdutivo: veredito.analiseSazonal?.sistemaProdutivo || null,
          modoRelatorio: reportMode,
          possuiMapa: !!imagemMapa,
          fallback: !!data.fallback,
          modeReturned: data.mode || null,
        },
      });
    } catch (cacheError) {
      console.error("Erro ao gravar cache do relatório:", cacheError);
    }

    try {
      await addDoc(collection(db, "historico_talhoes"), {
        talhao: operacao.talhao || "Talhão Não Identificado",
        cultura: operacao.cultura,
        regiao: operacao.regiao,
        faseFenologica: analise.faseFenologica,
        fosforo: operacao.fosforoMehlich,
        areaAfetada: analise.areaEstresseHa,
        roiProjetado: veredito.roiEstimado,
        vereditoSistema: veredito.status,
        parecerIA: data.relatorio,
        modo: data.fallback ? "LOCAL_FALLBACK" : (imagemMapa ? "MULTIMODAL" : "TECNICO"),
        modoRelatorio: reportMode,
        assinaturaCenario: cacheKey,
        sistemaProdutivo: veredito.analiseSazonal?.sistemaProdutivo || null,
        dataRegistro: serverTimestamp()
      });
    } catch (dbError) {
      console.error("Erro ao gravar histórico no banco:", dbError);
    }

    if (data.warning) {
      alert(data.warning);
    }
  } catch (error) {
    console.error("Falha ao gerar relatório:", error);
    alert("Falha de conexão com a API do relatório.");
  } finally {
    setGerandoIA(false);
  }
};

  const handleVerHistorico = async () => {
    setModalHistorico(true);
    setCarregandoHistorico(true);
    try {
      const q = query(collection(db, "historico_talhoes"), orderBy("dataRegistro", "desc"), limit(10));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataFormatada: doc.data().dataRegistro?.toDate().toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        })
      }));
      setListaHistorico(docs);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const cultureProfile = GeoEngine.getParametrosCultura(operacao.cultura, operacao.regiao);

const unidadePorCultura: Record<CulturaBrasil, string> = {
  SOJA: "sc/ha",
  MILHO: "sc/ha",
  TRIGO: "sc/ha",
  ALGODAO: "@/ha",
  CANA: "TCH",
};

const fatorExtracaoPMap: Record<CulturaBrasil, number> = {
  SOJA: 1,
  MILHO: 0.75,
  TRIGO: 0.78,
  ALGODAO: 0.9,
  CANA: 0.55,
};

const parametrosCulturaUI = {
  unidade: unidadePorCultura[operacao.cultura],
  produtividadeBase: cultureProfile.produtividadeBase,
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
            <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">GeoEngine & Inteligência de Safra</p>
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
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-slate-800"></span>
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
          />
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Dólar PTAX</span>
              </div>
              <p className="text-2xl font-mono font-bold text-white">R$ {mercado.dolarPtax.toFixed(2)}</p>
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
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Insumos (FOB/t)</span>
              </div>
              <div className="flex flex-col mt-1">
                <p className="text-[10px] font-mono text-slate-300 flex justify-between"><span>MAP:</span> <span>R$ {mercado.custoMapTon.toFixed(0)}</span></p>
                <p className="text-[10px] font-mono text-slate-300 flex justify-between"><span>KCL:</span> <span>R$ {mercado.custoKclTon.toFixed(0)}</span></p>
                <p className="text-[10px] font-mono text-slate-300 flex justify-between"><span>UREIA:</span> <span>R$ {mercado.custoUreaTon.toFixed(0)}</span></p>
              </div>
            </div>
            
            <div className="bg-blue-950/30 border border-blue-900/50 rounded-2xl p-3 shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-blue-400 text-[9px] font-bold uppercase tracking-wider">Doses Calc. (kg/ha)</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                 <div className="bg-blue-950/40 p-1.5 rounded border border-blue-900/30 text-center">
                    <span className="text-[7px] text-blue-400 font-bold block mb-0.5">MAP</span>
                    <p className="text-xs font-mono font-bold text-blue-100">{veredito?.doseMapHa.toFixed(0) || '0'}</p>
                 </div>
                 <div className="bg-blue-950/40 p-1.5 rounded border border-blue-900/30 text-center">
                    <span className="text-[7px] text-blue-400 font-bold block mb-0.5">KCL</span>
                    <p className="text-xs font-mono font-bold text-blue-100">{veredito?.doseKclHa.toFixed(0) || '0'}</p>
                 </div>
                 <div className="bg-blue-950/40 p-1.5 rounded border border-blue-900/30 text-center flex flex-col justify-center items-center">
                    <span className="text-[7px] text-blue-400 font-bold block mb-0.5">UREIA</span>
                    <p className={`font-mono font-bold text-blue-100 ${operacao.cultura === 'SOJA' ? 'text-[8px]' : 'text-xs'}`}>
                       {operacao.cultura === 'SOJA' ? 'FIX.' : (veredito?.doseUreaHa.toFixed(0) || '0')}
                    </p>
                 </div>
              </div>
            </div>
          </div>

          <DecisionVerdictCard veredito={veredito} />

          <TechnicalReportCard
            relatorioExecutivo={relatorioExecutivo}
            imagemMapa={imagemMapa}
          />
        </div>
      </div>

      <footer className="mt-12 pt-6 border-t border-slate-800/60 text-center flex flex-col items-center justify-center pb-8">
         <p className="text-slate-400 text-sm">
            Idealizado e desenvolvido por <a href="https://www.linkedin.com/in/joaohenriquedasilva-agronomo/" target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Eng. Agr. João Henrique da Silva</a>
         </p>
         <p className="text-slate-500 text-xs mt-1">
            &copy; 2026 Agro OS. Todos os direitos reservados.
         </p>
      </footer>

      <HistoryDrawer
        aberto={modalHistorico}
        carregando={carregandoHistorico}
        listaHistorico={listaHistorico}
        onFechar={() => setModalHistorico(false)}
        onCarregarLaudo={(parecerIA) => {
          setRelatorioExecutivo(parecerIA);
          setModalHistorico(false);
        }}
      />

      {/* MODAL 2 - RADAR DE MERCADO E CLIMA EM TEMPO REAL */}
      <OperationRadarModal
        aberto={modalAlerta}
        cidadeUsuario={cidadeUsuario}
        alertaClimaDinamico={alertaClimaDinamico}
        alertaMercadoDinamico={alertaMercadoDinamico}
        avisosMercado={mercado.avisosMercado}
        onFechar={() => setModalAlerta(false)}
      />

      {/* MODAL 3 - ARQUITETO DO SISTEMA */}
      <ProfileModal
        aberto={modalPerfil}
        onFechar={() => setModalPerfil(false)}
      />
    </div>
  );
}