import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { findUserByLineId, createLineUser, touchLastLoginFireAndForget } from '@/lib/data/users';
import { createSession } from '@/lib/data/session';
import { getOrCreateSessionToken } from '@/lib/session/cookie';
import { processReferral } from '@/lib/data/referral';

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

    // アクセストークンでLINEプロフィールを取得（トークン検証を兼ねる）
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

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
