import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly dataSource: DataSource) {}

  onModuleInit() {
    if (this.dataSource.isInitialized) {
      const opts = this.dataSource.options as { database?: string; host?: string; port?: number };
      const db = opts.database ?? 'db';
      const host = opts.host ?? 'localhost';
      const port = opts.port ?? 5432;
      this.logger.log(`Database connected successfully (${db}@${host}:${port})`);
    } else {
      this.logger.warn('Database connection not ready');
    }
  }

  getHello(): string {
    return 'Hello World!';
  }

  /** Đọc tiền cọc và phí khám từ system_config; fallback 50.000 nếu chưa có bảng. */
  async getBookingPolicy(): Promise<{ depositAmount: number; consultationFee: number }> {
    try {
      const rows = (await this.dataSource.query(
        `SELECT key, value FROM system_config WHERE key IN ('deposit_amount', 'consultation_fee')`,
      )) as { key: string; value: string }[];
      const map = new Map(rows.map((r) => [r.key, Number(r.value)]));
      const depositAmount = map.get('deposit_amount') ?? 50_000;
      const consultationFee = map.get('consultation_fee') ?? depositAmount;
      return { depositAmount, consultationFee };
    } catch {
      // bảng chưa tồn tại → fallback
    }
    return { depositAmount: 50_000, consultationFee: 50_000 };
  }
}
