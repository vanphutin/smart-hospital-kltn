import { Controller, Get, Param, Post, Query, UseGuards, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { UserPublic } from '../models/user.model';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveRequestStatus } from '../models/enums';

@Controller('admin/leave-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminLeaveController {
  constructor(private readonly leaveRequests: LeaveRequestsService) {}

  @Get()
  async list(@Query('status') statusRaw?: string) {
    let status: LeaveRequestStatus | undefined;
    if (statusRaw != null && statusRaw !== '') {
      const v = statusRaw.trim();
      if (!Object.values(LeaveRequestStatus).includes(v as LeaveRequestStatus)) {
        throw new BadRequestException('status: pending | approved | rejected');
      }
      status = v as LeaveRequestStatus;
    }
    return this.leaveRequests.listForAdmin(status);
  }

  @Post(':id/approve')
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: UserPublic,
  ) {
    return this.leaveRequests.approve(id, admin.id);
  }

  @Post(':id/reject')
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: UserPublic,
  ) {
    return this.leaveRequests.reject(id, admin.id);
  }
}
