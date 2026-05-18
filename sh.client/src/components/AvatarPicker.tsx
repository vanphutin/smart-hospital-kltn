import React, { useRef, useEffect, useState } from 'react';
import { User, Camera } from 'lucide-react';

type Size = 'md' | 'lg';

interface AvatarPickerProps {
  file: File | null;
  onChange: (file: File | null) => void;
  /** URL đầy đủ (đã resolve API base) khi chưa chọn file mới */
  existingImageUrl?: string | null;
  label?: string;
  size?: Size;
  disabled?: boolean;
}

const frameClass: Record<Size, string> = {
  md: 'w-28 h-28 rounded-2xl',
  lg: 'w-40 h-40 rounded-3xl',
};

const iconClass: Record<Size, string> = {
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
};

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  file,
  onChange,
  existingImageUrl,
  label = 'Ảnh đại diện',
  size = 'md',
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setLocalPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const displaySrc = localPreview ?? existingImageUrl ?? null;

  return (
    <div className="flex flex-col items-center gap-2">
      {label ? <span className="text-sm font-medium text-slate-700 text-center">{label}</span> : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={`relative ${frameClass[size]} overflow-hidden border-2 border-dashed border-primary/40 bg-gradient-to-br from-slate-50 via-white to-primary/[0.07] shadow-sm ring-4 ring-white transition hover:border-primary/70 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60`}
      >
        {displaySrc ? (
          <img src={displaySrc} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-primary/45">
            <User className={iconClass[size]} strokeWidth={1.25} />
          </div>
        )}
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 py-2 bg-slate-900/75 text-white text-[11px] font-semibold tracking-wide uppercase backdrop-blur-sm">
          <Camera className="w-3.5 h-3.5 shrink-0" />
          Chọn ảnh
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onChange(null);
            if (inputRef.current) inputRef.current.value = '';
          }}
          className="text-xs font-medium text-slate-500 hover:text-red-600"
        >
          Bỏ ảnh đã chọn
        </button>
      ) : (
        <p className="text-[11px] text-slate-500 text-center max-w-[11rem] leading-snug">
          JPEG, PNG, GIF, WebP
        </p>
      )}
    </div>
  );
};
