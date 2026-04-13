import { MercadoFinanceiro } from '../store/useAgroStore';

export const ServicoMercado = {
  sincronizarB3: async (): Promise<MercadoFinanceiro> => {
    try {
      const response = await fetch('/api/mercado', { cache: 'no-store' });
      if (!response.ok) throw new Error("Servidor HG inacessível.");
      
      const data = await response.json();
      const dolar = data.dolar;

      // Conversões Agronômicas de Precisão
      const sojaBRL = dolar * ((data.sojaUSDBushel / 100) * 2.2046);
      const milhoBRL = dolar * ((data.milhoUSDBushel / 100) * 2.362);
      const trigoBRL = dolar * ((data.trigoUSDBushel / 100) * 2.2046);
      const algodaoBRL = dolar * ((data.algodaoUSDLb / 100) * 33.069);
      const canaBRL = (data.acucarUSDLb / 100) * dolar * 135;

      return {
        dolarPtax: dolar,
        cotacoes: {
          SOJA: sojaBRL,
          MILHO: milhoBRL,
          TRIGO: trigoBRL,
          ALGODAO: algodaoBRL,
          CANA: canaBRL
        },
        custoMapTon: dolar * 595.00,
        custoKclTon: dolar * 415.00,
        custoUreaTon: dolar * 385.00,
        ultimaSincronizacao: new Date().toLocaleTimeString('pt-BR')
      };
    } catch (error) {
      console.warn("Utilizando Fallback por falha na API:", error);
      throw error;
    }
  }
};