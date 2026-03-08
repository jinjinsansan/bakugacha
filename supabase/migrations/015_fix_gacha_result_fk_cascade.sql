-- 015: gacha_results 削除時に keiba_cards / raise_cards の参照を NULL にセット
-- 元の FK (ON DELETE 未指定) を DROP して ON DELETE SET NULL で再作成

ALTER TABLE keiba_cards
  DROP CONSTRAINT IF EXISTS keiba_cards_gacha_result_id_fkey,
  ADD CONSTRAINT keiba_cards_gacha_result_id_fkey
    FOREIGN KEY (gacha_result_id) REFERENCES gacha_results(id) ON DELETE SET NULL;

ALTER TABLE raise_cards
  DROP CONSTRAINT IF EXISTS raise_cards_gacha_result_id_fkey,
  ADD CONSTRAINT raise_cards_gacha_result_id_fkey
    FOREIGN KEY (gacha_result_id) REFERENCES gacha_results(id) ON DELETE SET NULL;
