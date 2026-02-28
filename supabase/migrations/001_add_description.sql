-- gacha_products に説明文カラムを追加
-- Supabase SQL Editor で実行してください
ALTER TABLE gacha_products ADD COLUMN IF NOT EXISTS description TEXT;
