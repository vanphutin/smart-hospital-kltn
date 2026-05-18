import React, { useState } from 'react';
import { Sparkles, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { ModalOverlay, ModalCloseButton } from './ModalOverlay';
import { api, ApiRequestError, type ApiSpecialtySuggestion } from '../api/client';
import { useToast } from '../contexts/ToastContext';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Khi user bấm "Xem bác sĩ khoa này" — chuyển sang trang search lọc theo dept. */
  onPickDepartment: (departmentId: string) => void;
}

const PLACEHOLDER =
  'Ví dụ: Tôi bị đau đầu kéo dài 3 ngày, kèm chóng mặt, hay mất ngủ. Đôi khi buồn nôn vào buổi sáng.';

const CONFIDENCE_LABEL: Record<'low' | 'medium' | 'high', string> = {
  low: 'Tham khảo',
  medium: 'Khá phù hợp',
  high: 'Phù hợp cao',
};

const CONFIDENCE_BADGE: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const AISpecialtySuggestionModal: React.FC<Props> = ({
  open,
  onClose,
  onPickDepartment,
}) => {
  const toast = useToast();
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiSpecialtySuggestion | null>(null);

  const reset = () => {
    setSymptoms('');
    setResult(null);
    setLoading(false);
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = symptoms.trim();
    if (text.length < 10) {
      toast.error('Vui lòng mô tả triệu chứng chi tiết hơn (tối thiểu 10 ký tự).');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.aiSuggestDepartments(text);
      setResult(res);
    } catch (err) {
      toast.error(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Không gợi ý được. Thử lại sau.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePick = (departmentId: string | null) => {
    if (!departmentId) {
      toast.error('Chuyên khoa chưa khả dụng trong hệ thống.');
      return;
    }
    onPickDepartment(departmentId);
    reset();
    onClose();
  };

  return (
    <ModalOverlay open={open} onClose={handleClose}>
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden">
        <ModalCloseButton onClose={handleClose} disabled={loading} />

        <div className="px-6 pt-6 pb-4 bg-gradient-to-br from-violet-50 to-blue-50 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-violet-600 text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">Gợi ý chuyên khoa bằng AI</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Mô tả triệu chứng bạn đang gặp phải. Trợ lý AI sẽ gợi ý 1–3 chuyên khoa phù hợp để bạn cân nhắc.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Triệu chứng của bạn
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={4}
              maxLength={2000}
              disabled={loading}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none disabled:opacity-60"
            />
            <div className="flex justify-between mt-1">
              <p className="text-[11px] text-slate-500">
                Tối thiểu 10 ký tự. Đừng viết tên/SĐT — không cần thiết.
              </p>
              <p className="text-[11px] text-slate-400 tabular-nums">{symptoms.length}/2000</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || symptoms.trim().length < 10}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang phân tích...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Nhờ AI gợi ý
              </>
            )}
          </button>

          {result ? (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {result.urgent ? (
                <div className="flex gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-rose-900">
                      Triệu chứng có dấu hiệu cấp cứu
                    </div>
                    <p className="text-xs text-rose-800/90 mt-0.5">
                      Vui lòng đến cơ sở y tế gần nhất hoặc gọi cấp cứu 115 ngay. Đừng chờ đặt lịch online.
                    </p>
                  </div>
                </div>
              ) : null}

              {result.suggestions.length === 0 ? (
                <div className="text-sm text-slate-600 text-center py-4">
                  AI chưa đưa ra gợi ý phù hợp. Hãy thử mô tả chi tiết hơn hoặc chọn{' '}
                  <span className="font-semibold">khám tổng quát</span>.
                </div>
              ) : (
                result.suggestions.map((s, idx) => (
                  <button
                    key={`${s.departmentId ?? 'null'}-${idx}`}
                    type="button"
                    onClick={() => handlePick(s.departmentId)}
                    className="w-full text-left rounded-2xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/40 px-4 py-3 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-900">
                            {s.departmentName}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${CONFIDENCE_BADGE[s.confidence]}`}
                          >
                            {CONFIDENCE_LABEL[s.confidence]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{s.reason}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 mt-1 shrink-0" />
                    </div>
                  </button>
                ))
              )}

              {result.generalNote ? (
                <p className="text-xs text-slate-500 italic">{result.generalNote}</p>
              ) : null}

              <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-100">
                Đây là gợi ý tham khảo dựa trên AI, KHÔNG phải chẩn đoán y khoa. Bệnh nhân vẫn nên trao đổi trực tiếp với bác sĩ để được khám và chẩn đoán chính xác.
              </p>
            </div>
          ) : null}
        </form>
      </div>
    </ModalOverlay>
  );
};
