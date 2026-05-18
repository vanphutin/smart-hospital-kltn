import React from 'react';

/** Skeleton placeholder khớp layout DoctorCard (full size) */
export const DoctorCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="p-5 flex flex-col sm:flex-row gap-6">
      {/* Avatar */}
      <div className="relative shrink-0 w-32 h-32 rounded-2xl bg-slate-200 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Name */}
        <div className="relative h-5 w-48 rounded-lg bg-slate-200 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
        {/* Specialty */}
        <div className="relative h-4 w-32 rounded-lg bg-slate-200 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
          {[80, 96, 72, 88].map((w, i) => (
            <div key={i} className={`relative h-3.5 rounded-lg bg-slate-200 overflow-hidden`} style={{ width: `${w}%` }}>
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="space-y-1.5">
            <div className="relative h-3 w-12 rounded bg-slate-200 overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
            <div className="relative h-5 w-24 rounded-lg bg-slate-200 overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative h-9 w-24 rounded-xl bg-slate-200 overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
            <div className="relative h-9 w-24 rounded-xl bg-slate-200 overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
