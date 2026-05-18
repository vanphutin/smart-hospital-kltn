import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OpenAIService } from '../ai/openai.service';
import { AnonymizeService } from '../ai/anonymize.service';
import { MedicalRecordEntity } from '../models/medical-record.model';
import { UserEntity } from '../models/user.model';

/**
 * Quản lý vector embedding cho `medical_records` — phục vụ RAG ở tab Trợ lý AI bác sĩ.
 *
 * Quy ước:
 *  - 1 record → 1 row trong medical_record_embeddings (PK = record_id, ON DELETE CASCADE).
 *  - content_anonymized = text đầu vào sau khi đi qua AnonymizeService (bóc tên/SĐT/email).
 *  - Khi medical record được create/update → gọi `embedRecord()` để upsert.
 *  - `backfillAll()` chạy 1 lần cho dữ liệu cũ chưa có embedding.
 */
@Injectable()
export class MedicalRecordEmbeddingsService {
  private readonly logger = new Logger(MedicalRecordEmbeddingsService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(MedicalRecordEntity)
    private readonly recordRepo: Repository<MedicalRecordEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly openai: OpenAIService,
    private readonly anonymize: AnonymizeService,
  ) {}

  /** Build text mô tả cho 1 record (chỉ giữ medical info có ý nghĩa). */
  buildContent(r: MedicalRecordEntity): string {
    const parts = [
      r.symptoms ? `Triệu chứng: ${r.symptoms}` : '',
      r.diagnosis ? `Chẩn đoán: ${r.diagnosis}` : '',
      r.treatment ? `Điều trị: ${r.treatment}` : '',
      r.notes ? `Ghi chú: ${r.notes}` : '',
    ].filter(Boolean);
    return parts.join('\n');
  }

  /**
   * Embed 1 record và upsert vào DB. Trả `true` khi gọi OpenAI thành công và lưu được;
   * `false` khi OPENAI_API_KEY chưa cấu hình hoặc content rỗng.
   * Lỗi không mong đợi (network, rate-limit) sẽ throw — caller tự xử log.
   */
  async embedRecord(recordId: string): Promise<boolean> {
    if (!this.openai.isConfigured()) return false;

    const record = await this.recordRepo.findOne({ where: { id: recordId } });
    if (!record) return false;

    const rawContent = this.buildContent(record);
    if (!rawContent.trim()) return false;

    // Lấy tên patient/doctor để anonymize chuẩn hơn (regex email/phone vẫn áp).
    const [patient, doctor] = await Promise.all([
      this.userRepo.findOne({ where: { id: record.patientId } }),
      this.userRepo.findOne({ where: { id: record.doctorId } }),
    ]);
    const knownNames: string[] = [];
    if (patient?.fullName) knownNames.push(patient.fullName);
    if (doctor?.fullName) knownNames.push(doctor.fullName);

    const content = this.anonymize.scrub(rawContent, knownNames);
    if (!content.trim()) return false;

    const { embedding } = await this.openai.embed({
      feature: 'embed-medical-record',
      text: content.slice(0, 8000),
      metadata: { recordId },
    });
    if (!embedding.length) return false;

    const literal = `[${embedding.join(',')}]`;
    await this.dataSource.query(
      `
      INSERT INTO medical_record_embeddings
        (record_id, doctor_id, patient_id, content_anonymized, embedding, updated_at)
      VALUES ($1, $2, $3, $4, $5::vector, now())
      ON CONFLICT (record_id) DO UPDATE
        SET doctor_id          = EXCLUDED.doctor_id,
            patient_id         = EXCLUDED.patient_id,
            content_anonymized = EXCLUDED.content_anonymized,
            embedding          = EXCLUDED.embedding,
            updated_at         = now()
      `,
      [record.id, record.doctorId, record.patientId, content, literal],
    );

    return true;
  }

  /**
   * Embed mọi record CHƯA CÓ row trong medical_record_embeddings hoặc record đã update sau lần embed.
   * Tham số `forceAll` = true → re-embed toàn bộ (vd khi đổi model embedding).
   */
  async backfill(opts: { forceAll?: boolean; limit?: number } = {}): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    skipped: number;
  }> {
    if (!this.openai.isConfigured()) {
      this.logger.warn('OPENAI_API_KEY chưa cấu hình — bỏ qua backfill embeddings.');
      return { processed: 0, succeeded: 0, failed: 0, skipped: 0 };
    }

    const limit = opts.limit ?? 1000;
    const rows = (await this.dataSource.query(
      opts.forceAll
        ? `SELECT id FROM medical_records ORDER BY created_at ASC LIMIT $1`
        : `
          SELECT mr.id
          FROM medical_records mr
          LEFT JOIN medical_record_embeddings e ON e.record_id = mr.id
          WHERE e.record_id IS NULL
          ORDER BY mr.created_at ASC
          LIMIT $1
        `,
      [limit],
    )) as { id: string }[];

    let succeeded = 0;
    let failed = 0;
    let skipped = 0;
    for (const r of rows) {
      try {
        const ok = await this.embedRecord(r.id);
        if (ok) succeeded++;
        else skipped++;
      } catch (e) {
        failed++;
        this.logger.warn(
          `Embed record ${r.id} lỗi: ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    this.logger.log(
      `Backfill embeddings: total=${rows.length}, succeeded=${succeeded}, skipped=${skipped}, failed=${failed}.`,
    );
    return { processed: rows.length, succeeded, failed, skipped };
  }

  /** Xoá embedding của record (gọi khi record bị xoá thủ công — DB FK đã CASCADE nên thường không cần). */
  async deleteByRecord(recordId: string): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM medical_record_embeddings WHERE record_id = $1`,
      [recordId],
    );
  }

  /**
   * Vector search top-k record của 1 bác sĩ — dùng cho RAG chat.
   * Cosine distance (`<=>`) trên HNSW index. Filter cứng `doctor_id` để KHÔNG leak hồ sơ
   * của bác sĩ khác — đây là chốt quyền truy cập, không tin LLM.
   */
  async searchByDoctor(args: {
    doctorId: string;
    queryEmbedding: number[];
    topK?: number;
    /** Lọc thêm theo 1 bệnh nhân cụ thể (nếu bác sĩ chỉ định). */
    patientId?: string | null;
  }): Promise<RecordSearchHit[]> {
    const { doctorId, queryEmbedding, topK = 10, patientId = null } = args;
    const literal = `[${queryEmbedding.join(',')}]`;

    const sql = `
      SELECT
        e.record_id,
        e.patient_id,
        e.content_anonymized,
        u.full_name  AS patient_name,
        u.email      AS patient_email,
        u.phone      AS patient_phone,
        u.avatar_url AS patient_avatar_url,
        mr.created_at,
        mr.appointment_id,
        s.slot_time,
        e.embedding <=> $1::vector AS distance
      FROM medical_record_embeddings e
      JOIN medical_records mr ON mr.id = e.record_id
      JOIN users u ON u.id = e.patient_id
      LEFT JOIN appointments a ON a.id = mr.appointment_id
      LEFT JOIN appointment_slots s ON s.id = a.slot_id
      WHERE e.doctor_id = $2
        ${patientId ? 'AND e.patient_id = $4' : ''}
      ORDER BY e.embedding <=> $1::vector ASC
      LIMIT $3
    `;
    const params: unknown[] = [literal, doctorId, topK];
    if (patientId) params.push(patientId);

    const rows = (await this.dataSource.query(sql, params)) as {
      record_id: string;
      patient_id: string;
      content_anonymized: string;
      patient_name: string;
      patient_email: string | null;
      patient_phone: string | null;
      patient_avatar_url: string | null;
      created_at: Date;
      appointment_id: string | null;
      slot_time: Date | null;
      distance: string;
    }[];

    return rows.map((r) => ({
      recordId: r.record_id,
      patientId: r.patient_id,
      patientName: r.patient_name,
      patientEmail: r.patient_email,
      patientPhone: r.patient_phone,
      patientAvatarUrl: r.patient_avatar_url,
      content: r.content_anonymized,
      createdAt: new Date(r.created_at),
      appointmentId: r.appointment_id,
      slotTime: r.slot_time ? new Date(r.slot_time) : null,
      // <=> trả 0..2 (cosine distance); similarity = 1 - distance/2 cho dễ hiểu.
      similarity: Math.max(0, 1 - Number(r.distance) / 2),
    }));
  }
}

export interface RecordSearchHit {
  recordId: string;
  patientId: string;
  patientName: string;
  patientEmail: string | null;
  patientPhone: string | null;
  patientAvatarUrl: string | null;
  content: string;
  createdAt: Date;
  appointmentId: string | null;
  slotTime: Date | null;
  similarity: number;
}
