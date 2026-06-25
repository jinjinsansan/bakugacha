import Link from 'next/link';
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

const categoryStyle: Record<string, { bg: string; color: string }> = {
  'ポケモン':  { bg: 'rgba(32,96,240,0.7)',  color: '#93c5fd' },
  'ワンピース': { bg: 'rgba(180,28,28,0.7)',  color: '#fca5a5' },
  '遊戯王':   { bg: 'rgba(109,40,217,0.7)', color: '#d8b4fe' },
  'ギフト券': { bg: 'rgba(180,100,0,0.7)',  color: '#fcd34d' },
  'ゲーム機': { bg: 'rgba(180,20,20,0.7)',  color: '#fca5a5' },
};

function formatJst(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function ProductCard({ product }: ProductCardProps) {
  const isSoldOut = product.status === 'sold-out';
  const availStat = product.availabilityStatus ?? 'open';
  const isBeforeOpen = availStat === 'before_open';
  const isAfterClose = availStat === 'after_close';
  const cat = product.category ? categoryStyle[product.category] : null;

  return (
    <div className="card-premium relative overflow-hidden rounded-xl sm:rounded-2xl">

      {/* 価格リボン */}
      {product.price !== null && (
        <div
          className="absolute top-3 right-3 z-10 text-xs font-black px-2.5 py-1 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #ffe08a, #ffcb45)',
            color: '#3a2a06',
            boxShadow: '0 2px 8px rgba(255,203,69,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
            letterSpacing: '0.03em',
          }}
        >
          {product.price === 0 ? 'FREE' : `¥${product.price.toLocaleString()}`}
        </div>
      )}

      {/* カテゴリバッジ */}
      {cat && (
        <div
          className="absolute top-3 left-3 z-10 text-xs font-bold px-2 py-0.5 rounded-full tracking-wide"
          style={{ background: cat.bg, color: cat.color, backdropFilter: 'blur(4px)' }}
        >
          {product.category}
        </div>
      )}

      {/* サムネイル */}
      <Link href={product.href}>
        <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
          {product.imageSrc ? (
            <img
              src={product.imageSrc}
              alt={product.thumbnailLabel || product.title}
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${isSoldOut ? 'grayscale brightness-50' : ''}`}
            />
          ) : (
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center gap-3 ${isSoldOut ? 'grayscale brightness-40' : ''}`}
              style={{ background: product.thumbnailGradient || 'linear-gradient(135deg, #0d0d20, #1a1a35)' }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)' }}
              />
              {product.thumbnailEmoji && (
                <span className="text-5xl drop-shadow-2xl relative z-10">{product.thumbnailEmoji}</span>
              )}
              {product.thumbnailLabel && (
                <span
                  className="relative z-10 text-white font-black text-sm tracking-wider text-center px-4"
                  style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}
                >
                  {product.thumbnailLabel}
                </span>
              )}
            </div>
          )}

          {/* 画像下部グラデーション */}
          {product.imageSrc && (
            <div
              className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}
            />
          )}

          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span
                className="text-xs font-black tracking-widest px-4 py-1.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.8)', color: '#888', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                SOLD OUT
              </span>
            </div>
          )}

          {isBeforeOpen && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/60 gap-2">
              <span className="text-xs font-black tracking-widest px-4 py-1.5 rounded-full"
                style={{ background: 'rgba(255,203,69,0.9)', color: '#3a2a06' }}>
                受付前
              </span>
              {product.opensAt && (
                <span className="text-[10px] text-yellow-300/80 font-bold">
                  {formatJst(product.opensAt)} 開始
                </span>
              )}
            </div>
          )}

          {isAfterClose && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60">
              <span className="text-xs font-black tracking-widest px-4 py-1.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.8)', color: '#888', border: '1px solid rgba(255,255,255,0.1)' }}>
                受付終了
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* 情報 */}
      <div className="p-3 sm:p-4">
        <p className="text-sm font-bold text-gray-200 leading-snug mb-4 tracking-wide line-clamp-2">
          {product.title}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            {product.price !== null ? (
              <>
                <span className="text-base">🪙</span>
                <span className="text-xl font-black text-white">{product.price.toLocaleString()}</span>
                <span className="text-xs text-gray-500">/1回</span>
              </>
            ) : (
              <div className="h-7 w-20 rounded-lg bg-white/5" />
            )}
          </div>

          <div className="flex-1 ml-4">
            {product.stock?.text ? (
              <>
                <p className="text-xs text-gray-500 text-right mb-1">{product.stock.text}</p>
                <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <div className={product.stock.progressClass} />
                </div>
              </>
            ) : product.stock?.remaining ? (
              <p className="text-xs text-right" style={{ color: '#ffcb45' }}>残りあり</p>
            ) : null}
          </div>
        </div>

        {/* ボタン */}
        {isBeforeOpen ? (
          <Link href={product.href}
            className="flex items-center justify-center w-full h-10 rounded-xl text-xs font-black tracking-wider"
            style={{ background: 'rgba(255,203,69,0.15)', border: '1px solid rgba(255,203,69,0.4)', color: '#ffe08a' }}>
            詳細・カウントダウンを見る →
          </Link>
        ) : isAfterClose ? (
          <div className="flex items-center justify-center w-full h-10 rounded-xl text-xs font-bold text-white/30"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            受付終了
          </div>
        ) : product.buttons ? (
          <div className="flex gap-2">
            {product.buttons.map((label, i) => {
              const count = label.startsWith('100') ? 100 : label.startsWith('10') ? 10 : 1;
              return (
                <Link
                  key={i}
                  href={`${product.href}?count=${count}`}
                  className={`text-xs font-bold flex basis-0 grow h-10 items-center justify-center rounded-xl tracking-wider ${
                    i === 0 ? 'btn-gold' : i === 1 ? 'btn-silver' : 'btn-bronze'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="basis-0 grow h-10 rounded-xl bg-white/5" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
