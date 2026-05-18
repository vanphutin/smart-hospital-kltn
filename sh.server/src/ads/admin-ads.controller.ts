import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { UserPublic } from '../models/user.model';
import { adImageMulterOptions } from '../common/image-upload.config';
import { AdsService, AdminAdRowDto } from './ads.service';
import { S3UploadService } from '../common/s3-upload.service';
import {
  AD_PLACEMENTS,
  AD_STATUSES,
  AdPlacement,
  AdStatus,
} from '../models/advertisement.model';

/**
 * /admin/ads — quản lý quảng cáo (PB38).
 */
@Controller('admin/ads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminAdsController {
  constructor(
    private readonly adsService: AdsService,
    private readonly s3: S3UploadService,
  ) {}

  @Get()
  async list(
    @Query('status') status?: string,
    @Query('placement') placement?: string,
    @Query('q') q?: string,
  ): Promise<AdminAdRowDto[]> {
    let st: AdStatus | undefined;
    if (status && status !== '') {
      if (!AD_STATUSES.includes(status as AdStatus)) {
        throw new BadRequestException('status không hợp lệ');
      }
      st = status as AdStatus;
    }
    let pl: AdPlacement | undefined;
    if (placement && placement !== '') {
      if (!AD_PLACEMENTS.includes(placement as AdPlacement)) {
        throw new BadRequestException('placement không hợp lệ');
      }
      pl = placement as AdPlacement;
    }
    return this.adsService.listForAdmin({ status: st, placement: pl, q });
  }

  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string): Promise<AdminAdRowDto> {
    return this.adsService.getById(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image', adImageMulterOptions))
  async create(
    @Body() body: Record<string, unknown>,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() actor: UserPublic,
  ): Promise<AdminAdRowDto> {
    const dto = this.adsService.parseUpsertBody(body, true);
    const imagePath = file ? await this.s3.upload(file, 'ads') : null;
    return this.adsService.createAd(dto, imagePath, actor.id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', adImageMulterOptions))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Record<string, unknown>,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<AdminAdRowDto> {
    const dto = this.adsService.parseUpsertBody(body, false);
    const imagePath = file ? await this.s3.upload(file, 'ads') : undefined;
    const removeImage = body.removeImage === '1' || body.removeImage === 'true';
    return this.adsService.updateAd(id, dto, imagePath, removeImage);
  }

  @Patch(':id/status')
  async patchStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status?: string },
  ): Promise<AdminAdRowDto> {
    const v = String(body?.status ?? '').trim();
    if (!AD_STATUSES.includes(v as AdStatus)) {
      throw new BadRequestException('status không hợp lệ');
    }
    return this.adsService.setStatus(id, v as AdStatus);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.adsService.deleteAd(id);
  }
}
