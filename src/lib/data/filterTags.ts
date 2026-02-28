export interface FilterTag {
  readonly id: string;
  readonly label: string;
}

export const filterTags: FilterTag[] = [
  { id: 'beginner', label: '#初心者向け' },
  { id: 'low-price', label: '#低単価' },
  { id: 'high-price', label: '#高単価' },
  { id: 'small', label: '#小口' },
  { id: 'jackpot', label: '#1等超豪華' },
  { id: 'mystery', label: '#ミステリー' },
  { id: 'guarantee', label: '#最低保証' },
  { id: 'half-ad', label: '#1/2アド' },
  { id: 'high-loop', label: '#高ループ' },
  { id: '319', label: '#319' },
  { id: 'box', label: '#BOX' },
] as const;
