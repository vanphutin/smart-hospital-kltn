export class CreateBookingDto {
  slotId!: string;
  symptoms?: string | null;
  returnUrl?: string;
  cancelUrl?: string;
}
