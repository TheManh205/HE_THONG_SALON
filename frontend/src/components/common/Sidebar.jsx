import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Calendar, Users, Scissors,
  Sparkles, Receipt, BarChart3, UserCheck, Globe
} from 'lucide-react';

export const Sidebar = () => {
  const { role } = useAuth();

  const navItems = [
    { to: '/', label: 'Tổng Quan', icon: LayoutDashboard, roles: ['admin', 'manager', 'receptionist', 'hairdresser'] },
    { to: '/appointments', label: 'Quản Lý Lịch Hẹn', icon: Calendar, roles: ['admin', 'manager', 'receptionist', 'hairdresser'], badge: 'Chính' },
    { to: '/ai-hub', label: 'Trợ Lý AI Gemini', icon: Sparkles, roles: ['admin', 'manager', 'receptionist', 'hairdresser'], highlight: true },
    { to: '/customers', label: 'Hồ Sơ Khách Hàng', icon: Users, roles: ['admin', 'manager', 'receptionist', 'hairdresser'] },
    { to: '/stylists', label: 'Thợ Tóc & Ca Làm', icon: UserCheck, roles: ['admin', 'manager', 'receptionist', 'hairdresser'] },
    { to: '/services', label: 'Dịch Vụ Salon', icon: Scissors, roles: ['admin', 'manager', 'receptionist', 'hairdresser'] },
    { to: '/invoices', label: 'Hóa Đơn & Doanh Thu', icon: Receipt, roles: ['admin', 'manager', 'receptionist'] },
    { to: '/analytics', label: 'Báo Cáo & Thống Kê', icon: BarChart3, roles: ['admin', 'manager', 'receptionist'] },
  ];

  return (
    <aside className="hidden w-full shrink-0 lg:block lg:w-[270px]">
      <div className="sticky top-20 space-y-4 rounded-[28px] border border-black/10 bg-white p-3 shadow-[0_20px_60px_rgba(17,17,17,0.06)]">
        <div className="rounded-2xl border border-black/10 bg-[#f7f7f5] px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6b7280]">
            Phân hệ quản trị
          </p>
        </div>

        <nav className="space-y-1.5">
          {navItems
            .filter((item) => item.roles.includes(role))
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? item.highlight
                          ? 'border border-black/10 bg-black text-white shadow-[0_8px_20px_rgba(17,17,17,0.16)]'
                          : 'border border-black/10 bg-[#f4f4f2] text-black'
                        : item.highlight
                        ? 'text-[#4b5563] hover:bg-[#f7f7f5] hover:text-black'
                        : 'text-[#4b5563] hover:bg-[#f7f7f5] hover:text-black'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-md bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#4b5563]">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="rounded-md bg-[#f4f4f2] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-black">
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> AI
                      </span>
                    </span>
                  )}
                </NavLink>
              );
            })}
        </nav>

        <div className="border-t border-black/10 pt-3">
          <div className="rounded-[22px] border border-black/10 bg-[#111111] p-3.5 text-white shadow-[0_18px_30px_rgba(17,17,17,0.18)]">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white">
              <Globe className="h-4 w-4" />
            </div>
            <h4 className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-white/80">Cổng Đặt Lịch</h4>
            <p className="mb-3 text-[11px] leading-5 text-white/65">Trang công khai cho khách đặt lịch</p>
            <a
              href="/booking"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-full bg-white px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#eeeeee]"
            >
              Mở Trang Booking
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};
