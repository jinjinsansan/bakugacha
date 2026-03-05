import { NextResponse } from 'next/server';
import { fetchKeibaSettings } from '@/lib/data/keiba-gacha';
import { fetchProductById } from '@/lib/data/gacha';
import { getUserFromSession } from '@/lib/data/session';
import { deductCoins } from '@/lib/data/coins';
import { getServiceSupabase } from '@/lib/supabase/service';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import {
  pickCharacter,
  pickCourse,
  getCharaWinRate,
  generateScenario,
} from '@/lib/keiba-gacha/scenarios';

type KeibaQuality = 'high' | 'low';

function normalizeQuality(raw: unknown): KeibaQuality {
  return raw === 'low' ? 'low' : 'high';
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const productId = typeof body?.productId === 'string' ? body.productId : null;
    const quality = normalizeQuality(body?.quality);

    const supabase = getServiceSupabase();
    const settings = await fetchKeibaSettings(supabase);

    if (!settings.isActive) {
      return NextResponse.json(
        { success: false, error: '競馬ガチャは現在準備中です。' },
        { status: 503 },
      );
    }

    // 商品・ユーザー情報を並行取得
    const [product, user] = await Promise.all([
      productId ? fetchProductById(supabase, productId) : Promise.resolve(null),
      getUserFromSession(supabase),
    ]);

    const price: number = product?.price ?? 0;

    // 管理者判定
    const adminLineIds = (process.env.ADMIN_LINE_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const adminEmails  = (process.env.ADMIN_EMAILS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const isAdmin = (!!user?.line_user_id && adminLineIds.includes(user.line_user_id as string))
                 || (!!user?.email && adminEmails.includes(user.email as string));

    // 在庫切れチェック
    if (product && product.stock_remaining != null && product.stock_remaining <= 0) {
      return NextResponse.json(
        { success: false, error: 'この商品は売り切れです。' },
        { status: 400 },
      );
    }

    // コイン不足チェック（管理者はスキップ）
    if (!isAdmin && price > 0) {
      if (!user) {
        return NextResponse.json({ success: false, error: 'ログインが必要です。' }, { status: 401 });
      }
      const userCoins = (user.coins as number) ?? 0;
      if (userCoins < price) {
        return NextResponse.json(
          { success: false, error: `コインが不足しています。（必要: ${price}、所持: ${userCoins}）` },
          { status: 400 },
        );
      }
    }

    // 1. キャラ抽選
    const chara = pickCharacter(settings);

    // 2. キャラ別当たり確率を取得
    const charaWinRate = getCharaWinRate(chara.id, settings);

    // 3. 連続ハズレ強制当たり判定
    let forcedWin = false;
    if (user && settings.chainLoseThreshold > 0) {
      const { data: recentResults } = await supabase
        .from('gacha_results')
        .select('result')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(settings.chainLoseThreshold);
      if (
        recentResults &&
        recentResults.length >= settings.chainLoseThreshold &&
        recentResults.every((r: { result: string }) => r.result === 'loss')
      ) {
        forcedWin = true;
      }
    }

    // 4. 勝敗決定（キャラ別当たり確率適用）
    const isWin = forcedWin || Math.random() * 100 < charaWinRate;

    // 5. コース抽選（馬親父=01固定、他=重み付き抽選）
    const course = pickCourse(chara.id, settings);

    // 6. シナリオ生成（タイトル動画選択 + ステップ配列）
    const scenario = generateScenario(isWin, chara.id, course.id);

    // 7. コイン消費 & 結果保存
    if (user && productId) {
      const savePromises: Promise<unknown>[] = [];

      if (!isAdmin && price > 0) {
        savePromises.push(
          deductCoins(supabase, user.id as string, price, `ガチャ: ${product?.title ?? productId}`).catch(console.error),
        );
      }

      savePromises.push(
        Promise.resolve(
          supabase.from('gacha_results').insert({
            user_id: user.id,
            product_id: productId,
            result: isWin ? 'win' : 'loss',
            prize_name: product?.title ?? productId,
            coins_spent: price,
          }),
        ).then(({ error }) => { if (error) console.error('[gacha_results insert]', error); }),
      );

      await Promise.all(savePromises);

      // 在庫デクリメント & sold-out 自動化
      if (product && product.stock_remaining != null) {
        const newRemaining = (product.stock_remaining as number) - 1;
        const update: Record<string, unknown> = { stock_remaining: newRemaining };
        if (newRemaining <= 0) update.status = 'sold-out';
        await supabase
          .from('gacha_products')
          .update(update)
          .eq('id', productId);
      }
    }

    const baseFolder = quality === 'low' ? 'keiba-mobile' : 'keiba';

    return NextResponse.json({
      success: true,
      isWin: scenario.isWin,
      charaId: scenario.charaId,
      courseId: scenario.courseId,
      steps: scenario.steps,
      videoBasePath: buildGachaAssetPath(baseFolder),
    });
  } catch (error) {
    console.error('[keiba-gacha/play]', error);
    return NextResponse.json(
      { success: false, error: '抽選に失敗しました。しばらくして再試行してください。' },
      { status: 500 },
    );
  }
}
