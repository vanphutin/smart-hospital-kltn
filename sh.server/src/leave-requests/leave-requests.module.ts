import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorLeaveRequestEntity } from '../models/doctor-leave-request.model';
import { AppointmentSlotEntity } from '../models/appointment-slot.model';
import { UserEntity } from '../models/user.model';
import { AuthModule } from '../auth/auth.module';
import { LeaveRequestsService } from './leave-requests.service';
import { AdminLeaveController } from './admin-leave.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorLeaveRequestEntity, AppointmentSlotEntity, UserEntity]),
    AuthModule,
  ],
  controllers: [AdminLeaveController],
  providers: [LeaveRequestsService],
  exports: [LeaveRequestsService],
})
export class LeaveRequestsModule {}
