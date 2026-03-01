import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { findUserByLineId, createLineUser, touchLastLogin } from '@/lib/data/users';
import { createSession } from '@/lib/data/session';
import { getOrCreateSessionToken } from '@/lib/session/cookie';

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
    const { accessToken } = await request.json();
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

    // 既存ユーザーをチェック
    const existingUser = await findUserByLineId(supabase, lineUserId);

    if (existingUser) {
      // 既存ユーザー → セッション作成
      const sessionToken = await getOrCreateSessionToken();
      await createSession(supabase, sessionToken, existingUser.id as string);
      await touchLastLogin(supabase, existingUser.id as string);

      // LINE情報を最新に更新
      await supabase
        .from('app_users')
        .update({
          line_display_name: profile.displayName,
          line_picture_url: profile.pictureUrl ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id);

      return NextResponse.json({ ok: true });
    }

    // 新規ユーザー作成
    const newUser = await createLineUser(supabase, {
      lineUserId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      initialCoins: 0,
    });

    const sessionToken = await getOrCreateSessionToken();
    await createSession(supabase, sessionToken, newUser.id as string);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[LIFF login] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
