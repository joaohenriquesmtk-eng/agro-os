import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface CachedReportRecord {
  signature: string;
  relatorio: string;
  source: "IA_EXTERNA" | "LOCAL_FALLBACK" | "CACHE";
  createdAt?: unknown;
  updatedAt?: unknown;
  fingerprint: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

const COLLECTION_NAME = "cache_relatorios_cenario";

export async function readCachedReport(signature: string) {
  const ref = doc(db, COLLECTION_NAME, signature);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data() as CachedReportRecord;
}

export async function writeCachedReport(record: CachedReportRecord) {
  const ref = doc(db, COLLECTION_NAME, record.signature);

  await setDoc(
    ref,
    {
      ...record,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}