const DOCTOR_PREFIX = 'BS. ';

const HAS_PREFIX_REGEX = /^(bs\.?\s+|b[áa]c\s*s[ĩi]\s+|dr\.?\s+)/i;

/**
 * Chuẩn hoá tên bác sĩ để hiển thị: tự động prepend "BS. " nếu tên chưa có
 * tiền tố BS./Bác sĩ/Dr. ở đầu.
 *
 * Dùng ở mọi chỗ hiển thị tên bác sĩ trên UI để admin chỉ cần nhập tên thuần.
 */
export function formatDoctorName(name: string | null | undefined): string {
  if (name == null) return '';
  const trimmed = name.trim();
  if (trimmed === '') return '';
  if (HAS_PREFIX_REGEX.test(trimmed)) return trimmed;
  return `${DOCTOR_PREFIX}${trimmed}`;
}
