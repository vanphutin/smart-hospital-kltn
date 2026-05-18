import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  FileSearch,
  Database,
  AlertCircle,
  BookText,
  Plus,
  Trash2,
  MessageSquare,
  FileText,
  Phone,
  Mail,
  CalendarClock,
  History,
  Pencil,
  Check,
} from 'lucide-react';
import {
  api,
  type ApiDoctorChatResult,
  type ApiDoctorChatSessionListItem,
  type ApiDoctorChatSource,
  type ApiDoctorMedicalRecordListItem,
} from '../../api/client';
import { ModalCloseButton, ModalOverlay } from '../ModalOverlay';
import { useToast } from '../../contexts/ToastContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ApiDoctorChatSource[];
  searchedCount?: number;
}

const SUGGESTED_QUESTIONS = [
  'Bệnh nhân nào gần đây có triệu chứng đau ngực?',
  'Tóm tắt các ca tăng huyết áp tôi đã khám trong tháng qua',
  'Có ai đã được kê thuốc kháng sinh nhóm cephalosporin chưa?',
  'Liệt kê các trường hợp tiểu đường tuýp 2',
];

/**
 * Tab Trợ lý AI cho bác sĩ — UI 2 cột:
 *  - Sidebar trái: lịch sử các phiên hội thoại.
 *  - Khu vực phải: messages + input + sources cards (có nút Xem hồ sơ).
 *
 * Bảo mật: backend chốt cứng `doctor_id = currentUser.id` ở vector search,
 * KHÔNG dựa vào LLM giữ ranh giới. Patient info trong sources là THẬT
 * (bác sĩ là chủ hồ sơ), nhưng khi gửi cho LLM thì context block đã được mask.
 */
export const DoctorAiAssistantTab: React.FC = () => {
  const toast = useToast();

  // Sessions sidebar
  const [sessions, setSessions] = useState<ApiDoctorChatSessionListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  // Chat
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Backfill
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<string | null>(null);

  // Modal "Xem hồ sơ"
  const [recordModalId, setRecordModalId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const list = await api.listDoctorAiSessions();
      setSessions(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không tải được lịch sử chat');
    } finally {
      setSessionsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setQuestion('');
    setError(null);
  };

  const openSession = async (sessionId: string) => {
    if (sessionId === activeSessionId) return;
    setActiveSessionId(sessionId);
    setHistoryLoading(true);
    setError(null);
    try {
      const detail = await api.getDoctorAiSession(sessionId);
      setMessages(
        detail.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: m.sources ?? undefined,
        })),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không tải được hội thoại');
      setMessages([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const sendQuestion = async (text: string) => {
    const q = text.trim();
    if (!q || sending) return;
    setError(null);
    setSending(true);

    const userMsgId = `u-${Date.now()}`;
    setMessages((m) => [...m, { id: userMsgId, role: 'user', content: q }]);
    setQuestion('');

    try {
      const res: ApiDoctorChatResult = await api.doctorAiChat(q, {
        sessionId: activeSessionId,
      });
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: res.answer,
          sources: res.sources,
          searchedCount: res.searchedCount,
        },
      ]);
      // Lưu sessionId nếu vừa tạo mới + reload sidebar để có entry / cập nhật updatedAt.
      if (!activeSessionId) setActiveSessionId(res.sessionId);
      void loadSessions();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi không xác định';
      setError(msg);
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: `Đã xảy ra lỗi: ${msg}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleBackfill = async () => {
    setBackfilling(true);
    setBackfillResult(null);
    try {
      const r = await api.backfillMyMedicalRecordEmbeddings();
      setBackfillResult(
        `Đã xử lý ${r.processed} hồ sơ — thành công ${r.succeeded}, bỏ qua ${r.skipped}, lỗi ${r.failed}.`,
      );
    } catch (e) {
      setBackfillResult(`Lỗi: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBackfilling(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm('Xoá phiên hội thoại này? Hành động không hoàn tác.')) return;
    try {
      await api.deleteDoctorAiSession(id);
      toast.success('Đã xoá phiên hội thoại');
      if (id === activeSessionId) startNewChat();
      void loadSessions();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không xoá được phiên');
    }
  };

  const startRename = (s: ApiDoctorChatSessionListItem) => {
    setRenamingId(s.id);
    setRenameDraft(s.title);
  };

  const submitRename = async (id: string) => {
    const title = renameDraft.trim();
    if (!title) {
      setRenamingId(null);
      return;
    }
    try {
      await api.renameDoctorAiSession(id, title);
      setRenamingId(null);
      void loadSessions();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không đổi tên được');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-violet-950">Trợ lý AI tra cứu hồ sơ</h2>
            <p className="text-xs text-violet-800/80 mt-0.5">
              Hỏi bằng tiếng Việt tự nhiên về hồ sơ bệnh án bạn đã ghi. AI trả lời kèm trích nguồn —
              bạn có thể click để mở hồ sơ gốc và liên hệ bệnh nhân.
            </p>
          </div>
        </div>
        <div className="mt-3 grid sm:grid-cols-2 gap-2 text-[11px] text-violet-900/80">
          <div className="flex items-start gap-1.5">
            <Database className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              Chỉ tra hồ sơ <strong>của bạn</strong>. Không thấy hồ sơ bác sĩ khác.
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              Tên/SĐT/Email <strong>được che khi gửi cho AI</strong>, nhưng hiển thị đầy đủ cho bạn.
            </span>
          </div>
        </div>
      </div>

      {/* Backfill */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-[12px] text-amber-900 leading-snug">
          <strong>Lần đầu sử dụng?</strong> Index toàn bộ hồ sơ cũ vào AI. Hồ sơ mới sẽ tự index.
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBackfill}
            disabled={backfilling}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
          >
            {backfilling ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang index...
              </>
            ) : (
              <>
                <FileSearch className="w-3.5 h-3.5" />
                Index hồ sơ cũ
              </>
            )}
          </button>
        </div>
      </div>
      {backfillResult && (
        <div className="text-xs text-slate-700 px-3 py-2 rounded-lg bg-slate-100 border border-slate-200">
          {backfillResult}
        </div>
      )}

      {/* Layout 2 cột */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-3">
        {/* Sidebar lịch sử */}
        <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col h-[560px] overflow-hidden">
          <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <History className="w-4 h-4" />
              Lịch sử
            </div>
            <button
              type="button"
              onClick={startNewChat}
              className="px-2 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold inline-flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3 h-3" />
              Mới
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessionsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="px-3 py-6 text-center text-[11px] text-slate-500">
                Chưa có phiên nào. Bắt đầu hỏi để tạo phiên đầu tiên.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {sessions.map((s) => {
                  const isActive = s.id === activeSessionId;
                  const isRenaming = s.id === renamingId;
                  return (
                    <li
                      key={s.id}
                      className={`group px-3 py-2.5 cursor-pointer transition-colors ${
                        isActive ? 'bg-violet-50' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => !isRenaming && openSession(s.id)}
                    >
                      {isRenaming ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={renameDraft}
                            onChange={(e) => setRenameDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void submitRename(s.id);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            className="flex-1 min-w-0 px-2 py-1 text-xs border border-violet-300 rounded-md focus:ring-2 focus:ring-violet-200 outline-none"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void submitRename(s.id);
                            }}
                            className="p-1 text-violet-700 hover:text-violet-900"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-2">
                            <MessageSquare
                              className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                                isActive ? 'text-violet-700' : 'text-slate-400'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-xs font-semibold truncate ${
                                  isActive ? 'text-violet-950' : 'text-slate-800'
                                }`}
                                title={s.title}
                              >
                                {s.title}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                <span>{s.messageCount} tin nhắn</span>
                                <span>·</span>
                                <span>{formatRelative(s.updatedAt)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startRename(s);
                                }}
                                title="Đổi tên"
                                className="p-1 text-slate-400 hover:text-slate-700"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDeleteSession(s.id);
                                }}
                                title="Xoá phiên"
                                className="p-1 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Chat */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[560px]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/30">
            {historyLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center">
                  <BookText className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Bắt đầu hỏi AI về hồ sơ của bạn</h3>
                  <p className="text-xs text-slate-500 mt-1">Hoặc thử một câu gợi ý dưới đây</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 mt-2 w-full max-w-2xl">
                  {SUGGESTED_QUESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendQuestion(s)}
                      className="text-left text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40 text-slate-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <ChatBubble
                  key={m.id}
                  message={m}
                  onOpenSource={(s) => setRecordModalId(s.recordId)}
                />
              ))
            )}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-slate-500 px-3 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                AI đang đọc hồ sơ và soạn câu trả lời...
              </div>
            )}
          </div>

          <form
            className="border-t border-slate-200 bg-white px-3 py-2 flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion(question);
            }}
          >
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendQuestion(question);
                }
              }}
              placeholder={
                activeSessionId
                  ? 'Tiếp tục hội thoại...'
                  : 'Bắt đầu phiên mới: Tóm tắt các ca tăng huyết áp tháng trước...'
              }
              rows={2}
              className="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-200 outline-none"
            />
            <button
              type="submit"
              disabled={sending || !question.trim()}
              className="h-10 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white inline-flex items-center gap-1.5 text-sm font-semibold shrink-0"
            >
              <Send className="w-4 h-4" />
              Gửi
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-700 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200">
          {error}
        </div>
      )}

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Lưu ý: Trợ lý AI này chỉ truy vấn dữ liệu sẵn có. Câu trả lời có thể không đầy đủ hoặc sai
        sót nếu hồ sơ ghi thiếu — luôn kiểm tra lại với hồ sơ gốc trước khi đưa ra quyết định lâm sàng.
      </p>

      {recordModalId && (
        <RecordDetailModal recordId={recordModalId} onClose={() => setRecordModalId(null)} />
      )}
    </div>
  );
};

const ChatBubble: React.FC<{
  message: ChatMessage;
  onOpenSource: (s: ApiDoctorChatSource) => void;
}> = ({ message, onOpenSource }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
          isUser
            ? 'bg-violet-600 text-white rounded-br-sm'
            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
        }`}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Nguồn tham chiếu ({message.sources.length})
            </div>
            <div className="space-y-1.5">
              {message.sources.map((s) => (
                <SourceCard key={`${s.recordId}-${s.index}`} source={s} onOpen={() => onOpenSource(s)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SourceCard: React.FC<{ source: ApiDoctorChatSource; onOpen: () => void }> = ({
  source: s,
  onOpen,
}) => {
  return (
    <div className="text-xs px-2.5 py-2 rounded-lg bg-violet-50/70 border border-violet-100 hover:border-violet-300 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-violet-900 shrink-0">[#{s.index}]</span>
          <span className="text-xs font-semibold text-slate-800 truncate">{s.patientName}</span>
        </div>
        <span className="text-[10px] text-violet-700 tabular-nums shrink-0">
          {(s.similarity * 100).toFixed(0)}% liên quan
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 mb-1">
        {s.slotTime && (
          <span className="inline-flex items-center gap-0.5">
            <CalendarClock className="w-3 h-3" />
            {new Date(s.slotTime).toLocaleString('vi-VN')}
          </span>
        )}
        {s.patientPhone && (
          <span className="inline-flex items-center gap-0.5">
            <Phone className="w-3 h-3" />
            {s.patientPhone}
          </span>
        )}
        {s.patientEmail && (
          <span className="inline-flex items-center gap-0.5 truncate max-w-[180px]">
            <Mail className="w-3 h-3" />
            {s.patientEmail}
          </span>
        )}
      </div>
      <div className="text-[11px] text-slate-600 line-clamp-3">{s.excerpt}</div>
      <div className="mt-1.5 flex justify-end">
        <button
          type="button"
          onClick={onOpen}
          className="px-2 py-1 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold inline-flex items-center gap-1"
        >
          <FileText className="w-3 h-3" />
          Xem hồ sơ
        </button>
      </div>
    </div>
  );
};

const RecordDetailModal: React.FC<{ recordId: string; onClose: () => void }> = ({
  recordId,
  onClose,
}) => {
  const [record, setRecord] = useState<ApiDoctorMedicalRecordListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    api
      .getMyDoctorMedicalRecord(recordId)
      .then((r) => {
        if (!cancelled) setRecord(r);
      })
      .catch((e: unknown) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Không tải được hồ sơ');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recordId]);

  return (
    <ModalOverlay open onClose={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-xl w-full p-6 sm:p-7 my-8 ring-1 ring-black/[0.04] relative pr-12"
        role="dialog"
        aria-modal="true"
      >
        <ModalCloseButton onClose={onClose} />
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900">Chi tiết hồ sơ bệnh án</h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{recordId}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        ) : err ? (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {err}
          </div>
        ) : record ? (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Bệnh nhân
              </div>
              <div className="font-semibold text-slate-900">{record.patientName}</div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-600 mt-1">
                {record.patientEmail && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {record.patientEmail}
                  </span>
                )}
                {record.patientPhone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {record.patientPhone}
                  </span>
                )}
                {record.slotTime && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" />
                    {new Date(record.slotTime).toLocaleString('vi-VN')}
                  </span>
                )}
              </div>
            </div>

            <RecordField label="Triệu chứng" value={record.symptoms} />
            <RecordField label="Chẩn đoán" value={record.diagnosis} />
            <RecordField label="Điều trị" value={record.treatment} />
            <RecordField label="Ghi chú" value={record.notes} />

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              Tạo lúc: {new Date(record.createdAt).toLocaleString('vi-VN')}
            </div>
          </div>
        ) : null}
      </div>
    </ModalOverlay>
  );
};

const RecordField: React.FC<{ label: string; value: string | null }> = ({ label, value }) => (
  <div>
    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</div>
    <div
      className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm border ${
        value
          ? 'border-slate-200 bg-white text-slate-800'
          : 'border-dashed border-slate-200 bg-slate-50 text-slate-400 italic'
      }`}
    >
      {value || '(không có)'}
    </div>
  </div>
);

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (sec < 60) return 'vừa xong';
  if (min < 60) return `${min} phút trước`;
  if (hr < 24) return `${hr} giờ trước`;
  if (day < 7) return `${day} ngày trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
