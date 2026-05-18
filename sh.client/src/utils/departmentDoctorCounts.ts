/**
 * Map mỗi department id → số bác sĩ (GET /doctors, field departmentId).
 * Luôn có đủ key theo danh sách khoa — khoa không ai thì 0 (tránh fallback nhầm sang số đẹp trong UI constants).
 */
export function buildDoctorCountByDepartment(
  departments: { id: string }[],
  doctors: { departmentId?: string | null }[],
): Record<string, number> {
  const m: Record<string, number> = {};
  for (const d of departments) {
    m[d.id] = 0;
  }
  for (const doc of doctors) {
    const id = doc.departmentId;
    if (id != null && id !== '' && id in m) {
      m[id] += 1;
    }
  }
  return m;
}
