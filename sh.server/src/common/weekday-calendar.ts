/**
 * Ngày lịch (YYYY-MM-DD) theo UTC — so khớp slot hệ thống (T2–T6).
 */

function parseUtcDateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatUtcDateOnly(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 0 = CN … 6 = T7 */
export function utcDayOfWeekFromIso(iso: string): number {
  return parseUtcDateOnly(iso).getUTCDay();
}

export function isWeekendIsoDate(iso: string): boolean {
  const w = utcDayOfWeekFromIso(iso);
  return w === 0 || w === 6;
}

/** Các ngày thứ 2–thứ 6 (inclusive) trong khoảng start–end. */
export function listWeekdayIsoDatesInRange(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = parseUtcDateOnly(start);
  const last = parseUtcDateOnly(end);
  while (cur.getTime() <= last.getTime()) {
    const w = cur.getUTCDay();
    if (w >= 1 && w <= 5) {
      out.push(formatUtcDateOnly(cur));
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}
