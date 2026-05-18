import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const STATS_TZ = 'Asia/Ho_Chi_Minh';

export interface AiUsageStatsDto {
  range: { from: string; to: string };
  totals: {
    requests: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUsd: number;
  };
  byFeature: { feature: string; requests: number; totalTokens: number; costUsd: number }[];
  byModel: { model: string; requests: number; totalTokens: number; costUsd: number }[];
  byDay: { date: string; requests: number; totalTokens: number; costUsd: number }[];
}

@Injectable()
export class AdminAiUsageService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Tổng hợp chi phí AI trong khoảng ngày (giờ VN).
   * @param fromIsoDate YYYY-MM-DD; mặc định 30 ngày trước.
   * @param toIsoDate YYYY-MM-DD; mặc định hôm nay.
   */
  async getStats(fromIsoDate?: string, toIsoDate?: string): Promise<AiUsageStatsDto> {
    const today = todayIsoDate();
    const to = isValidDate(toIsoDate) ? toIsoDate! : today;
    const fromDefault = addDays(today, -29);
    const from = isValidDate(fromIsoDate) ? fromIsoDate! : fromDefault;

    // Xác định range timestamp (giờ VN). created_at là timestamptz nên cần AT TIME ZONE.
    const rangeFilter = `(u.created_at AT TIME ZONE '${STATS_TZ}')::date BETWEEN $1::date AND $2::date`;

    const totalsRows = (await this.dataSource.query(
      `SELECT
         COUNT(*)::int                         AS requests,
         COALESCE(SUM(prompt_tokens), 0)::int  AS prompt_tokens,
         COALESCE(SUM(completion_tokens), 0)::int AS completion_tokens,
         COALESCE(SUM(total_tokens), 0)::int   AS total_tokens,
         COALESCE(SUM(cost_usd), 0)::numeric   AS cost_usd
       FROM ai_usage u
       WHERE ${rangeFilter}`,
      [from, to],
    )) as {
      requests: number;
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      cost_usd: string;
    }[];
    const t = totalsRows[0];

    const byFeature = (await this.dataSource.query(
      `SELECT feature,
              COUNT(*)::int                       AS requests,
              COALESCE(SUM(total_tokens), 0)::int AS total_tokens,
              COALESCE(SUM(cost_usd), 0)::numeric AS cost_usd
       FROM ai_usage u
       WHERE ${rangeFilter}
       GROUP BY feature
       ORDER BY cost_usd DESC, requests DESC`,
      [from, to],
    )) as { feature: string; requests: number; total_tokens: number; cost_usd: string }[];

    const byModel = (await this.dataSource.query(
      `SELECT model,
              COUNT(*)::int                       AS requests,
              COALESCE(SUM(total_tokens), 0)::int AS total_tokens,
              COALESCE(SUM(cost_usd), 0)::numeric AS cost_usd
       FROM ai_usage u
       WHERE ${rangeFilter}
       GROUP BY model
       ORDER BY cost_usd DESC, requests DESC`,
      [from, to],
    )) as { model: string; requests: number; total_tokens: number; cost_usd: string }[];

    // Daily series với generate_series để có cả ngày KHÔNG có request (giá trị 0).
    const byDay = (await this.dataSource.query(
      `WITH days AS (
         SELECT generate_series($1::date, $2::date, '1 day')::date AS d
       ),
       agg AS (
         SELECT (u.created_at AT TIME ZONE '${STATS_TZ}')::date AS d,
                COUNT(*)::int                       AS requests,
                COALESCE(SUM(total_tokens), 0)::int AS total_tokens,
                COALESCE(SUM(cost_usd), 0)::numeric AS cost_usd
         FROM ai_usage u
         WHERE (u.created_at AT TIME ZONE '${STATS_TZ}')::date BETWEEN $1::date AND $2::date
         GROUP BY 1
       )
       SELECT to_char(days.d, 'YYYY-MM-DD') AS date,
              COALESCE(agg.requests, 0)     AS requests,
              COALESCE(agg.total_tokens, 0) AS total_tokens,
              COALESCE(agg.cost_usd, 0)     AS cost_usd
       FROM days
       LEFT JOIN agg ON agg.d = days.d
       ORDER BY days.d ASC`,
      [from, to],
    )) as { date: string; requests: number; total_tokens: number; cost_usd: string }[];

    return {
      range: { from, to },
      totals: {
        requests: t.requests,
        promptTokens: t.prompt_tokens,
        completionTokens: t.completion_tokens,
        totalTokens: t.total_tokens,
        costUsd: Number(t.cost_usd),
      },
      byFeature: byFeature.map((r) => ({
        feature: r.feature,
        requests: r.requests,
        totalTokens: r.total_tokens,
        costUsd: Number(r.cost_usd),
      })),
      byModel: byModel.map((r) => ({
        model: r.model,
        requests: r.requests,
        totalTokens: r.total_tokens,
        costUsd: Number(r.cost_usd),
      })),
      byDay: byDay.map((r) => ({
        date: r.date,
        requests: r.requests,
        totalTokens: r.total_tokens,
        costUsd: Number(r.cost_usd),
      })),
    };
  }
}

function isValidDate(s?: string): boolean {
  if (!s) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function todayIsoDate(): string {
  const now = new Date();
  const tz = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return tz.toISOString().slice(0, 10);
}
function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return tz.toISOString().slice(0, 10);
}
