import { Controller, Post, Get, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import {
  AppointmentsService,
  CreateBookingResult,
  AppointmentWithDetailsDto,
  PaymentHistoryItemDto,
} from './appointments.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { UserPublic } from '../models/user.model';
import { ConfigService } from '@nestjs/config';

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: UserPublic,
    @Body() dto: CreateBookingDto,
  ): Promise<CreateBookingResult> {
    const baseUrl = this.config.get<string>('PUBLIC_API_URL') ?? 'http://localhost:3000';
    const returnUrl = dto.returnUrl ?? `${baseUrl}/booking/success`;
    const cancelUrl = dto.cancelUrl ?? `${baseUrl}/booking/cancel`;
    return this.appointmentsService.createBooking(user.id, dto, returnUrl, cancelUrl);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyAppointments(@CurrentUser() user: UserPublic): Promise<AppointmentWithDetailsDto[]> {
    return this.appointmentsService.findMyAppointments(user.id);
  }

  @Get('me/payments')
  @UseGuards(JwtAuthGuard)
  async getMyPayments(@CurrentUser() user: UserPublic): Promise<PaymentHistoryItemDto[]> {
    return this.appointmentsService.findMyPayments(user.id);
  }

  /** Bệnh nhân tự huỷ cuộc hẹn của chính mình. Mất cọc nếu đã thanh toán. */
  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelMine(
    @CurrentUser() user: UserPublic,
    @Param('id', ParseUUIDPipe) appointmentId: string,
    @Body() body: { reason?: string | null } = {},
  ) {
    return this.appointmentsService.cancelByPatient(user.id, appointmentId, body?.reason);
  }
}
