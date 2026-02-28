import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';

const COIN_PLANS = [
  {
    id: 'plan-100',
    coins: 100,
    price: 110,
    bonus: 0,
    label: 'スターターパック',
    description: 'まずはここから試せる入門パック',
    badge: null,
  },
  {
    id: 'plan-500',
    coins: 500,
    price: 550,
    bonus: 50,
    label: 'スタンダードパック',
    description: '50コインボーナス付き！お得な定番パック',
    badge: '+50ボーナス',
  },
  {
    id: 'plan-1000',
    coins: 1000,
    price: 1100,
    bonus: 200,
    label: 'プレミアムパック',
    description: '200コインボーナス付き！最もお得',
    badge: 'おすすめ',
  },
  {
    id: 'plan-3000',
    coins: 3000,
    price: 3300,
    bonus: 800,
    label: 'VIPパック',
    description: '800コインボーナス付き！ヘビーユーザー向け',
    badge: '+800ボーナス',
  },
];

export default async function PurchasePage() {
  const supabase = getServiceSupabase();
  const user = await getUserFromSession(supabase);
  if (!user) redirect('/login');

  return (
    <div className="max-w-[860px] mx-auto px-4 py-10">
      {/* ヘッダー */}
      <div className="mb-8 text-center">
        <p className="text-[10px] font-bold tracking-[0.4em] text-gold uppercase mb-2">Coin Shop</p>
        <h1 className="text-2xl font-black text-white">コインを購入</h1>
        <p className="text-sm text-gray-500 mt-2">
          現在の残高：
          <span className="text-gold font-black ml-1">
            🪙 {(user.coins as number).toLocaleString()} コイン
          </span>
        </p>
      </div>

      {/* プラン一覧 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {COIN_PLANS.map((plan) => (
          <div
            key={plan.id}
            className="relative rounded-2xl p-6"
            style={{
              background: plan.badge === 'おすすめ'
                ? 'linear-gradient(135deg, #0f0f28, #141430)'
                : '#0a0a1c',
              border: plan.badge === 'おすすめ'
                ? '1px solid rgba(201,168,76,0.4)'
                : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {/* バッジ */}
            {plan.badge && (
              <span
                className="absolute top-4 right-4 text-[10px] font-black px-2.5 py-1 rounded-full"
                style={{
                  background: plan.badge === 'おすすめ'
                    ? 'linear-gradient(135deg, #c9a84c, #8a6e1e)'
                    : 'rgba(74,222,128,0.2)',
                  color: plan.badge === 'おすすめ' ? '#0a0800' : '#4ade80',
                }}
              >
                {plan.badge}
              </span>
            )}

            <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase mb-2">
              {plan.label}
            </p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-black text-white">
                🪙 {plan.coins.toLocaleString()}
              </span>
              {plan.bonus > 0 && (
                <span className="text-sm font-bold" style={{ color: '#4ade80' }}>
                  +{plan.bonus}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-4">{plan.description}</p>

            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-gold">
                ¥{plan.price.toLocaleString()}
              </span>
              <button
                type="button"
                className="btn-gold text-xs px-5 py-2.5 rounded-xl font-black tracking-wider"
                disabled
              >
                購入する（準備中）
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 注意事項 */}
      <div
        className="rounded-xl p-5 text-xs text-gray-500 leading-relaxed"
        style={{ background: '#0a0a1c', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p className="font-bold text-gray-400 mb-2">ご注意</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>コインは購入後のキャンセル・返金はできません</li>
          <li>コインの有効期限はありません</li>
          <li>決済は近日対応予定です</li>
        </ul>
      </div>
    </div>
  );
}
