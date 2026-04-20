import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const apiKey = process.env.HG_API_KEY;
    const agora = new Date().toISOString();

    // Se não houver chave, NÃO quebra o app.
    // Retorna fallback controlado.
    if (!apiKey) {
      return NextResponse.json({
        dolar: 5.1,
        sojaUSDBushel: 11.85,
        milhoUSDBushel: 4.35,
        trigoUSDBushel: 5.75,
        algodaoUSDLb: 84.5,
        acucarUSDLb: 21.8,
        origem: "FALLBACK_LOCAL",
        status: "DEGRADED",
        warnings: [
          "HG_API_KEY não configurada. Sistema operando em fallback local."
        ],
        syncedAt: agora
      });
    }

    const urlHG = `https://api.hgbrasil.com/finance?key=${apiKey}`;
    const response = await fetch(urlHG, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Falha na comunicação com HG Brasil");
    }

    const data = await response.json();
    const results = data.results;

    const dolarAtual = results?.currencies?.USD?.buy;

    if (!dolarAtual || Number.isNaN(dolarAtual)) {
      throw new Error("HG Brasil não retornou USD válido.");
    }

    return NextResponse.json({
      dolar: dolarAtual,
      sojaUSDBushel: 11.85,
      milhoUSDBushel: 4.35,
      trigoUSDBushel: 5.75,
      algodaoUSDLb: 84.5,
      acucarUSDLb: 21.8,
      origem: "HG_BRASIL",
      status: "PARTIAL",
      warnings: [
        "USD em fonte externa. Commodities ainda usam base parametrizada."
      ],
      syncedAt: agora
    });
  } catch (error: any) {
    console.error("Erro no módulo de mercado:", error.message);

    return NextResponse.json({
      dolar: 5.1,
      sojaUSDBushel: 11.85,
      milhoUSDBushel: 4.35,
      trigoUSDBushel: 5.75,
      algodaoUSDLb: 84.5,
      acucarUSDLb: 21.8,
      origem: "FALLBACK_ERRO",
      status: "DEGRADED",
      warnings: [
        `Falha no provedor principal: ${error.message}`,
        "Sistema operando em fallback local."
      ],
      syncedAt: new Date().toISOString()
    });
  }
}