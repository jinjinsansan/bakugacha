import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserIdFromSessionToken } from '@/lib/data/users';
import { getSessionToken } from '@/lib/session/cookie';
import { getServerEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = getServiceSupabase();
  const origin = new URL(request.url).origin;

  // セッションから user_id のみ取得 (app_users のフルフェッチを回避)
  const sessionToken = await getSessionToken();
  const userId = sessionToken ? await getUserIdFromSessionToken(supabase, sessionToken) : null;

  const { LINE_LOGIN_CHANNEL_ID } = getServerEnv();
  if (!LINE_LOGIN_CHANNEL_ID) {
    console.error('LINE_LOGIN_CHANNEL_ID is not configured');
    const fallback = userId ? '/mypage/line' : '/login';
    return NextResponse.redirect(`${origin}${fallback}?status=line-login-disabled`);
  }

  const state = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');

  // user_id は未認証の場合 null（LINEログイン / LINE登録）
  const { error } = await supabase
    .from('line_link_states')
    .insert({ user_id: userId, state, nonce });

  if (error) {
    console.error('Failed to create LINE link state', error);
    const fallback = userId ? '/mypage/line' : '/login';
    return NextResponse.redirect(`${origin}${fallback}?status=line-login-error`);
  }

  const redirectUri = `${origin}/api/line/login/callback`;
  const authorizeUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', LINE_LOGIN_CHANNEL_ID);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('scope', 'profile openid');
  authorizeUrl.searchParams.set('nonce', nonce);
  // prompt=consent を除去: iOSでLINEアプリが起動せずブラウザログインになる原因
  authorizeUrl.searchParams.set('bot_prompt', 'normal');

  return NextResponse.redirect(authorizeUrl.toString());
}
