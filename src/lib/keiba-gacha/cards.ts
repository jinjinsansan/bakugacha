// ── 競馬ガチャ デジタルカード定義 ─────────────────────────────

export type CardRarity = 'rainbow' | 'gold' | 'silver' | 'bronze' | 'simple';

export interface KeibaCardDef {
  charaId: string;
  name: string;
  ruby?: string;
  stars: number;
  rarity: CardRarity;
  cardNumber: string;
  attribute: 'light' | 'dark' | 'wind' | 'fire' | 'earth';
  attributeEmoji: string;
  typeLine: string;
  effectText: string;
  atk: number;
  def: number;
  illustFile: string;  // R2 key under keiba-cards/
}

const CARD_DEFS: KeibaCardDef[] = [
  {
    charaId: 'hazure',
    name: 'ハズレ',
    stars: 1,
    rarity: 'simple',
    cardNumber: 'JP000',
    attribute: 'earth',
    attributeEmoji: '💀',
    typeLine: '【騎馬族／通常】',
    effectText: '夢破れし者が手にする一枚。だが、この札を多く持つ者こそ、真の挑戦者と呼ばれる。いつか必ず、栄光は訪れる。',
    atk: 0,
    def: 0,
    illustFile: 'hazure.png',
  },
  {
    charaId: 'shirogane',
    name: '白銀',
    ruby: 'しろがね',
    stars: 3,
    rarity: 'bronze',
    cardNumber: 'JP001',
    attribute: 'light',
    attributeEmoji: '☀️',
    typeLine: '【騎馬族／効果】',
    effectText: 'かつて伝説と呼ばれた白の貴公子。その瞳には、まだ見ぬ栄光が宿っている。芝の上に降り立つ姿は、まるで神話の一頁。',
    atk: 1800,
    def: 1600,
    illustFile: 'A-01_shirogane.png',
  },
  {
    charaId: 'darkbolt',
    name: 'ダークボルト',
    stars: 5,
    rarity: 'gold',
    cardNumber: 'JP002',
    attribute: 'dark',
    attributeEmoji: '🌑',
    typeLine: '【騎馬族／効果】',
    effectText: '深夜の競馬場に現れる漆黒の稲妻。その蹄が大地を蹴るたび、観客は言葉を失い、ただ息を呑む。',
    atk: 2200,
    def: 900,
    illustFile: 'A-02_darkbolt.png',
  },
  {
    charaId: 'aoikaze',
    name: '蒼風',
    ruby: 'あおいかぜ',
    stars: 4,
    rarity: 'silver',
    cardNumber: 'JP003',
    attribute: 'wind',
    attributeEmoji: '💨',
    typeLine: '【騎馬族／効果】',
    effectText: '青き鬣をなびかせ、風と共に駆ける者。第四コーナーを曲がる瞬間、その青は空の色と溶け合う。',
    atk: 1700,
    def: 1400,
    illustFile: 'A-03_aoikaze.png',
  },
  {
    charaId: 'honohime',
    name: '炎姫',
    ruby: 'ほのおひめ',
    stars: 4,
    rarity: 'silver',
    cardNumber: 'JP004',
    attribute: 'fire',
    attributeEmoji: '🔥',
    typeLine: '【騎馬族／効果】',
    effectText: '燃え盛る炎を纏う紅蓮の女王。敵なしと言われた無敗の記録は、今も語り継がれる伝説となった。',
    atk: 2100,
    def: 1000,
    illustFile: 'A-04_honoohime.png',
  },
  {
    charaId: 'fuwarin',
    name: 'フワリン',
    stars: 2,
    rarity: 'simple',
    cardNumber: 'JP005',
    attribute: 'light',
    attributeEmoji: '☀️',
    typeLine: '【騎馬族／効果】',
    effectText: 'ふわりふわりと、まるで夢の中を走るよう。その愛らしい走りに、今日もスタンドから歓声が上がる。',
    atk: 1200,
    def: 1800,
    illustFile: 'A-05_fuwarin.png',
  },
  {
    charaId: 'bakugachahime',
    name: '爆ガチャ姫',
    stars: 5,
    rarity: 'gold',
    cardNumber: 'JP006',
    attribute: 'light',
    attributeEmoji: '☀️',
    typeLine: '【騎馬族／特殊効果】',
    effectText: 'ガチャの女神が降臨する瞬間、全ての馬券師は手を合わせ祈りを捧げる。この一枚を手にした者に、奇跡が訪れると言われている。',
    atk: 2500,
    def: 2000,
    illustFile: 'A-06_bakugachahime.png',
  },
  {
    charaId: 'umaoyaji',
    name: '馬おやじ',
    stars: 6,
    rarity: 'rainbow',
    cardNumber: 'JP007',
    attribute: 'earth',
    attributeEmoji: '🌍',
    typeLine: '【騎馬族／伝説】',
    effectText: '10人のおっさんが本気で走る。これが伝説だ。誰も信じなかったが、この一枚を引いた者だけが真実を知る。',
    atk: 3246,
    def: 3246,
    illustFile: 'A-07_umaoyaji.png',
  },
];

/** charaId → カード定義 */
export const KEIBA_CARD_MAP = new Map<string, KeibaCardDef>(
  CARD_DEFS.map((c) => [c.charaId, c]),
);

/** 全カード定義の配列 */
export const ALL_KEIBA_CARDS = CARD_DEFS;

/** レアリティ → CSSクラス名 */
export function getRarityClass(rarity: CardRarity): string {
  switch (rarity) {
    case 'rainbow': return 'rarity-rainbow';
    case 'gold':    return 'rarity-gold';
    case 'silver':  return 'rarity-silver';
    case 'bronze':  return 'rarity-bronze';
    case 'simple':  return 'rarity-simple';
  }
}

/** カードイラストのR2パスを組み立て */
export function getCardIllustUrl(illustFile: string): string {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(/\/+$/, '') ?? '';
  return `${base}/keiba-cards/${illustFile}`;
}
