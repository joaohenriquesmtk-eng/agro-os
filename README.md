# 🌾 Agro OS | GeoEngine & Inteligência de Safra

![Agro OS Banner](https://img.shields.io/badge/Status-Em_Produ%C3%A7%C3%A3o-10b981?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_1.5_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

O **Agro OS** é um ecossistema definitivo de inteligência agronômica e financeira. Nascido da fusão de projetos anteriores focados em diagnóstico visual e modelagem econômica, este sistema atua como o "cérebro" da operação agrícola, cruzando dados pedoclimáticos, análises de imagem por Inteligência Artificial e telemetria financeira em tempo real (B3/CBOT).

Desenvolvido com foco na alta complexidade do mercado agrícola do Cerrado brasileiro, o sistema não apenas diagnostica, mas emite **Vereditos de Viabilidade Econômica (ROI)** para intervenções no campo.

## 🚀 Arquitetura e Módulos Principais

O ecossistema é dividido em três motores fundamentais que operam em sincronia:

### 1. Motor N-P-K (GeoEngine)
- **Diagnóstico Nutricional:** Algoritmo proprietário que calcula a exigência de macronutrientes (Fósforo, Potássio e Nitrogênio) baseado na cultura, fase fenológica, região pedoclimática e produtividade alvo.
- **Auditoria de Custo:** Converte a necessidade física (kg/ha) em viabilidade financeira com base no custo de reposição atualizado (MAP, KCl, Ureia).

### 2. Radar de Mercado e Clima (Telemetria Edge)
- **Integração B3/CBOT:** Conexão direta com a API da **HG Brasil** processada no backend (Server-Side) para buscar a cotação em tempo real do Dólar PTAX e converter bases de commodities (Soja, Milho, Trigo, Algodão, Cana) diretamente para Reais por unidade comercial (Saca, Arroba, Tonelada).
- **Satélite Open-Meteo:** Rastreamento dinâmico do IP do usuário via *Edge Computing* para fornecer dados agrometeorológicos dos próximos 3 dias, emitindo alertas dinâmicos sobre risco de lavagem foliar ou volatilização de fertilizantes.

### 3. Auditoria Multimodal (Gemini AI)
- **Análise Visual de Anomalias:** Suporte para upload de mapas de índice vegetativo (NDVI/NDRE). O sistema processa a imagem via Google Gemini 1.5 Flash.
- **Laudo Técnico:** Geração de um parecer executivo agronômico cruzando a imagem do talhão com o ROI projetado, gerando um laudo documentado e histórico.

## 🛠️ Stack Tecnológica

- **Front-end:** React.js + Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Lucide Icons (Design UI/UX focado no retro-moderno e usabilidade de alto padrão)
- **Back-end & Edge:** Next.js API Routes executadas em infraestrutura Vercel para contornar gargalos de CORS e proxies financeiros.
- **State Management:** Zustand (Gerenciamento global de estado das operações e mercado)
- **Database:** Firebase Cloud Firestore (Armazenamento de Memória de Safra/Histórico de Laudos)
- **Integrações de API:** Google Gemini Studio, HG Brasil (Finance), Open-Meteo, Telemetria de IP Nativa.

## 💡 Filosofia de Desenvolvimento

Este projeto foi concebido sob a premissa de que o Agrônomo moderno precisa deixar de ser um mero "tirador de pedidos" para se tornar um gestor financeiro de alta precisão. O Agro OS elimina o viés emocional da recomendação técnica, colocando a margem de lucro e o risco climático como balizadores número um antes de qualquer maquinário entrar no talhão.

---

## ⚙️ Como Executar Localmente

Siga os passos abaixo para rodar o ecossistema em sua máquina local:

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/joaohenriquesmtk-eng/agro-os.git](https://github.com/joaohenriquesmtk-eng/agro-os.git)