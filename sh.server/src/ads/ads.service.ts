import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AdPlacement,
  AdStatus,
  AdType,
  AdvertisementEntity,
  AD_PLACEMENTS,
  AD_STATUSES,
  AD_TYPES,
} from '../models/advertisement.model';
import { S3UploadService } from '../common/s3-upload.service';
import type { UpsertAdDto } from './dto/upsert-ad.dto';

export interface AdminAdRowDto {
  id: string;
  type: AdType;
  title: string;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  placements: AdPlacement[];
  status: AdStatus;
  priority: number;
  startAt: string | null;
  endAt: string | null;
  viewCount: number;
  clickCount: number;
  isEffective: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicAdDto {
  id: string;
  type: AdType;
  title: string;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  priority: number;
}

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    @InjectRepository(AdvertisementEntity)
    private readonly adRepo: Repository<AdvertisementEntity>,
    private readonly s3: S3UploadService,
  ) {}

  // ============ Helpers ============
  private isEffective(a: AdvertisementEntity, now = new Date()): boolean {
    if (a.status !== 'active') return false;
    if (a.startAt && a.startAt.getTime() > now.getTime()) return false;
    if (a.endAt && a.endAt.getTime() <= now.getTime()) return false;
    return true;
  }

  /**
   * Auto-expire: chuyển mọi ad đang `active` đã quá `end_at` sang `expired`.
   * Chạy lazy mỗi lần admin truy vấn list + chạy cron định kỳ phía dưới.
   * Idempotent (chỉ update các bản ghi đủ điều kiện).
   */
  async expireDueAds(): Promise<number> {
    const res = await this.adRepo
      .createQueryBuilder()
      .update(AdvertisementEntity)
      .set({ status: 'expired', updatedAt: () => 'now()' })
      .where('status = :s', { s: 'active' as AdStatus })
      .andWhere('end_at IS NOT NULL')
      .andWhere('end_at <= now()')
      .execute();
    const affected = res.affected ?? 0;
    if (affected > 0) {
      this.logger.log(`Auto-expired ${affected} advertisement(s).`);
    }
    return affected;
  }

  /** Cron mỗi 5 phút — đảm bảo ad hết hạn được chuyển sang `expired` ngay cả khi không có ai mở admin. */
  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'ads-auto-expire' })
  async cronExpire(): Promise<void> {
    try {
      await this.expireDueAds();
    } catch (e) {
      this.logger.error(`Cron expireDueAds lỗi: ${(e as Error).message}`);
    }
  }

  private toAdminRow(a: AdvertisementEntity): AdminAdRowDto {
    return {
      id: a.id,
      type: a.type,
      title: a.title,
      body: a.body,
      imageUrl: a.imageUrl,
      linkUrl: a.linkUrl,
      placements: a.placements ?? [],
      status: a.status,
      priority: a.priority,
      startAt: a.startAt ? a.startAt.toISOString() : null,
      endAt: a.endAt ? a.endAt.toISOString() : null,
      viewCount: a.viewCount,
      clickCount: a.clickCount,
      isEffective: this.isEffective(a),
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }

  private toPublic(a: AdvertisementEntity): PublicAdDto {
    return {
      id: a.id,
      type: a.type,
      title: a.title,
      body: a.body,
      imageUrl: a.imageUrl,
      linkUrl: a.linkUrl,
      priority: a.priority,
    };
  }

  // ============ Validate / parse ============
  /**
   * Chuẩn hóa body (multipart/form-data) thành DTO. Đối với create: bắt buộc title, type, placements.
   */
  parseUpsertBody(body: Record<string, unknown>, isCreate: boolean): UpsertAdDto {
    const dto: UpsertAdDto = {};

    if (body.type !== undefined) {
      const t = String(body.type).trim();
      if (!AD_TYPES.includes(t as AdType)) {
        throw new BadRequestException("type phải là 'banner' hoặc 'promo'");
      }
      dto.type = t as AdType;
    } else if (isCreate) {
      dto.type = 'banner';
    }

    if (body.title !== undefined) {
      const v = String(body.title).trim();
      if (!v) throw new BadRequestException('title không được để trống');
      if (v.length > 255) throw new BadRequestException('title tối đa 255 ký tự');
      dto.title = v;
    } else if (isCreate) {
      throw new BadRequestException('title là bắt buộc');
    }

    if (body.body !== undefined) {
      const v = String(body.body);
      dto.body = v.trim() === '' ? null : v;
    }

    if (body.linkUrl !== undefined) {
      const v = String(body.linkUrl).trim();
      if (v === '') {
        dto.linkUrl = null;
      } else {
        if (!/^https?:\/\//i.test(v) && !v.startsWith('/')) {
          throw new BadRequestException('linkUrl phải bắt đầu bằng http(s):// hoặc /');
        }
        dto.linkUrl = v;
      }
    }

    if (body.placements !== undefined) {
      let arr: string[] = [];
      if (Array.isArray(body.placements)) {
        arr = body.placements.map((x) => String(x));
      } else {
        const raw = String(body.placements);
        if (raw.startsWith('[')) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) arr = parsed.map((x) => String(x));
          } catch {
            throw new BadRequestException('placements không hợp lệ (JSON parse fail)');
          }
        } else if (raw.trim() !== '') {
          arr = raw.split(',').map((x) => x.trim()).filter(Boolean);
        }
      }
      const unique = Array.from(new Set(arr));
      for (const p of unique) {
        if (!AD_PLACEMENTS.includes(p as AdPlacement)) {
          throw new BadRequestException(`placement không hợp lệ: ${p}`);
        }
      }
      dto.placements = unique as AdPlacement[];
    } else if (isCreate) {
      dto.placements = [];
    }

    if (body.status !== undefined) {
      const v = String(body.status).trim();
      if (!AD_STATUSES.includes(v as AdStatus)) {
        throw new BadRequestException(`status không hợp lệ: ${v}`);
      }
      dto.status = v as AdStatus;
    } else if (isCreate) {
      dto.status = 'draft';
    }

    if (body.priority !== undefined && String(body.priority).trim() !== '') {
      const n = parseInt(String(body.priority), 10);
      if (Number.isNaN(n) || n < 0 || n > 1000) {
        throw new BadRequestException('priority phải là số 0..1000');
      }
      dto.priority = n;
    } else if (isCreate) {
      dto.priority = 0;
    }

    const parseDate = (raw: unknown): Date | null => {
      const s = String(raw).trim();
      if (s === '') return null;
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) {
        throw new BadRequestException('Ngày giờ không hợp lệ');
      }
      return d;
    };
    if (body.startAt !== undefined) dto.startAt = parseDate(body.startAt);
    if (body.endAt !== undefined) dto.endAt = parseDate(body.endAt);

    return dto;
  }

  private validateWindow(startAt: Date | null | undefined, endAt: Date | null | undefined) {
    if (startAt && endAt && startAt.getTime() >= endAt.getTime()) {
      throw new BadRequestException('startAt phải nhỏ hơn endAt');
    }
  }

  // ============ Admin CRUD ============
  async createAd(
    dto: UpsertAdDto,
    imageRelPath: string | null,
    actorId: string | null,
  ): Promise<AdminAdRowDto> {
    if (!dto.title) throw new BadRequestException('title bắt buộc');
    this.validateWindow(dto.startAt ?? null, dto.endAt ?? null);
    const ad = this.adRepo.create({
      type: dto.type ?? 'banner',
      title: dto.title,
      body: dto.body ?? null,
      imageUrl: imageRelPath,
      linkUrl: dto.linkUrl ?? null,
      placements: dto.placements ?? [],
      status: dto.status ?? 'draft',
      priority: dto.priority ?? 0,
      startAt: dto.startAt ?? null,
      endAt: dto.endAt ?? null,
      createdBy: actorId,
    });
    const saved = await this.adRepo.save(ad);
    return this.toAdminRow(saved);
  }

  async updateAd(
    id: string,
    dto: UpsertAdDto,
    imageRelPath: string | null | undefined,
    removeImage: boolean,
  ): Promise<AdminAdRowDto> {
    const ad = await this.adRepo.findOne({ where: { id } });
    if (!ad) throw new NotFoundException('Không tìm thấy quảng cáo');

    if (dto.type !== undefined) ad.type = dto.type;
    if (dto.title !== undefined) ad.title = dto.title;
    if (dto.body !== undefined) ad.body = dto.body;
    if (dto.linkUrl !== undefined) ad.linkUrl = dto.linkUrl;
    if (dto.placements !== undefined) ad.placements = dto.placements;
    if (dto.status !== undefined) ad.status = dto.status;
    if (dto.priority !== undefined) ad.priority = dto.priority;
    if (dto.startAt !== undefined) ad.startAt = dto.startAt;
    if (dto.endAt !== undefined) ad.endAt = dto.endAt;
    this.validateWindow(ad.startAt, ad.endAt);

    // Auto reactivate: nếu đang `expired` mà admin không thay đổi status,
    // nhưng vừa gia hạn end_at sang tương lai (hoặc xóa giới hạn) → bật lại 'active'.
    const now = new Date();
    if (
      ad.status === 'expired' &&
      dto.status === undefined &&
      (ad.endAt === null || ad.endAt.getTime() > now.getTime())
    ) {
      ad.status = 'active';
    }
    // Auto expire ngay khi save: nếu admin set status=active nhưng end_at đã quá hạn.
    if (ad.status === 'active' && ad.endAt && ad.endAt.getTime() <= now.getTime()) {
      ad.status = 'expired';
    }

    let oldImage: string | null = null;
    if (imageRelPath) {
      oldImage = ad.imageUrl;
      ad.imageUrl = imageRelPath;
    } else if (removeImage) {
      oldImage = ad.imageUrl;
      ad.imageUrl = null;
    }
    ad.updatedAt = new Date();
    const saved = await this.adRepo.save(ad);
    if (oldImage) await this.tryUnlink(oldImage);
    return this.toAdminRow(saved);
  }

  async setStatus(id: string, status: AdStatus): Promise<AdminAdRowDto> {
    if (!AD_STATUSES.includes(status)) {
      throw new BadRequestException('status không hợp lệ');
    }
    const ad = await this.adRepo.findOne({ where: { id } });
    if (!ad) throw new NotFoundException('Không tìm thấy quảng cáo');
    if (status === 'active' && ad.endAt && ad.endAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Quảng cáo đã quá ngày kết thúc. Hãy gia hạn ngày kết thúc trước khi bật lại.',
      );
    }
    ad.status = status;
    ad.updatedAt = new Date();
    const saved = await this.adRepo.save(ad);
    return this.toAdminRow(saved);
  }

  async deleteAd(id: string): Promise<{ message: string }> {
    const ad = await this.adRepo.findOne({ where: { id } });
    if (!ad) throw new NotFoundException('Không tìm thấy quảng cáo');
    const oldImage = ad.imageUrl;
    await this.adRepo.delete({ id });
    if (oldImage) await this.tryUnlink(oldImage);
    return { message: 'Đã xóa quảng cáo' };
  }

  async listForAdmin(opts: {
    status?: AdStatus;
    placement?: AdPlacement;
    q?: string;
  }): Promise<AdminAdRowDto[]> {
    // Lazy flip ngay trước khi list để admin thấy realtime (không phải đợi cron 5 phút).
    await this.expireDueAds();
    const qb = this.adRepo
      .createQueryBuilder('a')
      .orderBy('a.priority', 'DESC')
      .addOrderBy('a.createdAt', 'DESC');
    if (opts.status) qb.andWhere('a.status = :status', { status: opts.status });
    if (opts.placement) qb.andWhere(':p = ANY(a.placements)', { p: opts.placement });
    if (opts.q && opts.q.trim() !== '') {
      qb.andWhere('LOWER(a.title) LIKE :q', { q: `%${opts.q.trim().toLowerCase()}%` });
    }
    const rows = await qb.getMany();
    return rows.map((r) => this.toAdminRow(r));
  }

  async getById(id: string): Promise<AdminAdRowDto> {
    await this.expireDueAds();
    const ad = await this.adRepo.findOne({ where: { id } });
    if (!ad) throw new NotFoundException('Không tìm thấy quảng cáo');
    return this.toAdminRow(ad);
  }

  // ============ Public ============
  async listPublic(placement: AdPlacement): Promise<PublicAdDto[]> {
    if (!AD_PLACEMENTS.includes(placement)) {
      throw new BadRequestException('placement không hợp lệ');
    }
    const now = new Date();
    const rows = await this.adRepo
      .createQueryBuilder('a')
      .where('a.status = :s', { s: 'active' as AdStatus })
      .andWhere(':p = ANY(a.placements)', { p: placement })
      .andWhere('(a.startAt IS NULL OR a.startAt <= :now)', { now })
      .andWhere('(a.endAt IS NULL OR a.endAt > :now)', { now })
      .orderBy('a.priority', 'DESC')
      .addOrderBy('a.createdAt', 'DESC')
      .getMany();
    return rows.map((r) => this.toPublic(r));
  }

  async incrementClick(id: string): Promise<{ ok: true }> {
    const ad = await this.adRepo.findOne({ where: { id } });
    if (!ad) throw new NotFoundException('Không tìm thấy quảng cáo');
    if (!this.isEffective(ad)) {
      throw new BadRequestException('Quảng cáo không còn hiệu lực');
    }
    await this.adRepo.increment({ id }, 'clickCount', 1);
    return { ok: true };
  }

  async incrementView(id: string): Promise<{ ok: true }> {
    const ad = await this.adRepo.findOne({ where: { id } });
    if (!ad) throw new NotFoundException('Không tìm thấy quảng cáo');
    if (!this.isEffective(ad)) return { ok: true };
    await this.adRepo.increment({ id }, 'viewCount', 1);
    return { ok: true };
  }

  // ============ File ============
  private async tryUnlink(url: string): Promise<void> {
    if (!url) return;
    await this.s3.delete(url);
  }
}
