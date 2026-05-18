import React, { useEffect, useState } from 'react';
import { api, type AdPlacement, type ApiPublicAd } from '../api/client';
import { AdSlot } from './AdSlot';

interface AdSlotSectionProps {
  placement: AdPlacement;
  sectionClassName?: string;
  aspect?: string;
  innerClassName?: string;
}

export const AdSlotSection: React.FC<AdSlotSectionProps> = ({
  placement,
  sectionClassName = '',
  aspect,
  innerClassName = '',
}) => {
  const [ads, setAds] = useState<ApiPublicAd[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getAds(placement)
      .then((rows) => { if (!cancelled) setAds(rows); })
      .catch(() => { if (!cancelled) setAds([]); });
    return () => { cancelled = true; };
  }, [placement]);

  // Đang load → skeleton giữ chỗ (AdSlot tự render skeleton khi loading=true)
  if (ads === null) {
    return (
      <section className={sectionClassName}>
        <AdSlot placement={placement} aspect={aspect} className={innerClassName} />
      </section>
    );
  }

  if (ads.length === 0) return null;

  return (
    <section className={sectionClassName}>
      <AdSlot placement={placement} aspect={aspect} className={innerClassName} />
    </section>
  );
};
