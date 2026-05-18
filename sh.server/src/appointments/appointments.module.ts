import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentEntity } from '../models/appointment.model';
import { PaymentEntity } from '../models/payment.model';
import { AppointmentSlotEntity } from '../models/appointment-slot.model';
import { AppointmentReminderEntity } from '../models/appointment-reminder.model';
import { AppointmentsController } from './appointments.controller';
import { AdminAppointmentsController } from './admin-appointments.controller';
import { PayOSWebhookController } from './payos-webhook.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentRemindersService } from './appointment-reminders.service';
import { PayOSModule } from '../payos/payos.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppointmentEntity,
      PaymentEntity,
      AppointmentSlotEntity,
      AppointmentReminderEntity,
    ]),
    PayOSModule,
    AuthModule,
  ],
  controllers: [AppointmentsController, AdminAppointmentsController, PayOSWebhookController],
  providers: [AppointmentsService, AppointmentRemindersService],
  exports: [AppointmentsService, AppointmentRemindersService],
})
export class AppointmentsModule {}
