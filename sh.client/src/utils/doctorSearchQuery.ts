/**
 * Mở rộng viết tắt thường gặp khi tìm bác sĩ (vd: bs → bác sĩ).
 */
export function expandDoctorSearchAbbreviations(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const m = token.match(/^(.+?)([.,;:!?]*)$/);
      const core = m?.[1] ?? token;
      const suffix = m?.[2] ?? '';
      if (/^bs$/i.test(core)) return `bác sĩ${suffix}`;
      return token;
    })
    .join(' ');
}
