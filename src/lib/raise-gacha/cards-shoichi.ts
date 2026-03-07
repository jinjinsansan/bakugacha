// ── 来世ガチャ（正一編）カード定義 ─────────────────────────────
// tensei プロジェクトの shoichi-cards.ts / shoichi-donden.ts に準拠
import type { RaiseCardDef, RaiseDondenRoute } from './types';

/**
 * 正一編 13枚（ハズレ + ★1〜12）
 * ★1-2: mainSceneSteps=2, ★3-6: 3, ★7-10: 4, ★11-12: 5
 */
const SHOICHI_CARD_DEFS: RaiseCardDef[] = [
  {
    cardId: 'hazure',
    name: '転生失敗',
    title: 'この来世は見つかりませんでした...',
    rarity: 'N',
    starLevel: 0,
    mainSceneSteps: 0,
    cardNumber: 'RS00',
    illustFile: 'shoichi_hazure.png',
    effectText: '夢破れし者が手にする一枚。だが、来世への希望は消えない。次こそ、運命を変えてみせる。',
  },
  {
    cardId: 'c01',
    name: '魚',
    title: '水槽の金魚',
    rarity: 'N',
    starLevel: 1,
    mainSceneSteps: 2,
    cardNumber: 'RS01',
    illustFile: 'shoichi_card01_fish.png',
    effectText: '暗い水槽の中で静かに揺らめくだけの、息苦しい転生ルート。',
  },
  {
    cardId: 'c02',
    name: '満員電車の男',
    title: '永遠に降りられない電車',
    rarity: 'N',
    starLevel: 2,
    mainSceneSteps: 2,
    cardNumber: 'RS02',
    illustFile: 'shoichi_card02_train.png',
    effectText: '永遠に止まらない満員電車で押しつぶされ続ける、終わりなき通勤地獄。',
  },
  {
    cardId: 'c03',
    name: 'ホスト見習い',
    title: 'モテない夜の戦士',
    rarity: 'R',
    starLevel: 3,
    mainSceneSteps: 3,
    cardNumber: 'RS03',
    illustFile: 'shoichi_card03_host.png',
    effectText: 'ネオン街の片隅で声をかけても誰にも振り向かれない、切ない夜の修行。',
  },
  {
    cardId: 'c04',
    name: '再雇用おじさん',
    title: '定年後の嘱託社員',
    rarity: 'R',
    starLevel: 4,
    mainSceneSteps: 3,
    cardNumber: 'RS04',
    illustFile: 'shoichi_card04_rehire.png',
    effectText: '定年後、元部下に敬語を使いながら小さなデスクで働き続ける現実。',
  },
  {
    cardId: 'c05',
    name: '秋田のクマ',
    title: '人里に降りた熊',
    rarity: 'SR',
    starLevel: 5,
    mainSceneSteps: 3,
    cardNumber: 'RS05',
    illustFile: 'shoichi_card05_bear.png',
    effectText: '秋田の山奥で人里に降りれば迷惑者扱いされる、孤独なクマとしての人生。',
  },
  {
    cardId: 'c06',
    name: 'イケメン無双',
    title: 'マッチングアプリの覇者',
    rarity: 'SR',
    starLevel: 6,
    mainSceneSteps: 3,
    cardNumber: 'RS06',
    illustFile: 'shoichi_card06_ikemen.png',
    effectText: 'マッチングアプリで連日マッチ通知が鳴り止まない、容姿チートな人生。',
  },
  {
    cardId: 'c07',
    name: 'ビーチバー経営者',
    title: 'タイの自由人',
    rarity: 'SSR',
    starLevel: 7,
    mainSceneSteps: 4,
    cardNumber: 'RS07',
    illustFile: 'shoichi_card07_beach_bar.png',
    effectText: 'タイのビーチで夕日を眺めながら、気ままにバーを回す脱サラ自由人。',
  },
  {
    cardId: 'c08',
    name: '逆転上司',
    title: '復讐を超えた部長',
    rarity: 'SSR',
    starLevel: 8,
    mainSceneSteps: 4,
    cardNumber: 'RS08',
    illustFile: 'shoichi_card08_revenge_boss.png',
    effectText: 'かつて自分をいじめた上司を部下に従え、静かに立場を逆転させた部長ルート。',
  },
  {
    cardId: 'c09',
    name: '青春リベンジ',
    title: '22歳の大恋愛',
    rarity: 'UR',
    starLevel: 9,
    mainSceneSteps: 4,
    cardNumber: 'RS09',
    illustFile: 'shoichi_card09_youth_love.png',
    effectText: '二度目の青春で、憧れだったような大恋愛に全力で飛び込むやり直しルート。',
  },
  {
    cardId: 'c10',
    name: '幸せ家庭',
    title: '4人家族の父',
    rarity: 'UR',
    starLevel: 10,
    mainSceneSteps: 4,
    cardNumber: 'RS10',
    illustFile: 'shoichi_card10_happy_family.png',
    effectText: '温かい食卓と子どもたちの笑い声に囲まれた、理想的な家庭持ち人生。',
  },
  {
    cardId: 'c11',
    name: '国際線パイロット',
    title: 'モテモテキャプテン',
    rarity: 'LR',
    starLevel: 11,
    mainSceneSteps: 5,
    cardNumber: 'RS11',
    illustFile: 'shoichi_card11_pilot.png',
    effectText: '世界中の空を飛び回り、憧れの視線を一身に集める国際線キャプテン。',
  },
  {
    cardId: 'c12',
    name: '巨額投資家',
    title: 'プライベートジェットの男',
    rarity: 'LR',
    starLevel: 12,
    mainSceneSteps: 5,
    cardNumber: 'RS12',
    illustFile: 'shoichi_card12_investor.png',
    effectText: 'プライベートジェットで世界を飛び回る、桁違いの資産を持つ投資家。',
  },
];

/** 正一編 どんでん返しルート（10本） */
export const SHOICHI_DONDEN_ROUTES: RaiseDondenRoute[] = [
  { fromCardId: 'c01', toCardId: 'c05' },
  { fromCardId: 'c01', toCardId: 'c07' },
  { fromCardId: 'c02', toCardId: 'c06' },
  { fromCardId: 'c02', toCardId: 'c08' },
  { fromCardId: 'c03', toCardId: 'c09' },
  { fromCardId: 'c03', toCardId: 'c11' },
  { fromCardId: 'c04', toCardId: 'c08' },
  { fromCardId: 'c05', toCardId: 'c10' },
  { fromCardId: 'c06', toCardId: 'c11' },
  { fromCardId: 'c08', toCardId: 'c12' },
];

/** cardId → カード定義 */
export const SHOICHI_CARD_MAP = new Map<string, RaiseCardDef>(
  SHOICHI_CARD_DEFS.map((c) => [c.cardId, c]),
);

/** 全カード定義の配列 */
export const ALL_SHOICHI_CARDS = SHOICHI_CARD_DEFS;

/** ★レベルからカードを取得 */
export function getShoichiCardByStarLevel(starLevel: number): RaiseCardDef | undefined {
  return SHOICHI_CARD_DEFS.find((c) => c.starLevel === starLevel);
}
