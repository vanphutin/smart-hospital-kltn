import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Log mỗi request OpenAI (chat hoặc embedding) → audit chi phí và truy vết.
 * Cost được tính tại app layer dựa trên price card OpenAI tại thời điểm gọi.
 */
@Entity('ai_usage')
export class AiUsageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Tên feature gọi: 'suggest-departments', 'embed-record', 'doctor-chat', ... */
  @Column({ type: 'varchar', length: 64 })
  feature: string;

  @Column({ type: 'varchar', length: 64 })
  model: string;

  @Column({ name: 'prompt_tokens', type: 'int', default: 0 })
  promptTokens: number;

  @Column({ name: 'completion_tokens', type: 'int', default: 0 })
  completionTokens: number;

  @Column({ name: 'total_tokens', type: 'int', default: 0 })
  totalTokens: number;

  @Column({ name: 'cost_usd', type: 'decimal', precision: 12, scale: 6, default: 0 })
  costUsd: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
