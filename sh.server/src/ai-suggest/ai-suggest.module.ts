import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentEntity } from '../models/department.model';
import { AiSpecialtySuggestionEntity } from '../models/ai-specialty-suggestion.model';
import { UserEntity } from '../models/user.model';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { SpecialtySuggestService } from './specialty-suggest.service';
import { SlotSuggestService } from './slot-suggest.service';
import { AiSuggestController } from './ai-suggest.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DepartmentEntity, AiSpecialtySuggestionEntity, UserEntity]),
    AuthModule,
    AiModule,
  ],
  controllers: [AiSuggestController],
  providers: [SpecialtySuggestService, SlotSuggestService],
  exports: [SpecialtySuggestService, SlotSuggestService],
})
export class AiSuggestModule {}
