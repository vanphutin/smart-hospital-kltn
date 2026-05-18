import { useEffect, useMemo, useState } from 'react';

export const PAGE_SIZE = {
  departments: 12,
  table: 10,
  slots: 20,
  patients: 8,
  overview: 5,
  doctorSearch: 5,
} as const;

/** Phân trang client-side; `resetKey` đổi → về trang 1 (lọc/tìm kiếm). */
export function usePagination<T>(items: T[], pageSize: number, resetKey?: string | number) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  const goToPage = (p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  };

  return {
    page: safePage,
    goToPage,
    totalPages,
    totalItems,
    paginatedItems,
    showPagination: totalPages > 1,
    pageSize,
  };
}
