export interface NewsItem {
  readonly id: string;
  readonly date: string;
  readonly title: string;
  readonly href: string;
}

export const newsItems: NewsItem[] = [
  {
    id: 'news-1',
    date: '2026年2月28日',
    title: '爆ガチャ オープンのお知らせ',
    href: '/news/1',
  },
  {
    id: 'news-2',
    date: '2026年2月28日',
    title: '新規登録で無料ガチャプレゼントキャンペーン開催中！',
    href: '/news/2',
  },
  {
    id: 'news-3',
    date: '2026年2月28日',
    title: 'ポケモンカード新弾入荷のお知らせ',
    href: '/news/3',
  },
] as const;
