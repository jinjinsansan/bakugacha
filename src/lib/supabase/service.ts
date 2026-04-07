import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { getServerEnv } from '@/lib/env';

// React.cache() でリクエストスコープにスコープを限定し並列リクエスト間の状態混在を防ぐ
export const getServiceSupabase = cache((): SupabaseClient => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
});
