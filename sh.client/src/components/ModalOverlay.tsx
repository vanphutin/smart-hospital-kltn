import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalOverlayProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Tailwind z-index (vd: z-50, z-[60]) */
  zClass?: string;
  className?: string;
}

/**
 * Lớp phủ modal: khóa cuộn body, click ra ngoài panel để đóng, backdrop che và chặn tương tác phía dưới.
 * Đặt `relative` trên panel con và dùng `<ModalCloseButton />` góc phải trên.
 */
export const ModalOverlay: React.FC<ModalOverlayProps> = ({
  open,
  onClose,
  children,
  zClass = 'z-50',
  className = '',
}) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 ${zClass} overflow-y-auto ${className}`} role="presentation">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Đóng"
        className="fixed inset-0 z-0 block min-h-full w-full cursor-default border-0 bg-slate-900/50 p-0 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 flex min-h-full w-full flex-col items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto flex w-full justify-center">{children}</div>
      </div>
    </div>
  );
};

interface ModalCloseButtonProps {
  onClose: () => void;
  disabled?: boolean;
  className?: string;
}

export const ModalCloseButton: React.FC<ModalCloseButtonProps> = ({
  onClose,
  disabled,
  className = '',
}) => (
  <button
    type="button"
    onClick={onClose}
    disabled={disabled}
    className={`absolute right-3 top-3 z-10 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-40 ${className}`}
    aria-label="Đóng"
  >
    <X className="w-5 h-5" strokeWidth={2} />
  </button>
);
