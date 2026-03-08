#!/usr/bin/env python3
"""
来世ガチャ映像・カード画像をbakugatcha R2にアップロードするスクリプト

映像ソース: tensei プロジェクトの 健太映像/ 昭一映像/
カード画像: tensei プロジェクトの kenta_cards/ shoichi_cards_v2/ (プレーンイラスト)

R2 アップロード先:
  raise-kenta/   ← 健太映像/*.mp4
  raise-shoichi/  ← 昭一映像/*.mp4
  raise-cards/    ← カード画像*.png

Usage:
    python scripts/upload-raise-to-r2.py
    python scripts/upload-raise-to-r2.py --dry-run
"""
import sys
import mimetypes
from pathlib import Path
import boto3

TENSEI_ROOT = Path(__file__).resolve().parent.parent.parent / 'tensei'

# 映像ソースフォルダ → R2 プレフィックス
VIDEO_SOURCES = [
    (TENSEI_ROOT / '健太映像',  'raise-kenta'),
    (TENSEI_ROOT / '昭一映像',  'raise-shoichi'),
]

# 健太カード: kenta_cards/ はプレフィックスなし + 一部名称違いがあるため明示マッピング
KENTA_CARD_MAP = [
    ('card01_convenience.png',   'kenta_card01_convenience.png'),
    ('card02_warehouse.png',     'kenta_card02_warehouse.png'),
    ('card03_youtuber.png',      'kenta_card03_youtuber.png'),
    ('card04_civil_servant.png', 'kenta_card04_civil_servant.png'),
    ('card05_ramen.png',         'kenta_card05_ramen.png'),
    ('card06_boxer.png',         'kenta_card06_boxer.png'),
    ('card07_surgeon.png',       'kenta_card07_surgeon.png'),
    ('card08_business_owner.png','kenta_card08_business.png'),    # business_owner → business
    ('card09_mercenary.png',     'kenta_card09_mercenary.png'),
    ('card10_rockstar.png',      'kenta_card10_rockstar.png'),
    ('card11_demon_king.png',    'kenta_card11_demon_lord.png'),  # demon_king → demon_lord
    ('card12_hero.png',          'kenta_card12_hero.png'),
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
    if ext in ('.jpg', '.jpeg'):
        return 'image/jpeg'
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

    # アップロード対象を収集
    tasks = []

    for src_dir, prefix in VIDEO_SOURCES:
        if not src_dir.exists():
            print(f'[WARN] {src_dir} が見つかりません、スキップ')
            continue
        for f in sorted(src_dir.glob('*.mp4')):
            tasks.append((f, f'{prefix}/{f.name}'))

    # 健太カード (明示マッピング)
    kenta_dir = TENSEI_ROOT / 'kenta_cards'
    if not kenta_dir.exists():
        print(f'[WARN] {kenta_dir} が見つかりません、スキップ')
    else:
        for src_name, dst_name in KENTA_CARD_MAP:
            src = kenta_dir / src_name
            if src.exists():
                tasks.append((src, f'raise-cards/{dst_name}'))
            else:
                print(f'[WARN] {src} が見つかりません、スキップ')

    # 正一カード (shoichi_cards_v2/ はファイル名そのまま)
    shoichi_dir = TENSEI_ROOT / 'shoichi_cards_v2'
    if not shoichi_dir.exists():
        print(f'[WARN] {shoichi_dir} が見つかりません、スキップ')
    else:
        for f in sorted(shoichi_dir.glob('shoichi_card*.png')):
            tasks.append((f, f'raise-cards/{f.name}'))

    if not tasks:
        print('アップロード対象が見つかりません')
        sys.exit(1)

    print(f'{"[DRY RUN] " if dry_run else ""}合計 {len(tasks)} ファイル → R2 バケット: {bucket}')
    print()

    ok = 0
    ng = 0
    for local_path, r2_key in tasks:
        size_mb = local_path.stat().st_size / (1024 * 1024)
        ct = get_content_type(local_path)
        if dry_run:
            print(f'  [DRY] {r2_key} ({size_mb:.2f} MB, {ct})')
            ok += 1
            continue
        try:
            with open(local_path, 'rb') as fobj:
                s3.put_object(Bucket=bucket, Key=r2_key, Body=fobj, ContentType=ct)
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
