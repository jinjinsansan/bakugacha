export interface FooterLink {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

export interface FooterSection {
  readonly id: string;
  readonly title: string;
  readonly links: FooterLink[];
}

export const footerSections: FooterSection[] = [
  {
    id: 'about',
    title: '爆ガチャについて',
    links: [
      { id: 'terms', label: '利用規約', href: '/terms' },
      { id: 'privacy', label: 'プライバシーポリシー', href: '/privacy' },
      { id: 'tradelaw', label: '特定商取引法に基づく表記', href: '/tradelaw' },
      { id: 'anti-social', label: '反社会的勢力に対する基本方針', href: '/anti-social-policy' },
    ],
  },
  {
    id: 'categories',
    title: 'ガチャカテゴリー',
    links: [
      { id: 'pokemon', label: 'ポケモンカードガチャ', href: '/category/pokemon' },
      { id: 'onepiece', label: 'ワンピースカードガチャ', href: '/category/onepiece' },
      { id: 'yugioh', label: '遊戯王ガチャ', href: '/category/yugioh' },
      { id: 'gift', label: 'Amazonギフト券ガチャ', href: '/category/gift' },
      { id: 'game', label: 'ゲーム機ガチャ', href: '/category/game' },
    ],
  },
  {
    id: 'support',
    title: 'サポート',
    links: [
      { id: 'how-to', label: '遊び方', href: '/how-to-play' },
      { id: 'faq', label: 'よくある質問', href: '/faq' },
      { id: 'contact', label: 'お問い合わせ', href: '/contact' },
    ],
  },
  {
    id: 'account',
    title: 'アカウント',
    links: [
      { id: 'register', label: '新規登録', href: '/register' },
      { id: 'login', label: 'ログイン', href: '/login' },
      { id: 'mypage', label: 'マイページ', href: '/mypage' },
      { id: 'purchase', label: 'コイン購入', href: '/purchase' },
    ],
  },
] as const;
