import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Dólar (AwesomeAPI)
    const respDolar = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', { cache: 'no-store' });
    const dadosDolar = await respDolar.json();
    const dolarAtual = parseFloat(dadosDolar.USDBRL.bid);

    // Função Arquiteto: Um buscador universal para qualquer ticker do Yahoo Finance
    const fetchTicker = async (ticker: string) => {
      const resp = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`, { cache: 'no-store' });
      const dados = await resp.json();
      return dados.chart.result[0].meta.regularMarketPrice;
    };

    // 2. Fazemos o fetch de todas as commodities AO MESMO TEMPO para performance máxima
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
    console.error("Erro interno no servidor financeiro:", error);
    return NextResponse.json({ error: 'Falha ao buscar cotações originais.' }, { status: 500 });
  }
}