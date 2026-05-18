import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { AppointmentEntity } from '../models/appointment.model';
import { PaymentEntity } from '../models/payment.model';
import { AppointmentSlotEntity } from '../models/appointment-slot.model';
import { SlotStatus, PaymentStatus, PaymentType } from '../models/enums';
import { AppointmentStatus } from '../models/enums';
import { PayOSService } from '../payos/payos.service';
import { ConfigService } from '@nestjs/config';

/** TTL (phút) — appointment 'pending' chưa được thanh toán cọc sau khoảng này sẽ tự huỷ và trả slot. */
const PENDING_BOOKING_TTL_MINUTES = 5;

/** Tiền cọc mặc định (VND) khi đặt lịch */
const DEFAULT_DEPOSIT_AMOUNT = 50_000;

export interface CreateBookingDto {
  slotId: string;
  symptoms?: string | null;
}

export interface CreateBookingResult {
  appointment: AppointmentEntity;
  payment: PaymentEntity;
  checkoutUrl: string;
}

/** Lịch hẹn kèm thông tin bác sĩ và slot (GET /appointments/me). */
export interface AppointmentWithDetailsDto {
  id: string;
  userId: string;
  doctorId: string;
  slotId: string | null;
  symptoms: string | null;
  status: string;
  depositAmount: number | null;
  createdAt: Date;
  doctor: { fullName: string; avatarUrl: string | null; departmentName: string | null } | null;
  slot: { slotTime: Date } | null;
  /** Đã có hồ sơ khám (medical_records) tương ứng → bệnh nhân có thể xem kết quả khám. */
  hasMedicalRecord: boolean;
  /** Lý do huỷ (nếu user/admin/hệ thống huỷ); null nếu chưa huỷ. */
  cancelReason: string | null;
  /** Thời điểm huỷ; null nếu chưa huỷ. */
  cancelledAt: Date | null;
}

/** Lịch sử giao dịch của bệnh nhân (GET /appointments/me/payments). */
export interface PaymentHistoryItemDto {
  id: string;
  amount: number;
  paymentType: string | null;
  paymentMethod: string | null;
  status: string;
  createdAt: Date;
  payosOrderCode: number | null;
  appointment: {
    id: string;
    status: string;
    slotTime: Date | null;
    doctor: {
      fullName: string;
      avatarUrl: string | null;
      departmentName: string | null;
    } | null;
  } | null;
}

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepo: Repository<AppointmentEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
    @InjectRepository(AppointmentSlotEntity)
    private readonly slotRepo: Repository<AppointmentSlotEntity>,
    private readonly dataSource: DataSource,
    private readonly payos: PayOSService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Đặt lịch — chuẩn concurrency:
   *  - Toàn bộ insert/update bọc trong 1 transaction.
   *  - SELECT slot ... FOR UPDATE để serialize 2 request đồng thời cùng 1 slot.
   *  - Partial UNIQUE index (status <> 'cancelled') ở DB là chốt cuối cùng (Layer 1).
   *  - Gọi PayOS bên trong transaction để fail → rollback sạch (lock chỉ giữ trên row slot,
   *    không ảnh hưởng các slot khác).
   */
  async createBooking(
    userId: string,
    dto: CreateBookingDto,
    returnUrl: string,
    cancelUrl: string,
  ): Promise<CreateBookingResult> {
    const baseUrl = this.config.get<string>('PUBLIC_API_URL') ?? 'http://localhost:3000';
    const payosReturn = returnUrl || `${baseUrl}/booking/success`;
    const payosCancel = cancelUrl || `${baseUrl}/booking/cancel`;

    // Đọc tiền cọc từ system_config; fallback về hằng số nếu chưa có bảng/row.
    let depositAmount = DEFAULT_DEPOSIT_AMOUNT;
    try {
      const rows = (await this.dataSource.query(
        `SELECT value FROM system_config WHERE key = 'deposit_amount' LIMIT 1`,
      )) as { value: string }[];
      if (rows.length > 0) {
        const parsed = Number(rows[0].value);
        if (!Number.isNaN(parsed) && parsed > 0) depositAmount = parsed;
      }
    } catch {
      // Bảng chưa tồn tại hoặc lỗi DB → dùng giá trị mặc định, không crash.
    }

    try {
      return await this.dataSource.transaction(async (em) => {
        // (1) Khóa pessimistic_write trên slot row → request thứ 2 cùng slot phải đợi.
        const slot = await em
          .createQueryBuilder(AppointmentSlotEntity, 's')
          .where('s.id = :id', { id: dto.slotId })
          .setLock('pessimistic_write')
          .getOne();
        if (!slot) throw new BadRequestException('Slot không tồn tại');
        if (slot.status !== SlotStatus.Available) {
          throw new ConflictException('Slot vừa được người khác đặt, vui lòng chọn khung giờ khác');
        }
        if (new Date(slot.slotTime).getTime() <= Date.now()) {
          throw new BadRequestException('Không thể đặt khung giờ đã qua. Vui lòng chọn slot trong tương lai.');
        }

        // (2) Idempotency cấp ứng dụng: cùng user đã có appointment 'pending' cho slot này → trả về bản đó.
        // Tránh tạo trùng nếu user reload trang/bấm 2 lần. Ngoài ra DB cũng có partial UNIQUE chốt cứng.
        const existing = await em
          .createQueryBuilder(AppointmentEntity, 'a')
          .innerJoinAndSelect(PaymentEntity, 'p', 'p.appointment_id = a.id')
          .where('a.slot_id = :slotId', { slotId: slot.id })
          .andWhere('a.user_id = :userId', { userId })
          .andWhere('a.status = :st', { st: AppointmentStatus.Pending })
          .andWhere('p.status = :pst', { pst: PaymentStatus.Pending })
          .getRawAndEntities();
        if (existing.entities.length > 0) {
          const apt = existing.entities[0];
          const orderCodeExisting = Number(existing.raw[0]?.p_payos_order_code);
          // Tạo lại link PayOS (idempotent với cùng orderCode) để client tiếp tục thanh toán.
          const link = await this.payos.createPaymentLink({
            orderCode: orderCodeExisting,
            amount: depositAmount,
            description: `Dat lich kham - Coc ${depositAmount} VND`,
            returnUrl: payosReturn,
            cancelUrl: payosCancel,
          });
          const payment = await em.findOneOrFail(PaymentEntity, {
            where: { appointmentId: apt.id },
          });
          return {
            appointment: apt,
            payment,
            checkoutUrl: link.checkoutUrl,
          };
        }

        // (3) Mark slot booked TRƯỚC khi insert appointment để cửa sổ race ngắn nhất.
        slot.status = SlotStatus.Booked;
        await em.save(slot);

        // (4) Insert appointment + payment. Nếu race cực hiếm vượt qua check (2 transaction
        // commit gần nhau với isolation default READ COMMITTED), partial UNIQUE INDEX sẽ chặn.
        const appointment = await em.save(AppointmentEntity, {
          userId,
          doctorId: slot.doctorId,
          slotId: slot.id,
          symptoms: dto.symptoms?.trim() || null,
          status: AppointmentStatus.Pending,
          depositAmount,
        });

        const orderCode = this.generateOrderCode();
        const payment = await em.save(PaymentEntity, {
          appointmentId: appointment.id,
          amount: depositAmount,
          paymentType: PaymentType.Deposit,
          paymentMethod: 'payos',
          status: PaymentStatus.Pending,
          payosOrderCode: orderCode,
        });

        // (5) Gọi PayOS — fail sẽ rollback toàn bộ (slot release + appointment/payment xoá).
        const link = await this.payos.createPaymentLink({
          orderCode,
          amount: depositAmount,
          description: `Dat lich kham - Coc ${depositAmount} VND`,
          returnUrl: payosReturn,
          cancelUrl: payosCancel,
        });

        return {
          appointment,
          payment,
          checkoutUrl: link.checkoutUrl,
        };
      });
    } catch (e) {
      // PG unique_violation (Layer 1) → trả 409 dễ hiểu thay vì 500.
      if (e instanceof QueryFailedError && (e as QueryFailedError & { code?: string }).code === '23505') {
        throw new ConflictException('Slot vừa được người khác đặt, vui lòng chọn khung giờ khác');
      }
      throw e;
    }
  }

  /** Lịch của user kèm thông tin bác sĩ và slot (cho UI Lịch hẹn sắp tới). */
  async findMyAppointments(userId: string): Promise<AppointmentWithDetailsDto[]> {
    const list = await this.appointmentRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['doctor', 'doctor.department', 'slot'],
    });
    if (list.length === 0) return [];

    // Một query duy nhất để xác định appointment nào đã có medical_records.
    const ids = list.map((a) => a.id);
    const recRows = (await this.appointmentRepo.manager.query(
      `SELECT appointment_id FROM medical_records WHERE appointment_id = ANY($1::uuid[])`,
      [ids],
    )) as { appointment_id: string }[];
    const withRecord = new Set(recRows.map((r) => r.appointment_id));

    return list.map((a) => this.toAppointmentWithDetails(a, withRecord.has(a.id)));
  }

  /**
   * Lịch sử giao dịch của bệnh nhân: gồm mọi payment (pending/paid/failed) gắn với
   * các appointment do user này tạo. Sắp xếp mới nhất trước.
   */
  async findMyPayments(userId: string): Promise<PaymentHistoryItemDto[]> {
    const rows = await this.paymentRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.appointment', 'a')
      .leftJoinAndSelect('a.doctor', 'doctor')
      .leftJoinAndSelect('doctor.department', 'department')
      .leftJoinAndSelect('a.slot', 'slot')
      .where('a.user_id = :userId', { userId })
      .orderBy('p.created_at', 'DESC')
      .getMany();

    return rows.map((p) => {
      const a = p.appointment as AppointmentEntity | undefined;
      const doctor = a?.doctor as
        | { fullName?: string; avatarUrl?: string | null; department?: { name?: string } | null }
        | undefined;
      const slot = a?.slot as AppointmentSlotEntity | null | undefined;
      return {
        id: p.id,
        amount: Number(p.amount),
        paymentType: p.paymentType,
        paymentMethod: p.paymentMethod,
        status: p.status,
        createdAt: p.createdAt,
        payosOrderCode: p.payosOrderCode != null ? Number(p.payosOrderCode) : null,
        appointment: a
          ? {
              id: a.id,
              status: a.status,
              slotTime: slot?.slotTime ?? null,
              doctor: doctor
                ? {
                    fullName: doctor.fullName ?? '',
                    avatarUrl: doctor.avatarUrl ?? null,
                    departmentName: doctor.department?.name ?? null,
                  }
                : null,
            }
          : null,
      };
    });
  }

  private toAppointmentWithDetails(
    a: AppointmentEntity,
    hasMedicalRecord = false,
  ): AppointmentWithDetailsDto {
    const doctor = a.doctor as { fullName?: string; avatarUrl?: string | null; department?: { name?: string } | null } | undefined;
    const slot = a.slot as AppointmentSlotEntity | null | undefined;
    return {
      id: a.id,
      userId: a.userId,
      doctorId: a.doctorId,
      slotId: a.slotId,
      symptoms: a.symptoms,
      status: a.status,
      depositAmount: a.depositAmount != null ? Number(a.depositAmount) : null,
      createdAt: a.createdAt,
      doctor: doctor
        ? {
            fullName: doctor.fullName ?? '',
            avatarUrl: doctor.avatarUrl ?? null,
            departmentName: doctor.department?.name ?? null,
          }
        : null,
      slot: slot ? { slotTime: slot.slotTime } : null,
      hasMedicalRecord,
      cancelReason: a.cancelReason ?? null,
      cancelledAt: a.cancelledAt ?? null,
    };
  }

  // ============ Cancel APIs ============

  /** Bệnh nhân tự huỷ cuộc hẹn của mình (pending hoặc confirmed; trước giờ khám). */
  async cancelByPatient(
    userId: string,
    appointmentId: string,
    reason?: string | null,
  ): Promise<{ id: string; status: string; depositRefunded: boolean }> {
    return this.cancelInternal({
      appointmentId,
      actorId: userId,
      isAdmin: false,
      reason: reason?.trim() || null,
    });
  }

  /** Admin force-cancel bất kỳ cuộc hẹn nào (kể cả sát giờ — vd bác sĩ ốm đột xuất). */
  async cancelByAdmin(
    adminId: string,
    appointmentId: string,
    reason?: string | null,
  ): Promise<{ id: string; status: string; depositRefunded: boolean }> {
    return this.cancelInternal({
      appointmentId,
      actorId: adminId,
      isAdmin: true,
      reason: reason?.trim() || null,
    });
  }

  /**
   * Logic huỷ chung — bọc transaction, kiểm tra quyền, kiểm tra trạng thái + thời gian,
   * trả slot về available nếu không còn ai khác đang giữ.
   * Chính sách: HUỶ = MẤT CỌC (cọc là phí giữ chỗ, không hoàn).
   */
  private async cancelInternal(opts: {
    appointmentId: string;
    actorId: string;
    isAdmin: boolean;
    reason: string | null;
  }): Promise<{ id: string; status: string; depositRefunded: boolean }> {
    const { appointmentId, actorId, isAdmin, reason } = opts;

    return this.dataSource.transaction(async (em) => {
      // (1) Khoá row appointment để tránh 2 nguồn cùng huỷ.
      const appt = await em
        .createQueryBuilder(AppointmentEntity, 'a')
        .where('a.id = :id', { id: appointmentId })
        .setLock('pessimistic_write')
        .getOne();
      if (!appt) throw new NotFoundException('Không tìm thấy cuộc hẹn');

      // (2) Kiểm tra quyền: bệnh nhân chỉ được huỷ cuộc hẹn của chính họ.
      if (!isAdmin && appt.userId !== actorId) {
        throw new ForbiddenException('Đây không phải cuộc hẹn của bạn');
      }

      // (3) Kiểm tra trạng thái — chỉ cho huỷ pending hoặc confirmed.
      if (
        appt.status !== AppointmentStatus.Pending &&
        appt.status !== AppointmentStatus.Confirmed
      ) {
        throw new BadRequestException(
          `Cuộc hẹn ở trạng thái '${appt.status}' không thể huỷ`,
        );
      }

      // (4) Bệnh nhân không được huỷ sau giờ khám đã qua. Admin thì được (force-cancel để dọn).
      if (!isAdmin && appt.slotId) {
        const slot = await em.findOne(AppointmentSlotEntity, { where: { id: appt.slotId } });
        if (slot && new Date(slot.slotTime).getTime() <= Date.now()) {
          throw new BadRequestException(
            'Đã quá giờ khám — không thể tự huỷ. Vui lòng liên hệ tổng đài để được hỗ trợ.',
          );
        }
      }

      const hadPaidDeposit =
        appt.status === AppointmentStatus.Confirmed ||
        (
          await em.query(
            `SELECT 1 FROM payments WHERE appointment_id = $1 AND status = 'paid' LIMIT 1`,
            [appt.id],
          )
        ).length > 0;

      // (5) Cập nhật appointment.
      appt.status = AppointmentStatus.Cancelled;
      appt.cancelReason = reason;
      appt.cancelledAt = new Date();
      appt.cancelledBy = actorId;
      await em.save(appt);

      // (6) Trả slot về 'available' nếu không còn cuộc hẹn 'sống' nào khác giữ slot đó.
      if (appt.slotId) {
        await em.query(
          `
          UPDATE appointment_slots
          SET status = $1
          WHERE id = $2
            AND status = $3
            AND NOT EXISTS (
              SELECT 1 FROM appointments a
              WHERE a.slot_id = appointment_slots.id
                AND a.status <> $4
            )
          `,
          [
            SlotStatus.Available,
            appt.slotId,
            SlotStatus.Booked,
            AppointmentStatus.Cancelled,
          ],
        );
      }

      // (7) Lưu ý: chính sách hiện tại là KHÔNG hoàn cọc. Payment 'paid' giữ nguyên — báo cáo
      // tài chính của hệ thống vẫn ghi nhận khoản này. depositRefunded luôn false.
      this.logger.log(
        `[Cancel] appt=${appt.id} by=${actorId} isAdmin=${isAdmin} hadPaid=${hadPaidDeposit} reason=${reason ?? '(none)'}`,
      );

      return {
        id: appt.id,
        status: appt.status,
        depositRefunded: false,
      };
    });
  }

  /**
   * Tự huỷ những appointment 'pending' đã quá {@link PENDING_BOOKING_TTL_MINUTES} phút mà chưa có
   * payment 'paid' → trả slot về 'available'. Idempotent, chạy mỗi 2 phút.
   * Đảm bảo: nếu user mở link PayOS rồi bỏ giữa chừng, slot không bị giữ vĩnh viễn.
   */
  async releaseStalePendingBookings(): Promise<{ cancelled: number; slotsReleased: number }> {
    return this.dataSource.transaction(async (em) => {
      // 1. Tìm appointments hết hạn cần huỷ (sub-query loại bỏ những cái đã có payment paid).
      const stale = (await em.query(
        `
        SELECT a.id AS appointment_id, a.slot_id
        FROM appointments a
        WHERE a.status = $1
          AND a.created_at < (now() - ($2 || ' minutes')::interval)
          AND NOT EXISTS (
            SELECT 1 FROM payments p
            WHERE p.appointment_id = a.id AND p.status = $3
          )
        FOR UPDATE OF a SKIP LOCKED
        `,
        [AppointmentStatus.Pending, String(PENDING_BOOKING_TTL_MINUTES), PaymentStatus.Paid],
      )) as { appointment_id: string; slot_id: string | null }[];

      if (stale.length === 0) return { cancelled: 0, slotsReleased: 0 };

      const apptIds = stale.map((r) => r.appointment_id);
      const slotIds = stale
        .map((r) => r.slot_id)
        .filter((x): x is string => Boolean(x));

      // 2. Cancel appointments — gắn cancel_reason để phân biệt với trường hợp user tự huỷ.
      await em.query(
        `UPDATE appointments
         SET status = $1, cancel_reason = $2, cancelled_at = now()
         WHERE id = ANY($3::uuid[])`,
        [AppointmentStatus.Cancelled, 'auto-expired:không thanh toán cọc trong hạn', apptIds],
      );

      // 3. Mark payments fail (nếu vẫn còn pending) — để báo cáo / lịch sử rõ ràng.
      await em.query(
        `UPDATE payments SET status = $1
         WHERE appointment_id = ANY($2::uuid[]) AND status = $3`,
        [PaymentStatus.Failed, apptIds, PaymentStatus.Pending],
      );

      // 4. Trả slot về available chỉ khi không còn appointment 'sống' nào khác giữ slot đó.
      let slotsReleased = 0;
      if (slotIds.length > 0) {
        const res = (await em.query(
          `
          UPDATE appointment_slots
          SET status = $1
          WHERE id = ANY($2::uuid[])
            AND status = $3
            AND NOT EXISTS (
              SELECT 1 FROM appointments a
              WHERE a.slot_id = appointment_slots.id
                AND a.status <> $4
            )
          RETURNING id
          `,
          [SlotStatus.Available, slotIds, SlotStatus.Booked, AppointmentStatus.Cancelled],
        )) as { id: string }[];
        slotsReleased = res.length;
      }

      this.logger.log(
        `Auto-cancel ${apptIds.length} pending booking(s); released ${slotsReleased} slot(s).`,
      );
      return { cancelled: apptIds.length, slotsReleased };
    });
  }

  // 1 phút/lần — với TTL 5 phút, slot sẽ được trả về trong khoảng 5–6 phút sau khi tạo.
  @Cron('0 */1 * * * *', { name: 'appointments-release-stale' })
  async cronReleaseStaleBookings(): Promise<void> {
    try {
      await this.releaseStalePendingBookings();
    } catch (e) {
      this.logger.error(
        `Cron releaseStalePendingBookings lỗi: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  /**
   * Xoá slot `available` đã qua giờ và chưa từng gắn appointment nào (không có hàng appointments.slot_id).
   * Giữ slot đã từng có lịch (kể cả đã huỷ) để không mất tham chiếu lịch sử.
   */
  async purgeOrphanPastAvailableSlots(): Promise<number> {
    const rows = (await this.dataSource.query(
      `
      DELETE FROM appointment_slots s
      WHERE s.status = $1
        AND s.slot_time < NOW()
        AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.slot_id = s.id)
      RETURNING s.id
      `,
      [SlotStatus.Available],
    )) as { id: string }[];
    const n = rows?.length ?? 0;
    if (n > 0) {
      this.logger.log(`purgeOrphanPastAvailableSlots: removed ${n} row(s).`);
    }
    return n;
  }

  /** 03:00 sáng theo giờ Việt Nam (UTC+7), không phụ thuộc TZ máy chủ. */
  @Cron('0 0 3 * * *', {
    name: 'slots-purge-orphan-past-available',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async cronPurgeOrphanPastAvailableSlots(): Promise<void> {
    try {
      await this.purgeOrphanPastAvailableSlots();
    } catch (e) {
      this.logger.error(
        `Cron purgeOrphanPastAvailableSlots lỗi: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  /** Cập nhật trạng thái thanh toán khi webhook PayOS báo đã thanh toán (đã cọc). */
  async markPaymentPaidByPayOSOrderCode(orderCode: number): Promise<void> {
    const payment = await this.paymentRepo.findOne({
      where: { payosOrderCode: orderCode },
    });
    if (!payment) return;

    payment.status = PaymentStatus.Paid;
    await this.paymentRepo.save(payment);

    const appointment = await this.appointmentRepo.findOne({
      where: { id: payment.appointmentId },
    });
    if (!appointment) return;

    // Khi đã cọc thành công, xem như lịch hẹn đã được xác nhận.
    appointment.status = AppointmentStatus.Confirmed;
    await this.appointmentRepo.save(appointment);
  }

  private generateOrderCode(): number {
    return Math.floor(Date.now() % 2147483647) + Math.floor(Math.random() * 10000);
  }
}
