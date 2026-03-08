#!/usr/bin/env python3
"""
来世ガチャ 軽量モード映像を R2 にアップロード

事前: bash scripts/encode-raise-mobile.sh を実行しておくこと

Usage:
    python scripts/upload-raise-mobile-r2.py
    python scripts/upload-raise-mobile-r2.py --dry-run
"""
import sys
import mimetypes
from pathlib import Path
import boto3

KENTA_ENCODED  = Path('/tmp/raise-kenta-mobile')
SHOICHI_ENCODED = Path('/tmp/raise-shoichi-mobile')

SOURCES = [
    (KENTA_ENCODED,  'raise-kenta-mobile'),
    (SHOICHI_ENCODED, 'raise-shoichi-mobile'),
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
                    env[key.strip()] = value.strip()
    return env

def main():
    dry_run = '--dry-run' in sys.argv
    env = load_env()
    account_id = env.get('R2_ACCOUNT_ID')
    bucket     = env.get('R2_BUCKET_NAME')
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

    tasks = []
    for src_dir, prefix in SOURCES:
        if not src_dir.exists():
            print(f'[WARN] {src_dir} が見つかりません。先に encode-raise-mobile.sh を実行してください。')
            continue
        for f in sorted(src_dir.glob('*.mp4')):
            tasks.append((f, f'{prefix}/{f.name}'))

    if not tasks:
        print('アップロード対象が見つかりません。先に bash scripts/encode-raise-mobile.sh を実行してください。')
        sys.exit(1)

    print(f'{"[DRY RUN] " if dry_run else ""}合計 {len(tasks)} ファイル → R2 バケット: {bucket}')
    print()

    ok = ng = 0
    for local_path, r2_key in tasks:
        size_mb = local_path.stat().st_size / (1024 * 1024)
        if dry_run:
            print(f'  [DRY] {r2_key} ({size_mb:.2f} MB)')
            ok += 1
            continue
        try:
            with open(local_path, 'rb') as fobj:
                s3.put_object(Bucket=bucket, Key=r2_key, Body=fobj, ContentType='video/mp4')
            print(f'  OK {r2_key} ({size_mb:.2f} MB)')
            ok += 1
        except Exception as e:
            print(f'  NG {r2_key}: {e}')
            ng += 1

    print()
    print(f'完了: {ok} 成功, {ng} 失敗')
    return 1 if ng else 0

if __name__ == '__main__':
    sys.exit(main())
