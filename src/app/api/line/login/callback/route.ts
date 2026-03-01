import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';
import { getServiceSupabase } from '@/lib/supabase/service';
import { findUserByLineId, createLineUser, touchLastLogin } from '@/lib/data/users';
import { createSession } from '@/lib/data/session';
import { getOrCreateSessionToken } from '@/lib/session/cookie';

type LineTokenResponse = {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type: string;
};

type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<LineTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LINE token exchange failed: ${response.status} ${text}`);
  }
  return (await response.json()) as LineTokenResponse;
}

async function fetchLineProfile(accessToken: string): Promise<LineProfile> {
  const response = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LINE profile fetch failed: ${response.status} ${text}`);
  }
  return (await response.json()) as LineProfile;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  if (errorParam) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('LINEでの承認がキャンセルされました。')}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('LINE認証エラーが発生しました。')}`);
  }

  const supabase = getServiceSupabase();

  // state 検証
  const { data: stateRow, error: stateError } = await supabase
    .from('line_link_states')
    .select('*')
    .eq('state', state)
    .maybeSingle();

  if (stateError || !stateRow) {
    console.error('LINE state not found', stateError);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('LINE認証エラーが発生しました。')}`);
  }

  const { LINE_LOGIN_CHANNEL_ID, LINE_LOGIN_CHANNEL_SECRET } = getServerEnv();
  if (!LINE_LOGIN_CHANNEL_ID || !LINE_LOGIN_CHANNEL_SECRET) {
    console.error('LINE login env is not fully configured');
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('LINE連携は現在準備中です。')}`);
  }

  try {
    const redirectUri = `${origin}/api/line/login/callback`;
    const token = await exchangeCodeForToken(code, redirectUri, LINE_LOGIN_CHANNEL_ID, LINE_LOGIN_CHANNEL_SECRET);
    const profile = await fetchLineProfile(token.access_token);
    const lineUserId = profile.userId;

    if (!lineUserId) {
      throw new Error('LINE profile missing userId');
    }

    const existingUserId: string | null = stateRow.user_id ?? null;

    // ─── パターン3: ログイン済みユーザーが LINE 連携 ───
    if (existingUserId) {
      // 重複チェック（他ユーザーが同じLINEアカウントで連携済み）
      const { data: duplicate } = await supabase
        .from('line_link_states')
        .select('id, user_id, rewarded_at')
        .eq('line_user_id', lineUserId)
        .not('rewarded_at', 'is', null)
        .maybeSingle();

      if (duplicate) {
        if (duplicate.user_id !== existingUserId) {
          return NextResponse.redirect(`${origin}/mypage/line?status=line-user-already-linked`);
        }
        return NextResponse.redirect(`${origin}/mypage/line?status=already-linked`);
      }

      // app_users に LINE 情報を保存
      await supabase
        .from('app_users')
        .update({
          line_user_id: lineUserId,
          line_display_name: profile.displayName,
          line_picture_url: profile.pictureUrl ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUserId);

      // 連携完了記録
      await supabase
        .from('line_link_states')
        .update({ line_user_id: lineUserId, rewarded_at: new Date().toISOString() })
        .eq('id', stateRow.id);

      return NextResponse.redirect(`${origin}/home`);
    }

    // ─── パターン1 & 2: 未認証 OAuth（LINE ログイン / LINE 登録）───
    const existingLineUser = await findUserByLineId(supabase, lineUserId);

    if (existingLineUser) {
      // パターン2: 既存 LINE ユーザーとしてログイン
      const sessionToken = await getOrCreateSessionToken();
      await createSession(supabase, sessionToken, existingLineUser.id as string);
      await touchLastLogin(supabase, existingLineUser.id as string);

      // state 行にも記録
      await supabase
        .from('line_link_states')
        .update({ line_user_id: lineUserId, rewarded_at: new Date().toISOString() })
        .eq('id', stateRow.id);

      return NextResponse.redirect(`${origin}/home`);
    }

    // パターン1: 新規ユーザー作成（LINE 経由、コインは0）
    const newUser = await createLineUser(supabase, {
      lineUserId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      initialCoins: 0,
    });

    // セッション作成
    const sessionToken = await getOrCreateSessionToken();
    await createSession(supabase, sessionToken, newUser.id as string);

    // state 行に記録
    await supabase
      .from('line_link_states')
      .update({ user_id: newUser.id, line_user_id: lineUserId, rewarded_at: new Date().toISOString() })
      .eq('id', stateRow.id);

    return NextResponse.redirect(`${origin}/home`);
  } catch (error) {
    console.error('LINE callback error', error);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('LINE認証中にエラーが発生しました。')}`);
  }
}
