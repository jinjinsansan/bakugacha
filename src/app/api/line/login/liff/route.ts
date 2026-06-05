import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';
import { getServiceSupabase } from '@/lib/supabase/service';
import { findUserByLineId, createLineUser, touchLastLoginFireAndForget } from '@/lib/data/users';
import { createSession } from '@/lib/data/session';
import { getOrCreateSessionToken } from '@/lib/session/cookie';
import { processReferral } from '@/lib/data/referral';
import { grantCoins } from '@/lib/data/coins';

const LINE_REWARD_COINS = Number(process.env.LINE_REWARD_COINS ?? 300);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

/**
 * LIFF経由のLINEログイン用エンドポイント。
 * クライアント(LIFF SDK)から受け取ったアクセストークンで
 * LINEプロフィールAPIを呼び出してユーザーを認証する。
 */
export async function POST(request: NextRequest) {
  try {
    const { accessToken, referralCode } = await request.json();
    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json({ error: 'Missing access token' }, { status: 400 });
    }

    // ── アクセストークンの発行先チャネル(audience)検証 ──────────────
    // これがないと、別チャネル向けに発行された LINE アクセストークンでも
    // ログインできてしまう(認証バイパス)。LINE の verify API で client_id を確認する。
    const { LINE_LOGIN_CHANNEL_ID } = getServerEnv();
    if (!LINE_LOGIN_CHANNEL_ID) {
      return NextResponse.json({ error: 'LINE連携は現在準備中です。' }, { status: 503 });
    }
    try {
      const verifyRes = await fetch(
        `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(accessToken)}`,
      );
      if (!verifyRes.ok) {
        return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
      }
      const verifyData = (await verifyRes.json()) as { client_id?: string };
      if (verifyData.client_id !== LINE_LOGIN_CHANNEL_ID) {
        console.error('[LIFF login] access token channel mismatch');
        return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
      }
    } catch (e) {
      console.error('[LIFF login] token verify failed:', e);
      return NextResponse.json({ error: 'LINEサーバーへの接続に失敗しました。' }, { status: 503 });
    }

    // アクセストークンでLINEプロフィールを取得（10秒タイムアウト付き）
    const profileController = new AbortController();
    const profileTimeout = setTimeout(() => profileController.abort(), 10000);
    let profileRes: Response;
    try {
      profileRes = await fetch('https://api.line.me/v2/profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: profileController.signal,
      });
    } catch (e) {
      clearTimeout(profileTimeout);
      const isTimeout = e instanceof DOMException && e.name === 'AbortError';
      console.error('[LIFF login] Profile fetch failed:', e);
      return NextResponse.json(
        { error: isTimeout ? 'LINEサーバーへの接続がタイムアウトしました。再試行してください。' : 'ネットワークエラーが発生しました。' },
        { status: 503 },
      );
    }
    clearTimeout(profileTimeout);

    if (!profileRes.ok) {
      console.error('[LIFF login] Profile fetch failed:', profileRes.status);
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
    }

    const profile: LineProfile = await profileRes.json();
    const lineUserId = profile.userId;

    if (!lineUserId) {
      return NextResponse.json({ error: 'Missing LINE user ID' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    // 既存ユーザーをチェック (is_blocked を含む全カラムを取得)
    const existingUser = await findUserByLineId(supabase, lineUserId);

    if (existingUser) {
      // ブロックチェック (既取得データを使用)
      if (existingUser.is_blocked === true) {
        return NextResponse.json({ error: 'アカウントがブロックされています' }, { status: 403 });
      }

      const sessionToken = await getOrCreateSessionToken();
      const userId = existingUser.id as string;

      // セッション作成と LINE 情報更新を並列実行
      await Promise.all([
        createSession(supabase, sessionToken, userId),
        supabase
          .from('app_users')
          .update({
            line_display_name: profile.displayName,
            line_picture_url: profile.pictureUrl ?? null,
            updated_at: now,
          })
          .eq('id', userId),
      ]);

      // last_login と login_history は fire-and-forget
      touchLastLoginFireAndForget(supabase, userId);

      return NextResponse.json({ ok: true });
    }

    // 新規ユーザー作成
    const newUser = await createLineUser(supabase, {
      lineUserId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      initialCoins: 0,
    });

    const newUserId = newUser.id as string;
    const sessionToken = await getOrCreateSessionToken();

    await createSession(supabase, sessionToken, newUserId);

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

    // 紹介コードがあれば紹介処理 (fire-and-forget)
    if (referralCode && typeof referralCode === 'string') {
      processReferral(supabase, newUserId, referralCode).catch((err) => {
        console.warn('[LIFF login] processReferral failed:', err);
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[LIFF login] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
