"use client";

import { useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { HistoryEntry } from "../types/report";
import type { HistoryFirestoreEntry } from "../types/persistence";

export function useHistoryLoader() {
  const [modalHistorico, setModalHistorico] = useState(false);
  const [listaHistorico, setListaHistorico] = useState<HistoryEntry[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  const handleVerHistorico = async () => {
    setModalHistorico(true);
    setCarregandoHistorico(true);

    try {
      const q = query(
        collection(db, "historico_talhoes"),
        orderBy("dataRegistro", "desc"),
        limit(10)
      );

      const querySnapshot = await getDocs(q);

      const docs: HistoryEntry[] = querySnapshot.docs.map((doc) => {
        const raw = doc.data() as Partial<HistoryFirestoreEntry> & {
          dataRegistro?: { toDate?: () => Date };
        };

        return {
          id: doc.id,
          ...raw,
          dataFormatada: raw.dataRegistro?.toDate?.().toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      });

      setListaHistorico(docs);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const fecharHistorico = () => setModalHistorico(false);

  return {
    modalHistorico,
    listaHistorico,
    carregandoHistorico,
    handleVerHistorico,
    fecharHistorico,
    setModalHistorico,
  };
}