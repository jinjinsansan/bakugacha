// ── 来世ガチャ（健太編）カード定義 ─────────────────────────────
// tensei プロジェクトの kenta-cards.ts / kenta-donden.ts に準拠
import type { RaiseCardDef, RaiseDondenRoute } from './types';

/**
 * 健太編 13枚（ハズレ + ★1〜12）
 * ★1-2: mainSceneSteps=2, ★3-6: 3, ★7-10: 4, ★11-12: 5
 */
const KENTA_CARD_DEFS: RaiseCardDef[] = [
  {
    cardId: 'hazure',
    name: '転生失敗',
    title: 'この来世は見つかりませんでした...',
    rarity: 'N',
    starLevel: 0,
    mainSceneSteps: 0,
    cardNumber: 'RK00',
    illustFile: 'kenta_hazure.png',
    effectText: '夢破れし者が手にする一枚。だが、来世への希望は消えない。次こそ、運命を変えてみせる。',
  },
  {
    cardId: 'c01',
    name: 'コンビニ夜勤バイト',
    title: '闇のレジ番',
    rarity: 'N',
    starLevel: 1,
    mainSceneSteps: 2,
    cardNumber: 'RK01',
    illustFile: 'kenta_card01_convenience.png',
    effectText: '深夜のコンビニで幽霊客と常連に挟まれる庶民ルート。',
  },
  {
    cardId: 'c02',
    name: '派遣倉庫作業員',
    title: '終わらない仕分け',
    rarity: 'N',
    starLevel: 2,
    mainSceneSteps: 2,
    cardNumber: 'RK02',
    illustFile: 'kenta_card02_warehouse.png',
    effectText: '巨大倉庫で黙々と荷物をさばき、汗で未来を切り開くルート。',
  },
  {
    cardId: 'c03',
    name: '底辺YouTuber',
    title: '再生数10の壁',
    rarity: 'R',
    starLevel: 3,
    mainSceneSteps: 3,
    cardNumber: 'RK03',
    illustFile: 'kenta_card03_youtuber.png',
    effectText: '投稿ボタンを押すたびに再生数を祈る、底辺配信者の奮闘。',
  },
  {
    cardId: 'c04',
    name: '地方公務員',
    title: '窓口ルーティン',
    rarity: 'R',
    starLevel: 4,
    mainSceneSteps: 3,
    cardNumber: 'RK04',
    illustFile: 'kenta_card04_civil_servant.png',
    effectText: '役所カウンターの静寂で、慎重に「市民の声」と向き合う毎日。',
  },
  {
    cardId: 'c05',
    name: 'ラーメン屋店主',
    title: '魂の一杯',
    rarity: 'SR',
    starLevel: 5,
    mainSceneSteps: 3,
    cardNumber: 'RK05',
    illustFile: 'kenta_card05_ramen.png',
    effectText: '魂のスープを仕込み、湯気の向こうに行列を夢見る屋台主。',
  },
  {
    cardId: 'c06',
    name: 'プロボクサー',
    title: 'リングの覚悟',
    rarity: 'SR',
    starLevel: 6,
    mainSceneSteps: 3,
    cardNumber: 'RK06',
    illustFile: 'kenta_card06_boxer.png',
    effectText: '血と汗と挑戦状。ゴングにすべてを賭けるリングサイド。',
  },
  {
    cardId: 'c07',
    name: '天才外科医',
    title: '一刀入魂',
    rarity: 'SSR',
    starLevel: 7,
    mainSceneSteps: 4,
    cardNumber: 'RK07',
    illustFile: 'kenta_card07_surgeon.png',
    effectText: '命を預かる手が震えを知らない、閃光のスカルペル。',
  },
  {
    cardId: 'c08',
    name: '実業家',
    title: '摩天楼の野望',
    rarity: 'SSR',
    starLevel: 8,
    mainSceneSteps: 4,
    cardNumber: 'RK08',
    illustFile: 'kenta_card08_business.png',
    effectText: '摩天楼の頂から次の市場を睨む、連続起業家の野望。',
  },
  {
    cardId: 'c09',
    name: '異世界傭兵',
    title: '剣と契約',
    rarity: 'UR',
    starLevel: 9,
    mainSceneSteps: 4,
    cardNumber: 'RK09',
    illustFile: 'kenta_card09_mercenary.png',
    effectText: '異世界で剣と契約を交わし、運命を金色に塗り替える傭兵。',
  },
  {
    cardId: 'c10',
    name: '伝説のロックスター',
    title: '轟音の祝祭',
    rarity: 'UR',
    starLevel: 10,
    mainSceneSteps: 4,
    cardNumber: 'RK10',
    illustFile: 'kenta_card10_rockstar.png',
    effectText: '満員アリーナを轟音で掌握する、伝説級フロントマン。',
  },
  {
    cardId: 'c11',
    name: '魔王',
    title: '禍々しき覇王',
    rarity: 'LR',
    starLevel: 11,
    mainSceneSteps: 5,
    cardNumber: 'RK11',
    illustFile: 'kenta_card11_demon_lord.png',
    effectText: '禍々しい玉座で世界を見下ろす、恐怖の支配者。',
  },
  {
    cardId: 'c12',
    name: '勇者',
    title: '光の継承者',
    rarity: 'LR',
    starLevel: 12,
    mainSceneSteps: 5,
    mainStepNumbers: [1, 3, 4, 5],
    cardNumber: 'RK12',
    illustFile: 'kenta_card12_hero.png',
    effectText: '聖剣と共に光を継ぎ、最後の希望として立ち上がる勇者。',
  },
];

/** 健太編 どんでん返しルート（10本） */
export const KENTA_DONDEN_ROUTES: RaiseDondenRoute[] = [
  { fromCardId: 'c01', toCardId: 'c05' },
  { fromCardId: 'c01', toCardId: 'c07' },
  { fromCardId: 'c02', toCardId: 'c06' },
  { fromCardId: 'c02', toCardId: 'c08' },
  { fromCardId: 'c03', toCardId: 'c10' },
  { fromCardId: 'c04', toCardId: 'c09' },
  { fromCardId: 'c05', toCardId: 'c08' },
  { fromCardId: 'c06', toCardId: 'c09' },
  { fromCardId: 'c07', toCardId: 'c11' },
  { fromCardId: 'c08', toCardId: 'c12' },
];

/** cardId → カード定義 */
export const KENTA_CARD_MAP = new Map<string, RaiseCardDef>(
  KENTA_CARD_DEFS.map((c) => [c.cardId, c]),
);

/** 全カード定義の配列 */
export const ALL_KENTA_CARDS = KENTA_CARD_DEFS;

/** ★レベルからカードを取得 */
export function getKentaCardByStarLevel(starLevel: number): RaiseCardDef | undefined {
  return KENTA_CARD_DEFS.find((c) => c.starLevel === starLevel);
}
