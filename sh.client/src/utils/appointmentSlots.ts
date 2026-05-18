import type { ApiAppointmentSlot } from '../api/client';

export function formatSlotDateLabel(isoDate: string) {
  const d = new Date(isoDate + 'T12:00:00');
  const weekday = d.toLocaleDateString('vi-VN', { weekday: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return { label: weekday, short: day, full: `${day}/${month}` };
}

export function formatSlotTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function isSlotTimeInFuture(slotTimeIso: string): boolean {
  const t = new Date(slotTimeIso).getTime();
  if (Number.isNaN(t)) return false;
  return t > Date.now();
}

export function groupSlotsByDate(slots: ApiAppointmentSlot[]): Record<string, ApiAppointmentSlot[]> {
  const map: Record<string, ApiAppointmentSlot[]> = {};
  for (const s of slots) {
    const key = s.slotTime.slice(0, 10);
    if (!map[key]) map[key] = [];
    map[key].push(s);
  }
  for (const k of Object.keys(map)) {
    map[k].sort((a, b) => a.slotTime.localeCompare(b.slotTime));
  }
  return map;
}

export function getAvailableDates(slotsByDate: Record<string, ApiAppointmentSlot[]>): string[] {
  return Object.keys(slotsByDate)
    .sort()
    .filter((d) => (slotsByDate[d] ?? []).some((s) => isSlotTimeInFuture(s.slotTime)));
}
