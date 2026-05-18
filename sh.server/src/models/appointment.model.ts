import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AppointmentStatus } from './enums';
import { UserEntity } from './user.model';
import { AppointmentSlotEntity } from './appointment-slot.model';

/**
 * Model appointments - bảng appointments
 * deposit_amount: DECIMAL(10,2)
 */
export interface Appointment {
  id: string;
  user_id: string;
  doctor_id: string;
  slot_id: string | null;
  symptoms: string | null;
  status: AppointmentStatus;
  deposit_amount: number | null;
  created_at: Date;
}

@Entity('appointments')
export class AppointmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @Column({ name: 'slot_id', type: 'uuid', nullable: true })
  slotId: string | null;

  @Column({ type: 'text', nullable: true })
  symptoms: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: AppointmentStatus;

  @Column({ name: 'deposit_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  depositAmount: number | null;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancelled_by', type: 'uuid', nullable: true })
  cancelledBy: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor?: UserEntity;

  @ManyToOne(() => AppointmentSlotEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'slot_id' })
  slot?: AppointmentSlotEntity | null;
}
