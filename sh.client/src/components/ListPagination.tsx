import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ListPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Nhãn đếm, VD: "khoa", "bác sĩ" */
  itemLabel?: string;
  className?: string;
}

function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const out: (number | '…')[] = [1];
  const lo = Math.max(2, current - 1);
  const hi = Math.min(total - 1, current + 1);
  if (lo > 2) out.push('…');
  for (let p = lo; p <= hi; p++) out.push(p);
  if (hi < total - 1) out.push('…');
  if (total > 1) out.push(total);
  return out;
}

export const ListPagination: React.FC<ListPaginationProps> = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'mục',
  className = '',
}) => {
  const pages = useMemo(() => buildPageList(page, totalPages), [page, totalPages]);

  if (totalPages <= 1) return null;

  const rangeFrom = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = Math.min(page * pageSize, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 ${className}`}>
      <p className="text-sm text-slate-500">
        Hiển thị{' '}
        <span className="font-semibold text-slate-800">
          {rangeFrom}–{rangeTo}
        </span>{' '}
        / <span className="font-semibold text-slate-800">{totalItems}</span> {itemLabel}
        {' · '}
        Trang <span className="font-semibold text-slate-800">{page}</span>/
        <span className="font-semibold text-slate-800">{totalPages}</span>
      </p>
      <div className="flex items-center justify-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Trước
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="px-2 text-slate-400 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-[2.25rem] h-9 rounded-xl text-sm font-bold transition-all ${
                p === page
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sau
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
