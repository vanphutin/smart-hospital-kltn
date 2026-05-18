import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiUsageEntity } from '../models/ai-usage.model';
import { OpenAIService } from './openai.service';
import { AnonymizeService } from './anonymize.service';

/**
 * Module hạ tầng AI dùng chung cho mọi tính năng AI:
 *  - OpenAIService: wrap OpenAI SDK, log token + cost vào ai_usage.
 *  - AnonymizeService: bóc PII cơ bản (tên/SĐT/email) trước khi gửi text ra ngoài.
 *
 * Các module feature (suggest-departments, doctor-chat, ...) sẽ import module này
 * để tái sử dụng client + policy chống leak PII.
 */
@Module({
  imports: [TypeOrmModule.forFeature([AiUsageEntity])],
  providers: [OpenAIService, AnonymizeService],
  exports: [OpenAIService, AnonymizeService],
})
export class AiModule {}
