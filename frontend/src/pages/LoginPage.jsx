import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Scissors, Lock, User, Shield, ArrowRight, ExternalLink } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      addToast('Vui lòng nhập tài khoản và mật khẩu!', 'error');
      return;
    }
    setLoading(true);
    const result = await login(username.trim(), password.trim());
    setLoading(false);
    if (result.success) {
      addToast(`Đăng nhập thành công! Xin chào ${result.user.full_name}`, 'success');
      navigate('/');
    } else {
      addToast(result.error || 'Đăng nhập thất bại!', 'error');
    }
  };

  // demo login removed for production

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 text-slate-100">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 -translate-x-1/2 translate-y-1/2 rounded-full bg-amber-500/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-card-dark">
        {/* Header Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-glow-gold">
            <Scissors className="h-8 w-8 rotate-45" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white font-serif-salon">
            THEMANH SALON
          </h1>
          <p className="text-sm text-slate-300 mt-1 font-medium">
            Hệ thống quản lý & điều phối salon tích hợp AI
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Tên Tài Khoản
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="admin, letan, stylist_nam..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Mật Khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3.5 text-sm font-black text-slate-950 transition hover:bg-amber-400 shadow-glow-gold disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                Đang xác thực...
              </span>
            ) : (
              <>Đăng Nhập <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* Demo switcher removed: production auth only */}

        <div className="mt-5 text-center">
          <Link
            to="/booking"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Đến trang đặt lịch cho khách hàng
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
