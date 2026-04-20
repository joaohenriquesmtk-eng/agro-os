import { useEffect, useState } from "react";

interface ClimateTelemetryState {
  cidadeUsuario: string;
  alertaClimaDinamico: string;
}

export function useClimateTelemetry(): ClimateTelemetryState {
  const [cidadeUsuario, setCidadeUsuario] = useState("Sua Região");
  const [alertaClimaDinamico, setAlertaClimaDinamico] = useState(
    "Analisando dados agrometeorológicos via satélite..."
  );

  useEffect(() => {
    const buscarLocalizacaoEClima = async () => {
      try {
        const resIp = await fetch("/api/localizacao");
        const dataIp = await resIp.json();

        if (dataIp.city && dataIp.lat && dataIp.lon) {
          setCidadeUsuario(dataIp.city);

          const resClima = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${dataIp.lat}&longitude=${dataIp.lon}&daily=precipitation_sum,temperature_2m_max&timezone=America/Sao_Paulo&forecast_days=3`
          );
          const dataClima = await resClima.json();

          if (dataClima.daily) {
            const chuvaTotal = dataClima.daily.precipitation_sum.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const tempMax = Math.max(...dataClima.daily.temperature_2m_max);

            if (chuvaTotal > 20) {
              setAlertaClimaDinamico(
                `Os modelos apontam chuvas acumuladas intensas (${chuvaTotal.toFixed(
                  0
                )}mm) para os próximos 3 dias em ${
                  dataIp.city
                }. Recomenda-se pausar pulverizações foliares para evitar lavagem e ter atenção redobrada ao escorrimento superficial de adubação recém-aplicada.`
              );
            } else if (tempMax > 33 && chuvaTotal < 5) {
              setAlertaClimaDinamico(
                `Alerta Severo: Previsão de forte estresse térmico em ${
                  dataIp.city
                } com máximas atingindo ${tempMax.toFixed(
                  0
                )}°C e chuva escassa (${chuvaTotal.toFixed(
                  0
                )}mm). Risco altíssimo de abortamento floral. Evite aplicações de Ureia a lanço nas horas mais quentes devido à volatilização extrema.`
              );
            } else {
              setAlertaClimaDinamico(
                `Janela Agroclimática Estável: Clima favorável em ${
                  dataIp.city
                } para os próximos dias (Temp. Máxima: ${tempMax.toFixed(
                  0
                )}°C e Chuvas: ${chuvaTotal.toFixed(
                  0
                )}mm). Condições adequadas para operações de manejo nutricional foliar e entrada de maquinário pesado.`
              );
            }
          }
        } else {
          throw new Error("Localização não identificada.");
        }
      } catch {
        console.warn("Telemetria de IP/Clima offline. Operando em modo de segurança.");
        setAlertaClimaDinamico(
          "Aviso de Sistema: Conexão meteorológica temporariamente indisponível. Mantenha o monitoramento manual de precipitação e temperatura para ajuste crítico das doses de nitrogênio em cobertura."
        );
      }
    };

    buscarLocalizacaoEClima();
  }, []);

  return {
    cidadeUsuario,
    alertaClimaDinamico,
  };
}