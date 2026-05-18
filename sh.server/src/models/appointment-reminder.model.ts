import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { AppointmentEntity } from './appointment.model';

/** Loại mốc nhắc lịch — đồng bộ với cron AppointmentRemindersService. */
export type AppointmentReminderKind = 'h24' | 'h1';

/**
 * Track email nhắc lịch đã gửi cho từng (cuộc hẹn, mốc) → idempotent.
 * PK composite (appointment_id, kind) khiến INSERT thứ 2 báo unique_violation,
 * đảm bảo cron / endpoint thủ công không gửi mail trùng.
 */
@Entity('appointment_reminders')
export class AppointmentReminderEntity {
  @PrimaryColumn({ name: 'appointment_id', type: 'uuid' })
  appointmentId: string;

  @PrimaryColumn({ type: 'varchar', length: 16 })
  kind: AppointmentReminderKind;

  @CreateDateColumn({ name: 'sent_at', type: 'timestamptz' })
  sentAt: Date;

  @ManyToOne(() => AppointmentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: AppointmentEntity;
}
