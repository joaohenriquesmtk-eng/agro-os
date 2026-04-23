import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { CachedReportRecord } from "../types/persistence";

const COLLECTION_NAME = "cache_relatorios_cenario";

export async function readCachedReport(
  signature: string
): Promise<CachedReportRecord | null> {
  const ref = doc(db, COLLECTION_NAME, signature);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data() as CachedReportRecord;
}

export async function writeCachedReport(
  record: Omit<CachedReportRecord, "createdAt" | "updatedAt">
) {
  const ref = doc(db, COLLECTION_NAME, record.signature);
  const existing = await getDoc(ref);

  await setDoc(
    ref,
    {
      ...record,
      updatedAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );
}