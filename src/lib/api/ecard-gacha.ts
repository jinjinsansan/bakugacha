import type { EcardStep } from '@/lib/ecard-gacha/types';

export type EcardPlayResponse = {
  success: true;
  isWin: boolean;
  isDonten: boolean;
  sequence: EcardStep[];
  videoBasePath: string;
  expectationStars: number;
  scenarioCode: string;
};

export type EcardQuality = 'high' | 'low';

function fetchWithTimeout(url: string, options: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function startEcardGacha(productId: string, quality: EcardQuality = 'high'): Promise<EcardPlayResponse> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      '/api/ecard-gacha/play',
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
  return data as EcardPlayResponse;
}
