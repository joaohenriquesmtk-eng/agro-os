import { MercadoFinanceiro } from '../store/useAgroStore';

export const ServicoMercado = {
  sincronizarB3: async (): Promise<MercadoFinanceiro> => {
    try {
      // Volta a buscar da nossa API segura na Vercel
      const response = await fetch('/api/mercado', { cache: 'no-store' });
      
      if (!response.ok) throw new Error("Servidor financeiro inacessível.");
      
      const data = await response.json();
      const dolarAtual = data.dolar;
      
      const precoSojaSacaUSD = (data.sojaUSDBushel / 100) * 2.2046; 
      const sojaBRL = dolarAtual * precoSojaSacaUSD;

      const precoMilhoSacaUSD = (data.milhoUSDBushel / 100) * 2.362;
      const milhoBRL = dolarAtual * precoMilhoSacaUSD;

      const precoTrigoSacaUSD = (data.trigoUSDBushel / 100) * 2.2046;
      const trigoBRL = dolarAtual * precoTrigoSacaUSD;

      const precoAlgodaoArrobaUSD = (data.algodaoUSDLb / 100) * 33.069;
      const algodaoBRL = dolarAtual * precoAlgodaoArrobaUSD;

      const canaBRL = (data.acucarUSDLb / 100) * dolarAtual * 135;

      const precoMapUSD = 595.00; 
      const precoKclUSD = 415.00;
      const precoUreaUSD = 385.00;

      return {
        dolarPtax: dolarAtual,
        cotacoes: {
          SOJA: sojaBRL,
          MILHO: milhoBRL,
          TRIGO: trigoBRL,
          ALGODAO: algodaoBRL,
          CANA: canaBRL
        },
        custoMapTon: dolarAtual * precoMapUSD,
        custoKclTon: dolarAtual * precoKclUSD,
        custoUreaTon: dolarAtual * precoUreaUSD,
        ultimaSincronizacao: new Date().toLocaleTimeString('pt-BR')
      };

    } catch (error) {
      console.error("🚨 [Agro OS] Fallback Ativado:", error);
      
      // Simulador de Mercado Dinâmico 
      const gerarVariacao = () => (Math.random() * 0.04) - 0.02; 
      const baseDolar = 5.10 * (1 + gerarVariacao());
      const baseSojaUSD = 11.90 * (1 + gerarVariacao()); 
      const sojaBRL = baseDolar * (baseSojaUSD * 2.2046);

      return {
        dolarPtax: baseDolar,
        cotacoes: {
          SOJA: sojaBRL,
          MILHO: sojaBRL * 0.45,
          TRIGO: sojaBRL * 0.55,
          ALGODAO: baseDolar * 31.50,
          CANA: 152.00 * (1 + gerarVariacao())
        },
        custoMapTon: 3050 * (1 + gerarVariacao()),
        custoKclTon: 2150 * (1 + gerarVariacao()),
        custoUreaTon: 1980 * (1 + gerarVariacao()),
        ultimaSincronizacao: `Offline (Valores Estimados)`
      };
    }
  }
};