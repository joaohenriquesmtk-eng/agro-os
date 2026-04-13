"use client";

import { useState, useEffect } from 'react';
import { useAgroStore, RegiaoBrasil, CulturaBrasil } from './store/useAgroStore';
import { GeoEngine } from './services/geoEngine';
import { ServicoMercado } from './services/apiMercado';
import { db } from './lib/firebase';
import { collection, addDoc, serverTimestamp, query, getDocs, orderBy, limit } from 'firebase/firestore';
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
  
  const [imagemMapa, setImagemMapa] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);

  const [modalHistorico, setModalHistorico] = useState(false);
  const [listaHistorico, setListaHistorico] = useState<any[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  const [modalAlerta, setModalAlerta] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  
  const [cidadeUsuario, setCidadeUsuario] = useState('Sua Região');
  const [alertaClimaDinamico, setAlertaClimaDinamico] = useState('Analisando dados agrometeorológicos via satélite...');

  useEffect(() => {
    const buscarLocalizacaoEClima = async () => {
      try {
        // 1. API NATIVA VERCEL: Não usa fontes externas, usa o nosso próprio back-end sem risco de CORS
        const resIp = await fetch('/api/localizacao');
        const dataIp = await resIp.json();
        
        if (dataIp.city && dataIp.lat && dataIp.lon) {
          setCidadeUsuario(dataIp.city);
          
          // 2. Busca Clima Real via Open-Meteo
          const resClima = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${dataIp.lat}&longitude=${dataIp.lon}&daily=precipitation_sum,temperature_2m_max&timezone=America/Sao_Paulo&forecast_days=3`);
          const dataClima = await resClima.json();
          
          if (dataClima.daily) {
            const chuvaTotal = dataClima.daily.precipitation_sum.reduce((a: number, b: number) => a + b, 0);
            const tempMax = Math.max(...dataClima.daily.temperature_2m_max);
            
            if (chuvaTotal > 20) {
              setAlertaClimaDinamico(`Os modelos apontam chuvas acumuladas intensas (${chuvaTotal.toFixed(0)}mm) para os próximos 3 dias em ${dataIp.city}. Recomenda-se pausar pulverizações foliares para evitar lavagem e ter atenção redobrada ao escorrimento superficial de adubação recém-aplicada.`);
            } else if (tempMax > 33 && chuvaTotal < 5) {
              setAlertaClimaDinamico(`Alerta Severo: Previsão de forte estresse térmico em ${dataIp.city} com máximas atingindo ${tempMax.toFixed(0)}°C e chuva escassa (${chuvaTotal.toFixed(0)}mm). Risco altíssimo de abortamento floral. Evite aplicações de Ureia a lanço nas horas mais quentes devido à volatilização extrema.`);
            } else {
              setAlertaClimaDinamico(`Janela Agroclimática Estável: Clima favorável em ${dataIp.city} para os próximos dias (Temp. Máxima: ${tempMax.toFixed(0)}°C e Chuvas: ${chuvaTotal.toFixed(0)}mm). Condições adequadas para operações de manejo nutricional foliar e entrada de maquinário pesado.`);
            }
          }
        } else {
            throw new Error("Localização não identificada.");
        }
      } catch (e) {
        console.warn("Telemetria de IP/Clima offline. Operando em modo de segurança.");
        setAlertaClimaDinamico(`Aviso de Sistema: Conexão meteorológica temporariamente indisponível. Mantenha o monitoramento manual de precipitação e temperatura para ajuste crítico das doses de nitrogênio em cobertura.`);
      }
    };
    buscarLocalizacaoEClima();
  }, []);

  useEffect(() => {
    setRelatorioExecutivo(null);
  }, [
    analise.areaEstresseHa, operacao.regiao, operacao.cultura, 
    operacao.fosforoMehlich, operacao.potassio, operacao.produtividadeAlvo, imagemMapa
  ]);

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
    if (!veredito) return;
    
    setGerandoIA(true);
    try {
      const response = await fetch('/api/relatorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            operacao, 
            analise, 
            mercado, 
            veredito, 
            imagemBase64: imagemMapa || null, 
            possuiMapa: !!imagemMapa 
        })
      });
      const data = await response.json();
      
      if (data.relatorio) {
        setRelatorioExecutivo(data.relatorio);
        
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
            modo: imagemMapa ? "MULTIMODAL" : "TECNICO", 
            dataRegistro: serverTimestamp()
          });
        } catch (dbError) {
          console.error("Erro ao gravar histórico no banco:", dbError);
        }

      } else {
        alert(data.error || "Erro desconhecido na API.");
      }
    } catch (error) {
      alert("Falha de conexão com a API do Gemini.");
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

  const parametrosCulturaUI = GeoEngine.getParametrosCultura(operacao.cultura);
  const precoCulturaAtual = mercado.cotacoes?.[operacao.cultura] || 0; 
  
  const alertaMercadoDinamico = mercado.dolarPtax > 0 
    ? `O Dólar (PTAX) operando a R$ ${mercado.dolarPtax.toFixed(2)} eleva o teto de custo dos insumos importados. Com a cotação base da ${operacao.cultura} em R$ ${precoCulturaAtual.toFixed(2)}/${parametrosCulturaUI.unidade.replace(/ /g, '')}, o motor N-P-K está priorizando ativamente a preservação da margem operacional.`
    : `O sistema financeiro aguarda a primeira sincronização. Acione o módulo da B3 para integrar os valores reais ao diagnóstico.`;

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

          <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg shadow-inner">
            <Globe2 className={`w-5 h-5 ${mercado.dolarPtax > 0 ? 'text-blue-400' : 'text-slate-600 animate-pulse'}`} />
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-semibold uppercase">Status Mercado B3</span>
              <span className="text-sm font-mono text-slate-300">
                {mercado.ultimaSincronizacao || 'Aguardando Sincronização...'}
              </span>
            </div>
          </div>

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
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm shadow-xl">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-slate-200 border-b border-slate-800 pb-2">
              <MapPin className="w-5 h-5 text-indigo-400" /> Parâmetros Agronômicos
            </h2>
            
            <div className="space-y-4">
              <div className="mb-4 pb-4 border-b border-slate-800">
                <label className="block text-[10px] font-bold text-indigo-400 mb-1 uppercase tracking-wider">Identificador do Talhão / Gleba</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-200"
                  value={operacao.talhao || ''}
                  onChange={(e) => setOperacao({ talhao: e.target.value })}
                  placeholder="Ex: Gleba 4 - Fazenda Santa Maria"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Cultura</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={operacao.cultura}
                    onChange={handleCulturaChange}
                  >
                    <option value="SOJA">Soja</option>
                    <option value="MILHO">Milho</option>
                    <option value="TRIGO">Trigo</option>
                    <option value="ALGODAO">Algodão</option>
                    <option value="CANA">Cana-de-Açúcar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Fase Fenológica</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={analise.faseFenologica}
                    onChange={(e) => setAnalise({ faseFenologica: e.target.value })}
                  >
                    {fasesFenologicas[operacao.cultura].map(fase => (
                      <option key={fase} value={fase}>{fase}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Região Geográfica</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={operacao.regiao}
                  onChange={(e) => setOperacao({ regiao: e.target.value as RegiaoBrasil })}
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
                  <label className="block text-[9px] font-bold text-blue-400 mb-1 uppercase tracking-wider flex items-center gap-1"><FlaskConical className="w-3 h-3"/> P (mg/dm³)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                    value={operacao.fosforoMehlich || ''}
                    onChange={(e) => setOperacao({ fosforoMehlich: Number(e.target.value) })}
                    placeholder="Ex: 12"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-blue-400 mb-1 uppercase tracking-wider flex items-center gap-1"><FlaskConical className="w-3 h-3"/> K (cmol/dm³)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                    value={operacao.potassio || ''}
                    onChange={(e) => setOperacao({ potassio: Number(e.target.value) })}
                    placeholder="Ex: 0.15"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-blue-400 mb-1 uppercase tracking-wider">
                    Meta ({parametrosCulturaUI.unidade})
                  </label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                    value={operacao.produtividadeAlvo || ''}
                    onChange={(e) => setOperacao({ produtividadeAlvo: Number(e.target.value) })}
                    placeholder={`Ex: ${parametrosCulturaUI.produtividadeBase}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-400 mb-1 uppercase tracking-wider">Área de Anomalia (Hectares)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-emerald-400"
                  value={analise.areaEstresseHa || ''}
                  onChange={(e) => setAnalise({ areaEstresseHa: Number(e.target.value) })}
                  placeholder="Ex: 50"
                />
              </div>

              <div className="pt-4">
                <label className="w-full relative overflow-hidden bg-slate-900 border border-dashed border-slate-600 hover:border-emerald-500 p-4 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group">
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadMapa} />
                  <Upload className={`w-6 h-6 ${imagemMapa ? 'text-emerald-500' : 'text-slate-500 group-hover:text-emerald-400'}`} />
                  <span className="text-xs font-medium text-slate-400 text-center">
                    {nomeArquivo ? <span className="text-emerald-400 font-bold">{nomeArquivo}</span> : "Anexar Mapa (NDVI/NDRE)"}
                  </span>
                </label>
                {imagemMapa && (
                    <button 
                        onClick={() => {setImagemMapa(null); setNomeArquivo(null);}}
                        className="w-full mt-2 text-[10px] text-red-500 font-bold uppercase hover:underline"
                    >
                        Remover Mapa
                    </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 shadow-xl">
             <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-slate-200">
              <Activity className="w-5 h-5 text-blue-400" /> Operações
            </h2>
            <button 
              onClick={handleSincronizarMercado}
              disabled={sincronizando}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              <RefreshCcw className={`w-5 h-5 ${sincronizando ? 'animate-spin' : ''}`} />
              {sincronizando ? 'Buscando Cotações...' : '1. Sincronizar B3/CBOT'}
            </button>

             <button 
              onClick={handleGerarRelatorioIA}
              disabled={!veredito || gerandoIA}
              className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  imagemMapa ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'
              }`}
            >
              {imagemMapa ? <BrainCircuit className={`w-5 h-5 ${gerandoIA ? 'animate-pulse' : ''}`} /> : <FileText className={`w-5 h-5 ${gerandoIA ? 'animate-pulse' : ''}`} />}
              {gerandoIA ? 'Processando...' : (imagemMapa ? '2. Auditoria Multimodal' : '2. Gerar Parecer Técnico')}
            </button>
          </div>
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
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{operacao.cultura} (B3)</span>
              </div>
              <p className="text-2xl font-mono font-bold text-white">
                R$ {precoCulturaAtual.toFixed(2)}
                <span className="text-xs text-slate-500 font-sans ml-1">/{parametrosCulturaUI.unidade.replace(/ /g, '')}</span>
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

          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8 backdrop-blur-sm shadow-xl min-h-[200px] flex flex-col justify-center relative overflow-hidden">
            {!veredito ? (
              <div className="text-center text-slate-500 flex flex-col items-center gap-3">
                <ShieldAlert className="w-12 h-12 text-slate-700" />
                <p>Preencha a Área de Anomalia e Sincronize o Mercado para ativar a Telemetria.</p>
              </div>
            ) : (
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  {veredito.status === 'AUTORIZADO' && <CheckCircle2 className="w-8 h-8 text-emerald-500" />}
                  {veredito.status === 'RISCO_ELEVADO' && <AlertOctagon className="w-8 h-8 text-yellow-500" />}
                  {veredito.status === 'BLOQUEADO' && <AlertOctagon className="w-8 h-8 text-red-500" />}
                  
                  <h2 className={`text-2xl font-bold tracking-tight uppercase ${
                    veredito.status === 'AUTORIZADO' ? 'text-emerald-400' : 
                    veredito.status === 'RISCO_ELEVADO' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {veredito.status.replace('_', ' ')}
                  </h2>
                </div>

                <div className="mb-6">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">ROI Financeiro Projetado (Margem Líquida)</p>
                  <p className={`text-5xl font-mono font-bold tracking-tighter ${veredito.roiEstimado >= 0 ? 'text-white' : 'text-red-400'}`}>
                    R$ {veredito.roiEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                  <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                    <span className="font-semibold text-white">Justificativa:</span> {veredito.justificativa}
                  </p>
                  <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                    <span className="font-semibold text-slate-300">Fator Pedoclimático:</span> {veredito.fatorLimitante}
                  </p>
                </div>
              </div>
            )}
            
            {veredito && (
              <div className={`absolute -right-20 -top-20 w-64 h-64 blur-3xl opacity-10 pointer-events-none rounded-full ${
                veredito.status === 'AUTORIZADO' ? 'bg-emerald-500' : 
                veredito.status === 'RISCO_ELEVADO' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            )}
          </div>

          {relatorioExecutivo && (
            <div className={`rounded-2xl border p-6 shadow-2xl shadow-emerald-900/10 ${
                imagemMapa ? 'bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500/30' : 'bg-gradient-to-br from-indigo-950/40 to-slate-900 border-indigo-500/30'
            }`}>
              <h3 className={`font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm border-b pb-2 ${
                  imagemMapa ? 'text-emerald-400 border-emerald-900/50' : 'text-indigo-400 border-indigo-900/50'
              }`}>
                {imagemMapa ? <BrainCircuit className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                {imagemMapa ? "Auditoria de Precisão (Gemini Multimodal)" : "Parecer Técnico Agronômico (Gemini IA)"}
              </h3>
              <div 
                className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm md:text-base whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: relatorioExecutivo
                    .replace(/\*\*(.*?)\*\*/g, `<strong class="${imagemMapa ? 'text-emerald-400' : 'text-indigo-400'}">$1</strong>`)
                    .replace(/•/g, `<span class="${imagemMapa ? 'text-emerald-500' : 'text-indigo-500'} mr-2">•</span>`)
                }}
              />
            </div>
          )}
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

      {modalHistorico && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setModalHistorico(false)} />
          <div className="relative w-full max-w-md bg-slate-900 h-full shadow-2xl border-l border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
            
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">Memória de Safra</h2>
              </div>
              <button onClick={() => setModalHistorico(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {carregandoHistorico ? (
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
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{item.dataFormatada}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        item.vereditoSistema === 'AUTORIZADO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {item.vereditoSistema}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-bold text-sm">{item.talhao}</h3>
                        {item.modo === "TECNICO" && <FileText className="w-3 h-3 text-indigo-500" />}
                    </div>
                    <p className="text-slate-400 text-xs line-clamp-2 italic mb-3">"{item.parecerIA?.substring(0, 100)}..."</p>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-800/50">
                      <span className="text-xs text-slate-500">{item.cultura} • {item.areaAfetada} ha</span>
                      <button 
                        onClick={() => {
                          setRelatorioExecutivo(item.parecerIA);
                          setModalHistorico(false);
                        }}
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
      )}

      {/* MODAL 2 - RADAR DE MERCADO E CLIMA EM TEMPO REAL */}
      {modalAlerta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setModalAlerta(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-yellow-500" /> Radar de Operação
              </h3>
              <button onClick={() => setModalAlerta(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* ALERTA 1: CLIMA DINÂMICO VIA OPEN-METEO */}
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-xl shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest">Alerta para {cidadeUsuario}</span>
                  <span className="text-[9px] text-yellow-600 font-medium">Satélite (Tempo Real)</span>
                </div>
                <p className="text-sm text-yellow-900 leading-relaxed font-medium">
                  {alertaClimaDinamico}
                </p>
              </div>

              {/* ALERTA 2: FINANCEIRO DINÂMICO BASEADO NA TELA */}
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Boletim de Mercado</span>
                  <span className="text-[9px] text-emerald-600 font-medium">B3/CBOT</span>
                </div>
                <p className="text-sm text-emerald-900 leading-relaxed font-medium">
                  {alertaMercadoDinamico}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 3 - ARQUITETO DO SISTEMA */}
      {modalPerfil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setModalPerfil(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setModalPerfil(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 text-indigo-900 font-bold mb-6 w-full justify-start border-b border-slate-100 pb-4 absolute top-0 left-0 p-6 rounded-t-3xl bg-slate-50/50">
              <Activity className="w-4 h-4" /> Arquiteto do Sistema
            </div>
            
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl mt-12 mb-4">
               <img src="/avatar.jpg" alt="João Henrique da Silva" className="w-full h-full object-cover bg-slate-200" onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=João+Henrique&background=10b981&color=fff&size=150"; }} />
            </div>
            
            <h2 className="text-xl font-extrabold text-slate-800">João Henrique da Silva</h2>
            <h3 className="text-xs font-bold text-emerald-600 tracking-widest uppercase mt-1 mb-4">Engenheiro Agrônomo</h3>
            
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              Formado pela Universidade Federal do Paraná (UFPR). Especialista em transformar dados multiespectrais e modelagem agroeconômica em decisões de alto impacto para a rentabilidade das operações no Cerrado.
            </p>
            
            <div className="flex gap-3 w-full">
              <a href="https://www.linkedin.com/in/joaohenriquedasilva-agronomo/" target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#0a66c2] hover:bg-[#004182] text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-blue-900/20">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg> LinkedIn
              </a>
              <a href="https://wa.me/5541996419950?text=Ol%C3%A1%2C%20Jo%C3%A3o!%20Vim%20atrav%C3%A9s%20do%20Agro%20OS%20e%20gostaria%20de%20conversar%20com%20voc%C3%AA." target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#25d366] hover:bg-[#128c7e] text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-emerald-900/20">
                 <MessageCircle className="w-5 h-5" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}