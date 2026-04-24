# 🌾 Agro OS | GeoEngine & Inteligência de Safra

![Status](https://img.shields.io/badge/Status-Em%20Evolu%C3%A7%C3%A3o-10b981?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![AI Routing](https://img.shields.io/badge/AI%20Routing-Gemini%20%E2%86%92%20OpenRouter%20%E2%86%92%20OpenAI%20%E2%86%92%20Local-6366f1?style=for-the-badge)
![Zustand](https://img.shields.io/badge/Zustand-State%20Management-111827?style=for-the-badge)

O **Agro OS** é um sistema de suporte à decisão agronômica e econômica voltado à interpretação de cenários de fertilidade, plausibilidade sazonal, custo de intervenção e emissão de laudos técnicos executivos.

O projeto foi concebido para transformar lógica agronômica em produto digital: em vez de apenas exibir indicadores, o Agro OS consolida dados operacionais, leitura econômica, coerência sazonal e geração de parecer técnico em uma única interface.

Seu foco atual está na construção de um **motor agronômico explicável**, combinado com uma camada resiliente de geração de laudos refinados por IA e fallback local.

---

## Visão do Produto

O Agro OS foi desenhado com uma premissa simples:

> **nem toda intervenção agronômica tecnicamente possível é economicamente viável no momento da decisão.**

Por isso, o sistema busca responder, de forma estruturada:

- a condição informada indica pressão nutricional real?
- a fase e a data são coerentes com o sistema produtivo modelado?
- a resposta marginal esperada compensa o custo da intervenção?
- o laudo final pode ser emitido com rastreabilidade, fallback e transparência operacional?

---

## O que o Agro OS faz hoje

### 1. Motor agronômico de decisão
O núcleo do sistema processa:

- cultura
- região
- fase fenológica
- produtividade-alvo
- fósforo (Mehlich)
- potássio
- pH do solo
- CTC
- matéria orgânica
- saturação por bases
- teor de argila
- chuva recente (7 dias)
- área de anomalia
- leitura de mercado
- plausibilidade sazonal por cultura, sistema e região

A partir disso, o motor calcula:

- classes de fertilidade para P e K
- pressão nutricional
- doses estimadas de MAP, KCl e ureia
- resposta marginal esperada
- leitura econômica da intervenção
- ROI incremental estimado
- margem sobre custo
- score de confiança
- fator limitante técnico/pedoclimático
- fator limitante econômico
- diagnóstico complementar do contexto
- status final do cenário:
  - **AUTORIZADO**
  - **RISCO ELEVADO**
  - **BLOQUEADO**

---

### 2. Leitura sazonal e sistema produtivo
O Agro OS não trata toda cultura de forma genérica.

A modelagem atual diferencia, por exemplo:

- **Soja primeira safra**
- **Milho verão**
- **Milho safrinha**
- **Trigo de inverno**
- **Algodão principal**
- **Cana-de-açúcar perene**

Além disso, a fase fenológica informada é confrontada com uma janela agrícola modelada por cultura e região, classificando a coerência como:

- **COERENTE**
- **ATENÇÃO**
- **FORA DO PADRÃO**

Essa camada não bloqueia automaticamente a decisão, mas influencia a interpretação do cenário e a confiança operacional do resultado.

---

### 3. Leitura econômica da intervenção
O sistema converte a recomendação física em leitura econômica, estimando:

- custo total da adubação
- retorno financeiro estimado
- ROI incremental
- margem sobre custo
- custo evitado, quando a não intervenção é a melhor decisão

O objetivo não é apenas recomendar dose, mas contextualizar se a intervenção faz sentido sob a ótica operacional e financeira.

---

### 4. Laudo técnico executivo
O Agro OS gera laudos em dois modos:

- **Modo Local**  
  usa apenas o motor interno, com resposta imediata e custo zero

- **Modo IA Refinada**  
  usa uma rota orquestrada de provedores externos para refinar a redação do laudo sem alterar a decisão do motor

A ordem atual da rota é:

**Gemini → OpenRouter → OpenAI → Local**

Se qualquer provedor falhar, entrar em cooldown ou estiver indisponível, o sistema desvia automaticamente para a próxima etapa da rota até concluir o laudo.

---

### 5. Telemetria operacional da rota de IA
A geração refinada de laudo possui observabilidade operacional.

O sistema registra:

- provedor utilizado
- tentativas anteriores na rota
- tempo total da execução
- tempo por tentativa
- modelo configurado / modelo usado
- fallback aplicado ou não
- persistência da telemetria no Firestore

O objetivo dessa camada é tornar a geração de laudos mais resiliente, auditável e rastreável.

---

### 6. Mercado e clima
O Agro OS também inclui módulos auxiliares de mercado e clima.

#### Mercado
O sistema sincroniza uma leitura econômica usando:

- dólar via fonte externa
- conversões internas de commodities
- custos de insumos parametrizados

#### Clima
O sistema consulta geolocalização e previsão meteorológica para produzir alertas operacionais contextuais.

> **Importante:** a camada climática atual é orientativa e não substitui recomendação meteorológica agronômica especializada.

---

## Arquitetura Atual

O Agro OS está organizado em quatro blocos principais:

### 1. Camada de motor agronômico
Responsável por:

- perfis por cultura
- classificação de fertilidade
- cálculo de doses
- leitura sazonal
- veredito técnico e econômico

### 2. Camada de integração operacional
Responsável por:

- mercado
- clima
- localização
- sincronização externa
- persistência em Firestore

### 3. Camada de geração de laudo
Responsável por:

- construção de prompt técnico
- orquestração de provedores
- fallback local
- telemetria da rota
- cache por assinatura expandida de cenário

### 4. Camada de interface
Responsável por:

- entrada de parâmetros
- exibição do veredito
- operações
- laudo
- histórico
- estado dos provedores

---

## Stack Tecnológica

- **Front-end:** React 19 + Next.js 16 (App Router)
- **Linguagem:** TypeScript
- **Estado global:** Zustand
- **UI:** Tailwind CSS + Lucide Icons
- **Banco:** Firebase Cloud Firestore
- **Admin / server:** Firebase Admin
- **IA externa:** Gemini, OpenRouter e OpenAI
- **Fallback técnico:** motor local
- **Telemetria de localização:** Vercel Edge Headers + fallback geográfico
- **Clima:** Open-Meteo
- **Mercado:** HG Brasil + modelagem econômica parametrizada
- **Testes:** Vitest (infraestrutura configurada)

---

## Principais Diferenciais

### Motor explicável
O sistema não responde apenas com um texto final. Ele expõe:

- justificativa central
- fatores determinantes
- premissas críticas
- leitura econômica
- coerência sazonal
- classes de solo interpretadas
- fator limitante técnico/pedoclimático
- fator limitante econômico
- diagnóstico complementar do contexto
- score de confiança do motor

### Arquitetura resiliente de laudo
A camada de IA não é um ponto único de falha.  
A geração refinada usa roteamento multi-provedor com fallback local e telemetria.

### Posicionamento agronômico
O Agro OS não foi pensado como “dashboard genérico”.  
Ele foi concebido como um **sistema de suporte à decisão agronômica e econômica**, com foco em contexto produtivo brasileiro, especialmente Cerrado e Centro-Oeste.

### Rastreabilidade de decisão
O Agro OS preserva o encadeamento da decisão entre:

- entrada operacional
- diagnóstico agronômico
- leitura econômica
- fatores limitantes
- laudo gerado
- histórico e cache por cenário

Isso reduz o risco de respostas desalinhadas entre motor, interface e laudo.

---

## Limitações Atuais

Este projeto está em evolução ativa.  
Para manter rigor técnico e honestidade, é importante deixar claro o que já está consolidado e o que ainda está em aprofundamento.

### 1. Mercado parcialmente parametrizado
A leitura econômica atual mistura:

- fonte externa real para parte da sincronização
- bases parametrizadas para parte das commodities e custos

Isso significa que o módulo econômico já é útil para simulação e triagem, mas ainda não representa um pipeline completo de market data institucional.

### 2. Camada climática orientativa
Os alertas climáticos atuais devem ser interpretados como apoio operacional, não como recomendação meteorológica definitiva para manejo.

### 3. Calibração agronômica complementar ainda em evolução
O sistema já integra de forma ativa variáveis adicionais como:

- pH
- CTC
- matéria orgânica
- saturação por bases
- teor de argila
- chuva recente

Esses parâmetros já participam do veredito, da confiança do motor, do diagnóstico complementar e da separação entre limitantes técnicos e econômicos.

O que ainda está em evolução não é mais a presença dessas variáveis na lógica, e sim o aprofundamento da calibragem agronômica para diferentes culturas, regiões e contextos operacionais.

### 4. Escopo atual
O Agro OS hoje é um sistema de triagem, interpretação e emissão de parecer técnico executivo.  
Ele **não** deve ser interpretado, neste estágio, como substituto de recomendação agronômica oficial de campo, laboratório ou assistência técnica presencial.

---

## Como Executar Localmente

### 1. Clone o repositório

```bash
git clone https://github.com/joaohenriquesmtk-eng/agro-os.git
cd agro-os