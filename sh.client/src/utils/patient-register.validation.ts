/** PB01 — validation phía client (đồng bộ quy tắc với sh.server patient-account.validation) */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VN_MOBILE_RE = /^0(3|5|7|8|9)\d{8}$/;

export function isValidEmailFormat(email: string): boolean {
  const s = email.trim();
  return s.length > 0 && s.length <= 255 && EMAIL_RE.test(s);
}

/** Chuẩn hóa SĐT di động VN → đúng 10 chữ số (`0xxxxxxxxxx`). Không tự thêm/bớt chữ số. */
export function normalizeVnPhone(input: string): string | null {
  if (!input?.trim()) return null;
  let s = input.replace(/[\s.\-()_/]/g, '').trim(); // không xoá "+"
  if (!s) return null;
  if (s.startsWith('+84')) {
    s = `0${s.slice(3).replace(/\D/g, '')}`;
  } else {
    s = s.replace(/\D/g, '');
    if (s.startsWith('84')) {
      if (s.length !== 11) return null;
      s = `0${s.slice(2)}`;
    }
  }
  if (!/^0\d{9}$/.test(s)) return null;
  if (!VN_MOBILE_RE.test(s)) return null;
  return s;
}

export function validateStrongPassword(password: string): string | null {
  if (password.length < 8) return 'Mật khẩu phải có tối thiểu 8 ký tự';
  if (!/[A-Z]/.test(password)) return 'Mật khẩu phải có ít nhất một chữ hoa';
  if (!/[a-z]/.test(password)) return 'Mật khẩu phải có ít nhất một chữ thường';
  if (!/[0-9]/.test(password)) return 'Mật khẩu phải có ít nhất một chữ số';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Mật khẩu phải có ít nhất một ký tự đặc biệt';
  return null;
}

export type RegisterFieldErrors = Record<string, string>;

/** Chỉ mật khẩu + xác nhận (đặt lại mật khẩu) */
export function validateNewPasswordPair(password: string, confirmPassword: string): RegisterFieldErrors | null {
  const errors: RegisterFieldErrors = {};
  const pwdErr = validateStrongPassword(password ?? '');
  if (pwdErr) errors.password = pwdErr;
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Mật khẩu nhập lại không khớp';
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

/** Cập nhật hồ sơ (PATCH /auth/me) — chỉ fullName + phone */
export function validateUpdateProfileForm(input: {
  fullName: string;
  phone: string;
}): RegisterFieldErrors | null {
  const errors: RegisterFieldErrors = {};
  const fullName = input.fullName?.trim() ?? '';
  if (!fullName) errors.fullName = 'Vui lòng nhập họ tên';
  else if (fullName.length > 255) errors.fullName = 'Họ tên quá dài';

  if (!input.phone?.trim()) errors.phone = 'Vui lòng nhập số điện thoại';
  else if (!normalizeVnPhone(input.phone))
    errors.phone =
      'Số điện thoại phải đủ 10 chữ số di động Việt Nam (ví dụ 0912345678 hoặc +84912345678).';

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validatePatientRegisterForm(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}): RegisterFieldErrors | null {
  const errors: RegisterFieldErrors = {};
  const fullName = input.fullName?.trim() ?? '';
  if (!fullName) errors.fullName = 'Vui lòng nhập họ tên';
  else if (fullName.length > 255) errors.fullName = 'Họ tên quá dài';

  const email = input.email?.trim() ?? '';
  if (!email) errors.email = 'Vui lòng nhập email';
  else if (!isValidEmailFormat(email)) errors.email = 'Email không đúng định dạng';

  if (!input.phone?.trim()) errors.phone = 'Vui lòng nhập số điện thoại';
  else if (!normalizeVnPhone(input.phone))
    errors.phone =
      'Số điện thoại phải đủ 10 chữ số di động Việt Nam (ví dụ 0912345678 hoặc +84912345678).';

  const pwdErr = validateStrongPassword(input.password ?? '');
  if (pwdErr) errors.password = pwdErr;
  if (input.password !== input.confirmPassword) {
    errors.confirmPassword = 'Mật khẩu nhập lại không khớp';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
