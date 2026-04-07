export type AvailabilityStatus =
  | { available: true }
  | { available: false; reason: 'before_open' | 'after_close'; opensAt?: string; closedAt?: string };

export function checkAvailability(
  availableFrom: string | null | undefined,
  availableUntil: string | null | undefined,
): AvailabilityStatus {
  const now = new Date();
  if (availableFrom && new Date(availableFrom) > now) {
    return { available: false, reason: 'before_open', opensAt: availableFrom };
  }
  if (availableUntil && new Date(availableUntil) < now) {
    return { available: false, reason: 'after_close', closedAt: availableUntil };
  }
  return { available: true };
}

export function availabilityErrorMessage(status: AvailabilityStatus): string {
  if (status.available) return '';
  if (status.reason === 'before_open') {
    const d = status.opensAt ? new Date(status.opensAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '';
    return `受付開始前です。開始日時: ${d}`;
  }
  const d = status.closedAt ? new Date(status.closedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '';
  return `受付は終了しました。終了日時: ${d}`;
}
