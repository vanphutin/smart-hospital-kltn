import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { api, ApiRequestError, type ApiAuthUser } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { validatePatientRegisterForm, isValidEmailFormat } from '../utils/patient-register.validation';

export type AuthModalTab = 'login' | 'register' | 'forgot';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: ApiAuthUser) => void;
  /** Mở modal với tab nào: Đăng nhập, Đăng ký hoặc Quên mật khẩu */
  initialTab: AuthModalTab;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, onSuccess, initialTab }) => {
  const toast = useToast();
  const [tab, setTab] = useState<AuthModalTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
    setError(null);
    setFieldErrors(null);
  }, [initialTab]);

  useEffect(() => {
    if (open) {
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open]);

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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const clearRegisterFields = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors(null);
    setLoading(true);
    try {
      if (tab === 'forgot') {
        const em = email.trim();
        if (!em) {
          setError('Vui lòng nhập email');
          return;
        }
        if (!isValidEmailFormat(em)) {
          setError('Email không đúng định dạng');
          return;
        }
        await api.forgotPassword(em);
        toast.success('Nếu email đã đăng ký, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.');
        setTab('login');
        setError(null);
        return;
      }
      if (tab === 'login') {
        const res = await api.login(email.trim(), password);
        toast.success('Đăng nhập thành công.');
        onSuccess(res.access_token, res.user);
        onClose();
      } else {
        const clientErr = validatePatientRegisterForm({
          fullName,
          email,
          phone,
          password,
          confirmPassword,
        });
        if (clientErr) {
          setFieldErrors(clientErr);
          return;
        }
        await api.register({
          email: email.trim(),
          password,
          confirmPassword,
          fullName: fullName.trim(),
          phone: phone.trim(),
        });
        toast.success('Đăng ký thành công');
        clearRegisterFields();
        setTab('login');
      }
    } catch (err) {
      if (err instanceof ApiRequestError && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputError = (name: string) => fieldErrors?.[name];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="auth-backdrop"
          className="fixed inset-0 z-[100] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Đóng"
            className="fixed inset-0 z-0 block min-h-full w-full cursor-default border-0 bg-black/50 p-0 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <div className="relative z-10 flex min-h-full w-full flex-col items-center justify-center p-4 pointer-events-none">
            <motion.div
              className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            >
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              {tab === 'forgot' ? (
                <div className="flex items-center gap-2" id="auth-modal-title">
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      setTab('login');
                      setError(null);
                      setFieldErrors(null);
                    }}
                    className="text-sm font-bold text-slate-600 hover:text-slate-900"
                  >
                    ← Đăng nhập
                  </button>
                  <span className="text-sm font-bold text-slate-900">Quên mật khẩu</span>
                </div>
              ) : (
                <div className="flex gap-2" id="auth-modal-title">
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      setTab('login');
                      setError(null);
                      setFieldErrors(null);
                      setShowPassword(false);
                      setShowConfirmPassword(false);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors duration-200 ${
                      tab === 'login' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      setTab('register');
                      setError(null);
                      setFieldErrors(null);
                      setShowPassword(false);
                      setShowConfirmPassword(false);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors duration-200 ${
                      tab === 'register' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Đăng ký
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
              )}
              {tab === 'register' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Họ tên</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (fieldErrors) setFieldErrors(null);
                      }}
                      placeholder="Nguyễn Văn A"
                      autoComplete="name"
                      className={`w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow ${
                        inputError('fullName') ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
                      }`}
                      aria-invalid={!!inputError('fullName')}
                    />
                    {inputError('fullName') ? (
                      <p className="text-xs text-red-600 mt-1">{inputError('fullName')}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors) setFieldErrors(null);
                      }}
                      placeholder="email@example.com"
                      autoComplete="email"
                      className={`w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow ${
                        inputError('email') ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
                      }`}
                      aria-invalid={!!inputError('email')}
                    />
                    {inputError('email') ? (
                      <p className="text-xs text-red-600 mt-1">{inputError('email')}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Số điện thoại</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors) setFieldErrors(null);
                      }}
                      placeholder="0912345678 (10 chữ số)"
                      autoComplete="tel"
                      maxLength={16}
                      className={`w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow ${
                        inputError('phone') ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
                      }`}
                      aria-invalid={!!inputError('phone')}
                    />
                    {inputError('phone') ? (
                      <p className="text-xs text-red-600 mt-1">{inputError('phone')}</p>
                    ) : null}
                  </div>
                </>
              )}
              {tab === 'login' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    autoComplete="email"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                    required
                  />
                  <p className="text-right mt-1">
                    <button
                      type="button"
                      tabIndex={-1}
                      className="text-sm font-semibold text-primary hover:underline"
                      onClick={() => {
                        setTab('forgot');
                        setError(null);
                        setFieldErrors(null);
                      }}
                    >
                      Quên mật khẩu?
                    </button>
                  </p>
                </div>
              )}
              {tab === 'forgot' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email đã đăng ký</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="email@example.com"
                    autoComplete="email"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">Chúng tôi sẽ gửi liên kết đặt lại mật khẩu đến email này nếu tài khoản tồn tại.</p>
                </div>
              )}
              {tab !== 'forgot' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors) setFieldErrors(null);
                    }}
                    placeholder="••••••••"
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                    className={`w-full pl-4 pr-12 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow ${
                      inputError('password') ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
                    }`}
                    required
                    aria-invalid={!!inputError('password')}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {tab === 'register' && inputError('password') ? (
                  <p className="text-xs text-red-600 mt-1">{inputError('password')}</p>
                ) : null}
              </div>
              )}
              {tab === 'register' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nhập lại mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors) setFieldErrors(null);
                      }}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={`w-full pl-4 pr-12 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow ${
                        inputError('confirmPassword') ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
                      }`}
                      aria-invalid={!!inputError('confirmPassword')}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      aria-label={showConfirmPassword ? 'Ẩn mật khẩu nhập lại' : 'Hiện mật khẩu nhập lại'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {inputError('confirmPassword') ? (
                    <p className="text-xs text-red-600 mt-1">{inputError('confirmPassword')}</p>
                  ) : null}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-opacity"
              >
                {loading
                  ? 'Đang xử lý...'
                  : tab === 'login'
                    ? 'Đăng nhập'
                    : tab === 'forgot'
                      ? 'Gửi liên kết'
                      : 'Đăng ký'}
              </button>
            </form>
          </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
