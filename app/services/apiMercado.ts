import { MercadoFinanceiro } from '../store/useAgroStore';

export const ServicoMercado = {
  sincronizarB3: async (): Promise<MercadoFinanceiro> => {
    try {
      // 1. Dólar (AwesomeAPI) - Permitido nativamente para navegadores (CORS liberado)
      const respDolar = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', { cache: 'no-store' });
      if (!respDolar.ok) throw new Error("Falha ao buscar Dólar");
      const dadosDolar = await respDolar.json();
      const dolarAtual = parseFloat(dadosDolar.USDBRL.bid);

      // 2. A SOLUÇÃO GARANTIDA: O Navegador do usuário faz o pedido, não a Vercel.
      // Como o Yahoo bloqueia IPs de servidores da Amazon/Vercel, fazemos o bypass client-side.
      const tickers = 'ZS=F,ZC=F,ZW=F,CT=F,SB=F';
      const urlYahoo = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${tickers}`;
      
      // Usamos o endpoint 'get' do AllOrigins que empacota os dados para driblar o bloqueio do navegador
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlYahoo)}`;

      const respYahoo = await fetch(proxyUrl, { cache: 'no-store' });
      if (!respYahoo.ok) throw new Error("Falha no Proxy do Navegador");
      
      const proxyData = await respYahoo.json();
      if (!proxyData.contents) throw new Error("Dados bloqueados");
      
      const dadosYahoo = JSON.parse(proxyData.contents);
      const resultados = dadosYahoo.spark.result;

      // Extrator de precisão do pacote Spark
      const getPreco = (simbolo: string) => {
          const ativo = resultados.find((r: any) => r.symbol === simbolo);
          if (ativo && ativo.response && ativo.response[0] && ativo.response[0].meta) {
              return ativo.response[0].meta.regularMarketPrice;
          }
          return 0;
      };

      const data = {
        sojaUSDBushel: getPreco('ZS=F'),
        milhoUSDBushel: getPreco('ZC=F'),
        trigoUSDBushel: getPreco('ZW=F'),
        algodaoUSDLb: getPreco('CT=F'),
        acucarUSDLb: getPreco('SB=F')
      };

      // Trava de segurança: se a bolsa estiver fechada e retornar zero
      if (data.sojaUSDBushel === 0) throw new Error("Bolsa fechada ou dados zerados");

      // --- MATEMÁTICA OFICIAL (Conversões Globais) ---
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
      console.warn("🚨 [Agro OS] Fallback Ativado:", error);
      
      // Simulador de Mercado Dinâmico (Plano de Segurança)
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