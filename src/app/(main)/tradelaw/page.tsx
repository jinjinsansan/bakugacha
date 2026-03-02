export default function TradelawPage() {
  return (
    <main className="max-w-[860px] mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-white mb-8">特定商取引法に基づく表記</h1>
      <div className="card-premium p-6 text-sm text-white/70 leading-relaxed">
        <table className="w-full">
          <tbody className="divide-y divide-white/10">
            {[
              ['販売業者', '準備中'],
              ['運営統括責任者', '準備中'],
              ['所在地', '準備中'],
              ['電話番号', '準備中'],
              ['メールアドレス', '準備中'],
              ['販売価格', '各商品ページに記載のコイン数（1コイン＝1円相当）'],
              ['商品代金以外の必要料金', 'なし'],
              ['支払方法', 'クレジットカード等（準備中）'],
              ['支払時期', '購入手続き完了時に即時決済'],
              ['商品の引渡し時期', 'ガチャプレイ後、当選時は事務局より連絡'],
              ['返品・交換', 'デジタルコンテンツの性質上、購入後の返品・返金は原則不可'],
              ['動作環境', 'モダンブラウザ（Chrome, Safari, Edge 等の最新版）'],
            ].map(([label, value]) => (
              <tr key={label}>
                <th className="text-left text-white font-bold py-3 pr-4 align-top whitespace-nowrap w-40">{label}</th>
                <td className="py-3">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-white/40 pt-4 mt-4 border-t border-white/10">※ 一部項目は準備中です。正式な情報が確定次第、更新いたします。</p>
      </div>
    </main>
  );
}
