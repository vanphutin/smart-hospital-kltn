import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api, resolveApiAssetUrl, type AdPlacement, type ApiPublicAd } from '../api/client';

interface AdSlotProps {
  placement: AdPlacement;
  className?: string;
  /** Carousel rotation interval ms — chỉ áp dụng khi có >1 ad */
  rotateMs?: number;
  /** Tỉ lệ aspect (vd: '16/9'). Nếu không truyền sẽ tự sinh tùy placement. */
  aspect?: string;
  /** Khi không có ad active → trả null */
  fallback?: React.ReactNode;
}

const placementAspect: Record<AdPlacement, string> = {
  home_hero: '16/9',
  home_below_search: '21/6',
  doctor_detail: '4/3',
  dashboard_user: '21/6',
};

/**
 * Hiển thị quảng cáo công khai theo vị trí. Tự fetch /ads, auto-rotate khi có nhiều ad.
 */
export const AdSlot: React.FC<AdSlotProps> = ({
  placement,
  className = '',
  rotateMs = 5000,
  aspect,
  fallback = null,
}) => {
  const [ads, setAds] = useState<ApiPublicAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const seenViewIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getAds(placement)
      .then((rows) => {
        if (!cancelled) setAds(rows);
      })
      .catch(() => {
        if (!cancelled) setAds([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [placement]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % ads.length);
    }, rotateMs);
    return () => window.clearInterval(t);
  }, [ads.length, rotateMs]);

  // View tracking — fire-and-forget mỗi ad lần đầu hiện
  useEffect(() => {
    const cur = ads[idx];
    if (!cur) return;
    if (seenViewIds.current.has(cur.id)) return;
    seenViewIds.current.add(cur.id);
    api.trackAdView(cur.id).catch(() => undefined);
  }, [ads, idx]);

  if (loading) {
    const ratio = aspect ?? placementAspect[placement];
    return (
      <div
        className={`relative w-full overflow-hidden rounded-2xl bg-slate-200 ${className}`}
        style={{ aspectRatio: ratio }}
      >
        {/* shimmer sweep */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>
    );
  }
  if (ads.length === 0) return <>{fallback}</>;

  const current = ads[idx];
  const imgSrc = current.imageUrl ? resolveApiAssetUrl(current.imageUrl) : undefined;
  const ratio = aspect ?? placementAspect[placement];

  const onClick = () => {
    api.trackAdClick(current.id).catch(() => undefined);
    if (current.linkUrl) {
      const absolute = /^https?:\/\//i.test(current.linkUrl);
      if (absolute) {
        window.open(current.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.assign(current.linkUrl);
      }
    }
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm ${className}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={!current.linkUrl}
        className={`group relative block w-full ${current.linkUrl ? 'cursor-pointer' : 'cursor-default'}`}
        style={{ aspectRatio: ratio }}
        aria-label={current.title}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={current.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
            <span className="text-2xl font-bold">{current.title}</span>
          </div>
        )}
        {(current.title || current.body) && current.type === 'promo' ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-4 sm:p-5 text-left">
            <h3 className="text-white text-base sm:text-lg font-bold drop-shadow">{current.title}</h3>
            {current.body ? (
              <p className="text-white/90 text-xs sm:text-sm mt-1 line-clamp-2">{current.body}</p>
            ) : null}
          </div>
        ) : null}
      </button>

      {ads.length > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => (i - 1 + ads.length) % ads.length);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow text-slate-700"
            aria-label="Quảng cáo trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => (i + 1) % ads.length);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow text-slate-700"
            aria-label="Quảng cáo kế tiếp"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {ads.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      ) : null}

      <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wide bg-slate-900/60 text-white px-2 py-0.5 rounded-md">
        Quảng cáo
      </span>
    </div>
  );
};
