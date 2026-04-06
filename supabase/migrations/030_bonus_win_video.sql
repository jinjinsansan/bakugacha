-- gacha_products に当選後ボーナス映像URL カラムを追加 (CD2ガチャ専用)
ALTER TABLE gacha_products
  ADD COLUMN IF NOT EXISTS bonus_win_video_url TEXT;
