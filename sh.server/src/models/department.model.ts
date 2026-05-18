/**
 * Model departments - bảng departments
 * Chuẩn từ db.sql. Gồm interface và class TypeORM (mapping bảng).
 */
import { Entity, Column, PrimaryColumn } from 'typeorm';

export interface Department {
  id: string;
  name: string;
  description: string | null;
}

@Entity('departments')
export class DepartmentEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
