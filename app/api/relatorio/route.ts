export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ erro: "Chave ausente no .env.local" }, { status: 500 });

    const dados = await req.json();
    // O payload agora contém as variáveis atualizadas N-P-K do Store e do GeoEngine
    const { operacao, analise, mercado, veredito, imagemBase64, possuiMapa } = dados;

    const dataAtual = new Intl.DateTimeFormat('pt-BR', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    }).format(new Date());

    // UTILIZANDO SUA URL COMPROVADA DO GEMINI
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    // Ajuste dinâmico da instrução caso não haja mapa
    const instrucaoVisual = imagemBase64 
      ? `Analise a imagem anexa (Mapa de Precisão). Identifique padrões de anomalia espectral correlacionando com o estágio ${analise.faseFenologica}.`
      : `O usuário não forneceu mapa visual. Atue como Consultor Técnico baseado APENAS nos dados numéricos e econômicos fornecidos abaixo.`;

    const promptMaster = `
Você é o Cérebro do Agro OS, um Arquiteto de Soluções Agrotech, Doutor em Solos e Especialista em Inteligência de Mercado.
Sua missão é realizar uma auditoria agronômica e financeira.

**CONTEXTO AGRONÔMICO (Vigor IA):**
- Data: ${dataAtual}
- Cultura: ${operacao.cultura} | Estágio: ${analise.faseFenologica}
- Região/Solo: ${operacao.regiao}
- Fósforo (P): ${operacao.fosforoMehlich} mg/dm³
- Potássio (K): ${operacao.potassio} cmolc/dm³
- Índice Espectral: ${analise.indice || 'Não fornecido'}

**CONTEXTO FINANCEIRO E RECOMENDAÇÕES N-P-K:**
- Dólar: R$ ${mercado.dolarPtax.toFixed(2)}
- Custo Insumos (FOB/t): MAP R$ ${mercado.custoMapTon?.toFixed(0) || 0} | KCL R$ ${mercado.custoKclTon?.toFixed(0) || 0} | UREIA R$ ${mercado.custoUreaTon?.toFixed(0) || 0}
- ROI Calculado pelo Sistema: R$ ${veredito.roiEstimado.toFixed(2)}
- Doses Recomendadas (kg/ha): MAP: ${veredito.doseMapHa?.toFixed(0) || 0} | KCL: ${veredito.doseKclHa?.toFixed(0) || 0} | UREIA: ${veredito.doseUreaHa?.toFixed(0) || 0}

**DIRETRIZES DO LAUDO:**
1. ${instrucaoVisual}
2. Cruze a necessidade química N-P-K com a viabilidade financeira e o teto produtivo da cultura. 
3. Se o ROI for baixo ou o risco regional (${veredito.fatorLimitante}) for alto, seja agressivo na recomendação de preservação de caixa.

**REGRAS DE FORMATAÇÃO:**
- Use apenas bullets (•) para listas. 
- Use negrito (**texto**) para destacar termos técnicos.
- Inicie com "LAUDO TÉCNICO EXECUTIVO - ${dataAtual}".
- Finalize com "PARECER OPERACIONAL:" e o veredito final sobre o orçamento.
`;

    // Montagem dinâmica das partes (evita enviar inlineData vazio)
    const parts: any[] = [{ text: promptMaster }];
    
    if (imagemBase64) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: imagemBase64 } });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }]
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("Falha Google Cloud:", result);
      return NextResponse.json({ error: `Erro na IA: ${result.error?.message || 'Falha na comunicação'}` }, { status: response.status });
    }

    const textoRelatorio = result.candidates?.[0]?.content?.parts?.[0]?.text || "Análise concluída, sem resposta textual.";

    return NextResponse.json({ relatorio: textoRelatorio });

  } catch (error: any) {
    console.error("Erro interno no servidor Agro OS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}