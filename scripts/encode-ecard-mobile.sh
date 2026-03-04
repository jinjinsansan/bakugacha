#!/bin/bash
# ecard-mobile 軽量動画エンコードスクリプト (WSL上で実行)
# 実行: wsl bash scripts/encode-ecard-mobile.sh

set -e

BASE="/mnt/e/dev/Cusor/bakugatcha/ROYALカード映像やり直し版"
REPLACE="${BASE}/差し替えバージョン"
OUT="/tmp/ecard-mobile"
mkdir -p "$OUT"

# 480p, 700kbps video + 64k audio, faststart (CD2-mobileと同設定)
FFOPTS="-vf scale=-2:480 -c:v libx264 -b:v 700k -maxrate 900k -bufsize 1800k -c:a aac -b:a 64k -movflags +faststart -y"

ok=0
skip=0
fail=0

encode() {
  local src="$1"
  local dst="$2"
  local name=$(basename "$dst")

  if [ -f "$dst" ]; then
    echo "  ⏭  スキップ: $name"
    skip=$((skip+1))
    return 0
  fi

  if [ ! -f "$src" ]; then
    echo "  ❌ ソースなし: $src"
    fail=$((fail+1))
    return 1
  fi

  echo "  🔄 エンコード中: $name"
  ffmpeg -i "$src" $FFOPTS "$dst" 2>/dev/null
  local size=$(du -k "$dst" | cut -f1)
  echo "  ✅ 完了: $name (${size}KB)"
  ok=$((ok+1))
}

echo ""
echo "── ecard-mobile 軽量エンコード開始 ──"
echo ""

# メインフォルダの動画（そのままのファイル名）
echo "── 演出・結果動画 ──"
encode "$BASE/ecard_title.mp4"        "$OUT/ecard_title.mp4"
encode "$BASE/ecard_my_blackout.mp4"  "$OUT/ecard_my_blackout.mp4"
encode "$BASE/ecard_opp_blackout.mp4" "$OUT/ecard_opp_blackout.mp4"
encode "$BASE/ecard_my_card_back.mp4" "$OUT/ecard_my_card_back.mp4"
encode "$BASE/ecard_opp_card_back.mp4" "$OUT/ecard_opp_card_back.mp4"
encode "$BASE/ecard_lose.mp4"         "$OUT/ecard_lose.mp4"
encode "$BASE/ecard_draw.mp4"         "$OUT/ecard_draw.mp4"
encode "$BASE/ecard_donten.mp4"       "$OUT/ecard_donten.mp4"
encode "$BASE/ecard_final_win.mp4"    "$OUT/ecard_final_win.mp4"

# 差し替えバージョンのカード動画（日本語→英語リネーム）
echo ""
echo "── 通常カード動画 ──"
encode "$REPLACE/皇帝自分側青.mp4"     "$OUT/ecard_my_emperor.mp4"
encode "$REPLACE/奴隷自分側青.mp4"     "$OUT/ecard_my_slave.mp4"
encode "$REPLACE/市民自分側青.mp4"     "$OUT/ecard_my_citizen.mp4"
encode "$REPLACE/皇帝相手側赤.mp4"     "$OUT/ecard_opp_emperor.mp4"
encode "$REPLACE/奴隷相手側赤.mp4"     "$OUT/ecard_opp_slave.mp4"
encode "$REPLACE/市民相手側赤.mp4"     "$OUT/ecard_opp_citizen.mp4"

echo ""
echo "── 勝ちパターン動画 ──"
encode "$REPLACE/皇帝自分側青勝ちパターン.mp4" "$OUT/ecard_my_emperor_win.mp4"
encode "$REPLACE/奴隷自分側青勝ちパターン.mp4" "$OUT/ecard_my_slave_win.mp4"
encode "$REPLACE/市民自分側青勝ちパターン.mp4" "$OUT/ecard_my_citizen_win.mp4"

echo ""
echo "── 負けパターン動画 ──"
encode "$REPLACE/皇帝相手側赤負けパターン.mp4" "$OUT/ecard_opp_emperor_lose.mp4"
encode "$REPLACE/奴隷相手側赤負けパターン.mp4" "$OUT/ecard_opp_slave_lose.mp4"
encode "$REPLACE/市民相手側赤負けパターン.mp4" "$OUT/ecard_opp_citizen_lose.mp4"

echo ""
echo "──────────────────────────────────────────"
echo "完了  ✅ ${ok}件エンコード  ⏭ ${skip}件スキップ  ❌ ${fail}件失敗"
echo "出力先: $OUT"
ls -lh "$OUT"/*.mp4 2>/dev/null | awk '{print "  "$NF" "$5}'
