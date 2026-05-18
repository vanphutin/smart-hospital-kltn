/**
 * Mapping enum từ DB (tiếng Anh) sang nhãn hiển thị tiếng Việt
 */

/** slot_status */
export const SLOT_STATUS_LABEL: Record<string, string> = {
  available: 'Còn trống',
  booked: 'Đã đặt',
  on_leave: 'Nghỉ phép',
};

/** appointment_status */
export const APPOINTMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Đã khám',
  cancelled: 'Đã hủy',
};

/** payment_status */
export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
};

/** payment_type */
export const PAYMENT_TYPE_LABEL: Record<string, string> = {
  deposit: 'Đặt cọc',
  full: 'Thanh toán đủ',
};

export function getSlotStatusLabel(value: string): string {
  return SLOT_STATUS_LABEL[value] ?? value;
}

export function getAppointmentStatusLabel(value: string): string {
  return APPOINTMENT_STATUS_LABEL[value] ?? value;
}

export function getPaymentStatusLabel(value: string): string {
  return PAYMENT_STATUS_LABEL[value] ?? value;
}

export function getPaymentTypeLabel(value: string): string {
  return PAYMENT_TYPE_LABEL[value] ?? value;
}
