import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

/** Multer giữ file trong RAM, S3UploadService sẽ upload lên S3 */
export const adImageMulterOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      cb(new BadRequestException('Ảnh chỉ nhận JPEG, PNG, GIF hoặc WebP'), false);
      return;
    }
    cb(null, true);
  },
};
