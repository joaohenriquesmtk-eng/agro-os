import { Activity, MessageCircle, X } from "lucide-react";

interface ProfileModalProps {
  aberto: boolean;
  onFechar: () => void;
}

export default function ProfileModal({ aberto, onFechar }: ProfileModalProps) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onFechar} />

      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onFechar}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-indigo-900 font-bold mb-6 w-full justify-start border-b border-slate-100 pb-4 absolute top-0 left-0 p-6 rounded-t-3xl bg-slate-50/50">
          <Activity className="w-4 h-4" /> Arquiteto do Sistema
        </div>

        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl mt-12 mb-4">
          <img
            src="/avatar.jpg"
            alt="João Henrique da Silva"
            className="w-full h-full object-cover bg-slate-200"
            onError={(e) => {
              e.currentTarget.src =
                "https://ui-avatars.com/api/?name=João+Henrique&background=10b981&color=fff&size=150";
            }}
          />
        </div>

        <h2 className="text-xl font-extrabold text-slate-800">João Henrique da Silva</h2>
        <h3 className="text-xs font-bold text-emerald-600 tracking-widest uppercase mt-1 mb-4">
          Engenheiro Agrônomo
        </h3>

        <p className="text-slate-600 text-sm leading-relaxed mb-8">
          Formado pela Universidade Federal do Paraná (UFPR). Especialista em transformar dados
          multiespectrais e modelagem agroeconômica em decisões de alto impacto para a rentabilidade
          das operações no Cerrado.
        </p>

        <div className="flex gap-3 w-full">
          <a
            href="https://www.linkedin.com/in/joaohenriquedasilva-agronomo/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[#0a66c2] hover:bg-[#004182] text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect width="4" height="12" x="2" y="9" />
              <circle cx="4" cy="4" r="2" />
            </svg>
            LinkedIn
          </a>

          <a
            href="https://wa.me/5541996419950?text=Ol%C3%A1%2C%20Jo%C3%A3o!%20Vim%20atrav%C3%A9s%20do%20Agro%20OS%20e%20gostaria%20de%20conversar%20com%20voc%C3%AA."
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[#25d366] hover:bg-[#128c7e] text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
          >
            <MessageCircle className="w-5 h-5" /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}