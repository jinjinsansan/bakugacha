export default function TermsPage() {
  return (
    <main className="max-w-[860px] mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-white mb-8">利用規約</h1>
      <div className="card-premium p-6 text-sm text-white/70 leading-relaxed space-y-6">
        <section>
          <h2 className="text-base font-bold text-white mb-2">第1条（適用）</h2>
          <p>本規約は、爆ガチャ（以下「当サービス」）の利用に関する条件を定めるものです。ユーザーは本規約に同意の上、当サービスをご利用ください。</p>
        </section>
        <section>
          <h2 className="text-base font-bold text-white mb-2">第2条（利用登録）</h2>
          <p>当サービスの利用にはLINEアカウントによるログインが必要です。登録情報に虚偽がある場合、利用をお断りすることがあります。</p>
        </section>
        <section>
          <h2 className="text-base font-bold text-white mb-2">第3条（コインの購入・利用）</h2>
          <p>コインは当サービス内でのガチャプレイに使用できます。購入済みのコインは原則として返金いたしません。</p>
        </section>
        <section>
          <h2 className="text-base font-bold text-white mb-2">第4条（禁止事項）</h2>
          <p>不正アクセス、他のユーザーへの迷惑行為、転売目的の利用、その他当サービスの運営を妨害する行為を禁止します。</p>
        </section>
        <section>
          <h2 className="text-base font-bold text-white mb-2">第5条（免責事項）</h2>
          <p>当サービスは現状有姿で提供され、ガチャの結果について保証するものではありません。通信環境等による不具合について、当社は責任を負いません。</p>
        </section>
        <p className="text-xs text-white/40 pt-4 border-t border-white/10">※ 本規約の詳細は準備中です。正式版を公開次第、本ページを更新いたします。</p>
      </div>
    </main>
  );
}
