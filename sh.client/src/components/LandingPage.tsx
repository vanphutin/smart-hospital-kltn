import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, ArrowRight, Shield, Clock, Users, Star, Quote, Sparkles } from 'lucide-react';
import { DEPARTMENTS, getDepartmentListFromApi } from '../constants';
import { DoctorCard } from './DoctorCard';
import { Doctor } from '../types';
import { api } from '../api/client';
import { mapDoctor } from '../api/mappers';
import { isUuid } from '../utils/isUuid';
import { buildDoctorCountByDepartment } from '../utils/departmentDoctorCounts';
import { AdSlotSection } from './AdSlotSection';
import { AISpecialtySuggestionModal } from './AISpecialtySuggestionModal';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  onNavigateToSearchWithDept?: (departmentId: string) => void;
  /** Đi tới trang tìm bác sĩ kèm từ khóa (?q=) */
  onNavigateToSearch?: (query?: string) => void;
  onBook: (doctor: Doctor) => void;
  onViewProfile: (doctor: Doctor) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onNavigateToSearchWithDept,
  onNavigateToSearch,
  onBook,
  onViewProfile,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [departments, setDepartments] = useState(DEPARTMENTS);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const handlePickDepartmentFromAI = (departmentId: string) => {
    if (onNavigateToSearchWithDept) {
      onNavigateToSearchWithDept(departmentId);
    } else {
      onNavigate('departments');
    }
  };

  const goToDoctorSearch = () => {
    const q = searchInput.trim();
    if (onNavigateToSearch) {
      onNavigateToSearch(q || undefined);
    } else {
      onNavigate('search');
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [apiDepts, apiDoctors] = await Promise.all([
          api.getDepartments(),
          api.getDoctors(),
        ]);
        if (!cancelled) {
          const deptCounts = buildDoctorCountByDepartment(apiDepts, apiDoctors);
          setDepartments(getDepartmentListFromApi(apiDepts, { doctorCountByDeptId: deptCounts }));
          setDoctors(apiDoctors.map(mapDoctor).sort(() => Math.random() - 0.5).slice(0, 6));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Không tải được dữ liệu');
          setDoctors([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-24 pb-24">
      {/* Quảng cáo Hero (chỉ hiển thị khi admin có quảng cáo active ở vị trí này) */}
      <AdSlotSection
        placement="home_hero"
        aspect="21/6"
        sectionClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"
      />

      {/* Hero Section */}
      <section className="relative pt-12 lg:pt-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold">
                <Shield className="w-4 h-4" />
                Nền tảng đặt lịch khám tin cậy
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.15] tracking-tight">
                Đặt lịch khám bác sĩ <br />
                <span className="text-primary">chỉ trong vài phút</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-lg leading-relaxed">
                Chọn bác sĩ, chọn khung giờ, đặt cọc giữ chỗ — giảm thời gian chờ đợi tại bệnh viện.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 min-w-0">
                  <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
                  <input
                    type="text"
                    placeholder="Tên bác sĩ hoặc khoa…"
                    autoComplete="off"
                    className="min-w-0 flex-1 appearance-none border-0 bg-transparent py-4 px-4 text-slate-700 shadow-none outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        goToDoctorSearch();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={goToDoctorSearch}
                  className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 shrink-0"
                >
                  Đặt lịch khám <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm text-slate-500 font-medium">4.9/5 từ hơn 2.000 bệnh nhân</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl"></div>
              <div className="relative bg-white rounded-[2.5rem] p-4 shadow-2xl border border-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1000"
                  alt="Bác sĩ"
                  className="rounded-[2rem] w-full h-[500px] object-cover"
                />
                <div className="absolute top-12 -left-12 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-4 animate-bounce-slow">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Bác sĩ đang hoạt động</p>
                    <p className="text-lg font-extrabold text-slate-900">1.200+</p>
                  </div>
                </div>
                <div className="absolute bottom-12 -right-12 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-4 animate-bounce-slow" style={{ animationDelay: '1s' }}>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Hỗ trợ 24/7</p>
                    <p className="text-lg font-extrabold text-slate-900">Tư vấn ngay</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quảng cáo: dải dưới Hero / ô tìm kiếm */}
      <AdSlotSection
        placement="home_below_search"
        aspect="21/5"
        sectionClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12"
      />

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Quy trình đặt lịch đơn giản</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Chỉ vài bước để giữ chỗ khám với bác sĩ bạn chọn.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: 1, title: 'Chọn bác sĩ', desc: 'Tìm theo khoa hoặc tên bác sĩ, xem đánh giá và lịch trống.' },
            { step: 2, title: 'Chọn thời gian', desc: 'Chọn ngày và khung giờ phù hợp với lịch của bạn.' },
            { step: 3, title: 'Đặt cọc giữ chỗ', desc: 'Đặt cọc 30% hoặc giữ chỗ, thanh toán phần còn lại sau khám.' }
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-5 font-bold text-lg">
                {step}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Departments Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Các khoa khám</h2>
            <p className="text-slate-500 max-w-md">Chọn khoa phù hợp với nhu cầu của bạn.</p>
          </div>
          <button onClick={() => onNavigate('departments')} className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all">
            Xem tất cả <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100">
                <div className="relative w-16 h-16 rounded-2xl bg-slate-200 mb-6 overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
                <div className="relative h-5 w-3/4 rounded-lg bg-slate-200 mb-2 overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
                <div className="relative h-3.5 w-1/3 rounded-lg bg-slate-200 overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
              </div>
            ))
          ) : departments.slice(0, 6).map((dept) => (
            <div
              key={dept.id}
              onClick={() => {
                if (!onNavigateToSearchWithDept) {
                  onNavigate('departments');
                  return;
                }
                if (isUuid(dept.id)) onNavigateToSearchWithDept(dept.id);
                else onNavigate('departments');
              }}
              className="bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-slate-200/50 transition-all group cursor-pointer"
            >
              <div className={`w-16 h-16 ${dept.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <dept.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{dept.name}</h3>
              <p className="text-sm text-slate-500 font-medium">
                {dept.specialistsCount === 0
                  ? 'Chưa có bác sĩ'
                  : `${dept.specialistsCount} bác sĩ`}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Lợi ích */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Lợi ích khi đặt lịch online</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Giảm thời gian chờ đợi, chủ động lịch khám.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'Không cần chờ đợi lâu', desc: 'Đặt lịch trước, đến đúng giờ khám — hạn chế xếp hàng tại bệnh viện.', icon: Clock },
            { title: 'Xem trước lịch bác sĩ', desc: 'Biết rõ khung giờ trống của từng bác sĩ để chọn thuận tiện.', icon: Calendar },
            { title: 'Đặt lịch minh bạch', desc: 'Phí khám, đặt cọc 30% và thanh toán phần còn lại rõ ràng.', icon: Shield }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-secondary/15 text-secondary rounded-2xl flex items-center justify-center mb-5">
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Doctors */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Bác sĩ nổi bật</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Đội ngũ bác sĩ giàu kinh nghiệm, được bệnh nhân đánh giá cao.</p>
          </div>
          {error && (
            <p className="text-center text-red-600 font-medium mb-6">{error}</p>
          )}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-4 flex gap-4">
                    <div className="relative w-20 h-20 rounded-xl bg-slate-200 shrink-0 overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    </div>
                    <div className="flex-1 space-y-2.5 py-1">
                      <div className="relative h-4 w-3/4 rounded-lg bg-slate-200 overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                      </div>
                      <div className="relative h-3 w-1/2 rounded-lg bg-slate-200 overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                      </div>
                      <div className="relative h-3 w-2/3 rounded-lg bg-slate-200 overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <div className="relative h-4 w-16 rounded-lg bg-slate-200 overflow-hidden">
                          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        </div>
                        <div className="relative h-7 w-16 rounded-lg bg-slate-200 overflow-hidden">
                          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {doctors.map(doctor => (
                  <DoctorCard
                    key={doctor.id}
                    doctor={doctor}
                    onBook={onBook}
                    onViewProfile={onViewProfile}
                    compact
                  />
                ))}
              </div>
              <div className="text-center mt-10">
                <button
                  type="button"
                  onClick={() => onNavigate('search')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  Xem thêm bác sĩ <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Phản hồi từ bệnh nhân</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Trải nghiệm thực tế của người đã đặt lịch qua hệ thống.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: 'Chị Nguyễn Thị H.', text: 'Đặt lịch xong đến đúng giờ là vào khám luôn, không phải chờ hàng giờ như trước. Rất hài lòng.', rating: 5 },
            { name: 'Anh Trần Văn M.', text: 'Xem được lịch trống của bác sĩ rồi chọn giờ phù hợp, tiện và minh bạch.', rating: 5 },
            { name: 'Chị Lê Minh T.', text: 'Đặt cọc 30% online, khám xong thanh toán phần còn lại tại quầy. Giao diện dễ dùng.', rating: 5 }
          ].map((t, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <Quote className="w-10 h-10 text-primary/30 mb-4" />
              <p className="text-slate-600 leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-2 mb-2">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm font-bold text-slate-700">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary rounded-[3rem] p-12 lg:p-20 text-white grid md:grid-cols-4 gap-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="space-y-2">
            <p className="text-5xl font-black">10k+</p>
            <p className="text-primary-foreground/80 font-bold uppercase tracking-widest text-xs">Bệnh nhân hài lòng</p>
          </div>
          <div className="space-y-2">
            <p className="text-5xl font-black">500+</p>
            <p className="text-primary-foreground/80 font-bold uppercase tracking-widest text-xs">Bác sĩ chuyên gia</p>
          </div>
          <div className="space-y-2">
            <p className="text-5xl font-black">20+</p>
            <p className="text-primary-foreground/80 font-bold uppercase tracking-widest text-xs">Khoa khám</p>
          </div>
          <div className="space-y-2">
            <p className="text-5xl font-black">15+</p>
            <p className="text-primary-foreground/80 font-bold uppercase tracking-widest text-xs">Năm kinh nghiệm</p>
          </div>
        </div>
      </section>

      <AISpecialtySuggestionModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onPickDepartment={handlePickDepartmentFromAI}
      />

      {/* Nút AI gợi ý khoa — cố định góc phải dưới */}
      <div className="fixed bottom-[5.25rem] right-3 z-[55] sm:bottom-8 sm:right-8 md:bottom-10">
        <button
          type="button"
          onClick={() => setAiModalOpen(true)}
          aria-label="AI gợi ý khoa khám theo triệu chứng"
          className="group relative flex max-w-[calc(100vw-1.5rem)] items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 py-3 pl-3 pr-4 text-left text-white shadow-[0_12px_40px_-8px_rgba(139,92,246,0.75)] ring-2 ring-white transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_16px_48px_-6px_rgba(217,70,239,0.65)] active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/80 sm:rounded-full sm:py-3.5 sm:pl-4 sm:pr-6"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-1 rounded-2xl bg-fuchsia-400/50 opacity-70 animate-ping sm:rounded-full"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.22)_48%,transparent_58%)] opacity-60 sm:rounded-full"
          />
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-2 ring-white/50 shadow-inner sm:h-14 sm:w-14 sm:rounded-full">
            <Sparkles className="h-7 w-7 text-amber-200 drop-shadow-md" aria-hidden />
          </span>
          <span className="relative min-w-0 flex-1 sm:flex-none">
            <span className="flex items-center gap-1.5">
              <span className="rounded-md bg-white/25 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-white ring-1 ring-white/35">
                AI
              </span>
              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wide text-violet-100/90">
                Miễn phí
              </span>
            </span>
            <span className="mt-0.5 block text-sm font-extrabold leading-tight sm:text-base">
              Gợi ý khoa khám
            </span>
            <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-violet-100/95 sm:text-xs">
              Không biết khám khoa nào? Bấm đây
            </span>
          </span>
          <ArrowRight
            className="relative hidden h-6 w-6 shrink-0 text-white/95 transition-transform group-hover:translate-x-1 sm:block"
            aria-hidden
          />
        </button>
      </div>
    </div>
  );
};
