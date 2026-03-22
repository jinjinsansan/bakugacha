import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { fetchExchangeRates } from '@/lib/data/raise-cards';

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  if (!type) {
    return NextResponse.json({ rates: {} });
  }

  const supabase = getServiceSupabase();
  const rates = await fetchExchangeRates(supabase, type);
  return NextResponse.json({ rates });
}
