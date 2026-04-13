import { MercadoFinanceiro } from '../store/useAgroStore';

export const ServicoMercado = {
  sincronizarB3: async (): Promise<MercadoFinanceiro> => {
    try {
      const response = await fetch('/api/mercado', { cache: 'no-store' });
      if (!response.ok) throw new Error("Servidor HG inacessível.");
      
      const data = await response.json();
      const dolar = data.dolar;

      // --- CONVERSÕES AGRONÔMICAS DE PRECISÃO ---
      
      // 1. Grãos (Já estão em Dólar/Bushel, NÃO dividimos por 100)
      // Soja: 1 Saca (60kg) = 2.2046 Bushels
      const sojaBRL = dolar * (data.sojaUSDBushel * 2.2046);
      
      // Milho: 1 Saca (60kg) = 2.362 Bushels
      const milhoBRL = dolar * (data.milhoUSDBushel * 2.362);
      
      // Trigo: 1 Saca (60kg) = 2.2046 Bushels
      const trigoBRL = dolar * (data.trigoUSDBushel * 2.2046);

      // 2. Fibras e Energia (Estão em Centavos/Libra-peso, MANTÉM a divisão por 100)
      // Algodão: 1 Arroba (15kg) = 33.069 Libras
      const algodaoBRL = dolar * ((data.algodaoUSDLb / 100) * 33.069);
      
      // Cana (Açúcar #11): Cálculo de Tonelada baseada no ATR projetado
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
      
      // Simulador de Mercado Dinâmico (Fallback)
      const gerarVariacao = () => (Math.random() * 0.04) - 0.02; 
      const baseDolar = 5.10 * (1 + gerarVariacao());
      const baseSojaUSD = 11.90 * (1 + gerarVariacao()); 
      
      return {
        dolarPtax: baseDolar,
        cotacoes: {
          SOJA: baseDolar * (baseSojaUSD * 2.2046),
          MILHO: baseDolar * (4.40 * 2.362),
          TRIGO: baseDolar * (5.80 * 2.2046),
          ALGODAO: baseDolar * ((84.50 / 100) * 33.069),
          CANA: (21.80 / 100) * baseDolar * 135
        },
        custoMapTon: 3050 * (1 + gerarVariacao()),
        custoKclTon: 2150 * (1 + gerarVariacao()),
        custoUreaTon: 1980 * (1 + gerarVariacao()),
        ultimaSincronizacao: `Offline (Valores Estimados)`
      };
    }
  }
};