import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { verifyCard } from '@/lib/data/keiba-cards';
import { verifyRaiseCard } from '@/lib/data/raise-cards';
import { KEIBA_CARD_MAP } from '@/lib/keiba-gacha/cards';
import { getCardDef } from '@/lib/raise-gacha/scenarios';
import type { RaiseCharacterId } from '@/lib/raise-gacha/types';

/** 外部買取サイト用検証API（認証不要） */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const serial = searchParams.get('serial');
  const code = searchParams.get('code');

  if (!serial || !code) {
    return NextResponse.json({ valid: false, error: 'serial と code は必須です。' }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  // シリアル番号のプレフィックスでカードタイプを判別
  if (serial.startsWith('KG')) {
    // 競馬ガチャカード
    const result = await verifyCard(supabase, serial, code);
    if (!result?.valid) {
      return NextResponse.json({ valid: false });
    }

    const def = result.charaId ? KEIBA_CARD_MAP.get(result.charaId) : null;

    return NextResponse.json({
      valid: true,
      cardType: 'keiba',
      charaId: result.charaId,
      name: def?.name ?? result.charaId,
      rarity: def?.rarity ?? 'unknown',
      serialNumber: result.serialNumber,
      status: result.status,
    });
  } else if (serial.startsWith('RK') || serial.startsWith('RS')) {
    // 来世ガチャカード
    const result = await verifyRaiseCard(supabase, serial, code);
    if (!result?.valid) {
      return NextResponse.json({ valid: false });
    }

    const characterId = result.characterId as RaiseCharacterId | undefined;
    const def = characterId && result.cardId ? getCardDef(characterId, result.cardId) : null;

    return NextResponse.json({
      valid: true,
      cardType: serial.startsWith('RK') ? 'raise_kenta' : 'raise_shoichi',
      characterId: result.characterId,
      cardId: result.cardId,
      name: def?.name ?? result.cardId,
      rarity: result.rarity,
      serialNumber: result.serialNumber,
      status: result.status,
    });
  }

  return NextResponse.json({ valid: false, error: '不明なシリアル形式です。' });
}
