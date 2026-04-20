import { MercadoFinanceiro } from "../store/useAgroStore";

interface MercadoApiResponse {
  dolar: number;
  sojaUSDBushel: number;
  milhoUSDBushel: number;
  trigoUSDBushel: number;
  algodaoUSDLb: number;
  acucarUSDLb: number;
  origem?: string;
  status?: "OK" | "PARTIAL" | "DEGRADED";
  warnings?: string[];
  syncedAt?: string;
}

export const ServicoMercado = {
  sincronizarB3: async (): Promise<MercadoFinanceiro> => {
    const response = await fetch("/api/mercado", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Falha ao buscar dados do mercado.");
    }

    const data = (await response.json()) as MercadoApiResponse;
    const dolar = data.dolar;

    // Conversões atuais do Agro OS
    const sojaBRL = dolar * (data.sojaUSDBushel * 2.2046);
    const milhoBRL = dolar * (data.milhoUSDBushel * 2.362);
    const trigoBRL = dolar * (data.trigoUSDBushel * 2.2046);
    const algodaoBRL = dolar * ((data.algodaoUSDLb / 100) * 33.069);
    const canaBRL = (data.acucarUSDLb / 100) * dolar * 135;

    return {
      dolarPtax: dolar,
      cotacoes: {
        SOJA: sojaBRL,
        MILHO: milhoBRL,
        TRIGO: trigoBRL,
        ALGODAO: algodaoBRL,
        CANA: canaBRL,
      },
      custoMapTon: dolar * 595.0,
      custoKclTon: dolar * 415.0,
      custoUreaTon: dolar * 385.0,
      ultimaSincronizacao: data.syncedAt
        ? new Date(data.syncedAt).toLocaleTimeString("pt-BR")
        : new Date().toLocaleTimeString("pt-BR"),
      statusMercado: data.status || "DEGRADED",
      avisosMercado: data.warnings || [],
      origemDolar: data.origem || null,
      origemCommodities: "PARAMETRIZED_MODEL",
    };
  },
};