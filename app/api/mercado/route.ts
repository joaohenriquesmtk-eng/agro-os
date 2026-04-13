import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Dólar (AwesomeAPI) - Direto, pois eles não bloqueiam a Vercel
    const respDolar = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', { cache: 'no-store' });
    const dadosDolar = await respDolar.json();
    const dolarAtual = parseFloat(dadosDolar.USDBRL.bid);

    // 2. A ROTA ALTERNATIVA: O Túnel (Proxy Global)
    const urlYahoo = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=ZS=F,ZC=F,ZW=F,CT=F,SB=F';
    
    // Envolvemos a URL do Yahoo dentro do AllOrigins (Raw Mode para devolver o JSON puro)
    const urlProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(urlYahoo)}`;

    const respYahoo = await fetch(urlProxy, { cache: 'no-store' });
    
    if (!respYahoo.ok) {
        throw new Error(`Falha no Túnel. Status: ${respYahoo.status}`);
    }
    
    const dadosYahoo = await respYahoo.json();
    const resultados = dadosYahoo.quoteResponse.result;

    // Função inteligente para achar o preço
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