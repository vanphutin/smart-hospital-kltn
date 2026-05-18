import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { AdsService, PublicAdDto } from './ads.service';
import {
  AD_PLACEMENTS,
  AdPlacement,
} from '../models/advertisement.model';

/**
 * /ads — endpoint công khai cho frontend hiển thị quảng cáo theo vị trí.
 */
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get()
  /** Không cache — sau khi admin xóa/sửa, trang public phải thấy dữ liệu mới ngay (không cần F5). */
  @Header('Cache-Control', 'no-store')
  async list(@Query('placement') placement?: string): Promise<PublicAdDto[]> {
    if (!placement) {
      throw new BadRequestException('placement là bắt buộc');
    }
    if (!AD_PLACEMENTS.includes(placement as AdPlacement)) {
      throw new BadRequestException('placement không hợp lệ');
    }
    return this.adsService.listPublic(placement as AdPlacement);
  }

  @Post(':id/click')
  async click(@Param('id', ParseUUIDPipe) id: string) {
    return this.adsService.incrementClick(id);
  }

  @Post(':id/view')
  async view(@Param('id', ParseUUIDPipe) id: string) {
    return this.adsService.incrementView(id);
  }
}
