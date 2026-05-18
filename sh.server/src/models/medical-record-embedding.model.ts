import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Vector embedding của medical_records (đã anonymize) phục vụ RAG cho trợ lý AI bác sĩ.
 *
 * Lưu ý dùng:
 *  - PK = record_id (1-1 với medical_records). FK ON DELETE CASCADE → record xoá thì embedding xoá.
 *  - doctor_id / patient_id denormalize để lọc cứng quyền truy cập trong query vector
 *    (KHÔNG dựa vào LLM tự lọc).
 *  - embedding là vector(1536) tương ứng text-embedding-3-small.
 *
 * Cột `embedding` ánh xạ sang `string` ở TypeORM vì pgvector chưa có driver chính thức;
 * khi đọc/ghi mình parse/format thủ công ở service.
 */
@Entity('medical_record_embeddings')
export class MedicalRecordEmbeddingEntity {
  @PrimaryColumn({ name: 'record_id', type: 'uuid' })
  recordId: string;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'content_anonymized', type: 'text' })
  contentAnonymized: string;

  /** PG vector(1536). Lưu ở dạng string `[0.1, 0.2, ...]` để tránh phải khai báo type tùy biến. */
  @Column({ type: 'text', transformer: vectorTransformer() })
  embedding: number[];

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

function vectorTransformer() {
  return {
    to: (value: number[] | null | undefined): string | null => {
      if (!value) return null;
      return `[${value.join(',')}]`;
    },
    from: (value: string | null | undefined): number[] => {
      if (!value) return [];
      const trimmed = value.trim();
      if (!trimmed.startsWith('[')) return [];
      return trimmed
        .replace(/^\[/, '')
        .replace(/\]$/, '')
        .split(',')
        .map((s) => Number(s));
    },
  };
}
