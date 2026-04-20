import { BrainCircuit, FileText } from "lucide-react";

function renderRelatorioSeguro(texto: string, modoMultimodal: boolean) {
  const destaqueClass = modoMultimodal ? "text-emerald-400" : "text-indigo-400";
  const bulletClass = modoMultimodal ? "text-emerald-500" : "text-indigo-500";

  const linhas = texto.split("\n").filter((linha) => linha.trim() !== "");

  return linhas.map((linha, index) => {
    const isBullet = linha.trim().startsWith("•");
    const conteudoLimpo = isBullet ? linha.trim().replace(/^•\s*/, "") : linha;

    const partes = conteudoLimpo.split(/(\*\*.*?\*\*)/g);

    return (
      <p
        key={`${index}-${conteudoLimpo.slice(0, 20)}`}
        className="mb-3 text-slate-300 leading-relaxed text-sm md:text-base"
      >
        {isBullet && <span className={`${bulletClass} mr-2 font-bold`}>•</span>}

        {partes.map((parte, parteIndex) => {
          const isBold = parte.startsWith("**") && parte.endsWith("**");

          if (isBold) {
            const textoNegrito = parte.slice(2, -2);
            return (
              <strong key={parteIndex} className={destaqueClass}>
                {textoNegrito}
              </strong>
            );
          }

          return <span key={parteIndex}>{parte}</span>;
        })}
      </p>
    );
  });
}

interface TechnicalReportCardProps {
  relatorioExecutivo: string | null;
  imagemMapa: string | null;
}

export default function TechnicalReportCard({
  relatorioExecutivo,
  imagemMapa,
}: TechnicalReportCardProps) {
  if (!relatorioExecutivo) return null;

  return (
    <div
      className={`rounded-2xl border p-6 shadow-2xl shadow-emerald-900/10 ${
        imagemMapa
          ? "bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500/30"
          : "bg-gradient-to-br from-indigo-950/40 to-slate-900 border-indigo-500/30"
      }`}
    >
      <h3
        className={`font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm border-b pb-2 ${
          imagemMapa
            ? "text-emerald-400 border-emerald-900/50"
            : "text-indigo-400 border-indigo-900/50"
        }`}
      >
        {imagemMapa ? <BrainCircuit className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
        {imagemMapa
          ? "Auditoria de Precisão (Gemini Multimodal)"
          : "Parecer Técnico Agronômico (Gemini IA)"}
      </h3>

      <div className="max-w-none whitespace-pre-wrap">
        {renderRelatorioSeguro(relatorioExecutivo, !!imagemMapa)}
      </div>
    </div>
  );
}