const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';

export async function sendLineWinNotification(
  lineUserId: string,
  prizeName: string,
): Promise<void> {
  // 大量送信によるアカウント凍結リスクのため一時無効化
  return;
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || !lineUserId) return;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

  const text = [
    '🎉 当選おめでとうございます！',
    '',
    `「${prizeName}」に当選しました。`,
    'マイページから受け取り手続きをお願いします。',
    '',
    `▶ ${siteUrl}/mypage`,
  ].join('\n');

  try {
    await fetch(LINE_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: 'text', text }],
      }),
    });
  } catch (err) {
    // 通知失敗はガチャ結果に影響させない
    console.error('[LINE notify] sendLineWinNotification failed:', err);
  }
}
