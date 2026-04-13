import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Dólar (AwesomeAPI) - Essa API é amigável com servidores e não bloqueia a Vercel
    const respDolar = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', { cache: 'no-store' });
    const dadosDolar = await respDolar.json();
    const dolarAtual = parseFloat(dadosDolar.USDBRL.bid);

    // Função Arquiteto: Buscador Universal blindado contra o bloqueio do Yahoo Finance
    const fetchTicker = async (ticker: string) => {
      const resp = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`, { 
        cache: 'no-store',
        // O "Disfarce": Engana o firewall do Yahoo fazendo a Vercel se passar por um navegador comum
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });
      
      if (!resp.ok) throw new Error(`Falha ao buscar ticker ${ticker}`);
      
      const dados = await resp.json();
      return dados.chart.result[0].meta.regularMarketPrice;
    };

    // 2. Fazemos o fetch de todas as commodities AO MESMO TEMPO
    const [soja, milho, trigo, algodao, acucar] = await Promise.all([
      fetchTicker('ZS=F'), // Soja (Centavos por Bushel)
      fetchTicker('ZC=F'), // Milho (Centavos por Bushel)
      fetchTicker('ZW=F'), // Trigo (Centavos por Bushel)
      fetchTicker('CT=F'), // Algodão (Centavos por Libra-peso)
      fetchTicker('SB=F')  // Açúcar #11 (Centavos por Libra-peso)
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
    console.error("Erro interno no servidor financeiro (Yahoo bloqueou a Vercel):", error);
    return NextResponse.json({ error: 'Falha ao buscar cotações originais.' }, { status: 500 });
  }
}