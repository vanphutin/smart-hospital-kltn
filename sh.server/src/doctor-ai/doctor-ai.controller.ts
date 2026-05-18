import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { UserPublic } from '../models/user.model';
import { DoctorChatService } from './doctor-chat.service';
import { DoctorChatSessionsService } from './doctor-chat-sessions.service';

/**
 * Endpoint AI dành cho bác sĩ. Bác sĩ chat với assistant tra cứu hồ sơ
 * của CHÍNH MÌNH (filter doctor_id ở DB layer — KHÔNG dựa vào LLM).
 *
 * Sessions:
 *  - GET    /ai/doctor/sessions              — list các phiên (sidebar)
 *  - POST   /ai/doctor/sessions              — tạo phiên rỗng
 *  - GET    /ai/doctor/sessions/:id          — chi tiết + messages
 *  - PATCH  /ai/doctor/sessions/:id          — đổi tên
 *  - DELETE /ai/doctor/sessions/:id          — xoá
 *
 * Chat:
 *  - POST   /ai/doctor/chat                  — gửi câu hỏi (kèm sessionId hoặc null)
 */
@Controller('ai/doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('doctor')
export class DoctorAiController {
  constructor(
    private readonly chat: DoctorChatService,
    private readonly sessions: DoctorChatSessionsService,
  ) {}

  @Post('chat')
  async chatEndpoint(
    @CurrentUser() user: UserPublic,
    @Body()
    body: {
      question?: string;
      patientId?: string | null;
      sessionId?: string | null;
    } = {},
  ) {
    return this.chat.chat({
      doctorId: user.id,
      question: body.question ?? '',
      patientId: body.patientId ?? null,
      sessionId: body.sessionId ?? null,
    });
  }

  @Get('sessions')
  listSessions(@CurrentUser() user: UserPublic) {
    return this.sessions.list(user.id);
  }

  @Post('sessions')
  async createSession(@CurrentUser() user: UserPublic) {
    const s = await this.sessions.create(user.id);
    return {
      id: s.id,
      title: s.title,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  @Get('sessions/:id')
  getSession(
    @CurrentUser() user: UserPublic,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sessions.getDetail(user.id, id);
  }

  @Patch('sessions/:id')
  async renameSession(
    @CurrentUser() user: UserPublic,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { title?: string } = {},
  ) {
    const title = (body.title ?? '').trim();
    if (!title) throw new BadRequestException('title không được để trống');
    const s = await this.sessions.rename(user.id, id, title);
    return { id: s.id, title: s.title, updatedAt: s.updatedAt.toISOString() };
  }

  @Delete('sessions/:id')
  async deleteSession(
    @CurrentUser() user: UserPublic,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.sessions.delete(user.id, id);
    return { ok: true };
  }
}
