import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Một phiên hội thoại của bác sĩ với trợ lý AI.
 *
 * - 1 doctor có nhiều session.
 * - title được tự động sinh từ câu hỏi đầu tiên (cắt ~80 ký tự) — bác sĩ có thể đổi sau.
 * - updated_at là thời điểm có message mới nhất → dùng để sort sidebar.
 */
@Entity('doctor_chat_sessions')
export class DoctorChatSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @Column({ type: 'varchar', length: 200, default: 'Hội thoại mới' })
  title: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
