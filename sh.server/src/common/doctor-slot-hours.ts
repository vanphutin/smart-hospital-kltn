/** Giờ làm việc bác sĩ khi generate slot (giờ địa phương server). */
export const DOCTOR_SLOT_START_HOUR = 8;
export const DOCTOR_SLOT_END_HOUR = 17;
export const DOCTOR_SLOT_INTERVAL_MINUTES = 15;

/** Nghỉ trưa: 11:30–13:00 (không tạo / không hiển thị slot available). */
export const DOCTOR_LUNCH_START_MINUTES = 11 * 60 + 30;
export const DOCTOR_LUNCH_END_MINUTES = 13 * 60;

export function isDoctorLunchBreak(hour: number, minute: number): boolean {
  const t = hour * 60 + minute;
  return t >= DOCTOR_LUNCH_START_MINUTES && t < DOCTOR_LUNCH_END_MINUTES;
}

/** PostgreSQL: `alias.slot_time` không nằm trong giờ nghỉ trưa. */
export function sqlSlotNotInLunchBreak(alias: string): string {
  const col = `EXTRACT(HOUR FROM ${alias}.slot_time) * 60 + EXTRACT(MINUTE FROM ${alias}.slot_time)`;
  return `(${col} < ${DOCTOR_LUNCH_START_MINUTES} OR ${col} >= ${DOCTOR_LUNCH_END_MINUTES})`;
}
