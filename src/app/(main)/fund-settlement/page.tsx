import { BRAND } from '@/lib/brand';

export const metadata = { title: '資金決済法に基づく表示' };

export default function FundSettlementPage() {
  const rows: [string, React.ReactNode][] = [
    ['前払式支払手段の名称', `${BRAND.name}コイン`],
    ['発行者', '合同会社KK企画'],
    ['支払可能金額等の上限', '【要確認】1回あたり・保有上限の定めがある場合は記載'],
    ['有効期限', '【要確認】最終利用日からの期間または無期限の別を記載'],
    ['利用可能な範囲', `${BRAND.name}内におけるガチャの利用に限ります（現金への払戻し・第三者への譲渡はできません）`],
    ['未使用残高の確認方法', 'マイページのコイン残高表示にてご確認いただけます'],
    ['利用上の注意', 'コインの購入後の払戻しは、法令に基づく場合を除き原則として行いません'],
    ['苦情・相談窓口', '公式LINE または お問い合わせページ'],
    ['利用約款', '利用規約に定めるところによります'],
  ];

  return (
    <main className="max-w-[860px] mx-auto px-4 py-10">
      <h1 className="headline-serif text-2xl mb-8">資金決済法に基づく表示</h1>
      <div className="card-premium p-6 text-sm text-white/70 leading-relaxed">
        <p className="mb-5">
          {BRAND.name}コインは、資金決済に関する法律上の前払式支払手段（自家型）に該当します。同法に基づき、以下のとおり表示します。
        </p>
        <table className="w-full">
          <tbody className="divide-y divide-white/10">
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th className="text-left text-white font-bold py-3 pr-4 align-top whitespace-nowrap w-44">{label}</th>
                <td className="py-3">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-white/40 pt-5 mt-2 border-t border-white/10">
          ※ 本表示は弁護士監修前のたたき台です。前払式支払手段の発行額によっては財務局への届出・登録や供託等が必要となる場合があります。発行形態・上限・有効期限を確定のうえ、正式版に更新してください。
        </p>
      </div>
    </main>
  );
}
