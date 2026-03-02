export default function ContactPage() {
  return (
    <main className="max-w-[860px] mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-white mb-8">お問い合わせ</h1>
      <div className="card-premium p-6 text-sm text-white/70 leading-relaxed space-y-6">
        <p>爆ガチャに関するご質問・ご要望・不具合のご報告は、以下の方法でお問い合わせください。</p>

        <section>
          <h2 className="text-base font-bold text-white mb-2">LINE公式アカウント</h2>
          <p>LINEの公式アカウントからお気軽にメッセージをお送りください。通常1〜2営業日以内にご返信いたします。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2">メール</h2>
          <p>メールでのお問い合わせは準備中です。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2">営業時間</h2>
          <p>平日 10:00〜18:00（土日祝日・年末年始を除く）</p>
        </section>

        <p className="text-xs text-white/40 pt-4 border-t border-white/10">※ お問い合わせフォームは準備中です。しばらくの間、LINE公式アカウントよりご連絡ください。</p>
      </div>
    </main>
  );
}
