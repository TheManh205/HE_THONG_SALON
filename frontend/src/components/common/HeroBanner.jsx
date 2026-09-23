import React from 'react';

export const HeroBanner = ({ name = 'Nhân viên' }) => {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-black/10 bg-gradient-to-br from-[#0f1724] to-[#111827] p-6 sm:p-8 shadow-[0_18px_40px_rgba(17,17,17,0.12)] text-white">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -top-8 -right-8 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-white/3 blur-2xl" />
      </div>
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
            Chào mừng · THEMANH SALON
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold">Xin chào, {name}!</h1>
          <p className="mt-2 max-w-lg text-sm text-white/75">Hệ thống đang hoạt động ổn định với đầy đủ phân hệ đặt lịch, thanh toán và Trợ lý AI.</p>
        </div>

        <div className="flex gap-3 items-center">
          <a href="/appointments" className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 text-xs font-bold text-black hover:opacity-95">Quản lý Lịch</a>
          <a href="/ai-hub" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold text-white">Mở AI</a>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
