import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyticsAPI, appointmentAPI } from '../services/endpoints';
import { AppointmentBadge } from '../components/common/Badge';
import {
  DollarSign, Calendar, Clock, Users, Sparkles,
  TrendingUp, ChevronRight, CheckCircle, AlertCircle, ArrowUpRight
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, role } = useAuth();
  const [overview, setOverview] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [role]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewRes, appRes, popRes] = await Promise.all([
        analyticsAPI.getOverview(),
        appointmentAPI.getAll({}),
        analyticsAPI.getPopularServices(5)
      ]);
      setOverview(overviewRes.data);
      setRecentAppointments(appRes.data.slice(0, 6));
      setPopularServices(popRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      label: 'Doanh Thu Hôm Nay',
      value: overview ? `${overview.today_revenue?.toLocaleString('vi-VN')}đ` : '—',
      icon: DollarSign,
      color: 'text-[#111111]',
      bg: 'bg-[#f5f5f3]',
      border: 'border-black/10',
      sub: 'Từ hóa đơn đã thanh toán',
      subColor: 'text-[#4b5563]',
    },
    {
      label: 'Lịch Hẹn Hôm Nay',
      value: overview ? `${overview.today_appointments} cuộc` : '—',
      icon: Calendar,
      color: 'text-[#111111]',
      bg: 'bg-[#f5f5f3]',
      border: 'border-black/10',
      sub: 'Theo lịch biểu ca làm việc',
      subColor: 'text-[#6b7280]',
    },
    {
      label: 'Chờ Xác Nhận',
      value: overview ? `${overview.pending_appointments} lịch` : '—',
      icon: Clock,
      color: 'text-[#111111]',
      bg: 'bg-[#f5f5f3]',
      border: 'border-black/10',
      sub: 'Cần lễ tân kiểm tra & duyệt',
      subColor: 'text-[#6b7280]',
    },
    {
      label: 'Khách Quay Lại',
      value: overview ? `${overview.retention_rate}%` : '—',
      icon: Users,
      color: 'text-[#111111]',
      bg: 'bg-[#f5f5f3]',
      border: 'border-black/10',
      sub: 'Tỷ lệ khách hàng thân thiết',
      subColor: 'text-[#6b7280]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[28px] border border-black/10 bg-[#111111] p-6 sm:p-8 shadow-[0_18px_40px_rgba(17,17,17,0.12)]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 h-64 w-64 rounded-full bg-white/30 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" /> Bảng Điều Khiển · THEMANH SALON
            </div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
              Xin chào, {user?.full_name || 'Nhân viên'}!
            </h1>
            <p className="max-w-lg text-sm text-white/75">
              Hệ thống đang hoạt động ổn định với đầy đủ phân hệ đặt lịch, chống trùng ca, thanh toán và AI Gemini.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2.5">
            <Link
              to="/appointments"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#f5f5f3]"
            >
              <Calendar className="h-4 w-4" /> Quản Lý Lịch Hẹn
            </Link>
            <Link
              to="/ai-hub"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4" /> Trợ Lý AI
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft hover:shadow-soft-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.label}</span>
                <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center border ${card.border}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className={`text-2xl font-black ${card.color} leading-tight`}>
                {loading ? <div className="h-7 w-24 bg-slate-100 animate-pulse rounded-lg" /> : card.value}
              </div>
              <p className={`text-[11px] font-medium ${card.subColor} mt-1.5`}>{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Appointments */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Lịch Hẹn Gần Đây
            </h2>
            <Link to="/appointments" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 hover:underline">
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_12px_30px_rgba(17,17,17,0.04)]">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : recentAppointments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentAppointments.map((app) => (
                  <div key={app.id} className="px-5 py-3.5 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-800 truncate">{app.customer?.full_name}</span>
                        <span className="text-xs text-slate-400 font-mono">{app.customer?.phone}</span>
                        <AppointmentBadge status={app.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="text-amber-600 font-semibold">
                          {app.hairdresser?.full_name}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(app.appointment_date).toLocaleString('vi-VN', {
                            day: 'numeric', month: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-slate-700">
                      {app.total_price?.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-medium">Chưa có lịch hẹn nào trong hệ thống.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-5">
          {/* Popular Services */}
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Dịch Vụ Phổ Biến
            </h3>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft divide-y divide-slate-100 overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-8 bg-slate-50 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : popularServices.length > 0 ? popularServices.map((svc, idx) => (
                <div key={svc.service_id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-black w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{svc.service_name}</p>
                      <p className="text-[10px] text-slate-400">{svc.category}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-600 shrink-0 ml-2">{svc.booking_count} lượt</span>
                </div>
              )) : (
                <div className="p-6 text-center text-slate-400 text-xs">Chưa có dữ liệu</div>
              )}
            </div>
          </div>

          {/* AI Quick Access */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-5 border border-purple-200 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Trợ Lý AI Gemini</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Soạn tin nhắn CSKH, tư vấn kiểu tóc, tóm tắt lịch sử kỹ thuật tự động.
            </p>
            <Link
              to="/ai-hub"
              className="inline-flex items-center gap-2 w-full justify-center py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-glow-accent"
            >
              Mở Module AI <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
