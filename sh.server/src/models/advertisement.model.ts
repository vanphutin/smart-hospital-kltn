/**
 * Model advertisements - bảng quảng cáo (PB38)
 * Hỗ trợ banner / promo, lịch hiển thị, multi-placement (mảng enum).
 */
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export type AdType = 'banner' | 'promo';
export type AdStatus = 'draft' | 'active' | 'paused' | 'archived' | 'expired';
export type AdPlacement = 'home_hero' | 'home_below_search' | 'doctor_detail' | 'dashboard_user';

export const AD_TYPES: AdType[] = ['banner', 'promo'];
export const AD_STATUSES: AdStatus[] = ['draft', 'active', 'paused', 'archived', 'expired'];
export const AD_PLACEMENTS: AdPlacement[] = [
  'home_hero',
  'home_below_search',
  'doctor_detail',
  'dashboard_user',
];

@Entity('advertisements')
export class AdvertisementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AD_TYPES, enumName: 'ad_type', default: 'banner' })
  type: AdType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'link_url', type: 'text', nullable: true })
  linkUrl: string | null;

  @Column({
    type: 'enum',
    enum: AD_PLACEMENTS,
    enumName: 'ad_placement',
    array: true,
    default: () => "'{}'::ad_placement[]",
  })
  placements: AdPlacement[];

  @Column({ type: 'enum', enum: AD_STATUSES, enumName: 'ad_status', default: 'draft' })
  status: AdStatus;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ name: 'start_at', type: 'timestamptz', nullable: true })
  startAt: Date | null;

  @Column({ name: 'end_at', type: 'timestamptz', nullable: true })
  endAt: Date | null;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @Column({ name: 'click_count', type: 'int', default: 0 })
  clickCount: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
