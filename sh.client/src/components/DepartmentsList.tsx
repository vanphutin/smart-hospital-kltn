import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { DEPARTMENTS, getDepartmentListFromApi } from '../constants';
import { api } from '../api/client';
import { buildDoctorCountByDepartment } from '../utils/departmentDoctorCounts';
import { isUuid } from '../utils/isUuid';
import { usePagination, PAGE_SIZE } from '../utils/usePagination';
import { ListPagination } from './ListPagination';

interface DepartmentsListProps {
  onNavigate: (view: string) => void;
  onNavigateToSearchWithDept?: (departmentId: string) => void;
}

export const DepartmentsList: React.FC<DepartmentsListProps> = ({
  onNavigate,
  onNavigateToSearchWithDept,
}) => {
  const [departments, setDepartments] = useState(DEPARTMENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getDepartments(), api.getDoctors()])
      .then(([list, doctors]) => {
        if (!cancelled) {
          const counts = buildDoctorCountByDepartment(list, doctors);
          setDepartments(getDepartmentListFromApi(list, { doctorCountByDeptId: counts }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Không tải được danh sách khoa');
          setDepartments(DEPARTMENTS);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const deptPage = usePagination(departments, PAGE_SIZE.departments);

  const handleDeptClick = (deptId: string) => {
    if (onNavigateToSearchWithDept && isUuid(deptId)) {
      onNavigateToSearchWithDept(deptId);
    } else {
      onNavigate('search');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Danh sách khoa khám</h1>
        <p className="text-slate-500">Chọn khoa để xem bác sĩ và đặt lịch.</p>
      </div>

      {error && <p className="text-red-600 font-medium mb-6">{error}</p>}
      {loading ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <li key={i} className="bg-white px-5 py-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="relative h-4 w-3/4 rounded-lg bg-slate-200 overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
                <div className="relative h-3 w-1/3 rounded-lg bg-slate-200 overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
              </div>
              <div className="relative w-4 h-4 rounded bg-slate-200 shrink-0 overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {deptPage.paginatedItems.map((dept) => (
            <li key={dept.id}>
              <button
                type="button"
                onClick={() => handleDeptClick(dept.id)}
                className="w-full text-left bg-white px-5 py-4 rounded-2xl border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all group flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{dept.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {dept.specialistsCount === 0 ? 'Chưa có bác sĩ' : `${dept.specialistsCount} bác sĩ`}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-primary shrink-0 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            </li>
          ))}
        </ul>
        <ListPagination
          page={deptPage.page}
          totalPages={deptPage.totalPages}
          totalItems={deptPage.totalItems}
          pageSize={deptPage.pageSize}
          onPageChange={deptPage.goToPage}
          itemLabel="khoa"
        />
        </>
      )}
    </div>
  );
};
