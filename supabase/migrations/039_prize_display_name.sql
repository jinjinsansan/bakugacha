-- 当選品ボックスやガチャ結果に表示する賞品名を商品タイトルとは別に設定可能にする
ALTER TABLE gacha_products
  ADD COLUMN IF NOT EXISTS prize_display_name TEXT;
