import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type RegiaoBrasil = "NORTE" | "NORDESTE" | "CENTRO_OESTE" | "SUDESTE" | "SUL";
export type CulturaBrasil = "SOJA" | "MILHO" | "CANA" | "ALGODAO" | "TRIGO";

export interface DadosOperacionais {
  talhao: string;
  regiao: RegiaoBrasil;
  cultura: CulturaBrasil;
  produtividadeAlvo: number;
  fosforoMehlich: number;
  potassio: number;
  phSolo: number;
  ctc: number;
  materiaOrganica: number;
  saturacaoBases: number;
  teorArgila: number;
}

export interface AnaliseEspectral {
  areaEstresseHa: number;
  faseFenologica: string;
  indice: string;
  chuva7dMm: number;
}

export interface MercadoFinanceiro {
  dolarPtax: number;
  cotacoes: Record<CulturaBrasil, number>;
  custoMapTon: number;
  custoKclTon: number;
  custoUreaTon: number;
  ultimaSincronizacao: string | null;
  statusMercado: "OK" | "PARTIAL" | "DEGRADED";
  avisosMercado: string[];
  origemDolar: string | null;
  origemCommodities: string | null;
}

interface AgroOSStore {
  operacao: DadosOperacionais;
  analise: AnaliseEspectral;
  mercado: MercadoFinanceiro;
  setOperacao: (dados: Partial<DadosOperacionais>) => void;
  setAnalise: (dados: Partial<AnaliseEspectral>) => void;
  setMercado: (dados: MercadoFinanceiro) => void;
  resetOperacao: () => void;
  resetAnalise: () => void;
}

const operacaoInicial: DadosOperacionais = {
  talhao: "",
  regiao: "CENTRO_OESTE",
  cultura: "SOJA",
  produtividadeAlvo: 75,
  fosforoMehlich: 12,
  potassio: 0.15,
  phSolo: 5.5,
  ctc: 8,
  materiaOrganica: 2,
  saturacaoBases: 50,
  teorArgila: 45,
};

const analiseInicial: AnaliseEspectral = {
  areaEstresseHa: 0,
  faseFenologica: "Emergência (VE-VC)",
  indice: "NDVI (Padrão)",
  chuva7dMm: 10,
};

const mercadoInicial: MercadoFinanceiro = {
  dolarPtax: 0,
  cotacoes: { SOJA: 0, MILHO: 0, CANA: 0, ALGODAO: 0, TRIGO: 0 },
  custoMapTon: 0,
  custoKclTon: 0,
  custoUreaTon: 0,
  ultimaSincronizacao: null,
  statusMercado: "DEGRADED",
  avisosMercado: [],
  origemDolar: null,
  origemCommodities: null,
};

export const useAgroStore = create<AgroOSStore>()(
  persist(
    (set) => ({
      operacao: operacaoInicial,
      analise: analiseInicial,
      mercado: mercadoInicial,

      setOperacao: (dados) =>
        set((state) => ({
          operacao: { ...state.operacao, ...dados },
        })),

      setAnalise: (dados) =>
        set((state) => ({
          analise: { ...state.analise, ...dados },
        })),

      setMercado: (dados) =>
        set(() => ({
          mercado: dados,
        })),

      resetOperacao: () =>
        set(() => ({
          operacao: operacaoInicial,
        })),

      resetAnalise: () =>
        set(() => ({
          analise: analiseInicial,
        })),
    }),
    {
      name: "agro-os-master-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        operacao: state.operacao,
        analise: state.analise,
        mercado: state.mercado,
      }),
    }
  )
);