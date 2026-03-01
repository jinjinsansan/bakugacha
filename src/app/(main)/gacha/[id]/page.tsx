import { notFound } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase/service';
import { fetchProductById } from '@/lib/data/gacha';
import { getUserFromSession } from '@/lib/data/session';
import { GachaPlayButton } from '@/components/gacha/GachaPlayButton';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GachaDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = getServiceSupabase();

  const [row, user] = await Promise.all([
    fetchProductById(supabase, id),
    getUserFromSession(supabase),
  ]);

  if (!row) notFound();

  const price: number = row.price ?? 0;
  const title: string = row.title ?? '';
  const imageUrl: string = row.image_url ?? '';
  const description: string = row.description ?? '';
  const stockTotal: number | null = row.stock_total ?? null;
  const stockRemaining: number | null = row.stock_remaining ?? null;
  const isSoldOut = row.status === 'sold-out';
  const isLoggedIn = !!user;

  const stockPct =
    stockTotal && stockRemaining != null
      ? Math.round(((stockTotal - stockRemaining) / stockTotal) * 100)
      : null;

  return (
    <main className="min-h-screen pb-20 pt-6 md:pt-10" style={{ background: 'var(--bg-base)' }}>
      {/* ヒーロー画像 */}
      <div className="relative w-full aspect-video max-w-lg mx-auto overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-contain"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-8xl"
            style={{ background: row.thumbnail_gradient ?? 'linear-gradient(135deg,#1a1a2e,#16213e)' }}
          >
            {row.thumbnail_emoji ?? '🎰'}
          </div>
        )}

        {/* SOLDOUTバッジ */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-white font-black text-3xl tracking-widest border-4 border-white px-6 py-2 rotate-[-15deg]">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 mt-6 flex flex-col gap-6">
        {/* タイトル・価格 */}
        <div>
          <h1 className="text-xl font-black text-white leading-snug">{title}</h1>
          <p className="mt-2 text-2xl font-black" style={{ color: 'var(--gold)' }}>
            {price === 0 ? '無料' : `🪙 ${price.toLocaleString()} コイン`}
          </p>
        </div>

        {/* 在庫バー */}
        {stockTotal != null && stockRemaining != null && (
          <div className="card-premium p-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm text-white/70">
              <span>残り回数</span>
              <span>
                {stockRemaining.toLocaleString()}回 / {stockTotal.toLocaleString()}回
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${stockPct}%`,
                  background: (stockPct ?? 0) > 80
                    ? '#ca8a04'
                    : (stockPct ?? 0) > 50
                    ? '#eab308'
                    : '#22c55e',
                }}
              />
            </div>
          </div>
        )}

        {/* 説明文 */}
        {description && (
          <div className="card-premium p-4">
            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{description}</p>
          </div>
        )}

        {/* ガチャボタン */}
        {!isSoldOut && (
          <GachaPlayButton
            productId={id}
            productTitle={title}
            price={price}
            isLoggedIn={isLoggedIn}
            prizeImageUrl={imageUrl || undefined}
            prizeEmoji={row.thumbnail_emoji ?? undefined}
            prizeGradient={row.thumbnail_gradient ?? undefined}
          />
        )}

        {/* ルール説明 */}
        <div className="card-premium p-4 flex flex-col gap-2">
          <h2 className="text-sm font-bold" style={{ color: 'var(--gold)' }}>遊び方</h2>
          <ul className="text-xs text-white/60 space-y-1 list-disc list-inside">
            <li>「ガチャを引く」ボタンを押すとカウントダウンチャレンジが始まります</li>
            <li>演出が終わると当選・落選が確定します</li>
            <li>当選した場合は後日事務局よりご連絡いたします</li>
            <li>コインは事前にマイページからチャージできます</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
