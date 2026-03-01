export function getServerEnv() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase server environment variables');
  }

  return {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
    LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    LINE_LOGIN_CHANNEL_ID: process.env.LINE_LOGIN_CHANNEL_ID,
    LINE_LOGIN_CHANNEL_SECRET: process.env.LINE_LOGIN_CHANNEL_SECRET,
  };
}

export function getPublicEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001',
    NEXT_PUBLIC_LINE_OFFICIAL_URL: process.env.NEXT_PUBLIC_LINE_OFFICIAL_URL ?? '',
  };
}
