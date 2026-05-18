import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecordEntity } from '../models/medical-record.model';
import { AppointmentEntity } from '../models/appointment.model';
import { UserEntity } from '../models/user.model';
import { MedicalRecordEmbeddingEntity } from '../models/medical-record-embedding.model';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordEmbeddingsService } from './medical-record-embeddings.service';
import { MedicalRecordsController } from './medical-records.controller';
import { PatientMedicalRecordsController } from './patient-medical-records.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalRecordEntity,
      AppointmentEntity,
      UserEntity,
      MedicalRecordEmbeddingEntity,
    ]),
    AuthModule,
    AiModule,
  ],
  controllers: [MedicalRecordsController, PatientMedicalRecordsController],
  providers: [MedicalRecordsService, MedicalRecordEmbeddingsService],
  exports: [MedicalRecordsService, MedicalRecordEmbeddingsService],
})
export class MedicalRecordsModule {}
