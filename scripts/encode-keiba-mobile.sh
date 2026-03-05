#!/bin/bash
# keiba-mobile 軽量動画エンコードスクリプト (WSL上で実行)
# 実行: wsl bash scripts/encode-keiba-mobile.sh

set -e

BASE="/mnt/e/dev/Cusor/bakugatcha/競馬ガチャ映像"
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

# タイトル演出
echo ""
echo "── タイトル演出 ──"
encode "$BASE/D-05a_title_normal.mp4"  "$OUT/D-05a_title_normal.mp4"
encode "$BASE/D-05b_title_heatup.mp4"  "$OUT/D-05b_title_heatup.mp4"
encode "$BASE/D-05c_title_hot.mp4"     "$OUT/D-05c_title_hot.mp4"
encode "$BASE/D-05d_title_ssr.mp4"     "$OUT/D-05d_title_ssr.mp4"

# キャラ紹介
echo ""
echo "── キャラ紹介 ──"
encode "$BASE/A-01_chara_shirogane.mp4"     "$OUT/A-01_chara_shirogane.mp4"
encode "$BASE/A-02_chara_darkbolt.mp4"      "$OUT/A-02_chara_darkbolt.mp4"
encode "$BASE/A-03_chara_aoikaze.mp4"       "$OUT/A-03_chara_aoikaze.mp4"
encode "$BASE/A-04_chara_honohime.mp4"      "$OUT/A-04_chara_honohime.mp4"
encode "$BASE/A-05_chara_fuwarin.mp4"       "$OUT/A-05_chara_fuwarin.mp4"
encode "$BASE/A-06_chara_bakugachahime.mp4" "$OUT/A-06_chara_bakugachahime.mp4"
encode "$BASE/A-07_chara_umaoyaji.mp4"      "$OUT/A-07_chara_umaoyaji.mp4"

# ゲートスタート
echo ""
echo "── ゲートスタート ──"
encode "$BASE/E-01_gate_sunny_turf.mp4"                    "$OUT/E-01_gate_sunny_turf.mp4"
encode "$BASE/E-01b_gate_start_sunny_turf_umaoyaji.mp4"   "$OUT/E-01b_gate_start_sunny_turf_umaoyaji.mp4"
encode "$BASE/E-02_gate_sunny_dirt.mp4"                    "$OUT/E-02_gate_sunny_dirt.mp4"
encode "$BASE/E-03_gate_start_soft_turf.mp4"               "$OUT/E-03_gate_start_soft_turf.mp4"
encode "$BASE/E-04_gate_start_soft_dirt.mp4"               "$OUT/E-04_gate_start_soft_dirt.mp4"
encode "$BASE/E-05_gate_start_heavy_turf.mp4"              "$OUT/E-05_gate_start_heavy_turf.mp4"
encode "$BASE/E-06_gate_start_rain_turf.mp4"               "$OUT/E-06_gate_start_rain_turf.mp4"
encode "$BASE/E-07_gate_start_rain_dirt.mp4"               "$OUT/E-07_gate_start_rain_dirt.mp4"

# 集団走行
echo ""
echo "── 集団走行 ──"
encode "$BASE/F-01_pack_side_sunny_turf.mp4"               "$OUT/F-01_pack_side_sunny_turf.mp4"
encode "$BASE/F-01b_pack_side_sunny_turf_umaoyaji.mp4"    "$OUT/F-01b_pack_side_sunny_turf_umaoyaji.mp4"
encode "$BASE/F-02_pack_side_sunny_dirt.mp4"               "$OUT/F-02_pack_side_sunny_dirt.mp4"
encode "$BASE/F-03_pack_side_soft_turf.mp4"                "$OUT/F-03_pack_side_soft_turf.mp4"
encode "$BASE/F-04_pack_side_soft_dirt.mp4"                "$OUT/F-04_pack_side_soft_dirt.mp4"
encode "$BASE/F-05_pack_side_heavy_turf.mp4"               "$OUT/F-05_pack_side_heavy_turf.mp4"
encode "$BASE/F-06_pack_side_rain_turf.mp4"                "$OUT/F-06_pack_side_rain_turf.mp4"
encode "$BASE/F-07_pack_side_rain_dirt.mp4"                "$OUT/F-07_pack_side_rain_dirt.mp4"

# 最終コーナー
echo ""
echo "── 最終コーナー ──"
encode "$BASE/G-01_final_corner_sunny_turf.mp4"            "$OUT/G-01_final_corner_sunny_turf.mp4"
encode "$BASE/G-01b_final_corner_sunny_turf_umaoyaji.mp4" "$OUT/G-01b_final_corner_sunny_turf_umaoyaji.mp4"
encode "$BASE/G-02_final_corner_sunny_dirt.mp4"            "$OUT/G-02_final_corner_sunny_dirt.mp4"
encode "$BASE/G-03_final_corner_soft_turf.mp4"             "$OUT/G-03_final_corner_soft_turf.mp4"
encode "$BASE/G-04_final_corner_soft_dirt.mp4"             "$OUT/G-04_final_corner_soft_dirt.mp4"
encode "$BASE/G-05_final_corner_heavy_turf.mp4"            "$OUT/G-05_final_corner_heavy_turf.mp4"
encode "$BASE/G-06_final_corner_rain_turf.mp4"             "$OUT/G-06_final_corner_rain_turf.mp4"
encode "$BASE/G-07_final_corner_rain_dirt.mp4"             "$OUT/G-07_final_corner_rain_dirt.mp4"

# ゴール直前
echo ""
echo "── ゴール直前 ──"
encode "$BASE/H-01_goal_front_sunny_turf.mp4"              "$OUT/H-01_goal_front_sunny_turf.mp4"
encode "$BASE/H-01b_goal_front_sunny_turf_umaoyaji.mp4"   "$OUT/H-01b_goal_front_sunny_turf_umaoyaji.mp4"
encode "$BASE/H-02_goal_front_sunny_dirt.mp4"              "$OUT/H-02_goal_front_sunny_dirt.mp4"
encode "$BASE/H-03_goal_front_soft_turf.mp4"               "$OUT/H-03_goal_front_soft_turf.mp4"
encode "$BASE/H-04_goal_front_soft_dirt.mp4"               "$OUT/H-04_goal_front_soft_dirt.mp4"
encode "$BASE/H-05_goal_front_heavy_turf.mp4"              "$OUT/H-05_goal_front_heavy_turf.mp4"
encode "$BASE/H-06_goal_front_rain_turf.mp4"               "$OUT/H-06_goal_front_rain_turf.mp4"
encode "$BASE/H-07_goal_front_rain_dirt.mp4"               "$OUT/H-07_goal_front_rain_dirt.mp4"

# 当たり演出
echo ""
echo "── 当たり演出 ──"
encode "$BASE/WIN-01_shirogane.mp4"      "$OUT/WIN-01_shirogane.mp4"
encode "$BASE/WIN-02_darkbolt.mp4"       "$OUT/WIN-02_darkbolt.mp4"
encode "$BASE/WIN-03_aoikaze.mp4"        "$OUT/WIN-03_aoikaze.mp4"
encode "$BASE/WIN-04_honohime.mp4"       "$OUT/WIN-04_honohime.mp4"
encode "$BASE/WIN-05_fuwarin.mp4"        "$OUT/WIN-05_fuwarin.mp4"
encode "$BASE/WIN-06_bakugachahime.mp4"  "$OUT/WIN-06_bakugachahime.mp4"
encode "$BASE/WIN-07_umaoyaji.mp4"       "$OUT/WIN-07_umaoyaji.mp4"

# ハズレ演出
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
