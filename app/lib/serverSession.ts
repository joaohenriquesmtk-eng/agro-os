import { getAdminAuth } from "./firebaseAdmin";
import { SESSION_MAX_AGE_SECONDS } from "./sessionConstants";

export async function createFirebaseSessionCookie(idToken: string) {
  return await getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  });
}