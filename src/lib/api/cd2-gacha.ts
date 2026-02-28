import type { Cd2Step } from '@/lib/cd2-gacha/types';

export type Cd2PlayResponse = {
  success: true;
  isWin: boolean;
  isDonden: boolean;
  isPatlite: boolean;
  isFreeze: boolean;
  sequence: Cd2Step[];
  videoBasePath: string;
  expectationStars: number;
};

function fetchWithTimeout(url: string, options: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function startCd2Gacha(): Promise<Cd2PlayResponse> {
  let res: Response;
  try {
    res = await fetchWithTimeout('/api/cd2-gacha/play', { method: 'POST' }, 30000);
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
  return data as Cd2PlayResponse;
}
