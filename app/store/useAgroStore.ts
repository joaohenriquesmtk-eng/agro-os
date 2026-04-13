import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type RegiaoBrasil = 'NORTE' | 'NORDESTE' | 'CENTRO_OESTE' | 'SUDESTE' | 'SUL';
export type CulturaBrasil = 'SOJA' | 'MILHO' | 'CANA' | 'ALGODAO' | 'TRIGO';

export interface DadosOperacionais {
  talhao: string;
  regiao: RegiaoBrasil;
  cultura: CulturaBrasil;
  produtividadeAlvo: number; 
  fosforoMehlich: number;    
  potassio: number;          
}

export interface AnaliseEspectral {
  areaEstresseHa: number;
  faseFenologica: string;
  indice: string;
}

export interface MercadoFinanceiro {
  dolarPtax: number;
  cotacoes: Record<CulturaBrasil, number>; 
  custoMapTon: number;  // Expansão N-P-K
  custoKclTon: number;  // Expansão N-P-K
  custoUreaTon: number; // Expansão N-P-K
  ultimaSincronizacao: string | null;
}

interface AgroOSStore {
  operacao: DadosOperacionais;
  analise: AnaliseEspectral;
  mercado: MercadoFinanceiro;
  setOperacao: (dados: Partial<DadosOperacionais>) => void;
  setAnalise: (dados: Partial<AnaliseEspectral>) => void;
  setMercado: (dados: MercadoFinanceiro) => void;
}

export const useAgroStore = create<AgroOSStore>()(
  persist(
    (set) => ({
      operacao: {
        talhao: '',
        regiao: 'CENTRO_OESTE',
        cultura: 'SOJA',
        produtividadeAlvo: 75,
        fosforoMehlich: 12,
        potassio: 0.15
      },
      analise: {
        areaEstresseHa: 0,
        faseFenologica: 'Emergência (VE-VC)',
        indice: 'NDVI (Padrão)'
      },
      mercado: {
        dolarPtax: 0,
        cotacoes: { SOJA: 0, MILHO: 0, CANA: 0, ALGODAO: 0, TRIGO: 0 },
        custoMapTon: 0,
        custoKclTon: 0,
        custoUreaTon: 0,
        ultimaSincronizacao: null
      },
      setOperacao: (dados) => set((state) => ({ operacao: { ...state.operacao, ...dados } })),
      setAnalise: (dados) => set((state) => ({ analise: { ...state.analise, ...dados } })),
      setMercado: (dados) => set({ mercado: dados }),
    }),
    { name: 'agro-os-master-storage', storage: createJSONStorage(() => localStorage) }
  )
);