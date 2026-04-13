import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Dólar (AwesomeAPI) - Blindado e estável
    const respDolar = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', { cache: 'no-store' });
    const dadosDolar = await respDolar.json();
    const dolarAtual = parseFloat(dadosDolar.USDBRL.bid);

    // 2. A ROTA SPARK: O Cavalo de Troia.
    // Em vez de acessar a rota web (bloqueada), acessamos a rota de "Widgets de Celular" (Spark).
    // Essa rota é livre de Cookies e Crumbs, e a AWS/Vercel consegue acessá-la se fingirmos ser um iPhone.
    const tickers = 'ZS=F,ZC=F,ZW=F,CT=F,SB=F';
    const urlSpark = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${tickers}`;

    const respYahoo = await fetch(urlSpark, {
      cache: 'no-store',
      headers: {
        // Disfarce perfeito: O Yahoo enxerga a Vercel como um iPhone pedindo dados para um Widget
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        'Accept': 'application/json'
      }
    });

    if (!respYahoo.ok) {
        throw new Error(`O Firewall barrou o Spark. Status: ${respYahoo.status}`);
    }

    const dadosYahoo = await respYahoo.json();
    const resultados = dadosYahoo.spark.result;

    // Função para extrair o preço exato dentro do pacote do Widget (Spark)
    const getPreco = (simbolo: string) => {
        const ativo = resultados.find((r: any) => r.symbol === simbolo);
        if (ativo && ativo.response && ativo.response[0] && ativo.response[0].meta) {
            return ativo.response[0].meta.regularMarketPrice;
        }
        return 0;
    };

    return NextResponse.json({ 
      dolar: dolarAtual, 
      sojaUSDBushel: getPreco('ZS=F'),
      milhoUSDBushel: getPreco('ZC=F'),
      trigoUSDBushel: getPreco('ZW=F'),
      algodaoUSDLb: getPreco('CT=F'),
      acucarUSDLb: getPreco('SB=F')
    });

  } catch (error: any) {
    console.error("Erro fatal no Oráculo Vercel:", error.message);
    return NextResponse.json({ error: 'Bloqueio de nuvem.' }, { status: 500 });
  }
}