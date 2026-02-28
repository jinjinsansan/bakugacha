const BASE = process.env.NEXT_PUBLIC_GACHA_ASSET_BASE_URL?.replace(/\/+$/, '') ?? '/videos';

export function buildGachaAssetPath(...segments: (string | number | undefined | null)[]): string {
  const parts = segments
    .filter((s): s is string | number => s !== undefined && s !== null)
    .map((s) => String(s).replace(/^\/+|\/+$/g, ''))
    .filter(Boolean);
  return `${BASE}/${parts.join('/')}`;
}

export function buildCommonAssetPath(...segments: (string | number | undefined | null)[]): string {
  return buildGachaAssetPath('common', ...segments);
}
