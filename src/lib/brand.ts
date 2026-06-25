/**
 * ブランド情報の単一ソース。
 * リブランド時は原則このファイルだけを編集する。
 *
 * 注意（ここに含めない／変更しないもの）:
 *  - R2 バケット名 `bakugacha`（src/lib/r2/upload.ts）… 変更すると全アセット再アップが必要
 *  - セッション Cookie 名 `bakugatcha_session`（src/lib/session/cookie.ts）… 変更すると全ユーザーが再ログイン
 *  - ゲーム内キャラクター名「バクガチャヒメ / 爆ガチャ姫」（競馬ガチャ）… ブランドとは別物
 *  - DB の値・マイグレーション・各種アップロードスクリプトのパス … 内部識別子
 */
export const BRAND = {
  /** 表示名（日本語） */
  name: 'ガチャパ',
  /** 英字（ローマ字）表記 — ヘッダーのサブタイトルや英語 metadata 用 */
  nameEn: 'GACHAPA',
  /** サイトのキャッチコピー */
  tagline: '最高のガチャ体験',
  /**
   * ドメイン（Cloudflare で取得後に確定）。
   * 実際のサイト URL は環境変数 NEXT_PUBLIC_SITE_URL を使用すること。
   */
  domain: 'gachapa.jp',
} as const;
