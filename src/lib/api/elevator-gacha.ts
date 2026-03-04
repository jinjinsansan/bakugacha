import type { ElevatorFloor } from '@/lib/elevator-gacha/types';

export type ElevatorPlayResponse = {
  success: true;
  isWin: boolean;
  isDonten: boolean;
  floors: ElevatorFloor[];
  videoBasePath: string;
  expectationStars: number;
  scenarioCode: string;
  countdownSeconds: number;
};

export type ElevatorQuality = 'high' | 'low';

function fetchWithTimeout(url: string, options: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function startElevatorGacha(productId: string, quality: ElevatorQuality = 'high'): Promise<ElevatorPlayResponse> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      '/api/elevator-gacha/play',
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
  return data as ElevatorPlayResponse;
}
