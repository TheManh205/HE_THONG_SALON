import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyticsAPI, appointmentAPI } from '../services/endpoints';
import { AppointmentBadge } from '../components/common/Badge';
import HeroBanner from '../components/common/HeroBanner';
import {
  DollarSign, Calendar, Clock, Users, Sparkles,
  TrendingUp, ChevronRight, AlertCircle, ArrowUpRight
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
      value: overview ? `${overview.today_revenue?.toLocaleString('vi-VN')} đ` : '—',
      icon: DollarSign,
      color: 'text-amber-400',
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/30',
      sub: 'Từ hóa đơn đã thanh toán',
      subColor: 'text-amber-300/80',
    },
    {
      label: 'Lịch Hẹn Hôm Nay',
      value: overview ? `${overview.today_appointments} ca` : '—',
      icon: Calendar,
      color: 'text-blue-400',
      bg: 'bg-blue-500/15',
      border: 'border-blue-500/30',
      sub: 'Theo lịch biểu ca làm việc',
      subColor: 'text-slate-400',
    },
    {
      label: 'Chờ Xác Nhận',
      value: overview ? `${overview.pending_appointments} lịch` : '—',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/30',
      sub: 'Cần lễ tân kiểm tra & duyệt',
      subColor: 'text-slate-400',
    },
    {
      label: 'Khách Quay Lại',
      value: overview ? `${overview.retention_rate}%` : '—',
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-500/15',
      border: 'border-purple-500/30',
      sub: 'Tỷ lệ khách hàng thân thiết',
      subColor: 'text-slate-400',
    },
  ];

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Welcome Banner */}
      <HeroBanner name={user?.full_name || 'Nhân viên'} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-card-dark hover:border-slate-600 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{card.label}</span>
                <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center border ${card.border}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className={`text-2xl sm:text-3xl font-black ${card.color} font-serif-salon leading-tight`}>
                {loading ? <div className="h-8 w-28 bg-slate-700/60 animate-pulse rounded-lg" /> : card.value}
              </div>
              <p className={`text-xs font-medium ${card.subColor} mt-1.5`}>{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Appointments */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-white flex items-center gap-2 font-serif-salon">
              <Calendar className="w-5 h-5 text-amber-400" />
              Lịch Hẹn Gần Đây
            </h2>
            <Link
              to="/appointments"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-card-dark">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 bg-slate-700/50 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : recentAppointments.length > 0 ? (
              <div className="divide-y divide-slate-700/70">
                {recentAppointments.map((app) => (
                  <div
                    key={app.id}
                    className="px-5 py-4 hover:bg-slate-700/40 transition-colors flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                        <span className="font-bold text-white truncate">{app.customer?.full_name}</span>
                        <span className="text-xs text-slate-400 font-mono">{app.customer?.phone}</span>
                        <AppointmentBadge status={app.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-300">
                        <span className="text-amber-400 font-bold">
                          {app.hairdresser?.full_name}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(app.appointment_date).toLocaleString('vi-VN', {
                            day: 'numeric', month: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-black text-amber-400">
                      {app.total_price?.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">Chưa có lịch hẹn nào trong hệ thống.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Popular Services */}
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2 mb-3 font-serif-salon">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Dịch Vụ Phổ Biến
            </h3>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-card-dark divide-y divide-slate-700/70 overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-8 bg-slate-700/50 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : popularServices.length > 0 ? popularServices.map((svc, idx) => (
                <div key={svc.service_id} className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-700/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-black w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${idx === 0 ? 'bg-amber-500 text-slate-950 shadow-glow-gold' : 'bg-slate-700 text-slate-300'}`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{svc.service_name}</p>
                      <p className="text-[11px] text-slate-400">{svc.category}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-400 shrink-0 ml-2">{svc.booking_count} lượt</span>
                </div>
              )) : (
                <div className="p-6 text-center text-slate-400 text-xs">Chưa có dữ liệu</div>
              )}
            </div>
          </div>

          {/* AI Quick Access */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-850 rounded-2xl p-6 border border-purple-500/30 text-center space-y-3.5 shadow-card-dark">
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Trợ Lý AI Gemini</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Soạn tin nhắn CSKH, tư vấn kiểu tóc, tóm tắt lịch sử kỹ thuật tự động bằng trí tuệ nhân tạo.
            </p>
            <Link
              to="/ai-hub"
              className="inline-flex items-center gap-2 w-full justify-center py-2.5 rounded-xl text-xs font-black bg-purple-600 text-white hover:bg-purple-500 transition-colors shadow-glow-accent"
            >
              Mở Module AI <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
