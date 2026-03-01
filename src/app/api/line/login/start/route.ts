import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { getServerEnv } from '@/lib/env';

export async function GET(request: NextRequest) {
  const supabase = getServiceSupabase();
  const user = await getUserFromSession(supabase);
  const origin = new URL(request.url).origin;

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { LINE_LOGIN_CHANNEL_ID } = getServerEnv();
  if (!LINE_LOGIN_CHANNEL_ID) {
    console.error('LINE_LOGIN_CHANNEL_ID is not configured');
    return NextResponse.redirect(`${origin}/mypage/line?status=line-login-disabled`);
  }

  const state = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');

  const { error } = await supabase
    .from('line_link_states')
    .insert({ user_id: user.id, state, nonce });

  if (error) {
    console.error('Failed to create LINE link state', error);
    return NextResponse.redirect(`${origin}/mypage/line?status=line-login-error`);
  }

  const redirectUri = `${origin}/api/line/login/callback`;
  const authorizeUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', LINE_LOGIN_CHANNEL_ID);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('scope', 'profile openid');
  authorizeUrl.searchParams.set('nonce', nonce);
  authorizeUrl.searchParams.set('prompt', 'consent');
  authorizeUrl.searchParams.set('bot_prompt', 'normal');

  return NextResponse.redirect(authorizeUrl.toString());
}
