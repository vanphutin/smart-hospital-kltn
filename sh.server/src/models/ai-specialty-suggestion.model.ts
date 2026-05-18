import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Cache kết quả gợi ý chuyên khoa AI theo SHA-256 của symptoms (đã normalize).
 * Cùng câu triệu chứng từ nhiều bệnh nhân → gọi OpenAI 1 lần, các lần sau đọc cache.
 */
@Entity('ai_specialty_suggestions')
export class AiSpecialtySuggestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'symptoms_hash', type: 'varchar', length: 64 })
  symptomsHash: string;

  /** 1 sample của text gốc (để debug + reload nếu cần re-prompt). */
  @Column({ name: 'symptoms_sample', type: 'text' })
  symptomsSample: string;

  @Column({ name: 'response_json', type: 'jsonb' })
  responseJson: SpecialtySuggestionResponse;

  @Column({ type: 'int', default: 1 })
  hits: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

/** Format output cố định để FE render dễ dàng. */
export interface SpecialtySuggestionItem {
  departmentId: string | null;
  departmentName: string;
  reason: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface SpecialtySuggestionResponse {
  suggestions: SpecialtySuggestionItem[];
  /** Cảnh báo nếu triệu chứng có dấu hiệu cấp cứu — UI sẽ hiển thị banner đỏ. */
  urgent: boolean;
  /** Lý do general (vd "Triệu chứng mơ hồ, nên thăm khám tổng quát trước"). */
  generalNote: string | null;
}
