import type { CulturaBrasil } from "../store/useAgroStore";

export const fasesFenologicas: Record<CulturaBrasil, string[]> = {
  SOJA: [
    "Emergência (VE-VC)",
    "Vegetativo (V1-Vn)",
    "Floração (R1-R2)",
    "Enchimento (R5-R6)",
    "Maturação (R7-R8)",
  ],
  MILHO: [
    "Emergência (VE)",
    "Vegetativo (V4-V8)",
    "Pendoamento (VT-R1)",
    "Enchimento (R2-R5)",
    "Maturação (R6)",
  ],
  CANA: [
    "Brotação",
    "Perfilhamento",
    "Crescimento de Colmos",
    "Maturação",
  ],
  ALGODAO: [
    "Emergência (V0)",
    "Vegetativo (V1-Vn)",
    "Botão Floral (B1-Bn)",
    "Florescimento (F1-Fn)",
    "Maçã (M1-Mn)",
    "Maturação",
  ],
  TRIGO: [
    "Germinação",
    "Perfilhamento",
    "Elongação",
    "Espigamento",
    "Maturação",
  ],
};

export const unidadePorCultura: Record<CulturaBrasil, string> = {
  SOJA: "sc/ha",
  MILHO: "sc/ha",
  TRIGO: "sc/ha",
  ALGODAO: "@/ha",
  CANA: "TCH",
};

export const fatorExtracaoPMap: Record<CulturaBrasil, number> = {
  SOJA: 1,
  MILHO: 0.75,
  TRIGO: 0.78,
  ALGODAO: 0.9,
  CANA: 0.55,
};