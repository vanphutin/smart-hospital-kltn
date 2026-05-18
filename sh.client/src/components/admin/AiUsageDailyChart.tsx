import React from 'react';

interface DayPoint {
  date: string;
  requests: number;
  totalTokens: number;
  costUsd: number;
}

interface Props {
  data: DayPoint[];
}

/**
 * Bar chart đơn giản (SVG) cho chi phí AI theo ngày.
 * Không cần thư viện ngoài — đủ tốt cho admin theo dõi tổng quan.
 */
export const AiUsageDailyChart: React.FC<Props> = ({ data }) => {
  const max = Math.max(0.0001, ...data.map((d) => d.costUsd));
  const W = 800;
  const H = 180;
  const padding = { top: 12, right: 12, bottom: 28, left: 36 };
  const innerW = W - padding.left - padding.right;
  const innerH = H - padding.top - padding.bottom;
  const barGap = 2;
  const barW = data.length > 0 ? Math.max(1, innerW / data.length - barGap) : 0;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-[200px] min-w-[600px]"
        preserveAspectRatio="none"
      >
        {/* baseline */}
        <line
          x1={padding.left}
          y1={H - padding.bottom}
          x2={W - padding.right}
          y2={H - padding.bottom}
          stroke="#e2e8f0"
          strokeWidth={1}
        />
        {/* y-axis labels (max + 0) */}
        <text
          x={padding.left - 6}
          y={padding.top + 4}
          textAnchor="end"
          fontSize="10"
          fill="#94a3b8"
        >
          ${max.toFixed(3)}
        </text>
        <text
          x={padding.left - 6}
          y={H - padding.bottom + 4}
          textAnchor="end"
          fontSize="10"
          fill="#94a3b8"
        >
          $0
        </text>

        {data.map((d, i) => {
          const h = max > 0 ? (d.costUsd / max) * innerH : 0;
          const x = padding.left + i * (barW + barGap);
          const y = H - padding.bottom - h;
          const dayLabel = d.date.slice(8, 10) + '/' + d.date.slice(5, 7);
          // Chỉ in nhãn ngày cách quãng để đỡ rối với chuỗi 30+ điểm.
          const showLabel =
            data.length <= 14 || i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 8) === 0;
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={2}
                fill="#7c3aed"
                opacity={d.costUsd > 0 ? 0.85 : 0.18}
              >
                <title>{`${d.date}\n${d.requests} request • ${d.totalTokens.toLocaleString('vi-VN')} tokens • $${d.costUsd.toFixed(4)}`}</title>
              </rect>
              {showLabel ? (
                <text
                  x={x + barW / 2}
                  y={H - padding.bottom + 14}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748b"
                >
                  {dayLabel}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
