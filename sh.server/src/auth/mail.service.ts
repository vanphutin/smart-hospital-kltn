import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sgMail = require('@sendgrid/mail') as typeof import('@sendgrid/mail');

/**
 * Gửi email qua SendGrid.
 * Biến môi trường: SENDGRID_API_KEY, MAIL_FROM.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly configured: boolean;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY?.trim();
    if (!apiKey) {
      this.logger.warn('SENDGRID_API_KEY chưa cấu hình — không gửi được email.');
      this.configured = false;
      return;
    }
    sgMail.setApiKey(apiKey);
    this.configured = true;
  }

  isConfigured(): boolean {
    return this.configured && !!process.env.MAIL_FROM?.trim();
  }

  private get from(): string {
    const f = process.env.MAIL_FROM?.trim();
    if (!f) throw new Error('MAIL_FROM chưa cấu hình');
    return f;
  }

  private guard() {
    if (!this.configured) throw new Error('SENDGRID_API_KEY chưa cấu hình');
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    this.guard();
    await sgMail.send({
      from: this.from,
      to,
      subject: 'Đặt lại mật khẩu — SmartHospital',
      html: `
        <p>Xin chào,</p>
        <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản SmartHospital.</p>
        <p><a href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#0d9488;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Đặt lại mật khẩu</a></p>
        <p>Liên kết có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
        <p style="color:#64748b;font-size:12px;">Nếu nút không hoạt động, dán URL sau vào trình duyệt:<br/><span style="word-break:break-all;">${resetLink}</span></p>
      `,
    });
    this.logger.log(`Đã gửi email đặt lại mật khẩu tới ${to}`);
  }

  async sendDoctorAccountCreatedEmail(
    to: string,
    ctx: { doctorName: string; email: string; initialPassword: string },
  ): Promise<void> {
    this.guard();
    const appBase = (process.env.CLIENT_APP_URL ?? '').trim() || 'http://localhost:5173';
    const loginUrl = `${appBase}/?view=login`;

    await sgMail.send({
      from: this.from,
      to,
      subject: 'Tài khoản bác sĩ — SmartHospital',
      html: `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;line-height:1.55;">
          <h2 style="margin:0 0 12px 0;color:#0d9488;">Tài khoản bác sĩ đã được tạo</h2>
          <p>Xin chào <strong>${escapeHtml(ctx.doctorName)}</strong>,</p>
          <p>Quản trị viên đã tạo tài khoản bác sĩ cho bạn trên SmartHospital. Thông tin đăng nhập ban đầu:</p>
          <table style="border-collapse:collapse;margin:10px 0 16px 0;">
            <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Email</td><td><strong>${escapeHtml(ctx.email)}</strong></td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Mật khẩu</td><td><strong>${escapeHtml(ctx.initialPassword)}</strong></td></tr>
          </table>
          <p>
            <a href="${loginUrl}" style="display:inline-block;padding:12px 18px;background:#0d9488;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;">
              Mở trang đăng nhập
            </a>
          </p>
          <p style="background:#f1f5f9;border-left:4px solid #0d9488;padding:10px 14px;border-radius:6px;">
            Khuyến nghị: sau khi đăng nhập, hãy đổi mật khẩu ngay.
          </p>
          <p style="color:#64748b;font-size:12px;margin-top:24px;">Email được gửi tự động, vui lòng không reply.</p>
        </div>
      `,
    });
    this.logger.log(`Đã gửi email tạo tài khoản bác sĩ tới ${to}`);
  }

  async sendAppointmentReminderEmail(
    to: string,
    ctx: {
      patientName: string;
      doctorName: string;
      departmentName: string | null;
      slotTime: Date;
      kind: 'h24' | 'h1';
      isTest?: boolean;
    },
  ): Promise<void> {
    this.guard();
    const fmt = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const slotLabel = fmt.format(ctx.slotTime);
    const isH1 = ctx.kind === 'h1';
    const baseSubject = isH1
      ? '[Nhắc lịch] Cuộc hẹn của bạn sắp diễn ra trong 1 giờ'
      : '[Nhắc lịch] Cuộc hẹn của bạn vào ngày mai';
    const subject = ctx.isTest ? `[TEST] ${baseSubject}` : baseSubject;
    const heading = isH1 ? 'Cuộc hẹn sắp diễn ra trong 1 giờ' : 'Nhắc lịch khám ngày mai';
    const tip = isH1
      ? 'Vui lòng có mặt trước giờ hẹn 10–15 phút để làm thủ tục tiếp đón.'
      : 'Vui lòng sắp xếp thời gian và có mặt đúng hẹn. Nếu cần đổi/huỷ, hãy thực hiện sớm trên hệ thống.';
    const dept = ctx.departmentName ? ` — ${ctx.departmentName}` : '';

    await sgMail.send({
      from: this.from,
      to,
      subject,
      html: `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;line-height:1.55;">
          <h2 style="margin:0 0 12px 0;color:#0d9488;">${heading}</h2>
          <p>Xin chào <strong>${escapeHtml(ctx.patientName)}</strong>,</p>
          <p>SmartHospital xin nhắc bạn về cuộc hẹn sắp tới:</p>
          <table style="border-collapse:collapse;margin:8px 0 16px 0;">
            <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Bác sĩ</td><td><strong>${escapeHtml(ctx.doctorName)}</strong>${escapeHtml(dept)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Thời gian</td><td><strong>${escapeHtml(slotLabel)}</strong></td></tr>
          </table>
          <p style="background:#f1f5f9;border-left:4px solid #0d9488;padding:10px 14px;border-radius:6px;">${tip}</p>
          <p style="color:#64748b;font-size:12px;margin-top:24px;">Email được gửi tự động, vui lòng không reply.</p>
        </div>
      `,
    });
    this.logger.log(`Đã gửi email nhắc lịch (${ctx.kind}) tới ${to}`);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
