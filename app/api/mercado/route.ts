import { NextResponse } from 'next/server';

// Garante que a Vercel nunca use dados velhos do cache
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    };

    // 1. Dólar (AwesomeAPI) - Blindado e estável
    const respDolar = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', { 
        cache: 'no-store', 
        headers 
    });
    const dadosDolar = await respDolar.json();
    const dolarAtual = parseFloat(dadosDolar.USDBRL.bid);

    // 2. A MÁGICA: O Tiro de Sniper. Busca todas as commodities em uma única requisição.
    // Isso evita o bloqueio de Rate Limit (Muitas Requisições) do Yahoo contra a Vercel.
    const urlYahoo = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=ZS=F,ZC=F,ZW=F,CT=F,SB=F';
    const respYahoo = await fetch(urlYahoo, { cache: 'no-store', headers });
    
    if (!respYahoo.ok) {
        throw new Error(`Yahoo bloqueou a requisição única. Status: ${respYahoo.status}`);
    }
    
    const dadosYahoo = await respYahoo.json();
    const resultados = dadosYahoo.quoteResponse.result;

    // Função inteligente para achar o preço no meio do pacote de dados
    const getPreco = (simbolo: string) => {
        const ativo = resultados.find((r: any) => r.symbol === simbolo);
        return ativo ? ativo.regularMarketPrice : 0;
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
    console.error("Erro fatal no Oráculo de Mercado:", error.message);
    return NextResponse.json({ error: 'Falha ao buscar cotações originais.' }, { status: 500 });
  }
}