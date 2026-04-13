"use client";

import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { ShieldAlert, Save, RefreshCw, Lock, LogOut } from 'lucide-react';

export default function AdminPanel() {
  // Estados de Autenticação
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [erroAuth, setErroAuth] = useState<string | null>(null);

  // Estados do Banco de Dados
  const [precoMAP, setPrecoMAP] = useState<number>(0);
  const [loadingDB, setLoadingDB] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  // 1. O OLHO QUE TUDO VÊ: Fica escutando se há alguém logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuarioLogado) => {
      setUser(usuarioLogado);
      setLoadingAuth(false);
      
      // Se tiver usuário logado, busca o preço do banco de dados
      if (usuarioLogado) {
        buscarDadosMercado();
      }
    });

    return () => unsubscribe(); // Limpa o observador ao sair da tela
  }, []);

  const buscarDadosMercado = async () => {
    setLoadingDB(true);
    try {
      const docRef = doc(db, "parametros_mercado", "fertilizantes");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setPrecoMAP(docSnap.data().preco_map_usd);
      } else {
        await setDoc(docRef, { preco_map_usd: 595.00 });
        setPrecoMAP(595.00);
      }
    } catch (error) {
      console.error("Erro ao conectar com Firebase:", error);
    } finally {
      setLoadingDB(false);
    }
  };

  // Lógica de Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAuth(true);
    setErroAuth(null);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      // O onAuthStateChanged vai detectar o sucesso e mudar a tela automaticamente
    } catch (error: any) {
      setErroAuth("Credenciais inválidas ou sem permissão de acesso.");
      setLoadingAuth(false);
    }
  };

  // Lógica de Logout
  const handleLogout = async () => {
    await signOut(auth);
  };

  // Lógica de Salvar o Preço
  const handleSalvar = async () => {
    setSalvando(true);
    setMensagem(null);
    try {
      const docRef = doc(db, "parametros_mercado", "fertilizantes");
      await setDoc(docRef, { preco_map_usd: Number(precoMAP) }, { merge: true });
      setMensagem("Protocolo C-Level atualizado! O Agro OS já reflete o novo preço.");
    } catch (error) {
      setMensagem("Acesso Negado: Você não tem permissão de escrita.");
    } finally {
      setSalvando(false);
      setTimeout(() => setMensagem(null), 5000);
    }
  };

  // TELA DE CARREGAMENTO INICIAL
  if (loadingAuth && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <RefreshCw className="animate-spin text-emerald-500 w-8 h-8" />
      </div>
    );
  }

  // TELA DE LOGIN (O COFRE)
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-sm w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="bg-red-500/10 p-4 rounded-full mb-4">
              <Lock className="text-red-500 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white">Acesso Restrito</h1>
            <p className="text-sm text-slate-500 mt-1">Insira a credencial de Arquiteto</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="email" 
                placeholder="E-mail de Segurança" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-red-500 outline-none"
                required
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder="Senha" 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-red-500 outline-none"
                required
              />
            </div>

            {erroAuth && <p className="text-red-400 text-xs text-center font-bold">{erroAuth}</p>}

            <button 
              type="submit"
              disabled={loadingAuth}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors mt-4 disabled:opacity-50"
            >
              {loadingAuth ? "Autenticando..." : "Desbloquear Painel"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // TELA DO PAINEL ADMINISTRATIVO (Logado)
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        
        <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-emerald-500 w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold text-white">Backoffice Master</h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors bg-slate-800 p-2 rounded-lg">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {loadingDB ? (
          <div className="flex justify-center py-10">
            <RefreshCw className="animate-spin text-emerald-500 w-8 h-8" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Preço MAP (Referência FOB - USD/ton)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                <input 
                  type="number" 
                  value={precoMAP}
                  onChange={(e) => setPrecoMAP(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-8 pr-4 text-white font-mono text-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <button 
              onClick={handleSalvar}
              disabled={salvando}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {salvando ? <RefreshCw className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
              {salvando ? "Gravando na Nuvem..." : "Atualizar Ecossistema"}
            </button>

            {mensagem && (
              <div className="bg-emerald-950/50 border border-emerald-900 text-emerald-400 p-4 rounded-lg text-sm text-center">
                {mensagem}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}