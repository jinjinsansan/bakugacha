#!/usr/bin/env python3
"""
修正フォルダの映像・画像を bakugatcha R2 にアップロードするスクリプト

アップロード先:
  raise-shoichi/shoichi_standby.mp4   ← 正一編STANDBY.mp4
  raise-kenta/kenta_standby.mp4       ← 健太編STANDBY.mp4
  raise-common/tensei_loss_hint.mp4   ← 転生ガチャハズレ示唆.mp4
  raise-common/tensei_win_hint.mp4    ← 転生ガチャ当たり示唆.mp4
  keiba/keiba_standby.mp4             ← 競馬ガチャSTANDBY.mp4
  raise-cards/shoichi_hazure.png      ← 正一編ハズレカード元画像.png
  raise-cards/kenta_hazure.png        ← 健太編ハズレカード元画像.png

Usage:
    python scripts/upload-fixes-to-r2.py
    python scripts/upload-fixes-to-r2.py --dry-run
"""
import sys
import mimetypes
from pathlib import Path
import boto3

FIX_DIR = Path(__file__).resolve().parent.parent / '修正フォルダ'

UPLOAD_MAP = [
    (FIX_DIR / '正一編STANDBY.mp4',          'raise-shoichi/shoichi_standby.mp4'),
    (FIX_DIR / '健太編STANDBY.mp4',          'raise-kenta/kenta_standby.mp4'),
    (FIX_DIR / '転生ガチャハズレ示唆.mp4',   'raise-common/tensei_loss_hint.mp4'),
    (FIX_DIR / '転生ガチャ当たり示唆.mp4',   'raise-common/tensei_win_hint.mp4'),
    (FIX_DIR / '競馬ガチャSTANDBY.mp4',      'keiba/keiba_standby.mp4'),
    (FIX_DIR / '正一編ハズレカード元画像.png', 'raise-cards/shoichi_hazure.png'),
    (FIX_DIR / '健太編ハズレカード元画像.png', 'raise-cards/kenta_hazure.png'),
]

def load_env():
    env_path = Path(__file__).resolve().parent.parent / '.env.local'
    env = {}
    if env_path.exists():
        with open(env_path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env[key] = value
    return env

def get_content_type(path: Path) -> str:
    mt, _ = mimetypes.guess_type(str(path))
    if mt:
        return mt
    ext = path.suffix.lower()
    if ext == '.mp4':
        return 'video/mp4'
    if ext == '.png':
        return 'image/png'
    return 'application/octet-stream'

def main():
    dry_run = '--dry-run' in sys.argv

    env = load_env()
    account_id = env.get('R2_ACCOUNT_ID')
    bucket = env.get('R2_BUCKET_NAME')
    access_key = env.get('R2_ACCESS_KEY_ID')
    secret_key = env.get('R2_SECRET_ACCESS_KEY')

    if not all([account_id, bucket, access_key, secret_key]):
        print('R2認証情報が .env.local に見つかりません')
        sys.exit(1)

    s3 = boto3.client(
        's3',
        endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name='auto',
    )

    missing = [str(src) for src, _ in UPLOAD_MAP if not src.exists()]
    if missing:
        print('以下のファイルが見つかりません:')
        for m in missing:
            print(f'  {m}')
        sys.exit(1)

    print(f'{"[DRY RUN] " if dry_run else ""}合計 {len(UPLOAD_MAP)} ファイル → R2 バケット: {bucket}')
    print()

    ok = 0
    ng = 0
    for local_path, r2_key in UPLOAD_MAP:
        size_mb = local_path.stat().st_size / (1024 * 1024)
        ct = get_content_type(local_path)
        if dry_run:
            print(f'  [DRY] {local_path.name} → {r2_key} ({size_mb:.2f} MB, {ct})')
            ok += 1
            continue
        try:
            with open(local_path, 'rb') as fobj:
                s3.put_object(Bucket=bucket, Key=r2_key, Body=fobj, ContentType=ct)
            print(f'  OK  {local_path.name} → {r2_key} ({size_mb:.2f} MB)')
            ok += 1
        except Exception as e:
            print(f'  NG  {r2_key}: {e}')
            ng += 1

    print()
    print(f'完了: {ok} 成功, {ng} 失敗')
    return 1 if ng else 0

if __name__ == '__main__':
    sys.exit(main())
