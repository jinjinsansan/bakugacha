#!/bin/bash
# keiba-mobile 軽量動画エンコードスクリプト (WSL上で実行)
# 実行: bash scripts/encode-keiba-mobile.sh

set -e

BASE="/mnt/e/dev/Cusor/bakugatcha/競馬ガチャ映像"
NARR="$BASE/ナレーション付き"
OUT="/tmp/keiba-mobile"
mkdir -p "$OUT"

# 480p, 700kbps video + 64k audio, faststart (他ガチャと同設定)
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
echo "── keiba-mobile 軽量エンコード開始 ──"

# タイトル演出（コース別ファンファーレ）
echo ""
echo "── タイトル演出 ──"
encode "$NARR/title_sunny_turf.mp4"  "$OUT/title_sunny_turf.mp4"
encode "$NARR/title_sunny_dirt.mp4"  "$OUT/title_sunny_dirt.mp4"
encode "$NARR/title_soft_turf.mp4"   "$OUT/title_soft_turf.mp4"
encode "$NARR/title_soft_dirt.mp4"   "$OUT/title_soft_dirt.mp4"
encode "$NARR/title_heavy_turf.mp4"  "$OUT/title_heavy_turf.mp4"
encode "$NARR/title_rain_turf.mp4"   "$OUT/title_rain_turf.mp4"
encode "$NARR/title_rain_dirt.mp4"   "$OUT/title_rain_dirt.mp4"

# キャラ紹介（ナレーション付き）
echo ""
echo "── キャラ紹介 ──"
encode "$NARR/A-01_chara_shirogane.mp4"     "$OUT/A-01_chara_shirogane.mp4"
encode "$NARR/A-02_chara_darkbolt.mp4"      "$OUT/A-02_chara_darkbolt.mp4"
encode "$NARR/A-03_chara_aoikaze.mp4"       "$OUT/A-03_chara_aoikaze.mp4"
encode "$NARR/A-04_chara_honohime.mp4"      "$OUT/A-04_chara_honohime.mp4"
encode "$NARR/A-05_chara_fuwarin.mp4"       "$OUT/A-05_chara_fuwarin.mp4"
encode "$NARR/A-06_chara_bakugachahime.mp4" "$OUT/A-06_chara_bakugachahime.mp4"
encode "$NARR/A-07_chara_umaoyaji.mp4"      "$OUT/A-07_chara_umaoyaji.mp4"

# ゲートスタート（ナレーション付き）
echo ""
echo "── ゲートスタート ──"
encode "$NARR/E-01_gate_start_sunny_turf.mp4"              "$OUT/E-01_gate_start_sunny_turf.mp4"
encode "$NARR/E-01b_gate_start_sunny_turf_umaoyaji.mp4"    "$OUT/E-01b_gate_start_sunny_turf_umaoyaji.mp4"
encode "$NARR/E-02_gate_start_sunny_dirt.mp4"              "$OUT/E-02_gate_start_sunny_dirt.mp4"
encode "$NARR/E-03_gate_start_soft_turf.mp4"               "$OUT/E-03_gate_start_soft_turf.mp4"
encode "$NARR/E-04_gate_start_soft_dirt.mp4"               "$OUT/E-04_gate_start_soft_dirt.mp4"
encode "$NARR/E-05_gate_start_heavy_turf.mp4"              "$OUT/E-05_gate_start_heavy_turf.mp4"
encode "$NARR/E-06_gate_start_rain_turf.mp4"               "$OUT/E-06_gate_start_rain_turf.mp4"
encode "$NARR/E-07_gate_start_rain_dirt.mp4"               "$OUT/E-07_gate_start_rain_dirt.mp4"

# 集団走行（ナレーション付き）
echo ""
echo "── 集団走行 ──"
encode "$NARR/F-01_pack_side_sunny_turf.mp4"               "$OUT/F-01_pack_side_sunny_turf.mp4"
encode "$NARR/F-01b_pack_side_sunny_turf_umaoyaji.mp4"     "$OUT/F-01b_pack_side_sunny_turf_umaoyaji.mp4"
encode "$NARR/F-02_pack_side_sunny_dirt.mp4"               "$OUT/F-02_pack_side_sunny_dirt.mp4"
encode "$NARR/F-03_pack_side_soft_turf.mp4"                "$OUT/F-03_pack_side_soft_turf.mp4"
encode "$NARR/F-04_pack_side_soft_dirt.mp4"                "$OUT/F-04_pack_side_soft_dirt.mp4"
encode "$NARR/F-05_pack_side_heavy_turf.mp4"               "$OUT/F-05_pack_side_heavy_turf.mp4"
encode "$NARR/F-06_pack_side_rain_turf.mp4"                "$OUT/F-06_pack_side_rain_turf.mp4"
encode "$NARR/F-07_pack_side_rain_dirt.mp4"                "$OUT/F-07_pack_side_rain_dirt.mp4"

# 最終コーナー（ナレーション付き）
echo ""
echo "── 最終コーナー ──"
encode "$NARR/G-01_final_corner_sunny_turf.mp4"            "$OUT/G-01_final_corner_sunny_turf.mp4"
encode "$NARR/G-01b_final_corner_sunny_turf_umaoyaji.mp4"  "$OUT/G-01b_final_corner_sunny_turf_umaoyaji.mp4"
encode "$NARR/G-02_final_corner_sunny_dirt.mp4"            "$OUT/G-02_final_corner_sunny_dirt.mp4"
encode "$NARR/G-03_final_corner_soft_turf.mp4"             "$OUT/G-03_final_corner_soft_turf.mp4"
encode "$NARR/G-04_final_corner_soft_dirt.mp4"             "$OUT/G-04_final_corner_soft_dirt.mp4"
encode "$NARR/G-05_final_corner_heavy_turf.mp4"            "$OUT/G-05_final_corner_heavy_turf.mp4"
encode "$NARR/G-06_final_corner_rain_turf.mp4"             "$OUT/G-06_final_corner_rain_turf.mp4"
encode "$NARR/G-07_final_corner_rain_dirt.mp4"             "$OUT/G-07_final_corner_rain_dirt.mp4"

# ゴール直前（ナレーション付き）
echo ""
echo "── ゴール直前 ──"
encode "$NARR/H-01_goal_front_sunny_turf.mp4"              "$OUT/H-01_goal_front_sunny_turf.mp4"
encode "$NARR/H-01b_goal_front_sunny_turf_umaoyaji.mp4"    "$OUT/H-01b_goal_front_sunny_turf_umaoyaji.mp4"
encode "$NARR/H-02_goal_front_sunny_dirt.mp4"              "$OUT/H-02_goal_front_sunny_dirt.mp4"
encode "$NARR/H-03_goal_front_soft_turf.mp4"               "$OUT/H-03_goal_front_soft_turf.mp4"
encode "$NARR/H-04_goal_front_soft_dirt.mp4"               "$OUT/H-04_goal_front_soft_dirt.mp4"
encode "$NARR/H-05_goal_front_heavy_turf.mp4"              "$OUT/H-05_goal_front_heavy_turf.mp4"
encode "$NARR/H-06_goal_front_rain_turf.mp4"               "$OUT/H-06_goal_front_rain_turf.mp4"
encode "$NARR/H-07_goal_front_rain_dirt.mp4"               "$OUT/H-07_goal_front_rain_dirt.mp4"

# 当たり演出（ナレーション付き）
echo ""
echo "── 当たり演出 ──"
encode "$NARR/WIN-01_shirogane.mp4"      "$OUT/WIN-01_shirogane.mp4"
encode "$NARR/WIN-02_darkbolt.mp4"       "$OUT/WIN-02_darkbolt.mp4"
encode "$NARR/WIN-03_aoikaze.mp4"        "$OUT/WIN-03_aoikaze.mp4"
encode "$NARR/WIN-04_honohime.mp4"       "$OUT/WIN-04_honohime.mp4"
encode "$NARR/WIN-05_fuwarin.mp4"        "$OUT/WIN-05_fuwarin.mp4"
encode "$NARR/WIN-06_bakugachahime.mp4"  "$OUT/WIN-06_bakugachahime.mp4"
encode "$NARR/WIN-07_umaoyaji.mp4"       "$OUT/WIN-07_umaoyaji.mp4"

# ハズレ演出（ナレーション版なし・既存ファイル使用）
echo ""
echo "── ハズレ演出 ──"
encode "$BASE/LOSE-01_shirogane.mp4"      "$OUT/LOSE-01_shirogane.mp4"
encode "$BASE/LOSE-02_darkbolt.mp4"       "$OUT/LOSE-02_darkbolt.mp4"
encode "$BASE/LOSE-03_aoikaze.mp4"        "$OUT/LOSE-03_aoikaze.mp4"
encode "$BASE/LOSE-04_honohime.mp4"       "$OUT/LOSE-04_honohime.mp4"
encode "$BASE/LOSE-05_fuwarin.mp4"        "$OUT/LOSE-05_fuwarin.mp4"
encode "$BASE/LOSE-06_bakugachahime.mp4"  "$OUT/LOSE-06_bakugachahime.mp4"
encode "$BASE/LOSE-07_umaoyaji.mp4"       "$OUT/LOSE-07_umaoyaji.mp4"

echo ""
echo "──────────────────────────────────────────"
echo "完了  ✅ ${ok}件エンコード  ⏭ ${skip}件スキップ  ❌ ${fail}件失敗"
echo "出力先: $OUT"
ls -lh "$OUT"/*.mp4 2>/dev/null | awk '{print "  "$NF" "$5}'
