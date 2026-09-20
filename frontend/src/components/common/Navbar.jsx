import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RoleBadge } from './Badge';
import { Scissors, ExternalLink, LogOut, User, ShieldCheck, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout, demoLogin, role } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/10 bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-3 sm:px-4 lg:px-6 xl:px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-black text-white shadow-[0_14px_30px_rgba(0,0,0,0.14)] transition-transform duration-200 group-hover:scale-[1.03]">
            <Scissors className="h-5 w-5 rotate-45" />
          </div>
          <div>
            <span className="block text-lg font-black tracking-[0.12em] text-black sm:text-xl">
              THEMANH
            </span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
              Salon management
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/booking"
            target="_blank"
            className="hidden items-center gap-1.5 rounded-full border border-black/10 bg-[#f7f7f5] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:border-black hover:bg-black hover:text-white sm:inline-flex"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Booking
          </Link>

          {isAuthenticated ? (
            <>
              <div className="hidden items-center gap-1 rounded-full border border-black/10 bg-[#f8f8f7] p-1 lg:flex">
                <span className="flex items-center gap-1 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                  <ShieldCheck className="h-3.5 w-3.5 text-black" /> Demo
                </span>
                <button
                  onClick={() => demoLogin('admin')}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                    role === 'admin' ? 'bg-black text-white' : 'text-[#4b5563] hover:bg-black/5'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => demoLogin('receptionist')}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                    role === 'receptionist' ? 'bg-black text-white' : 'text-[#4b5563] hover:bg-black/5'
                  }`}
                >
                  Lễ Tân
                </button>
                <button
                  onClick={() => demoLogin('hairdresser')}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                    role === 'hairdresser' ? 'bg-black text-white' : 'text-[#4b5563] hover:bg-black/5'
                  }`}
                >
                  Thợ
                </button>
              </div>

              <div className="hidden items-center gap-3 border-l border-black/10 pl-3 sm:flex">
                <div className="text-right">
                  <div className="text-sm font-bold text-black leading-tight">
                    {user?.full_name || user?.username}
                  </div>
                  <RoleBadge role={user?.role} />
                </div>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="rounded-full border border-black/10 bg-white p-2 text-[#4b5563] transition hover:border-black hover:bg-black hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-black px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#222222] sm:px-4"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng Nhập</span>
            </Link>
          )}

          <button
            type="button"
            aria-label="Toggle mobile menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black transition hover:border-black hover:bg-black hover:text-white lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-black/10 bg-white px-3 py-3 lg:hidden">
          <div className="space-y-2">
            <Link
              to="/booking"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-2xl border border-black/10 bg-[#f7f7f5] px-3 py-2.5 text-sm font-semibold text-black"
            >
              <span>Trang Đặt Lịch Khách</span>
              <ExternalLink className="h-4 w-4" />
            </Link>

            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    demoLogin('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-3 py-2.5 text-left text-sm font-semibold text-black"
                >
                  Chuyển sang Admin
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-[#f7f7f5] px-3 py-2.5 text-left text-sm font-semibold text-black"
                >
                  <span>Đăng xuất</span>
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-2xl bg-black px-3 py-2.5 text-sm font-bold uppercase tracking-[0.12em] text-white"
              >
                Đăng Nhập
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
