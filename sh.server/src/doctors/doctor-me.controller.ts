import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import {
  DoctorsService,
  type DoctorPatientDto,
  type DoctorAppointmentDto,
} from './doctors.service';
import { AppointmentSlotEntity } from '../models/appointment-slot.model';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { UserPublic } from '../models/user.model';
import { LeaveRequestsService } from '../leave-requests/leave-requests.service';

/** API cho bác sĩ: slot; nghỉ phép. Hồ sơ khám: `MedicalRecordsController` (module medical-records). */
@Controller('doctor/me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('doctor')
export class DoctorMeController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly leaveRequests: LeaveRequestsService,
  ) {}

  @Get('slots')
  async getMySlots(
    @CurrentUser() user: UserPublic,
    @Query('from') fromDate?: string,
  ): Promise<AppointmentSlotEntity[]> {
    return this.doctorsService.findSlotsByDoctor(user.id, fromDate);
  }

  @Get('leave-requests')
  async listMyLeaveRequests(@CurrentUser() user: UserPublic) {
    return this.leaveRequests.listForDoctor(user.id);
  }

  @Post('leave-requests')
  async createLeaveRequest(
    @CurrentUser() user: UserPublic,
    @Body() body: { startDate: string; endDate: string; reason?: string | null },
  ) {
    return this.leaveRequests.createForDoctor(user.id, body);
  }

  @Get('patients')
  async listMyPatients(@CurrentUser() user: UserPublic): Promise<DoctorPatientDto[]> {
    return this.doctorsService.findMyPatients(user.id);
  }

  @Get('appointments')
  async listMyAppointments(
    @CurrentUser() user: UserPublic,
    @Query('from') fromDate?: string,
    @Query('to') toDate?: string,
  ): Promise<DoctorAppointmentDto[]> {
    return this.doctorsService.findMyAppointmentsByRange(user.id, fromDate, toDate);
  }
}
