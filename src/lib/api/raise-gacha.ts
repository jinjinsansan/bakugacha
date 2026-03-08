import type { RaiseStep, RaiseCharacterId } from '@/lib/raise-gacha/types';

export type RaisePlayResponse = {
  success: true;
  isLoss: boolean;
  characterId: RaiseCharacterId;
  cardId: string;
  starLevel: number;
  rarity: string;
  hasDonden: boolean;
  steps: RaiseStep[];
  starDisplay: number;
  videoBasePath: string;
  card: {
    serialNumber: string;
    cardId: string;
    cardNumber: string;
    characterId: string;
    rarity: string;
    starLevel: number;
  } | null;
};

export type RaiseQuality = 'high' | 'low';

function fetchWithTimeout(url: string, options: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function startRaiseGacha(
  productId: string,
  quality: RaiseQuality,
  characterId: RaiseCharacterId,
): Promise<RaisePlayResponse> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      '/api/raise-gacha/play',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quality, characterId }),
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
  return data as RaisePlayResponse;
}
