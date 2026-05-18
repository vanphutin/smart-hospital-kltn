/** Ngày lịch YYYY-MM-DD theo UTC — khớp rule T2–T6 trên server */

function parseUtcDateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function utcDayOfWeekFromIso(iso: string): number {
  return parseUtcDateOnly(iso).getUTCDay();
}

export function isWeekendIsoDate(iso: string): boolean {
  const w = utcDayOfWeekFromIso(iso);
  return w === 0 || w === 6;
}

export function listWeekdayIsoDatesInRange(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = parseUtcDateOnly(start);
  const last = parseUtcDateOnly(end);
  while (cur.getTime() <= last.getTime()) {
    const w = cur.getUTCDay();
    if (w >= 1 && w <= 5) {
      const y = cur.getUTCFullYear();
      const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
      const day = String(cur.getUTCDate()).padStart(2, '0');
      out.push(`${y}-${m}-${day}`);
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/** Bỏ qua T7/CN, trả về ngày T2–T6 đầu tiên từ `iso` trở đi */
export function firstWeekdayOnOrAfter(iso: string, addDays: (d: string, n: number) => string): string {
  let d = iso;
  let guard = 0;
  while (isWeekendIsoDate(d) && guard < 14) {
    d = addDays(d, 1);
    guard += 1;
  }
  return d;
}

export function formatWorkdaysShortVi(isoDates: string[]): string {
  if (isoDates.length === 0) return '—';
  const parts = isoDates.map((iso) =>
    new Date(iso + 'T12:00:00Z').toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
  );
  if (isoDates.length <= 4) return parts.join(' · ');
  return `${parts[0]} → ${parts[parts.length - 1]} (${isoDates.length} ngày làm việc)`;
}
