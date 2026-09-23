import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Calendar, Users, Scissors,
  Sparkles, Receipt, BarChart3, UserCheck, Globe, X
} from 'lucide-react';

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { role } = useAuth();

  const navItems = [
    { to: '/', label: 'Bảng Điều Khiển', icon: LayoutDashboard, roles: ['admin', 'receptionist', 'hairdresser'] },
    { to: '/appointments', label: 'Quản Lý Lịch Hẹn', icon: Calendar, roles: ['admin', 'receptionist', 'hairdresser'], badge: 'Chính' },
    { to: '/ai-hub', label: 'Trợ Lý AI Salon', icon: Sparkles, roles: ['admin', 'receptionist', 'hairdresser'], highlight: true },
    { to: '/customers', label: 'Khách Hàng', icon: Users, roles: ['admin', 'receptionist', 'hairdresser'] },
    { to: '/stylists', label: 'Thợ Tóc & Ca Làm', icon: UserCheck, roles: ['admin', 'receptionist', 'hairdresser'] },
    { to: '/services', label: 'Dịch Vụ Salon', icon: Scissors, roles: ['admin', 'receptionist', 'hairdresser'] },
    { to: '/invoices', label: 'Hóa Đơn & Doanh Thu', icon: Receipt, roles: ['admin', 'receptionist'] },
    { to: '/analytics', label: 'Báo Cáo & Thống Kê', icon: BarChart3, roles: ['admin'] },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4 bg-slate-800 text-slate-100">
      <div className="space-y-6">
        {/* Brand Logo & Close button on mobile */}
        <div className="flex items-center justify-between px-2 pt-2 border-b border-slate-700/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-glow-gold">
              <Scissors className="h-6 w-6 rotate-45" />
            </div>
            <div>
              <span className="block text-lg font-black tracking-wider text-white font-serif-salon">
                THEMANH
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-400">
                Salon Haute Coiffure
              </span>
            </div>
          </div>
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Section Label */}
        <div className="px-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Hệ Thống Quản Trị
          </p>
        </div>

        {/* Navigation list */}
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
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-black shadow-glow-gold'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-md bg-slate-900/80 text-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="rounded-md bg-purple-500/20 text-purple-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30 inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AI
                    </span>
                  )}
                </NavLink>
              );
            })}
        </nav>
      </div>

      {/* Bottom Client Portal Link */}
      <div className="space-y-3 pt-4 border-t border-slate-700">
        <div className="rounded-2xl bg-slate-900/90 border border-slate-700 p-4 text-white shadow-card-dark">
          <div className="flex items-center gap-2 mb-1.5 text-amber-400">
            <Globe className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Cổng Khách Hàng</h4>
          </div>
          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            Xem trang đặt lịch online công khai của Salon
          </p>
          <a
            href="/booking"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-sm"
          >
            Mở Cổng Booking →
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-700 lg:bg-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-slate-800 shadow-2xl z-50 flex flex-col border-r border-slate-700">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
