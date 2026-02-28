'use client';

import { useCallback } from 'react';

// 署名なし（公開URL）で動画を提供する簡易実装
// R2連携後は signed URL に切り替え
export function useSignedAssetResolver(_sources: readonly string[]) {
  const resolveAssetSrc = useCallback((src: string) => src, []);
  return { resolveAssetSrc, loading: false };
}
