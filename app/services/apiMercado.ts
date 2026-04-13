import { MercadoFinanceiro } from '../store/useAgroStore';

export const ServicoMercado = {
  sincronizarB3: async (): Promise<MercadoFinanceiro> => {
    try {
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

      // Insumos (MAP, KCL, UREIA) referenciados em USD FOB
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
      return {
        dolarPtax: 5.10,
        cotacoes: {
          SOJA: 128.50,
          MILHO: 58.30,
          TRIGO: 72.10,
          ALGODAO: 145.00,
          CANA: 152.00
        },
        custoMapTon: 3034.50,
        custoKclTon: 2116.50,
        custoUreaTon: 1963.50,
        ultimaSincronizacao: 'Offline (Valores Reais de Fechamento)'
      };
    }
  }
};