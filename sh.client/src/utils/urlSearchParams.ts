/**
 * Đọc/ghi query string để URL rõ ràng (view, page, departmentId, ...)
 */
const VIEW = 'view';
const PAGE = 'page';
const DEPARTMENT_ID = 'departmentId';
const RESET_TOKEN = 'token';
/** Từ khóa tìm bác sĩ (trang search) */
const Q = 'q';

export function getSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

export function getView(): string | null {
  return getSearchParams().get(VIEW);
}

export function getPage(): number {
  const p = getSearchParams().get(PAGE);
  const n = p ? parseInt(p, 10) : 1;
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function getDepartmentId(): string | null {
  return getSearchParams().get(DEPARTMENT_ID);
}

/** Từ khóa tìm kiếm trên trang bác sĩ (khớp tên / khoa). */
export function getSearchQuery(): string {
  return getSearchParams().get(Q)?.trim() ?? '';
}

/** Token đặt lại mật khẩu (64 ký tự hex) */
export function getResetPasswordToken(): string | null {
  const t = getSearchParams().get(RESET_TOKEN);
  return t && /^[a-f0-9]{64}$/i.test(t) ? t.toLowerCase() : null;
}

export function buildSearchUrl(params: {
  view?: string;
  page?: number;
  departmentId?: string | null;
  token?: string | null;
  q?: string | null;
}): string {
  const sp = new URLSearchParams(window.location.search);
  if (params.view !== undefined) {
    if (params.view) sp.set(VIEW, params.view);
    else sp.delete(VIEW);
  }
  if (params.page !== undefined) {
    if (params.page > 1) sp.set(PAGE, String(params.page));
    else sp.delete(PAGE);
  }
  if (params.departmentId !== undefined) {
    if (params.departmentId) sp.set(DEPARTMENT_ID, params.departmentId);
    else sp.delete(DEPARTMENT_ID);
  }
  if (params.q !== undefined) {
    if (params.q) sp.set(Q, params.q);
    else sp.delete(Q);
  }
  if (params.token !== undefined) {
    if (params.token) sp.set(RESET_TOKEN, params.token);
    else sp.delete(RESET_TOKEN);
  }
  const q = sp.toString();
  return q ? `${window.location.pathname}?${q}` : window.location.pathname || '/';
}

export function replaceSearchParams(params: {
  view?: string;
  page?: number;
  departmentId?: string | null;
  token?: string | null;
  q?: string | null;
}) {
  const url = buildSearchUrl(params);
  window.history.replaceState(null, '', url);
}
