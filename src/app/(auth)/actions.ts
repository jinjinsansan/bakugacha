'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getServiceSupabase } from '@/lib/supabase/service';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { findUserByEmail, createUser, touchLastLogin } from '@/lib/data/users';
import { createSession, deleteSession } from '@/lib/data/session';
import { grantCoins } from '@/lib/data/coins';
import { checkRateLimit } from '@/lib/ratelimit-db';
import { getOrCreateSessionToken, getSessionToken, clearSessionToken } from '@/lib/session/cookie';

const REGISTER_BONUS_COINS = 300; // 新規登録ボーナス

/** server action 用: リクエストヘッダーからクライアント IP を取得 */
async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return h.get('x-real-ip') ?? 'unknown';
}

const registerSchema = z
  .object({
    email: z.string().email('メールアドレスの形式が正しくありません。'),
    password: z.string().min(8, 'パスワードは8文字以上で入力してください。'),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'パスワードが一致しません。',
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function errorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

// ── 新規登録 ──────────────────────────────────────────────────
export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? '入力内容をご確認ください。';
    errorRedirect('/register', msg);
  }

  const { email, password } = parsed.data;
  const supabase = getServiceSupabase();

  // Sybil(大量アカウント作成)対策: 同一IPからの登録を1時間に5回までに制限
  const ip = await clientIp();
  const rl = await checkRateLimit(supabase, { key: `register:${ip}`, maxRequests: 5, windowSeconds: 3600 });
  if (!rl.allowed) {
    errorRedirect('/register', '登録の試行が多すぎます。しばらくしてからお試しください。');
  }

  // 重複チェック
  const existing = await findUserByEmail(supabase, email);
  if (existing) {
    errorRedirect('/register', 'このメールアドレスは既に登録されています。');
  }

  // ユーザー作成
  const passwordHash = await hashPassword(password);
  const user = await createUser(supabase, {
    email,
    passwordHash,
    initialCoins: REGISTER_BONUS_COINS,
  });

  // ボーナスコイントランザクション記録
  await supabase.from('coin_transactions').insert({
    user_id: user.id,
    type: 'bonus',
    amount: REGISTER_BONUS_COINS,
    balance_after: REGISTER_BONUS_COINS,
    description: '新規登録ボーナス',
  });

  // セッション作成
  const token = await getOrCreateSessionToken();
  await createSession(supabase, token, user.id);

  redirect('/');
}

// ── ログイン ──────────────────────────────────────────────────
export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  });

  if (!parsed.success) {
    errorRedirect('/login', 'メールアドレスとパスワードを入力してください。');
  }

  const { email, password } = parsed.data;
  const supabase = getServiceSupabase();

  // ブルートフォース対策: 同一IPからのログイン試行を1分に10回までに制限
  const ip = await clientIp();
  const rl = await checkRateLimit(supabase, { key: `login:${ip}`, maxRequests: 10, windowSeconds: 60 });
  if (!rl.allowed) {
    errorRedirect('/login', 'ログインの試行が多すぎます。しばらくしてからお試しください。');
  }

  const user = await findUserByEmail(supabase, email);
  if (!user) {
    errorRedirect('/login', 'メールアドレスまたはパスワードが正しくありません。');
  }

  // LINE 専用ユーザー（password_hash が null）はメールログイン不可
  if (!user.password_hash) {
    errorRedirect('/login', 'このアカウントはLINEでログインしてください。');
  }

  const ok = await verifyPassword(password, user.password_hash as string);
  if (!ok) {
    errorRedirect('/login', 'メールアドレスまたはパスワードが正しくありません。');
  }

  // ブロック済みユーザーはログイン不可
  if (user.is_blocked === true) {
    errorRedirect('/login', 'このアカウントはブロックされています。');
  }

  // セッション作成
  const token = await getOrCreateSessionToken();
  await createSession(supabase, token, user.id as string);
  await touchLastLogin(supabase, user.id as string);

  redirect('/');
}

// ── ログアウト ────────────────────────────────────────────────
export async function logoutAction() {
  const token = await getSessionToken();
  if (token) {
    const supabase = getServiceSupabase();
    await deleteSession(supabase, token);
  }
  await clearSessionToken();
  redirect('/login');
}
