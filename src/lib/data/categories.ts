export interface Category {
  readonly id: string;
  readonly label: string;
}

export const categories: Category[] = [
  { id: 'all', label: 'すべて' },
  { id: 'pokemon', label: 'ポケモン' },
  { id: 'onepiece', label: 'ワンピース' },
  { id: 'yugioh', label: '遊戯王' },
  { id: 'gift', label: 'ギフト券' },
  { id: 'game', label: 'ゲーム機' },
] as const;
