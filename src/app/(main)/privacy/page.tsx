export const metadata = { title: 'プライバシーポリシー' };

const SECTIONS: { heading: string; body: React.ReactNode }[] = [
  {
    heading: '1. 事業者情報',
    body: '合同会社KK企画（運営統括責任者：笹栗啓太）は、当サービスにおける個人情報を、個人情報の保護に関する法律その他の関係法令およびガイドラインを遵守し、適切に取り扱います。',
  },
  {
    heading: '2. 取得する情報',
    body: (
      <ul className="list-disc list-inside space-y-1.5 pl-1">
        <li>LINEアカウント情報（表示名・プロフィール画像・識別子）</li>
        <li>メールアドレス等の登録情報</li>
        <li>当選品の発送に必要な氏名・住所・連絡先（当選時に取得）</li>
        <li>ガチャ利用履歴・コイン取引履歴・ログイン履歴</li>
        <li>端末情報、IPアドレス、Cookie等を通じて自動的に取得する情報</li>
      </ul>
    ),
  },
  {
    heading: '3. 利用目的',
    body: (
      <ul className="list-disc list-inside space-y-1.5 pl-1">
        <li>当サービスの提供・本人確認・アカウント管理</li>
        <li>当選連絡および当選品の発送・対応</li>
        <li>コインの購入・付与・残高管理</li>
        <li>お問い合わせ・サポート対応</li>
        <li>不正利用の防止、利用状況の分析、サービスの改善</li>
        <li>重要なお知らせ・キャンペーン等のご案内</li>
      </ul>
    ),
  },
  {
    heading: '4. Cookie等の利用',
    body: '当サービスは、ログイン状態の維持や利用状況の把握のためにCookieおよび類似技術を使用することがあります。ブラウザ設定によりCookieを無効化できますが、その場合、一部機能をご利用いただけないことがあります。',
  },
  {
    heading: '5. 第三者提供',
    body: '当社は、次の場合を除き、あらかじめユーザーの同意を得ることなく個人情報を第三者に提供しません。（1）法令に基づく場合、（2）人の生命・身体・財産の保護に必要な場合、（3）当選品の発送等のために配送事業者へ必要な範囲で提供する場合。',
  },
  {
    heading: '6. 業務委託',
    body: '当社は、利用目的の達成に必要な範囲で、個人情報の取扱いを外部に委託することがあります。この場合、委託先に対して適切な監督を行います。',
  },
  {
    heading: '7. 保有期間',
    body: '個人情報は、利用目的の達成に必要な範囲および法令で定められた期間において保有し、不要となった情報は適切に消去します。',
  },
  {
    heading: '8. 安全管理措置',
    body: '当社は、個人情報の漏洩・滅失・毀損を防止するため、アクセス制御・暗号化通信（SSL）等の適切な安全管理措置を講じます。',
  },
  {
    heading: '9. 開示・訂正・削除等の請求',
    body: 'ユーザーは、当社が保有する自己の個人情報について、開示・訂正・利用停止・削除等を請求できます。ご希望の場合は、お問い合わせページまたは公式LINEよりご連絡ください。本人確認のうえ、法令に従い対応します。',
  },
  {
    heading: '10. 本ポリシーの改定',
    body: '当社は、必要に応じて本ポリシーを改定することがあります。重要な変更がある場合は、当サービス上で通知します。',
  },
  {
    heading: '11. お問い合わせ窓口',
    body: '個人情報の取扱いに関するお問い合わせは、公式LINEまたはお問い合わせページよりご連絡ください。',
  },
];

export default function PrivacyPage() {
  return (
    <main className="max-w-[860px] mx-auto px-4 py-10">
      <h1 className="headline-serif text-2xl mb-8">プライバシーポリシー</h1>
      <div className="card-premium p-6 text-sm text-white/70 leading-relaxed space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.heading}>
            <h2 className="text-base font-bold text-white mb-2">{s.heading}</h2>
            <div>{s.body}</div>
          </section>
        ))}
        <p className="text-xs text-white/40 pt-4 border-t border-white/10">
          制定日：2026年6月25日<br />
          ※ 本ポリシーは弁護士監修前のたたき台です。正式版を公開次第、本ページを更新します。
        </p>
      </div>
    </main>
  );
}
