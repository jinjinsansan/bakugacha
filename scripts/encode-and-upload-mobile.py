"""
cd2-mobile 軽量動画エンコード & R2アップロードスクリプト
実行: python3 scripts/encode-and-upload-mobile.py
"""

import os
import subprocess
import sys
import boto3
from pathlib import Path

# ── 設定 ──────────────────────────────────────────────────────
REENCODED_DIR = Path("/mnt/e/dev/Cusor/tensei/炎映像/カウントダウンチャレンジ２ガチャ/_reencoded")
BASE_DIR      = Path("/mnt/e/dev/Cusor/tensei/炎映像/カウントダウンチャレンジ２ガチャ")
OUT_DIR       = Path("/tmp/cd2-mobile")

ACCOUNT_ID  = "954dcc10adf822b50ccceedef0aa97e6"
ACCESS_KEY  = "eaa0aa3d33af2b2d635d73218e633514"
SECRET_KEY  = "4275dc9a87fb942bc5e28974b31abed5fcbc2b920512869b059ab0e882e6462e"
BUCKET      = "bakugacha"
R2_PREFIX   = "cd2-mobile"

# 480p, 700kbps video + 64k audio, moov atom先頭（faststart）
FFMPEG_OPTS = [
    "-vf", "scale=-2:480",
    "-c:v", "libx264",
    "-b:v", "700k",
    "-maxrate", "900k",
    "-bufsize", "1800k",
    "-c:a", "aac",
    "-b:a", "64k",
    "-movflags", "+faststart",
    "-y",
]

# ── ファイルマッピング（srcファイル名 → R2キーのサフィックス）──
ENCODED_MAP = [
    ("1秒タイトル映像赤.mp4",          "title_red.mp4"),
    ("1秒赤10.mp4",                   "red_10.mp4"),
    ("1秒赤９.mp4",                   "red_9.mp4"),
    ("1秒赤８.mp4",                   "red_8.mp4"),
    ("1秒赤7.mp4",                    "red_7.mp4"),
    ("1秒赤６映像再修正版.mp4",         "red_6.mp4"),
    ("1秒赤５.mp4",                   "red_5.mp4"),
    ("1秒赤４.mp4",                   "red_4.mp4"),
    ("1秒赤３映像再修正版.mp4",         "red_3.mp4"),
    ("1秒赤２.mp4",                   "red_2.mp4"),
    ("1秒赤１.mp4",                   "red_1.mp4"),
    ("1秒赤０.mp4",                   "red_0.mp4"),
    ("1秒赤３当たり再修正版.mp4",       "red_3_win.mp4"),
    ("1秒赤２当たり.mp4",              "red_2_win.mp4"),
    ("1秒赤１当たり.mp4",              "red_1_win.mp4"),
    ("1秒赤０当たり.mp4",              "red_0_win.mp4"),
    ("1秒赤３ハズレ映像再修正版.mp4",   "red_3_loss.mp4"),
    ("1秒赤２ハズレ.mp4",              "red_2_loss.mp4"),
    ("1秒赤1ハズレ.mp4",               "red_loss.mp4"),
    ("1秒赤０ハズレ.mp4",              "red_0_loss.mp4"),
    ("1秒パトライト映像.mp4",           "patlite.mp4"),
    ("1秒どんでん返し映像.mp4",         "donden.mp4"),
    ("1秒ジャックポット映像.mp4",       "jackpot.mp4"),
]

STANDBY_MAP = [
    ("blackstandby.mp4",   "standby/blackstandby.mp4"),
    ("bluestandby.mp4",    "standby/bluestandby.mp4"),
    ("rainbowstandby.mp4", "standby/rainbowstandby.mp4"),
    ("redstandby.mp4",     "standby/redstandby.mp4"),
    ("whitestandby.mp4",   "standby/whitestandby.mp4"),
    ("yellowstandby.mp4",  "standby/yellowstandby.mp4"),
]

# ── R2クライアント ────────────────────────────────────────────
s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    region_name="auto",
)

encode_ok = skip_encode = upload_ok = warn = 0

def find_source(filename: str, prefer_dir: Path, fallback_dir: Path) -> Path | None:
    p = prefer_dir / filename
    if p.exists():
        return p
    p2 = fallback_dir / filename
    if p2.exists():
        return p2
    return None

def encode(src: Path, dst: Path) -> bool:
    global encode_ok, skip_encode
    if dst.exists():
        print(f"  ⏭  エンコード済みスキップ: {dst.name}")
        skip_encode += 1
        return True
    dst.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-i", str(src)] + FFMPEG_OPTS + [str(dst)]
    result = subprocess.run(cmd, capture_output=True)
    if result.returncode != 0:
        print(f"  ❌ エンコード失敗: {src.name}")
        print(result.stderr.decode(errors="replace")[-500:])
        return False
    print(f"  ✅ エンコード完了: {dst.name} ({dst.stat().st_size // 1024}KB)")
    encode_ok += 1
    return True

def upload(local: Path, key: str) -> bool:
    global upload_ok, warn
    if not local.exists():
        print(f"  ⚠️  ファイルなし: {local}")
        warn += 1
        return False
    s3.upload_file(str(local), BUCKET, key, ExtraArgs={"ContentType": "video/mp4"})
    print(f"  ☁️  アップロード: {key}")
    upload_ok += 1
    return True

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "standby").mkdir(parents=True, exist_ok=True)

    print("\n── カウントダウン・演出動画 エンコード & アップロード ──")
    for src_name, key_suffix in ENCODED_MAP:
        src = find_source(src_name, REENCODED_DIR, BASE_DIR)
        if src is None:
            print(f"  ⚠️  ソースなし: {src_name}")
            warn += 1
            continue
        dst = OUT_DIR / key_suffix
        if encode(src, dst):
            upload(dst, f"{R2_PREFIX}/{key_suffix}")

    print("\n── スタンバイ動画 エンコード & アップロード ──")
    for src_name, key_suffix in STANDBY_MAP:
        src = BASE_DIR / src_name
        if not src.exists():
            print(f"  ⚠️  ソースなし: {src_name}")
            warn += 1
            continue
        dst = OUT_DIR / key_suffix
        if encode(src, dst):
            upload(dst, f"{R2_PREFIX}/{key_suffix}")

    print(f"\n{'─'*50}")
    print(f"完了  ✅ エンコード {encode_ok}件  ⏭ スキップ {skip_encode}件  ☁️ アップロード {upload_ok}件  ⚠️ 警告 {warn}件")

if __name__ == "__main__":
    main()
