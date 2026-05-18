import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { api, ApiRequestError } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { validateNewPasswordPair } from '../utils/patient-register.validation';

interface ResetPasswordViewProps {
  token: string | null;
  onNavigate: (view: string) => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ token, onNavigate }) => {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inputError = (name: string) => fieldErrors?.[name];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setFieldErrors(null);
    const clientErr = validateNewPasswordPair(password, confirmPassword);
    if (clientErr) {
      setFieldErrors(clientErr);
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword({ token, password, confirmPassword });
      toast.success('Đặt lại mật khẩu thành công. Vui lòng đăng nhập.');
      onNavigate('home');
    } catch (err) {
      if (err instanceof ApiRequestError && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
      } else {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
          <h1 className="text-lg font-bold text-slate-900 mb-2">Liên kết không hợp lệ hoặc đã hết hạn</h1>
          <p className="text-slate-600 text-sm mb-6">Vui lòng yêu cầu gửi lại email đặt lại mật khẩu từ màn đăng nhập.</p>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-xl font-bold text-slate-900 mb-2 text-center">Đặt lại mật khẩu</h1>
      <p className="text-slate-600 text-sm text-center mb-8">Nhập mật khẩu mới cho tài khoản của bạn.</p>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {error ? <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p> : null}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu mới</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors) setFieldErrors(null);
              }}
              placeholder="••••••••"
              autoComplete="new-password"
              className={`w-full pl-4 pr-12 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${
                inputError('password') ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
              }`}
              aria-invalid={!!inputError('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {inputError('password') ? <p className="text-xs text-red-600 mt-1">{inputError('password')}</p> : null}
        </div>
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
              className={`w-full pl-4 pr-12 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${
                inputError('confirmPassword') ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
              }`}
              aria-invalid={!!inputError('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu nhập lại' : 'Hiện mật khẩu nhập lại'}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {inputError('confirmPassword') ? (
            <p className="text-xs text-red-600 mt-1">{inputError('confirmPassword')}</p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
        </button>
      </form>
    </section>
  );
};
