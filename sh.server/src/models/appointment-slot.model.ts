import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.model';
import { SlotStatus } from './enums';

/**
 * Model appointment_slots - bảng appointment_slots
 * Slot 15 phút, do hệ thống tạo khi admin thêm bác sĩ (T2–T6, 08:00–17:00, trừ nghỉ trưa 11:30–13:00).
 * DB: CHECK appointment_slots_slot_weekday_only (ISODOW 1–5), không lưu thứ 7 / CN.
 */
export interface AppointmentSlot {
  id: string;
  doctor_id: string;
  slot_time: Date;
  status: SlotStatus;
}

@Entity('appointment_slots')
export class AppointmentSlotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @Column({ name: 'slot_time', type: 'timestamp' })
  slotTime: Date;

  @Column({ type: 'varchar', length: 20, default: 'available' })
  status: SlotStatus;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: UserEntity;
}
