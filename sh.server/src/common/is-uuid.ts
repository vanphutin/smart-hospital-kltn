/** Chuỗi UUID dạng 8-4-4-4-12 (hex), tương thích so khớp với kiểu uuid của PostgreSQL. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}
