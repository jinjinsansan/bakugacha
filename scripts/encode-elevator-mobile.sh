#!/bin/bash
# elevator-mobile 軽量動画エンコードスクリプト (WSL上で実行)
# 実行: wsl bash scripts/encode-elevator-mobile.sh

set -e

BASE="/mnt/e/dev/Cusor/bakugatcha/エレベーターガチャ映像"
OUT="/tmp/elevator-mobile"
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
    echo "  ❌ ソースなし: $(basename "$src")"
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
echo "── elevator-mobile 軽量エンコード開始 ──"
echo ""

# タイトル
encode "$BASE/eelev_title.mp4" "$OUT/eelev_title.mp4"

# 上昇映像
echo ""
echo "── 上昇映像 ──"
encode "$BASE/eelev_rise.mp4"      "$OUT/eelev_rise.mp4"
encode "$BASE/eelev_rise_down.mp4" "$OUT/eelev_rise_down.mp4"
encode "$BASE/eelev_rise_fast.mp4" "$OUT/eelev_rise_fast.mp4"

# 停止映像
echo ""
echo "── 停止映像 ──"
encode "$BASE/eelev_stop.mp4"             "$OUT/eelev_stop.mp4"
encode "$BASE/eelev_stop_boss.mp4"        "$OUT/eelev_stop_boss.mp4"
encode "$BASE/eelev_stop_countdown.mp4"   "$OUT/eelev_stop_countdown.mp4"
encode "$BASE/eelev_stop_multidoor.mp4"   "$OUT/eelev_stop_multidoor.mp4"
encode "$BASE/eelev_stop_numchaos.mp4"    "$OUT/eelev_stop_numchaos.mp4"
encode "$BASE/eelev_stop_numreverse.mp4"  "$OUT/eelev_stop_numreverse.mp4"
encode "$BASE/eelev_stop_vibration.mp4"   "$OUT/eelev_stop_vibration.mp4"
encode "$BASE/eelev_stop_emergency.mp4"   "$OUT/eelev_stop_emergency.mp4"
encode "$BASE/eelev_stop_transparent.mp4" "$OUT/eelev_stop_transparent.mp4"
encode "$BASE/eelev_stop_halfopen.mp4"    "$OUT/eelev_stop_halfopen.mp4"
encode "$BASE/eelev_stop_mirror.mp4"      "$OUT/eelev_stop_mirror.mp4"
encode "$BASE/eelev_stop_ghost.mp4"       "$OUT/eelev_stop_ghost.mp4"
encode "$BASE/eelev_stop_ice.mp4"         "$OUT/eelev_stop_ice.mp4"
encode "$BASE/eelev_stop_fire.mp4"        "$OUT/eelev_stop_fire.mp4"

# OPEN/SKIP
echo ""
echo "── OPEN/SKIP・結果映像 ──"
encode "$BASE/eelev_open_skip.mp4"           "$OUT/eelev_open_skip.mp4"
encode "$BASE/eelev_open_wall.mp4"           "$OUT/eelev_open_wall.mp4"
encode "$BASE/eelev_open_wall_collapse.mp4"  "$OUT/eelev_open_wall_collapse.mp4"
encode "$BASE/eelev_open_hole.mp4"           "$OUT/eelev_open_hole.mp4"
encode "$BASE/eelev_open_coin.mp4"           "$OUT/eelev_open_coin.mp4"
encode "$BASE/eelev_open_coin_explosion.mp4" "$OUT/eelev_open_coin_explosion.mp4"
encode "$BASE/eelev_open_coin_boss.mp4"      "$OUT/eelev_open_coin_boss.mp4"

# 最終結果
encode "$BASE/eelev_final_lose.mp4" "$OUT/eelev_final_lose.mp4"
encode "$BASE/eelev_final_win.mp4"  "$OUT/eelev_final_win.mp4"

echo ""
echo "──────────────────────────────────────────"
echo "完了  ✅ ${ok}件エンコード  ⏭ ${skip}件スキップ  ❌ ${fail}件失敗"
echo "出力先: $OUT"
ls -lh "$OUT"/*.mp4 2>/dev/null | awk '{print "  "$NF" "$5}'
