import { LucideIcon } from 'lucide-react';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  degree: string;
  rating: number;
  reviewsCount: number;
  experience: number;
  location: string;
  hospital: string;
  availability: string;
  image: string;
  online?: boolean;
  fullyBooked?: boolean;
  fee: number;
  bio?: string;
  /** Trường đại học (nếu có) */
  university?: string;
  /** Mô tả khoa từ API (department.description), hiển thị kèm chuyên môn */
  departmentDescription?: string;
}

export interface Department {
  id: string;
  name: string;
  icon: LucideIcon;
  specialistsCount: number;
  color: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  reason: string;
  paymentStatus: 'Paid' | 'Pending' | 'Processed';
  amount?: number;
}
