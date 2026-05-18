import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';

@Injectable()
export class S3UploadService {
  private readonly logger = new Logger(S3UploadService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor() {
    this.region = process.env.AWS_REGION ?? 'ap-southeast-1';
    this.bucket = process.env.AWS_BUCKET_NAME ?? '';
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  /** Upload buffer lên S3, trả về public URL */
  async upload(
    file: Express.Multer.File,
    prefix = 'uploads',
  ): Promise<string> {
    let ext = extname(file.originalname).toLowerCase();
    if (!ext || ext.length > 6) ext = this.extFromMime(file.mimetype);
    const key = `${prefix}/${randomUUID()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /** Xóa object trên S3 theo URL đầy đủ hoặc key */
  async delete(urlOrKey: string): Promise<void> {
    try {
      const key = this.extractKey(urlOrKey);
      if (!key) return;
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (e) {
      this.logger.warn(`Không xóa được S3 object ${urlOrKey}: ${(e as Error).message}`);
    }
  }

  private extractKey(urlOrKey: string): string | null {
    try {
      const url = new URL(urlOrKey);
      // pathname bắt đầu bằng '/', bỏ dấu '/' đầu
      return url.pathname.replace(/^\//, '');
    } catch {
      // không phải URL → coi là key trực tiếp
      return urlOrKey || null;
    }
  }

  private extFromMime(mimetype: string): string {
    switch (mimetype) {
      case 'image/png': return '.png';
      case 'image/webp': return '.webp';
      case 'image/gif': return '.gif';
      default: return '.jpg';
    }
  }
}
