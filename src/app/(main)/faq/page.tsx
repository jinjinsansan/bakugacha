export default function FaqPage() {
  const faqs = [
    { q: 'ガチャは無料で引けますか？', a: '新規登録ボーナスや友達紹介ボーナスのコインを使って無料でお楽しみいただけます。コインが足りない場合は購入も可能です。' },
    { q: '当選した場合はどうなりますか？', a: '当選確定後、事務局よりLINEまたはメールにてご連絡いたします。発送先などの情報をお伺いした後、商品をお届けします。' },
    { q: 'コインの有効期限はありますか？', a: '現在、コインに有効期限はありません。ご購入いただいたコインはいつでもご利用いただけます。' },
    { q: '1つの商品に何回でもガチャを引けますか？', a: '在庫（提供回数）がある限り、何度でもガチャを引くことができます。' },
    { q: 'コインの返金はできますか？', a: 'デジタルコンテンツの性質上、購入済みコインの返金は原則としてお受けしておりません。' },
    { q: '対応ブラウザを教えてください', a: 'Chrome, Safari, Edge 等のモダンブラウザの最新版に対応しています。LINEアプリ内ブラウザでもご利用いただけます。' },
  ];

  return (
    <main className="max-w-[860px] mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-white mb-8">よくある質問</h1>
      <div className="flex flex-col gap-3">
        {faqs.map((faq, i) => (
          <div key={i} className="card-premium p-5">
            <h2 className="text-sm font-bold text-gold mb-2">Q. {faq.q}</h2>
            <p className="text-sm text-white/60">A. {faq.a}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
