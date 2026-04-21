import "server-only";
import { getAdminDb } from "./firebaseAdmin";

export type ProviderName = "GEMINI" | "OPENROUTER" | "OPENAI";

export type ProviderHealthStatus =
  | "ONLINE"
  | "RATE_LIMITED"
  | "DEGRADED"
  | "OFFLINE";

export interface ProviderHealthSnapshot {
  provider: ProviderName;
  status: ProviderHealthStatus;
  cooldownUntil: string | null;
  consecutiveFailures: number;
  lastFailureAt: string | null;
  lastSuccessAt: string | null;
  lastHttpStatus: number | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  updatedAt: string;
}

interface RegisterProviderFailureInput {
  httpStatus?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
}

const COLLECTION_NAME = "provider_health";
const ALL_PROVIDERS: ProviderName[] = ["GEMINI", "OPENROUTER", "OPENAI"];

const RATE_LIMIT_COOLDOWN_MS = 10 * 60 * 1000;
const DEGRADED_COOLDOWN_MS = 2 * 60 * 1000;
const OFFLINE_COOLDOWN_MS = 15 * 60 * 1000;

const memoryStore = new Map<ProviderName, ProviderHealthSnapshot>();

function nowIso() {
  return new Date().toISOString();
}

function buildFutureIso(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}

function buildDefaultSnapshot(provider: ProviderName): ProviderHealthSnapshot {
  return {
    provider,
    status: "ONLINE",
    cooldownUntil: null,
    consecutiveFailures: 0,
    lastFailureAt: null,
    lastSuccessAt: null,
    lastHttpStatus: null,
    lastErrorCode: null,
    lastErrorMessage: null,
    updatedAt: nowIso(),
  };
}

function normalizeSnapshot(
  raw: Partial<ProviderHealthSnapshot> | null | undefined,
  provider: ProviderName
): ProviderHealthSnapshot {
  const base = buildDefaultSnapshot(provider);

  const snapshot: ProviderHealthSnapshot = {
    ...base,
    ...(raw ?? {}),
    provider,
  };

  if (
    snapshot.status !== "ONLINE" &&
    snapshot.cooldownUntil &&
    new Date(snapshot.cooldownUntil).getTime() <= Date.now()
  ) {
    return {
      ...snapshot,
      status: "ONLINE",
      cooldownUntil: null,
      updatedAt: nowIso(),
    };
  }

  return snapshot;
}

async function readRawSnapshot(provider: ProviderName) {
  try {
    const snap = await getAdminDb().collection(COLLECTION_NAME).doc(provider).get();

    if (snap.exists) {
      return snap.data() as Partial<ProviderHealthSnapshot>;
    }
  } catch (error) {
    console.warn(
      "Provider health indisponível no Firestore. Usando memória do processo.",
      error
    );
  }

  return memoryStore.get(provider) ?? null;
}

async function persistSnapshot(snapshot: ProviderHealthSnapshot) {
  memoryStore.set(snapshot.provider, snapshot);

  try {
    await getAdminDb()
      .collection(COLLECTION_NAME)
      .doc(snapshot.provider)
      .set(snapshot, { merge: true });
  } catch (error) {
    console.warn(
      "Falha ao persistir provider health no Firestore. Mantendo memória local.",
      error
    );
  }

  return snapshot;
}

export async function readProviderHealth(provider: ProviderName) {
  const raw = await readRawSnapshot(provider);
  const normalized = normalizeSnapshot(raw, provider);

  if (!raw || raw.status !== normalized.status || raw.cooldownUntil !== normalized.cooldownUntil) {
    await persistSnapshot(normalized);
  }

  return normalized;
}

export async function getProvidersHealth(
  providers: ProviderName[] = ALL_PROVIDERS
) {
  const entries = await Promise.all(
    providers.map(async (provider) => {
      const snapshot = await readProviderHealth(provider);
      return [provider, snapshot] as const;
    })
  );

  return Object.fromEntries(entries) as Partial<
    Record<ProviderName, ProviderHealthSnapshot>
  >;
}

export async function getProviderAttemptState(provider: ProviderName) {
  const health = await readProviderHealth(provider);

  const cooldownActive =
    health.status !== "ONLINE" &&
    !!health.cooldownUntil &&
    new Date(health.cooldownUntil).getTime() > Date.now();

  return {
    health,
    canAttempt: !cooldownActive,
  };
}

export async function registerProviderSuccess(provider: ProviderName) {
  const current = await readProviderHealth(provider);

  return persistSnapshot({
    ...current,
    provider,
    status: "ONLINE",
    cooldownUntil: null,
    consecutiveFailures: 0,
    lastSuccessAt: nowIso(),
    lastHttpStatus: 200,
    lastErrorCode: null,
    lastErrorMessage: null,
    updatedAt: nowIso(),
  });
}

export async function registerProviderFailure(
  provider: ProviderName,
  input: RegisterProviderFailureInput = {}
) {
  const current = await readProviderHealth(provider);
  const consecutiveFailures = (current.consecutiveFailures ?? 0) + 1;

  let status: ProviderHealthStatus = "DEGRADED";
  let cooldownMs = DEGRADED_COOLDOWN_MS;

  if (input.httpStatus === 429) {
    status = "RATE_LIMITED";
    cooldownMs = RATE_LIMIT_COOLDOWN_MS;
  } else if (input.httpStatus === 401 || input.httpStatus === 403) {
    status = "OFFLINE";
    cooldownMs = OFFLINE_COOLDOWN_MS;
  } else if (consecutiveFailures >= 3) {
    status = "OFFLINE";
    cooldownMs = OFFLINE_COOLDOWN_MS;
  }

  return persistSnapshot({
    ...current,
    provider,
    status,
    cooldownUntil: buildFutureIso(cooldownMs),
    consecutiveFailures,
    lastFailureAt: nowIso(),
    lastHttpStatus: input.httpStatus ?? null,
    lastErrorCode: input.errorCode ?? null,
    lastErrorMessage: input.errorMessage
      ? String(input.errorMessage).slice(0, 300)
      : null,
    updatedAt: nowIso(),
  });
}