/** Body webhook PayOS gửi đến */
export class PayOSWebhookBodyDto {
  code!: string;
  desc!: string;
  success!: boolean;
  data!: {
    orderCode: number;
    amount: number;
    description?: string;
    [key: string]: unknown;
  };
  signature!: string;
}
