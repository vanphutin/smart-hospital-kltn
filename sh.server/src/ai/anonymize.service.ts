import { Injectable } from '@nestjs/common';

/**
 * Bóc bỏ PII cơ bản trước khi gửi text sang OpenAI.
 * Mức MVP: tên (theo whitelist + heuristic), SĐT (VN format), email.
 * KHÔNG anonymize: triệu chứng, chẩn đoán, thuốc — đó là medical info có ý nghĩa.
 *
 * Lưu ý: Không thể anonymize hoàn hảo bằng regex; đây là tuyến phòng thủ thứ nhất.
 * Production cần combine với compliance policy + Data Processing Agreement với OpenAI.
 */
@Injectable()
export class AnonymizeService {
  // Email: chuẩn RFC đơn giản, đủ cho text y tế.
  private readonly EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

  // SĐT VN: cho phép +84, 84, 0; 9-10 số sau prefix; cho phép dấu cách / dấu chấm / gạch ngang.
  private readonly PHONE_VN_RE = /(?:\+?84|0)\s?\d{2,3}[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;

  /**
   * @param text Văn bản cần làm sạch.
   * @param knownNames Tên cụ thể cần bóc (vd full_name của patient/doctor liên quan).
   *                   Truyền vào để có độ chính xác cao hơn so với regex tên thuần Việt.
   */
  scrub(text: string, knownNames: string[] = []): string {
    if (!text) return text;
    let out = text;

    // 1) Email
    out = out.replace(this.EMAIL_RE, '[EMAIL]');

    // 2) Phone VN
    out = out.replace(this.PHONE_VN_RE, '[PHONE]');

    // 3) Known names — replace literal, escape regex meta.
    for (const name of knownNames) {
      const trimmed = name?.trim();
      if (!trimmed || trimmed.length < 2) continue;
      const re = new RegExp(escapeRegex(trimmed), 'gi');
      out = out.replace(re, '[NAME]');
    }

    return out;
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
