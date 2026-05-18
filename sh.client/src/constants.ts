import { Heart, Brain, Baby, Sparkles, Ear, Bone } from 'lucide-react';
import type { Doctor, Department } from './types';

/** Phí khám mặc định hiển thị (VND). DB chưa có cột — đồng nhất card / detail / đặt lịch */
export const DEFAULT_CONSULTATION_FEE_VND = 50_000;

/** Style theo tên khoa (để merge với API departments) */
type DeptStyleShape = { icon: typeof Heart; color: string; specialistsCount: number };

export const DEPARTMENT_STYLES_BY_NAME: Record<string, DeptStyleShape> = {
  'Tim mạch': { icon: Heart, color: 'bg-red-100 text-red-600', specialistsCount: 12 },
  'Da liễu': { icon: Sparkles, color: 'bg-amber-100 text-amber-600', specialistsCount: 6 },
  'Nhi khoa': { icon: Baby, color: 'bg-green-100 text-green-600', specialistsCount: 15 },
  /** API thường đặt "Khoa Nhi" — sau strip prefix còn "Nhi". */
  Nhi: { icon: Baby, color: 'bg-green-100 text-green-600', specialistsCount: 0 },
  'Tai mũi họng': { icon: Ear, color: 'bg-sky-100 text-sky-600', specialistsCount: 10 },
  'Thần kinh': { icon: Brain, color: 'bg-blue-100 text-blue-600', specialistsCount: 8 },
  'Chỉnh hình': { icon: Bone, color: 'bg-slate-100 text-slate-600', specialistsCount: 9 },
  /** Tên hay gặp trong DB/API (PREFIX "Khoa …") — chỉ là icon/màu fallback, số bác sĩ lấy từ đếm thật. */
  Ngoại: { icon: Bone, color: 'bg-orange-100 text-orange-700', specialistsCount: 0 },
  'Nội tổng quát': { icon: Brain, color: 'bg-emerald-100 text-emerald-700', specialistsCount: 0 },
  Nội: { icon: Brain, color: 'bg-emerald-50 text-emerald-700', specialistsCount: 0 },
};

const DEFAULT_DEPT_STYLE: DeptStyleShape = { icon: Heart, color: 'bg-slate-100 text-slate-600', specialistsCount: 0 };

/** Chuẩn hoá icon/màu: tên API thường có tiền tố "Khoa …", không khớp key trong map cũ. */
function resolveDepartmentStyle(apiName: string): DeptStyleShape {
  const trimmed = apiName.replace(/^khoa\s+/i, '').trim();
  const direct =
    DEPARTMENT_STYLES_BY_NAME[apiName] ??
    DEPARTMENT_STYLES_BY_NAME[trimmed];
  if (direct) return direct;
  const lower = `${apiName} ${trimmed}`.toLowerCase();
  const keys = Object.keys(DEPARTMENT_STYLES_BY_NAME).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const k = key.toLowerCase();
    if (lower.includes(k)) return DEPARTMENT_STYLES_BY_NAME[key];
  }
  return DEFAULT_DEPT_STYLE;
}

export interface GetDepartmentListFromApiOptions {
  /** Đếm thật từ GET /doctors — ưu tiên thay cho số tĩnh trong map UI. */
  doctorCountByDeptId?: Record<string, number>;
}

export const DOCTORS: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Jane Smith',
    specialty: 'Senior Cardiologist',
    degree: 'MBBS, MD',
    rating: 4.9,
    reviewsCount: 124,
    experience: 12,
    location: 'City Central Hospital',
    hospital: 'City Central Hospital',
    availability: 'Today, 04:30 PM',
    image: 'https://images.unsplash.com/photo-1559839734-2b71f153678f?auto=format&fit=crop&q=80&w=400',
    online: true,
    fee: DEFAULT_CONSULTATION_FEE_VND,
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    specialty: 'Neurologist',
    degree: 'MD, PhD',
    rating: 4.8,
    reviewsCount: 89,
    experience: 8,
    location: 'Westside Medical Hub',
    hospital: 'Westside Medical Hub',
    availability: 'Tomorrow, 10:00 AM',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
    fee: DEFAULT_CONSULTATION_FEE_VND,
  },
  {
    id: '3',
    name: 'Dr. Sarah Wilson',
    specialty: 'Pediatrician',
    degree: 'MD',
    rating: 4.7,
    reviewsCount: 210,
    experience: 15,
    location: "Children's Care Clinic",
    hospital: "Children's Care Clinic",
    availability: 'Hết lịch 1 tuần',
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=400',
    fullyBooked: true,
    fee: DEFAULT_CONSULTATION_FEE_VND,
  },
];

/** Fallback khi chưa load API */
export const DEPARTMENTS: Department[] = [
  { id: '1', name: 'Tim mạch', icon: Heart, specialistsCount: 12, color: 'bg-red-100 text-red-600' },
  { id: '2', name: 'Da liễu', icon: Sparkles, specialistsCount: 6, color: 'bg-amber-100 text-amber-600' },
  { id: '3', name: 'Nhi khoa', icon: Baby, specialistsCount: 15, color: 'bg-green-100 text-green-600' },
  { id: '4', name: 'Tai mũi họng', icon: Ear, specialistsCount: 10, color: 'bg-sky-100 text-sky-600' },
  { id: '5', name: 'Thần kinh', icon: Brain, specialistsCount: 8, color: 'bg-blue-100 text-blue-600' },
  { id: '6', name: 'Chỉnh hình', icon: Bone, specialistsCount: 9, color: 'bg-slate-100 text-slate-600' }
];

export function getDepartmentListFromApi(
  apiList: { id: string; name: string }[],
  options?: GetDepartmentListFromApiOptions,
): Department[] {
  return apiList.map((api) => {
    const style = resolveDepartmentStyle(api.name);
    const counts = options?.doctorCountByDeptId;
    /** Có map đếm từ API → luôn dùng số thật (kể cả 0). Không có map mới dùng specialistsCount trong style (fallback mock). */
    const specialistsCount =
      counts !== undefined ? (counts[api.id] ?? 0) : style.specialistsCount;
    return {
      id: api.id,
      name: api.name,
      icon: style.icon,
      color: style.color,
      specialistsCount,
    };
  });
}
