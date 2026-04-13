import { RegiaoBrasil, CulturaBrasil, DadosOperacionais, MercadoFinanceiro, AnaliseEspectral } from '../store/useAgroStore';

interface VereditoFinal {
  status: 'AUTORIZADO' | 'RISCO_ELEVADO' | 'BLOQUEADO';
  roiEstimado: number;
  justificativa: string;
  fatorLimitante: string;
  doseMapHa: number;
  doseKclHa: number;
  doseUreaHa: number;
}

interface ParametrosRegionais {
  pCritico: number; 
  doseMax: number; 
  doseManutencao: number; 
  eficiencia: number; 
  risco: string;
}

interface ParametrosCultura {
  unidade: string;
  produtividadeBase: number; 
  fatorExtracaoP: number;    
}

export const GeoEngine = {
  getEficienciaFase: (fase: string): number => {
    const faseNormalizada = fase.toUpperCase();
    if (faseNormalizada.includes('EMERGÊNCIA') || faseNormalizada.includes('VEGETATIVO') || faseNormalizada.includes('BROTAÇÃO') || faseNormalizada.includes('GERMINAÇÃO')) return 1.0;
    if (faseNormalizada.includes('FLORAÇÃO') || faseNormalizada.includes('PENDOAMENTO') || faseNormalizada.includes('CRESCIMENTO') || faseNormalizada.includes('BOTÃO FLORAL') || faseNormalizada.includes('PERFILHAMENTO')) return 0.6;
    if (faseNormalizada.includes('ENCHIMENTO') || faseNormalizada.includes('MAÇÃ') || faseNormalizada.includes('ELONGAÇÃO')) return 0.2; 
    if (faseNormalizada.includes('MATURAÇÃO') || faseNormalizada.includes('ESPIGAMENTO')) return 0.0; 
    return 0.8; 
  },

  getParametros: (regiao: RegiaoBrasil): ParametrosRegionais => {
    const config: Record<RegiaoBrasil, ParametrosRegionais> = {
      'CENTRO_OESTE': { pCritico: 18, doseMax: 320, doseManutencao: 90, eficiencia: 0.45, risco: 'Veranicos e alta fixação de fósforo em latossolos argilosos.' },
      'SUL': { pCritico: 12, doseMax: 220, doseManutencao: 70, eficiencia: 0.75, risco: 'Geadas tardias e alto potencial de resposta por matéria orgânica.' },
      'NORTE': { pCritico: 15, doseMax: 350, doseManutencao: 100, eficiencia: 0.35, risco: 'Lixiviação extrema e solos de baixa CTC.' },
      'NORDESTE': { pCritico: 20, doseMax: 280, doseManutencao: 85, eficiencia: 0.50, risco: 'Estresse hídrico e risco de salinização superficial.' },
      'SUDESTE': { pCritico: 16, doseMax: 260, doseManutencao: 80, eficiencia: 0.65, risco: 'Erosão e exaustão do solo.' }
    };
    return config[regiao];
  },

  getParametrosCultura: (cultura: CulturaBrasil): ParametrosCultura => {
    const config: Record<CulturaBrasil, ParametrosCultura> = {
      'SOJA': { unidade: 'sc/ha', produtividadeBase: 60, fatorExtracaoP: 1.0 },
      'MILHO': { unidade: 'sc/ha', produtividadeBase: 100, fatorExtracaoP: 0.6 },
      'TRIGO': { unidade: 'sc/ha', produtividadeBase: 60, fatorExtracaoP: 0.7 },
      'ALGODAO': { unidade: '@ / ha', produtividadeBase: 250, fatorExtracaoP: 0.85 },
      'CANA': { unidade: 'TCH', produtividadeBase: 90, fatorExtracaoP: 0.4 }
    };
    return config[cultura];
  },

  processarROI: (
    operacao: DadosOperacionais, 
    analise: AnaliseEspectral, 
    mercado: MercadoFinanceiro
  ): VereditoFinal => {
    
    const params = GeoEngine.getParametros(operacao.regiao);
    const paramsCultura = GeoEngine.getParametrosCultura(operacao.cultura);
    const pAtual = operacao.fosforoMehlich;
    const efFase = GeoEngine.getEficienciaFase(analise.faseFenologica);

    // 1. CÁLCULO FÓSFORO (MAP)
    let doseBaseP = 0;
    if (pAtual < params.pCritico) {
      const amplitudeDose = params.doseMax - params.doseManutencao;
      doseBaseP = params.doseMax - (amplitudeDose * (pAtual / params.pCritico));
    } else {
      const excesso = pAtual - params.pCritico;
      doseBaseP = params.doseManutencao / (1 + (excesso * 0.1));
    }
    const fatorProdutividade = operacao.produtividadeAlvo / paramsCultura.produtividadeBase;
    const doseMapHa = Math.max(doseBaseP * fatorProdutividade * paramsCultura.fatorExtracaoP, 40);

    // 2. CÁLCULO POTÁSSIO (KCL)
    let doseKclHa = 0;
    if (operacao.potassio < 0.15) doseKclHa = 150;
    else if (operacao.potassio < 0.30) doseKclHa = 80;
    else doseKclHa = 40;
    doseKclHa *= fatorProdutividade;

    // 3. CÁLCULO NITROGÊNIO (UREIA)
    let doseUreaHa = 0;
    if (operacao.cultura !== 'SOJA') {
       const demandaN = (operacao.produtividadeAlvo * 0.6) * 1.5; 
       doseUreaHa = Math.min(demandaN, 350); 
    }

    // 4. MATEMÁTICA FINANCEIRA N-P-K
    const custoTotalAdubacao = analise.areaEstresseHa * (
      (doseMapHa * (mercado.custoMapTon / 1000)) +
      (doseKclHa * (mercado.custoKclTon / 1000)) +
      (doseUreaHa * (mercado.custoUreaTon / 1000))
    );

    const precoRealMercado = mercado.cotacoes?.[operacao.cultura] || 0;
    const ganhoPotencialVolume = (operacao.produtividadeAlvo * 0.18) * analise.areaEstresseHa;
    const retornoFinanceiro = (ganhoPotencialVolume * precoRealMercado) * params.eficiencia * efFase;

    const roi = retornoFinanceiro - custoTotalAdubacao;

    // 5. STATUS EXECUTIVO ADAPTATIVO
    let status: 'AUTORIZADO' | 'RISCO_ELEVADO' | 'BLOQUEADO' = 'BLOQUEADO';
    let justificativa = "";

    if (efFase === 0) {
      status = 'BLOQUEADO';
      justificativa = `Operação vetada. A cultura (${operacao.cultura}) em ${analise.faseFenologica} não possui metabolismo para resposta à adubação via solo.`;
    } else if (roi > (custoTotalAdubacao * 0.4)) {
      status = 'AUTORIZADO';
      justificativa = `Recomendação N-P-K viável: MAP(${doseMapHa.toFixed(0)}kg), KCL(${doseKclHa.toFixed(0)}kg)${doseUreaHa > 0 ? `, UREIA(${doseUreaHa.toFixed(0)}kg)` : ' com Fixação de N'}.`;
    } else if (roi > 0) {
      status = 'RISCO_ELEVADO';
      justificativa = `Viabilidade econômica limitada pelo custo N-P-K e janela nutricional atual.`;
    } else {
      status = 'BLOQUEADO';
      justificativa = `Prejuízo financeiro: Custo total de nutrição (N-P-K) inviabiliza o teto produtivo de ${operacao.cultura}.`;
    }

    return {
      status,
      roiEstimado: roi,
      justificativa,
      fatorLimitante: params.risco,
      doseMapHa, doseKclHa, doseUreaHa
    };
  }
};