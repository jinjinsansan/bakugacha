import type { KeibaStep } from '@/lib/keiba-gacha/types';

export type KeibaPlayResponse = {
  success: true;
  isWin: boolean;
  charaId: string;
  courseId: string;
  charaName: string;
  charaWeight: string;
  expectationStars: number;
  raceName: string;
  distance: string;
  trackCondition: string;
  steps: KeibaStep[];
  videoBasePath: string;
};

export type KeibaQuality = 'high' | 'low';

function fetchWithTimeout(url: string, options: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function startKeibaGacha(productId: string, quality: KeibaQuality = 'high'): Promise<KeibaPlayResponse> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      '/api/keiba-gacha/play',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quality }),
      },
      30000,
    );
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('通信がタイムアウトしました。再試行してください。');
    }
    throw e;
  }
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? 'ガチャの開始に失敗しました。');
  }
  return data as KeibaPlayResponse;
}
