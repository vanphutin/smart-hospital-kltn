import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { UserPublic } from '../models/user.model';
import { AppointmentsService } from './appointments.service';
import { AppointmentRemindersService } from './appointment-reminders.service';

/**
 * Endpoints admin liên quan tới cuộc hẹn — tách controller riêng để
 * gắn @Roles('admin') ở method-level (RolesGuard hiện chỉ đọc handler).
 */
@Controller('admin/appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminAppointmentsController {
  constructor(
    private readonly appointments: AppointmentsService,
    private readonly reminders: AppointmentRemindersService,
  ) {}

  /**
   * Admin force-cancel một cuộc hẹn — dùng khi bác sĩ ốm đột xuất, khiếu nại,
   * hoặc dọn dẹp lịch lỗi. Mất cọc theo policy chung.
   */
  @Post(':id/cancel')
  @Roles('admin')
  async cancel(
    @CurrentUser() admin: UserPublic,
    @Param('id', ParseUUIDPipe) appointmentId: string,
    @Body() body: { reason?: string | null } = {},
  ) {
    return this.appointments.cancelByAdmin(admin.id, appointmentId, body?.reason);
  }

  /**
   * Chạy thủ công job nhắc lịch (gửi email H-24 / H-1 cho các cuộc hẹn confirmed).
   * Dùng để test, hoặc để admin chủ động "đẩy" mail mà không cần đợi cron 5 phút.
   * Idempotent: cuộc hẹn đã nhận mail mốc nào sẽ không gửi lại mốc đó.
   */
  @Post('reminders/run')
  @Roles('admin')
  async runReminders() {
    return this.reminders.runRemindersOnce();
  }

  /**
   * Force-send mail nhắc lịch TEST cho 1 cuộc hẹn cụ thể — bỏ qua cửa sổ thời gian
   * và idempotency log. Subject có prefix [TEST]. Bấm nhiều lần đều gửi.
   */
  @Post(':id/send-reminder-test')
  @Roles('admin')
  async sendReminderTest(
    @Param('id', ParseUUIDPipe) appointmentId: string,
    @Body() body: { kind?: 'h24' | 'h1' } = {},
  ) {
    const kind = body?.kind === 'h24' ? 'h24' : 'h1';
    return this.reminders.sendTestReminder(appointmentId, kind);
  }
}
