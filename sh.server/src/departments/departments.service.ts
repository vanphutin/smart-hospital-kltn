import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { DepartmentEntity } from '../models/department.model';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly repo: Repository<DepartmentEntity>,
  ) {}

  async findAll(): Promise<DepartmentEntity[]> {
    return this.repo.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<DepartmentEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** So sánh trùng tên (bỏ qua chữ hoa/thường, gom khoảng trắng). */
  private deptNameCanonical(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFKC')
      .toLocaleLowerCase('vi-VN');
  }

  private async nameTakenByAnother(canonical: string, excludeId?: string): Promise<boolean> {
    const rows = await this.repo.find({ select: ['id', 'name'] });
    return rows.some((r) => r.id !== excludeId && this.deptNameCanonical(r.name) === canonical);
  }

  async create(dto: { name: string; description?: string | null }): Promise<DepartmentEntity> {
    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestException('Tên khoa không được để trống.');
    }
    const canon = this.deptNameCanonical(name);
    if (await this.nameTakenByAnother(canon)) {
      throw new ConflictException('Tên khoa đã tồn tại.');
    }
    const entity = this.repo.create({
      id: randomUUID(),
      name,
      description: dto.description?.trim() || null,
    });
    return this.repo.save(entity);
  }

  async update(id: string, dto: { name?: string; description?: string | null }): Promise<DepartmentEntity> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Khoa không tồn tại');
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Tên khoa không được để trống.');
      }
      const canon = this.deptNameCanonical(name);
      if (await this.nameTakenByAnother(canon, id)) {
        throw new ConflictException('Tên khoa đã tồn tại.');
      }
      existing.name = name;
    }
    if (dto.description !== undefined) existing.description = dto.description?.trim() || null;
    return this.repo.save(existing);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Khoa không tồn tại');
  }
}
