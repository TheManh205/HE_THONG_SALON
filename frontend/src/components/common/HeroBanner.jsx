import React from 'react';

export const HeroBanner = ({ name = 'Nhân viên' }) => {
  return (
    <div className="hero-banner relative overflow-hidden rounded-[28px] border border-amber-200/80 dark:border-black/10 bg-gradient-to-br from-amber-50/80 via-white to-amber-100/40 dark:from-[#0f1724] dark:to-[#111827] p-6 sm:p-8 shadow-sm dark:shadow-[0_18px_40px_rgba(17,17,17,0.12)] text-slate-900 dark:text-white transition-all duration-200">
      <div className="absolute inset-0 opacity-15 dark:opacity-10 pointer-events-none">
        <div className="absolute -top-8 -right-8 h-64 w-64 rounded-full bg-amber-400/10 dark:bg-white/5 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-amber-500/10 dark:bg-white/3 blur-2xl" />
      </div>
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-amber-500/30 dark:border-white/10 bg-amber-500/10 dark:bg-white/5 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-amber-900 dark:text-white backdrop-blur-sm">
            Chào mừng · THE MANH SALON
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Xin chào, {name}!
          </h1>
          <p className="mt-2 max-w-lg text-sm text-slate-600 dark:text-white/75">
            Hệ thống đang hoạt động ổn định với đầy đủ phân hệ đặt lịch, thanh toán và Trợ lý AI.
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <a
            href="/appointments"
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400 transition-all shadow-sm active:scale-95"
          >
            Quản lý Lịch
          </a>
          <a
            href="/ai-hub"
            className="hero-btn-secondary inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 px-5 py-2.5 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95 shadow-sm dark:shadow-none"
          >
            Mở AI
          </a>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
