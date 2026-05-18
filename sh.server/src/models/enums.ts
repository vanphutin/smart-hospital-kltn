/**
 * ENUMs mapping từ db.sql
 */

/** appointment_slots.status */
export enum SlotStatus {
  Available = 'available',
  Booked = 'booked',
  /** Đã duyệt nghỉ phép — không cho đặt lịch */
  OnLeave = 'on_leave',
}

/** doctor_leave_requests.status */
export enum LeaveRequestStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

/** appointments.status */
export enum AppointmentStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

/** payments.status */
export enum PaymentStatus {
  Pending = 'pending',
  Paid = 'paid',
  Failed = 'failed',
}

/** payments.payment_type */
export enum PaymentType {
  Deposit = 'deposit',
  Full = 'full',
}
