/**
 * html2canvas でカードDOM → PNG変換 → ダウンロード
 */
export async function downloadCardAsPng(
  element: HTMLElement,
  serialNumber: string,
): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;

  // PNG保存用: ライトスウィープ非表示 & アニメーション一時停止
  element.setAttribute('data-capturing', '');

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `keiba-card-${serialNumber}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    element.removeAttribute('data-capturing');
  }
}
