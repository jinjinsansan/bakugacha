import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/lib/env';

let serviceClient: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient {
  if (!serviceClient) {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
    serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return serviceClient;
}
