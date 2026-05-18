/** Phục vụ lọc slot theo ngày/tuần (giờ local trình duyệt). */

function startOfWeekMonday(ref: Date): Date {
  const x = new Date(ref);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeekSunday(ref: Date): Date {
  const start = startOfWeekMonday(ref);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function slotOnLocalDay(slotIso: string, ref: Date, dayOffset: number): boolean {
  const slot = new Date(slotIso);
  const target = new Date(ref);
  target.setDate(target.getDate() + dayOffset);
  return (
    slot.getFullYear() === target.getFullYear() &&
    slot.getMonth() === target.getMonth() &&
    slot.getDate() === target.getDate()
  );
}

export function slotInCurrentCalendarWeek(slotIso: string, ref: Date): boolean {
  const t = new Date(slotIso).getTime();
  return t >= startOfWeekMonday(ref).getTime() && t <= endOfWeekSunday(ref).getTime();
}
