import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvertisementEntity } from '../models/advertisement.model';
import { AdsService } from './ads.service';
import { AdminAdsController } from './admin-ads.controller';
import { AdsController } from './ads.controller';
import { AuthModule } from '../auth/auth.module';
import { S3UploadService } from '../common/s3-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdvertisementEntity]), AuthModule],
  controllers: [AdminAdsController, AdsController],
  providers: [AdsService, S3UploadService],
})
export class AdsModule {}
