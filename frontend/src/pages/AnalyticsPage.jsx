import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/endpoints';
import { useToast } from '../contexts/ToastContext';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Sparkles,
  Award
} from 'lucide-react';

export const AnalyticsPage = () => {
  const { addToast } = useToast();

  const [days, setDays] = useState(7);
  const [revenueData, setRevenueData] = useState(null);
  const [popularServices, setPopularServices] = useState([]);
  const [retention, setRetention] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [revRes, popRes, retRes] = await Promise.all([
        analyticsAPI.getRevenue(days),
        analyticsAPI.getPopularServices(10),
        analyticsAPI.getCustomerRetention()
      ]);
      setRevenueData(revRes.data);
      setPopularServices(popRes.data);
      setRetention(retRes.data);
    } catch (err) {
      addToast('Lỗi khi tải dữ liệu thống kê', 'error');
    } finally {
      setLoading(false);
    }
  };

  const maxRevenueInChart = revenueData?.daily_breakdown?.reduce(
    (max, item) => Math.max(max, item.revenue),
    1
  ) || 1;

  return (
    <div className="space-y-8">
      {/* Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-salon text-slate-100 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-salon-primary" />
            Báo Cáo Doanh Thu & Thống Kê
          </h1>
          <p className="text-xs text-salon-muted mt-1">
            Phân tích số liệu tài chính, hiệu suất dịch vụ và mức độ trung thành của khách hàng
          </p>
        </div>

        <div className="flex items-center gap-2 bg-salon-card p-1.5 rounded-2xl border border-salon-border">
          {[
            { label: '7 Ngày', val: 7 },
            { label: '14 Ngày', val: 14 },
            { label: '30 Ngày', val: 30 },
          ].map((d) => (
            <button
              key={d.val}
              onClick={() => setDays(d.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                days === d.val
                  ? 'bg-salon-primary text-black shadow-glow-gold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-panel p-6 rounded-3xl border border-salon-border/60">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-salon-muted uppercase tracking-wider">
              Tổng Doanh Thu ({days} ngày)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-100">
            {revenueData ? `${revenueData.total_revenue.toLocaleString('vi-VN')} đ` : '0 đ'}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">
            Tổng số: {revenueData?.total_invoices || 0} hóa đơn
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-salon-border/60">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-salon-muted uppercase tracking-wider">
              Giá Trị Đơn Trung Bình (AOV)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-300">
            {revenueData ? `${revenueData.average_order_value.toLocaleString('vi-VN')} đ` : '0 đ'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Mức chi tiêu trung bình / lượt khách
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-salon-border/60">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-salon-muted uppercase tracking-wider">
              Tỷ Lệ Giữ Chân Khách Hàng
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-300">
            {retention ? `${retention.retention_rate_percentage}%` : '0%'}
          </div>
          <p className="text-[11px] text-purple-400 mt-1">
            {retention?.returning_customers || 0} khách quay lại / {retention?.total_customers || 0} tổng khách
          </p>
        </div>
      </div>

      {/* Revenue Bar Chart (Custom High-res Responsive CSS Chart) */}
      <div className="glass-panel p-6 rounded-3xl border border-salon-border/60 space-y-6">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-salon-primary" />
          Biểu Đồ Doanh Thu Theo Ngày
        </h3>

        <div className="h-64 flex items-end gap-2 sm:gap-4 pt-6 border-b border-salon-border/60 pb-2">
          {revenueData?.daily_breakdown?.map((item) => {
            const heightPercent = Math.max(12, (item.revenue / maxRevenueInChart) * 100);
            return (
              <div
                key={item.date}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-salon-border px-2 py-1 rounded-lg text-[10px] font-bold text-amber-300 pointer-events-none whitespace-nowrap z-20 shadow-xl">
                  {item.revenue.toLocaleString('vi-VN')} đ ({item.appointment_count} đơn)
                </div>

                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[40px] rounded-t-xl bg-gradient-to-t from-amber-600/40 via-salon-primary/80 to-amber-300 group-hover:to-white transition-all shadow-glow-gold"
                />
                <span className="text-[10px] font-semibold text-slate-400 rotate-45 sm:rotate-0 origin-left mt-2">
                  {item.date.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popular Services Breakdown */}
      <div className="glass-panel rounded-3xl p-6 border border-salon-border/60 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Hiệu Suất Dịch Vụ & Doanh Thu Tương Ứng
        </h3>

        <div className="space-y-3">
          {popularServices.map((svc) => (
            <div
              key={svc.service_id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-salon-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-slate-100">{svc.service_name}</span>
                <span className="text-xs text-salon-muted block">{svc.category}</span>
              </div>

              <div className="flex items-center gap-6 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Lượt đặt</span>
                  <span className="font-bold text-salon-primary">{svc.booking_count} lượt</span>
                </div>
                <div className="text-right min-w-[120px]">
                  <span className="text-slate-400 block text-[10px]">Tổng doanh thu</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {svc.total_revenue.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
