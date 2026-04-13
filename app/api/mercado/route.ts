import { NextResponse } from 'next/server';

// A MÁGICA: Mudar o código da AWS para a rede Edge da Vercel (burlar bloqueio do Yahoo)
export const runtime = 'edge';

export async function GET() {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': '*/*',
    };

    // 1. Dólar (AwesomeAPI)
    const respDolar = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', { cache: 'no-store' });
    const dadosDolar = await respDolar.json();
    const dolarAtual = parseFloat(dadosDolar.USDBRL.bid);

    // 2. Buscador Universal com endpoint query2 (mais permissivo)
    const fetchTicker = async (ticker: string) => {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
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

  } catch (error: any) {
    console.error("Erro no Oráculo Edge:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}