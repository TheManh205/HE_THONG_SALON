import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Scissors, Lock, User, Shield, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const { login, demoLogin } = useAuth();
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

  const handleQuickDemo = async (roleType) => {
    setLoading(true);
    const result = await demoLogin(roleType);
    setLoading(false);
    if (result.success) {
      addToast(`Đăng nhập Demo ${roleType} thành công!`, 'success');
      navigate('/');
    } else {
      addToast(result.error || 'Đăng nhập thất bại!', 'error');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f5f3] p-4">
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-black/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 -translate-x-1/2 translate-y-1/2 rounded-full bg-black/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-black/10 bg-white p-8 shadow-[0_20px_48px_rgba(17,17,17,0.08)]">
        {/* Header Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-black shadow-[0_10px_20px_rgba(17,17,17,0.15)]">
            <Scissors className="h-8 w-8 rotate-45 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-[0.14em] text-[#111111]">
            THEMANH
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Hệ thống quản lý & điều phối salon tích hợp AI
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
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
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
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
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#1f1f1f] disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                Đang xác thực...
              </span>
            ) : (
              <>Đăng Nhập Hệ Thống <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* Demo Switcher */}
        <div className="border-t border-slate-100 pt-5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
            Truy Cập Nhanh Demo
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-black/10 bg-[#f7f7f5] p-3 text-xs font-bold text-[#111111] transition hover:bg-[#efefed]"
            >
              <Shield className="w-4 h-4" />
              Quản Lý
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('receptionist')}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-black/10 bg-[#f7f7f5] p-3 text-xs font-bold text-[#111111] transition hover:bg-[#efefed]"
            >
              <User className="w-4 h-4" />
              Lễ Tân
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('hairdresser')}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-black/10 bg-[#f7f7f5] p-3 text-xs font-bold text-[#111111] transition hover:bg-[#efefed]"
            >
              <Scissors className="w-4 h-4" />
              Thợ Tóc
            </button>
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link
            to="/booking"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111111] hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Đến trang đặt lịch cho khách hàng
          </Link>
        </div>
      </div>
    </div>
  );
};
