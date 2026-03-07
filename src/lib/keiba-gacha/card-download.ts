/**
 * html2canvas でカードDOM → PNG変換 → ダウンロード
 * iOS Safari は <a download> が効かないため Blob URL + share/open にフォールバック
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

    const fileName = `keiba-card-${serialNumber}.png`;

    // canvas → Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/png',
      );
    });

    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

    // iOS: Web Share API (ファイル共有) → フォールバックで新タブ表示
    if (isIOS) {
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        // Share API 非対応時は Blob URL を新タブで開く（長押しで保存可能）
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
      return;
    }

    // 非iOS: 従来の <a download> 方式
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } finally {
    element.removeAttribute('data-capturing');
  }
}
