import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type DoctorChatRole = 'user' | 'assistant';

/**
 * 1 lượt nhắn trong phiên hội thoại bác sĩ ↔ trợ lý AI.
 *
 * - role: 'user' (bác sĩ) | 'assistant' (AI).
 * - sources (chỉ ở assistant message): JSON array các record được dùng làm context
 *   để bác sĩ click mở hồ sơ gốc — KHÔNG ẩn danh ở chỗ này vì bác sĩ là chủ hồ sơ.
 *   Lưu ý: snapshot lúc trả lời → record có thể bị xoá sau, FE cần handle gracefully.
 */
@Entity('doctor_chat_messages')
export class DoctorChatMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ type: 'varchar', length: 16 })
  role: DoctorChatRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  sources: SourceJson[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

/** Shape của 1 source được lưu trong DB (khớp với DoctorChatSource ở service). */
export interface SourceJson {
  index: number;
  recordId: string;
  patientId: string;
  patientName: string;
  patientPhone: string | null;
  patientEmail: string | null;
  appointmentId: string | null;
  slotTime: string | null;
  similarity: number;
  excerpt: string;
}
