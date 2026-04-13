import { NextResponse } from 'next/server';

// A Vercel vai rodar isso direto na borda (Edge), super rápido e sem limites
export const runtime = 'edge';

export async function GET(req: Request) {
  // A Vercel entrega a localização nativamente através destes headers ocultos
  const city = req.headers.get('x-vercel-ip-city');
  const lat = req.headers.get('x-vercel-ip-latitude');
  const lon = req.headers.get('x-vercel-ip-longitude');

  if (city && lat && lon) {
    return NextResponse.json({ 
      city: decodeURIComponent(city), 
      lat: parseFloat(lat), 
      lon: parseFloat(lon) 
    });
  }

  // Fallback de desenvolvimento (quando você roda no localhost da sua casa)
  try {
    const resp = await fetch('https://ipapi.co/json/');
    const data = await resp.json();
    return NextResponse.json({ city: data.city, lat: data.latitude, lon: data.longitude });
  } catch (e) {
    return NextResponse.json({ city: 'Colombo', lat: -25.2917, lon: -49.2242 });
  }
}