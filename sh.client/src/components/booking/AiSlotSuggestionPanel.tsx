import React, { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, Check, Clock } from 'lucide-react';
import { api, type ApiSlotSuggestion, type ApiSlotSuggestionItem } from '../../api/client';

interface Props {
  doctorId: string;
  /** Khi user click 1 gợi ý — chuyển slot + ngày sang BookingFlow chính. */
  onPick: (slot: ApiSlotSuggestionItem) => void;
}

/**
 * Section "Gợi ý cho bạn" trong BookingFlow:
 *  - User nhập triệu chứng ngắn (tuỳ chọn) → AI phân loại khẩn + gợi ý slot.
 *  - Cá nhân hoá theo lịch sử (giờ/thứ user hay khám) — server tự build pattern.
 *  - Banner đỏ nếu AI thấy khẩn.
 */
export const AiSlotSuggestionPanel: React.FC<Props> = ({ doctorId, onPick }) => {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiSlotSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await api.aiSuggestSlots({
        doctorId,
        symptoms: symptoms.trim() || null,
      });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không gọi được AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 px-4 py-3.5 mb-5 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-violet-950">Gợi ý cho bạn</h3>
          <p className="text-[11px] text-violet-800/80 mt-0.5">
            AI tham khảo lịch sử khám và triệu chứng của bạn để gợi ý slot phù hợp nhất.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          type="text"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Triệu chứng ngắn (tuỳ chọn): ví dụ 'đau đầu 3 ngày'"
          className="flex-1 px-3 py-2 text-sm border border-violet-200 rounded-xl bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200 outline-none"
          maxLength={200}
        />
        <button
          type="button"
          onClick={fetchSuggestions}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tìm...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Nhờ AI gợi ý
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5">
          {error}
        </div>
      )}

      {result && result.urgent && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <strong>Triệu chứng có dấu hiệu cần khám sớm.</strong>
            {result.urgencyReason && <span className="ml-1">{result.urgencyReason}</span>}{' '}
            Nếu cấp cứu, hãy gọi 115 hoặc đến cơ sở y tế gần nhất ngay lập tức.
          </div>
        </div>
      )}

      {result && (
        <div className="mt-3">
          {result.suggestions.length === 0 ? (
            <div className="text-xs text-slate-600 px-3 py-2 rounded-lg bg-white border border-slate-200">
              Không có slot trống nào trong 14 ngày tới cho bác sĩ này. Bạn có thể chọn ngày thủ công bên dưới.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-[11px] text-violet-800/80 mb-1.5">
                <span className="font-semibold">Top {result.suggestions.length} gợi ý</span>
                {result.personalized ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold">
                    Cá nhân hoá
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Mặc định (chưa đủ lịch sử)
                  </span>
                )}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {result.suggestions.map((s, i) => (
                  <SlotSuggestionCard
                    key={s.slotId}
                    suggestion={s}
                    rank={i + 1}
                    onPick={() => onPick(s)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const SlotSuggestionCard: React.FC<{
  suggestion: ApiSlotSuggestionItem;
  rank: number;
  onPick: () => void;
}> = ({ suggestion: s, rank, onPick }) => {
  const t = new Date(s.slotTime);
  const dayLabel = t.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
  const timeLabel = t.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const isTop = rank === 1;

  return (
    <button
      type="button"
      onClick={onPick}
      className={`group text-left rounded-xl border-2 px-3 py-2.5 transition-all bg-white hover:shadow-md ${
        isTop
          ? 'border-violet-400 ring-1 ring-violet-200'
          : 'border-slate-200 hover:border-violet-300'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-violet-600 shrink-0" />
          <span className="text-sm font-bold text-slate-900 tabular-nums">{timeLabel}</span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs font-semibold text-slate-700">{dayLabel}</span>
        </div>
        {isTop && (
          <span className="px-1.5 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold">
            Gợi ý #1
          </span>
        )}
      </div>
      <ul className="space-y-0.5 mt-1.5">
        {s.reasons.slice(0, 2).map((r, i) => (
          <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
            <Check className="w-3 h-3 mt-0.5 text-emerald-500 shrink-0" />
            <span className="line-clamp-1">{r}</span>
          </li>
        ))}
      </ul>
    </button>
  );
};
