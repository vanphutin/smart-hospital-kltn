import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Public — chính sách đặt lịch (tiền cọc). Không cần auth. */
  @Get('config/booking-policy')
  async getBookingPolicy(): Promise<{ depositAmount: number }> {
    return this.appService.getBookingPolicy();
  }
}
