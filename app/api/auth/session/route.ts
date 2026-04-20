import { NextResponse } from 'next/server';

import { getAdminAuth } from '../../../lib/firebaseAdmin';
import { createFirebaseSessionCookie } from '../../../lib/serverSession';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '../../../lib/sessionConstants';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idToken = typeof body.idToken === 'string' ? body.idToken : '';

    if (!idToken) {
      return NextResponse.json({ error: 'idToken obrigatório.' }, { status: 400 });
    }

    await getAdminAuth().verifyIdToken(idToken);
    const sessionCookie = await createFirebaseSessionCookie(idToken);
    const response = NextResponse.json({ ok: true });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao criar sessão';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
