import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';
import { getServiceSupabase } from '@/lib/supabase/service';
import { findUserByLineId, createLineUser, touchLastLoginFireAndForget } from '@/lib/data/users';
import { createSession, getUserFromSession } from '@/lib/data/session';
import { getOrCreateSessionToken } from '@/lib/session/cookie';
import { processReferral } from '@/lib/data/referral';
import { grantCoins } from '@/lib/data/coins';

const LINE_REWARD_COINS = Number(process.env.LINE_REWARD_COINS ?? 300);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  // state 検証 (必要カラムのみ取得)。rewarded_at IS NULL = 未使用のみ受理(単回使用)。
  const { data: stateRow, error: stateError } = await supabase
    .from('line_link_states')
    .select('id, user_id, referral_code, created_at')
    .eq('state', state)
    .is('rewarded_at', null)
    .maybeSingle();

  if (stateError || !stateRow) {
    console.error('LINE state not found / already used', stateError);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('LINE認証エラーが発生しました。')}`);
  }

  // state 失効チェック: 発行から1時間を超えた state は無効(リプレイ窓の縮小)
  const stateAgeMs = Date.now() - new Date(stateRow.created_at as string).getTime();
  if (stateAgeMs > 60 * 60 * 1000) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('LINE認証の有効期限が切れました。もう一度お試しください。')}`);
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
    const now = new Date().toISOString();

    // ─── パターン3: ログイン済みユーザーが LINE 連携 ───
    if (existingUserId) {
      // 連携フローを開始した本人のセッションであることを確認（強制連携CSRF対策）。
      // 攻撃者が被害者の state を使って連携を完了させることを防ぐ。
      const sessionUser = await getUserFromSession(supabase);
      if (!sessionUser || sessionUser.id !== existingUserId) {
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('セッションが一致しません。もう一度お試しください。')}`);
      }

      // 重複チェック（他ユーザーが同じLINEアカウントで連携済み）
      const { data: duplicate } = await supabase
        .from('line_link_states')
        .select('user_id, rewarded_at')
        .eq('line_user_id', lineUserId)
        .not('rewarded_at', 'is', null)
        .maybeSingle();

      if (duplicate) {
        if (duplicate.user_id !== existingUserId) {
          return NextResponse.redirect(`${origin}/mypage/line?status=line-user-already-linked`);
        }
        return NextResponse.redirect(`${origin}/mypage/line?status=already-linked`);
      }

      // app_users 更新 と line_link_states 更新を並列実行
      await Promise.all([
        supabase
          .from('app_users')
          .update({
            line_user_id: lineUserId,
            line_display_name: profile.displayName,
            line_picture_url: profile.pictureUrl ?? null,
            updated_at: now,
          })
          .eq('id', existingUserId),
        supabase
          .from('line_link_states')
          .update({ line_user_id: lineUserId, rewarded_at: now })
          .eq('id', stateRow.id),
      ]);

      return NextResponse.redirect(`${origin}/`);
    }

    // ─── パターン1 & 2: 未認証 OAuth（LINE ログイン / LINE 登録）───
    // findUserByLineId は is_blocked を含む全カラムを返すので個別クエリは不要
    const existingLineUser = await findUserByLineId(supabase, lineUserId);

    if (existingLineUser) {
      // ブロックチェック (既に取得済みのデータを使用)
      if (existingLineUser.is_blocked === true) {
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('アカウントがブロックされています。')}`);
      }

      // パターン2: 既存 LINE ユーザーとしてログイン
      const sessionToken = await getOrCreateSessionToken();
      const userId = existingLineUser.id as string;

      // セッション作成・state更新を並列実行 (login_history は fire-and-forget)
      await Promise.all([
        createSession(supabase, sessionToken, userId),
        supabase
          .from('line_link_states')
          .update({ line_user_id: lineUserId, rewarded_at: now })
          .eq('id', stateRow.id),
      ]);

      // last_login と login_history は fire-and-forget (レスポンスをブロックしない)
      touchLastLoginFireAndForget(supabase, userId);

      return NextResponse.redirect(`${origin}/`);
    }

    // パターン1: 新規ユーザー作成（LINE 経由、コインは0）
    const newUser = await createLineUser(supabase, {
      lineUserId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      initialCoins: 0,
    });

    const newUserId = newUser.id as string;
    const sessionToken = await getOrCreateSessionToken();

    // セッション作成・state更新を並列実行
    await Promise.all([
      createSession(supabase, sessionToken, newUserId),
      supabase
        .from('line_link_states')
        .update({ user_id: newUser.id, line_user_id: lineUserId, rewarded_at: now })
        .eq('id', stateRow.id),
    ]);

    // LINEフォローボーナス: line_friend_bonus_at を原子的にセットできた時のみ付与する。
    // webhook 等が先に付与済みの場合は 0 件となり、二重付与を防ぐ。
    const { data: bonusRows } = await supabase
      .from('app_users')
      .update({ line_friend_bonus_at: now, updated_at: now })
      .eq('id', newUserId)
      .is('line_friend_bonus_at', null)
      .select('id');

    if (LINE_REWARD_COINS > 0 && bonusRows && bonusRows.length > 0) {
      await grantCoins(supabase, newUserId, LINE_REWARD_COINS, `公式LINE友だち追加ボーナス (+${LINE_REWARD_COINS}コイン)`);
    }

    // 紹介コードがあれば紹介処理 (fire-and-forget でリダイレクトをブロックしない)
    const storedReferralCode = stateRow.referral_code as string | null;
    if (storedReferralCode) {
      processReferral(supabase, newUserId, storedReferralCode).catch((err) => {
        console.warn('[LINE callback] processReferral failed:', err);
      });
    }

    return NextResponse.redirect(`${origin}/`);
  } catch (error) {
    console.error('LINE callback error', error);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('LINE認証中にエラーが発生しました。')}`);
  }
}
