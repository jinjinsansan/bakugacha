#!/bin/bash
# 来世ガチャ 軽量動画エンコードスクリプト (WSL上で実行)
# 実行: bash scripts/encode-raise-mobile.sh
# 強制再エンコード: bash scripts/encode-raise-mobile.sh --force

set -e

KENTA_SRC="/mnt/e/dev/Cusor/tensei/健太映像"
SHOICHI_SRC="/mnt/e/dev/Cusor/tensei/昭一映像"
KENTA_OUT="/tmp/raise-kenta-mobile"
SHOICHI_OUT="/tmp/raise-shoichi-mobile"
FORCE=0
[ "$1" = "--force" ] && FORCE=1

mkdir -p "$KENTA_OUT" "$SHOICHI_OUT"

# 480p, 700kbps video + 64k audio, faststart
FFOPTS="-vf scale=-2:480 -c:v libx264 -b:v 700k -maxrate 900k -bufsize 1800k -c:a aac -b:a 64k -movflags +faststart -y"

ok=0; skip=0; fail=0

encode() {
  local src="$1"
  local dst="$2"
  local name=$(basename "$dst")

  if [ -f "$dst" ] && [ "$FORCE" = "0" ]; then
    echo "  ⏭  スキップ: $name"
    skip=$((skip+1))
    return 0
  fi
  if [ ! -f "$src" ]; then
    echo "  ❌ ソースなし: $(basename "$src")"
    fail=$((fail+1))
    return 0
  fi

  echo "  🔄 エンコード中: $name"
  ffmpeg -i "$src" $FFOPTS "$dst" 2>/dev/null && {
    size=$(du -k "$dst" | cut -f1)
    echo "  ✅ 完了: $name (${size}KB)"
    ok=$((ok+1))
  } || {
    echo "  ❌ 失敗: $name"
    fail=$((fail+1))
  }
}

echo ""
echo "── 健太編 軽量エンコード開始 ──"

# タイトル
for i in $(seq -w 1 12); do
  encode "$KENTA_SRC/kenta_title_c${i}.mp4" "$KENTA_OUT/kenta_title_c${i}.mp4"
done

# PRE
for p in a b c d; do
  for n in 1 2; do
    encode "$KENTA_SRC/kenta_pre_${p}${n}.mp4" "$KENTA_OUT/kenta_pre_${p}${n}.mp4"
  done
done

# CHANCE
for p in a b c d; do
  encode "$KENTA_SRC/kenta_chance_${p}.mp4" "$KENTA_OUT/kenta_chance_${p}.mp4"
done

# MAIN
for card in c01 c02 c03 c04 c05 c06 c07 c08 c09 c10 c11; do
  for n in 1 2 3 4 5; do
    [ -f "$KENTA_SRC/kenta_${card}_${n}.mp4" ] && \
      encode "$KENTA_SRC/kenta_${card}_${n}.mp4" "$KENTA_OUT/kenta_${card}_${n}.mp4"
  done
done
# c12 は _2 が存在しない
for n in 1 3 4 5; do
  encode "$KENTA_SRC/kenta_c12_${n}.mp4" "$KENTA_OUT/kenta_c12_${n}.mp4"
done

# REV (どんでん)
for route in c01_c05 c01_c07 c02_c06 c02_c08 c03_c10 c04_c09 c05_c08 c06_c09 c07_c11 c08_c12; do
  for n in 1 2; do
    encode "$KENTA_SRC/kenta_rev_${route}_${n}.mp4" "$KENTA_OUT/kenta_rev_${route}_${n}.mp4"
  done
done

echo ""
echo "── 正一編 軽量エンコード開始 ──"

# タイトル
for i in $(seq -w 1 12); do
  encode "$SHOICHI_SRC/shoichi_title_c${i}.mp4" "$SHOICHI_OUT/shoichi_title_c${i}.mp4"
done

# PRE
for p in a b c d; do
  for n in 1 2; do
    encode "$SHOICHI_SRC/shoichi_pre_${p}${n}.mp4" "$SHOICHI_OUT/shoichi_pre_${p}${n}.mp4"
  done
done

# CHANCE
for p in a b c d; do
  encode "$SHOICHI_SRC/shoichi_chance_${p}.mp4" "$SHOICHI_OUT/shoichi_chance_${p}.mp4"
done

# MAIN
for card in c01 c02 c03 c04 c05 c06 c07 c08 c09 c10 c11 c12; do
  for n in 1 2 3 4 5; do
    [ -f "$SHOICHI_SRC/shoichi_${card}_${n}.mp4" ] && \
      encode "$SHOICHI_SRC/shoichi_${card}_${n}.mp4" "$SHOICHI_OUT/shoichi_${card}_${n}.mp4"
  done
done

# REV (どんでん)
for route in c01_c05 c01_c07 c02_c06 c02_c08 c03_c09 c03_c11 c04_c08 c05_c10 c06_c11 c08_c12; do
  for n in 1 2; do
    encode "$SHOICHI_SRC/shoichi_rev_${route}_${n}.mp4" "$SHOICHI_OUT/shoichi_rev_${route}_${n}.mp4"
  done
done

echo ""
echo "═══════════════════════════════════"
echo " エンコード結果: ✅${ok}件 ⏭${skip}件 ❌${fail}件"
echo " 出力先:"
echo "   健太: $KENTA_OUT ($(ls $KENTA_OUT 2>/dev/null | wc -l) ファイル)"
echo "   正一: $SHOICHI_OUT ($(ls $SHOICHI_OUT 2>/dev/null | wc -l) ファイル)"
echo "═══════════════════════════════════"
echo ""
echo "次: python3 scripts/upload-raise-mobile-r2.py"
