/**
 * 商品データ初期投入スクリプト
 * 実行: npx tsx scripts/seed-products.ts
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jetyojivnweyakuqozmj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldHlvaml2bndleWFrdXFvem1qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI3MjI2OSwiZXhwIjoyMDg3ODQ4MjY5fQ.s2a-bizywGwLy4-Y6zTc3b_2qngSZksJf98YyJIqgeo',
  { auth: { persistSession: false } },
);

const PHOTOS: Record<string, string> = {
  pokemon1:  'https://picsum.photos/seed/poke1/640/360',
  pokemon2:  'https://picsum.photos/seed/poke2/640/360',
  pokemon3:  'https://picsum.photos/seed/poke3/640/360',
  amazon1:   'https://picsum.photos/seed/amzn1/640/360',
  amazon2:   'https://picsum.photos/seed/amzn2/640/360',
  yugioh1:   'https://picsum.photos/seed/yugi1/640/360',
  yugioh2:   'https://picsum.photos/seed/yugi2/640/360',
  onepiece1: 'https://picsum.photos/seed/op1/640/360',
  nintendo1: 'https://picsum.photos/seed/nntd1/640/360',
  nintendo2: 'https://picsum.photos/seed/nntd2/640/360',
  soldout1:  'https://picsum.photos/seed/sold1/640/360',
  soldout2:  'https://picsum.photos/seed/sold2/640/360',
};

const products = [
  // ── 登録後限定（is_featured = true）──────────────────────────
  {
    id: 'lwfwZtxr', title: 'ようこそ爆ガチャへ！無料でお試しガチャ',
    category: 'ポケモン', price: 0, image_url: PHOTOS.pokemon1,
    thumbnail_gradient: 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #f9a825 100%)',
    thumbnail_emoji: '🎴', thumbnail_label: 'ポケモンカードガチャ',
    is_featured: true, status: 'active', sort_order: 1,
  },
  {
    id: 'GPPMQ68r', title: '新規登録後24時間限定！ノーリスクで大当たりを狙え！',
    category: 'ギフト券', price: 50, image_url: PHOTOS.amazon1,
    thumbnail_gradient: 'linear-gradient(135deg, #1a1a2e 0%, #0d47a1 60%, #ff6f00 100%)',
    thumbnail_emoji: '🎁', thumbnail_label: 'Amazonギフト券ガチャ',
    is_featured: true, status: 'active', sort_order: 2,
  },
  {
    id: 'qBha4P5C', title: '🔥登録後24時間限定🔥 ノーリスク3パック確定ガチャ',
    category: '遊戯王', price: 1000, image_url: PHOTOS.yugioh1,
    thumbnail_gradient: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 50%, #f57f17 100%)',
    thumbnail_emoji: '⚔️', thumbnail_label: '遊戯王ガチャ',
    is_featured: true, status: 'active', sort_order: 3,
  },
  {
    id: 'Qv1wgsj1', title: '🔥登録後24時間限定🔥 アド確定ガチャ！プレミアムver',
    category: 'ゲーム機', price: 5000, image_url: PHOTOS.nintendo1,
    thumbnail_gradient: 'linear-gradient(135deg, #b71c1c 0%, #c62828 40%, #e53935 100%)',
    thumbnail_emoji: '🕹️', thumbnail_label: '任天堂スイッチガチャ',
    is_featured: true, status: 'active', sort_order: 4,
  },
  {
    id: 'KCyfdwoU', title: '🔥登録後24時間限定🔥 アド確定ガチャ！！超豪華版',
    category: 'ワンピース', price: 10000, image_url: PHOTOS.onepiece1,
    thumbnail_gradient: 'linear-gradient(135deg, #880e4f 0%, #c2185b 50%, #1a1a1a 100%)',
    thumbnail_emoji: '🏴‍☠️', thumbnail_label: 'ワンピースカードガチャ',
    is_featured: true, status: 'active', sort_order: 5,
  },
  {
    id: 'lWFKzZkk', title: '登録後24時間限定！1等山盛りフィーバー',
    category: 'ギフト券', price: 20, image_url: PHOTOS.amazon2,
    thumbnail_gradient: 'linear-gradient(135deg, #0d1b4b 0%, #1565c0 60%, #ff8f00 100%)',
    thumbnail_emoji: '💰', thumbnail_label: 'Amazonギフト券ガチャ',
    is_featured: true, status: 'active', sort_order: 6,
    stock_total: 2000000, stock_remaining: 464442,
  },
  {
    id: '9s4Ls0xX', title: '登録後24時間限定 クルーンニブイチ',
    category: 'ポケモン', price: 250, image_url: PHOTOS.pokemon2,
    thumbnail_gradient: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #f3e5f5 100%)',
    thumbnail_emoji: '🎴', thumbnail_label: 'ポケモンカードガチャ',
    is_featured: true, status: 'active', sort_order: 7,
    stock_total: 1000000, stock_remaining: 123370,
  },
  {
    id: '4lBCY8LB', title: '登録後1週間限定 超豪華GETチャレンジ',
    category: 'ゲーム機', price: 4170, image_url: PHOTOS.nintendo2,
    thumbnail_gradient: 'linear-gradient(135deg, #7f0000 0%, #b71c1c 50%, #37474f 100%)',
    thumbnail_emoji: '🕹️', thumbnail_label: '任天堂スイッチガチャ',
    is_featured: true, status: 'active', sort_order: 8,
    stock_total: 840, stock_remaining: 542,
  },
  // ── 通常ガチャ（is_featured = false）─────────────────────────
  {
    id: 'MwEqzSw6', title: '1コインログインボーナス',
    category: 'ポケモン', price: 1, image_url: PHOTOS.pokemon3,
    thumbnail_gradient: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #ffd54f 100%)',
    thumbnail_emoji: '✨', thumbnail_label: 'ポケモンカードガチャ',
    is_featured: false, status: 'active', sort_order: 10,
  },
  {
    id: 'IPereEFU', title: '100連全回転フェスティバル',
    category: '遊戯王', price: 69, image_url: PHOTOS.yugioh2,
    thumbnail_gradient: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 50%, #bf360c 100%)',
    thumbnail_emoji: '⚔️', thumbnail_label: '遊戯王ガチャ',
    is_featured: false, status: 'active', sort_order: 11,
    stock_total: 4000000, stock_remaining: 500536,
  },
  {
    id: 'zX5vGF9E', title: '超大当たりフェスティバル',
    category: 'ギフト券', price: 69, image_url: PHOTOS.amazon1,
    thumbnail_gradient: 'linear-gradient(135deg, #0a1628 0%, #0d47a1 50%, #ff6f00 100%)',
    thumbnail_emoji: '🎁', thumbnail_label: 'Amazonギフト券ガチャ',
    is_featured: false, status: 'active', sort_order: 12,
    stock_total: 2600000, stock_remaining: 89915,
  },
  {
    id: 'TOJqx73j', title: '任天堂スイッチ 超豪華パック',
    category: 'ゲーム機', price: 0, image_url: PHOTOS.soldout1,
    thumbnail_gradient: 'linear-gradient(135deg, #37474f 0%, #546e7a 100%)',
    thumbnail_emoji: '🕹️', thumbnail_label: '任天堂スイッチガチャ',
    is_featured: false, status: 'sold-out', sort_order: 13,
  },
  {
    id: 'ihzkS5KC', title: 'オールPSA10 超豪華パック',
    category: '遊戯王', price: 0, image_url: PHOTOS.soldout2,
    thumbnail_gradient: 'linear-gradient(135deg, #37474f 0%, #455a64 100%)',
    thumbnail_emoji: '⚔️', thumbnail_label: '遊戯王ガチャ',
    is_featured: false, status: 'sold-out', sort_order: 14,
  },
];

async function seed() {
  console.log('🌱 商品データ投入開始...\n');

  const { error } = await supabase
    .from('gacha_products')
    .upsert(products, { onConflict: 'id' });

  if (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }

  console.log(`✅ ${products.length}件の商品データを投入しました`);
}

seed().catch(console.error);
