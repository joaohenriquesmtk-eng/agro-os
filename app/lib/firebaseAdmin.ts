import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let adminApp: App;

function getPrivateKey() {
  const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!key) {
    throw new Error("FIREBASE_ADMIN_PRIVATE_KEY não configurada.");
  }

  return key.replace(/\\n/g, "\n");
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail) {
    throw new Error(
      "Firebase Admin incompleto. Configure FIREBASE_ADMIN_PROJECT_ID e FIREBASE_ADMIN_CLIENT_EMAIL."
    );
  }

  adminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return adminApp;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}