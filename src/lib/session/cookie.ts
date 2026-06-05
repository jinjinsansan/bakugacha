import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const SESSION_COOKIE_NAME = 'bakugatcha_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90日

/**
 * 認証成功時に呼ぶ。常に新しいトークンを発行してローテーションする。
 * 既存 cookie 値を再利用しないことでセッション固定攻撃を防ぐ。
 * トークンは 256bit の CSPRNG 乱数(hex)。
 */
export async function getOrCreateSessionToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = randomBytes(32).toString('hex');
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return token;
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function clearSessionToken(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
