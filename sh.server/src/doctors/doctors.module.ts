import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../models/user.model';
import { DoctorScheduleEntity } from '../models/doctor-schedule.model';
import { AppointmentSlotEntity } from '../models/appointment-slot.model';
import { AppointmentEntity } from '../models/appointment.model';
import { DoctorsController } from './doctors.controller';
import { DoctorMeController } from './doctor-me.controller';
import { DoctorsService } from './doctors.service';
import { AuthModule } from '../auth/auth.module';
import { LeaveRequestsModule } from '../leave-requests/leave-requests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      DoctorScheduleEntity,
      AppointmentSlotEntity,
      AppointmentEntity,
    ]),
    AuthModule,
    LeaveRequestsModule,
  ],
  controllers: [DoctorsController, DoctorMeController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
