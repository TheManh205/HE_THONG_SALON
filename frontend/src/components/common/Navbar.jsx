import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RoleBadge } from './Badge';
import {
  ExternalLink, LogOut, User, ShieldCheck, Menu
} from 'lucide-react';

export const Navbar = ({ onMenuClick }) => {
  const { user, isAuthenticated, logout, demoLogin, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-20 flex items-center justify-between px-4 sm:px-6">
      {/* Mobile Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="hidden sm:block">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Hệ Thống Quản Trị Salon
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Quick link to client booking */}
        <Link
          to="/booking"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500 hover:text-slate-950 shadow-sm"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Đặt Lịch Khách</span>
        </Link>

        {isAuthenticated ? (
          <>
            {/* Quick Demo Switcher */}
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/90 p-1">
              <span className="flex items-center gap-1 px-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> Demo:
              </span>
              <button
                onClick={() => demoLogin('admin')}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  role === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => demoLogin('receptionist')}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  role === 'receptionist'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                Lễ Tân
              </button>
              <button
                onClick={() => demoLogin('hairdresser')}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  role === 'hairdresser'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                Stylist
              </button>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white leading-tight">
                  {user?.full_name || user?.username}
                </div>
                <div className="text-[11px] text-amber-400 font-bold capitalize mt-0.5">
                  {user?.role}
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-sm">
                {(user?.full_name || user?.username || 'U').slice(0, 1).toUpperCase()}
              </div>

              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="rounded-full border border-slate-700 bg-slate-800 p-2 text-slate-300 transition hover:border-rose-500 hover:bg-rose-500/20 hover:text-rose-300"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-xs font-black text-slate-950 uppercase tracking-wider transition hover:bg-amber-400 shadow-glow-gold"
          >
            <User className="h-4 w-4" />
            <span>Đăng Nhập</span>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
