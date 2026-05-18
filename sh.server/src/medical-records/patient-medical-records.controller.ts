import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { UserPublic } from '../models/user.model';
import { MedicalRecordsService } from './medical-records.service';

/**
 * API hồ sơ khám dành cho bệnh nhân (role 'user').
 * Tách controller riêng để bảo đảm RBAC method-level (RolesGuard hiện chỉ đọc handler).
 */
@Controller('medical-records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientMedicalRecordsController {
  constructor(private readonly medicalRecords: MedicalRecordsService) {}

  /** Toàn bộ hồ sơ khám của chính bệnh nhân (mới nhất trước). */
  @Get('me/patient')
  @Roles('user')
  listMine(@CurrentUser() user: UserPublic) {
    return this.medicalRecords.listForPatient(user.id);
  }

  /** Hồ sơ khám của 1 cuộc hẹn cụ thể — chỉ khi cuộc hẹn thuộc về bệnh nhân. */
  @Get('me/patient/by-appointment/:appointmentId')
  @Roles('user')
  getByAppointment(
    @CurrentUser() user: UserPublic,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ) {
    return this.medicalRecords.getByAppointmentForPatient(user.id, appointmentId);
  }
}
