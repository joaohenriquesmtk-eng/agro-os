import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    // 1. Dólar (AwesomeAPI)
    const respDolar = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', { cache: 'no-store' });
    const dadosDolar = await respDolar.json();
    const dolarAtual = parseFloat(dadosDolar.USDBRL.bid);

    // Função para buscar no Yahoo com retry e headers profundos
    const fetchTicker = async (ticker: string) => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
      const resp = await fetch(url, { headers, cache: 'no-store' });
      if (!resp.ok) throw new Error(`Yahoo barrou ${ticker}`);
      const dados = await resp.json();
      return dados.chart.result[0].meta.regularMarketPrice;
    };

    const [soja, milho, trigo, algodao, acucar] = await Promise.all([
      fetchTicker('ZS=F'),
      fetchTicker('ZC=F'),
      fetchTicker('ZW=F'),
      fetchTicker('CT=F'),
      fetchTicker('SB=F')
    ]);

    return NextResponse.json({ 
      dolar: dolarAtual, 
      sojaUSDBushel: soja,
      milhoUSDBushel: milho,
      trigoUSDBushel: trigo,
      algodaoUSDLb: algodao,
      acucarUSDLb: acucar
    });

  } catch (error) {
    console.error("Erro no Oráculo:", error);
    // Retornamos um erro 500 para acionar o Fallback Realista do apiMercado.ts
    return NextResponse.json({ error: 'Yahoo limit' }, { status: 500 });
  }
}