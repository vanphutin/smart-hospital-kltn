/**
 * Model doctor_schedules - bảng doctor_schedules (doctor_id -> users.id)
 */
import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.model';

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  work_day: string;
  start_time: string;
  end_time: string;
}

@Entity('doctor_schedules')
export class DoctorScheduleEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @Column({ name: 'work_day', type: 'date' })
  workDay: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: UserEntity;
}
