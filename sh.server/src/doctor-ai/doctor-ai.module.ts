import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { MedicalRecordsModule } from '../medical-records/medical-records.module';
import { DoctorChatSessionEntity } from '../models/doctor-chat-session.model';
import { DoctorChatMessageEntity } from '../models/doctor-chat-message.model';
import { DoctorChatService } from './doctor-chat.service';
import { DoctorChatSessionsService } from './doctor-chat-sessions.service';
import { DoctorAiController } from './doctor-ai.controller';

/**
 * Module Trợ lý AI cho bác sĩ:
 *  - DoctorChatService: anonymize → embed query → vector search (lọc theo doctor_id)
 *    → LLM với context → lưu vào doctor_chat_messages.
 *  - DoctorChatSessionsService: CRUD phiên hội thoại.
 *  - DoctorAiController: endpoints /ai/doctor/* (role=doctor).
 */
@Module({
  imports: [
    AuthModule,
    AiModule,
    MedicalRecordsModule,
    TypeOrmModule.forFeature([DoctorChatSessionEntity, DoctorChatMessageEntity]),
  ],
  controllers: [DoctorAiController],
  providers: [DoctorChatService, DoctorChatSessionsService],
})
export class DoctorAiModule {}
