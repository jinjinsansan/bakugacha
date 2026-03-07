-- どんでんパターン個別ウェイト列を追加
ALTER TABLE keiba_settings
  ADD COLUMN IF NOT EXISTS donten_pattern_weights JSONB DEFAULT '{}';
