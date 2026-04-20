import { NextResponse } from 'next/server';

const CACHE_SECONDS = 1800;
export const runtime = 'nodejs';

function buildWeatherAlert(chuvaTotal: number, temperaturaMaxima: number) {
  if (chuvaTotal > 20) {
    return `Modelos indicam ${chuvaTotal.toFixed(0)} mm de chuva acumulada nos próximos 3 dias. Evite operações foliares e monitore perdas superficiais de adubo recém-aplicado.`;
  }

  if (temperaturaMaxima > 33 && chuvaTotal < 5) {
    return `Há risco elevado de estresse térmico com máxima de ${temperaturaMaxima.toFixed(0)}°C e baixa chuva acumulada (${chuvaTotal.toFixed(0)} mm). Priorize operações em janelas mais frescas e preserve eficiência do nitrogênio.`;
  }

  return `Janela operacional relativamente estável: máxima prevista de ${temperaturaMaxima.toFixed(0)}°C e ${chuvaTotal.toFixed(0)} mm de chuva acumulada em 3 dias.`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get('lat'));
  const lon = Number(url.searchParams.get('lon'));

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'Latitude/longitude inválidas.' }, { status: 400 });
  }

  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=America/Sao_Paulo&forecast_days=3`;

  try {
    const response = await fetch(apiUrl, {
      next: { revalidate: CACHE_SECONDS },
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'AgroOS/1.0 (+https://agro-os.vercel.app)' },
    });
    if (!response.ok) {
      throw new Error('Falha ao consultar Open-Meteo.');
    }

    const data = await response.json();
    const daily = data?.daily;

    if (!daily?.precipitation_sum || !daily?.temperature_2m_max) {
      throw new Error('Resposta meteorológica inválida.');
    }

    const chuvaTotal = daily.precipitation_sum.reduce((sum: number, value: number) => sum + value, 0);
    const temperaturaMaxima = Math.max(...daily.temperature_2m_max);
    const temperaturaMinima = Math.min(...daily.temperature_2m_min);

    return NextResponse.json(
      {
        status: 'live',
        alerta: buildWeatherAlert(chuvaTotal, temperaturaMaxima),
        resumo: {
          chuvaTotalMm: chuvaTotal,
          temperaturaMaximaC: temperaturaMaxima,
          temperaturaMinimaC: temperaturaMinima,
          atualizadoEm: new Date().toISOString(),
          origem: 'Open-Meteo',
          url: apiUrl,
        },
      },
      {
        headers: {
          'Cache-Control': `s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno de clima';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
