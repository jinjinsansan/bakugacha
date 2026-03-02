export default function PrivacyPage() {
  return (
    <main className="max-w-[860px] mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-white mb-8">プライバシーポリシー</h1>
      <div className="card-premium p-6 text-sm text-white/70 leading-relaxed space-y-6">
        <section>
          <h2 className="text-base font-bold text-white mb-2">1. 収集する情報</h2>
          <p>当サービスでは、LINEアカウント情報（表示名・プロフィール画像）、メールアドレス、ガチャ利用履歴、コイン取引履歴を取得します。</p>
        </section>
        <section>
          <h2 className="text-base font-bold text-white mb-2">2. 利用目的</h2>
          <p>取得した情報は、サービスの提供・改善、当選連絡、お問い合わせ対応、不正利用防止の目的に限り使用します。</p>
        </section>
        <section>
          <h2 className="text-base font-bold text-white mb-2">3. 第三者提供</h2>
          <p>法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報を提供することはありません。</p>
        </section>
        <section>
          <h2 className="text-base font-bold text-white mb-2">4. 情報の管理</h2>
          <p>個人情報は適切なセキュリティ対策を講じて管理し、不正アクセス・漏洩の防止に努めます。</p>
        </section>
        <section>
          <h2 className="text-base font-bold text-white mb-2">5. お問い合わせ</h2>
          <p>個人情報の開示・訂正・削除をご希望の場合は、お問い合わせページよりご連絡ください。</p>
        </section>
        <p className="text-xs text-white/40 pt-4 border-t border-white/10">※ 本ポリシーの詳細は準備中です。正式版を公開次第、本ページを更新いたします。</p>
      </div>
    </main>
  );
}
