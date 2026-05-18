import type { AdPlacement, AdStatus, AdType } from '../../models/advertisement.model';

/**
 * Dữ liệu sau khi đã chuẩn hóa từ multipart/form-data.
 * Tất cả optional ở DTO update; controller sẽ validate required cho create.
 */
export interface UpsertAdDto {
  type?: AdType;
  title?: string;
  body?: string | null;
  linkUrl?: string | null;
  placements?: AdPlacement[];
  status?: AdStatus;
  priority?: number;
  startAt?: Date | null;
  endAt?: Date | null;
}
