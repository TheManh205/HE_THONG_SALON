import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/endpoints';
import { useToast } from '../contexts/ToastContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Award,
  Scissors,
  Star,
  CalendarDays,
  Filter
} from 'lucide-react';

const formatCurrency = (val) => {
  if (!val && val !== 0) return '0 đ';
  return `${Number(val).toLocaleString('vi-VN')} đ`;
};

const formatDateInput = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const AnalyticsPage = () => {
  const { addToast } = useToast();

  // Date range state default to 7 days
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);

  const [dateRangeType, setDateRangeType] = useState('7');
  const [startDate, setStartDate] = useState(formatDateInput(sevenDaysAgo));
  const [endDate, setEndDate] = useState(formatDateInput(today));

  const [revenueData, setRevenueData] = useState(null);
  const [stylistData, setStylistData] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [retention, setRetention] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics(startDate, endDate);
  }, []);

  const handlePresetChange = (days) => {
    setDateRangeType(String(days));
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    const startStr = formatDateInput(start);
    const endStr = formatDateInput(end);
    setStartDate(startStr);
    setEndDate(endStr);
    fetchAnalytics(startStr, endStr);
  };

  const handleCustomFilterSubmit = (e) => {
    e?.preventDefault();
    if (!startDate || !endDate) {
      addToast('Vui lòng chọn ngày bắt đầu và kết thúc', 'warning');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      addToast('Ngày bắt đầu không được lớn hơn ngày kết thúc', 'warning');
      return;
    }
    setDateRangeType('custom');
    fetchAnalytics(startDate, endDate);
  };

  const fetchAnalytics = async (start, end) => {
    setLoading(true);
    try {
      const [revRes, stylistRes, popRes, retRes] = await Promise.all([
        analyticsAPI.getRevenueByRange(start, end),
        analyticsAPI.getStylistPerformance(start, end),
        analyticsAPI.getPopularServices(10),
        analyticsAPI.getCustomerRetention(),
      ]);
      setRevenueData(revRes.data);
      setStylistData(stylistRes.data.stylists || []);
      setPopularServices(popRes.data || []);
      setRetention(retRes.data);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.detail || 'Lỗi khi tải dữ liệu thống kê', 'error');
    } finally {
      setLoading(false);
    }
  };

  const chartData = (revenueData?.daily_breakdown || []).map((item) => ({
    date: item.date.slice(5), // MM-DD
    fullDate: item.date,
    revenue: item.revenue,
    appointments: item.appointment_count,
  }));

  const stylistChartData = stylistData.map((s) => ({
    name: s.hairdresser_name,
    revenue: s.total_revenue,
    appointments: s.completed_appointments,
  }));

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Top Header & Range Controls */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-card-dark">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-glow-gold">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-serif-salon text-white">
              Báo Cáo & Phân Tích Doanh Thu
            </h1>
          </div>
          <p className="text-sm text-slate-300 mt-2">
            Thống kê doanh thu theo khoảng ngày A → B, hiệu suất từng Stylist và tỷ lệ giữ chân khách hàng
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Buttons */}
          <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-700">
            {[
              { label: '7 ngày', val: '7' },
              { label: '14 ngày', val: '14' },
              { label: '30 ngày', val: '30' },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => handlePresetChange(Number(p.val))}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dateRangeType === p.val
                    ? 'bg-amber-500 text-slate-950 shadow-glow-gold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker */}
          <form
            onSubmit={handleCustomFilterSubmit}
            className="flex items-center gap-2 text-xs bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-700"
          >
            <CalendarDays className="w-4 h-4 text-amber-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
            />
            <span className="text-slate-400">→</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-amber-500 text-slate-950 font-black rounded-md text-xs hover:bg-amber-400 transition-colors flex items-center gap-1 shadow-sm"
            >
              <Filter className="w-3 h-3" />
              Lọc
            </button>
          </form>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-card-dark">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Tổng Doanh Thu
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-serif-salon">
            {loading ? '...' : formatCurrency(revenueData?.total_revenue)}
          </div>
          <p className="text-xs text-slate-300 font-semibold mt-1">
            Tổng số: <strong className="text-white">{revenueData?.total_invoices || 0}</strong> hóa đơn đã thu
          </p>
        </div>

        {/* Average Order Value */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-card-dark">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Giá Trị Đơn TB (AOV)
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-serif-salon">
            {loading ? '...' : formatCurrency(revenueData?.average_order_value)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mức chi tiêu trung bình / lượt khách
          </p>
        </div>

        {/* Customer Retention */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-card-dark">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Tỷ Lệ Khách Quay Lại
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300 font-serif-salon">
            {loading ? '...' : `${retention?.retention_rate_percentage || 0}%`}
          </div>
          <p className="text-xs text-purple-300/80 font-medium mt-1">
            {retention?.returning_customers || 0} khách quen / {retention?.total_customers || 0} tổng khách
          </p>
        </div>

        {/* Stylist Summary */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-card-dark">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Stylist Hoạt Động
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-serif-salon">
            {loading ? '...' : `${stylistData.length} Thợ`}
          </div>
          <p className="text-xs text-emerald-300/80 font-medium mt-1">
            {stylistData.reduce((acc, s) => acc + s.completed_appointments, 0)} ca phục vụ hoàn tất
          </p>
        </div>
      </div>

      {/* Main Revenue Chart (Recharts Dark Theme) */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-card-dark">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2 font-serif-salon">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              Biểu Đồ Doanh Thu Theo Ngày
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Khoảng thời gian: {revenueData?.start_date} → {revenueData?.end_date}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-amber-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-glow-gold"></span>
              <span>Doanh thu thực tế (VNĐ)</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              Đang tải biểu đồ doanh thu...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              Không có dữ liệu trong khoảng thời gian này
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradDark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}M` : `${v / 1000}k`)}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                  labelFormatter={(lbl, payload) => payload?.[0]?.payload?.fullDate || lbl}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.75rem',
                    color: '#ffffff',
                    fontSize: '13px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#revenueGradDark)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Stylist Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stylist Revenue Bar Chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 lg:col-span-1 flex flex-col shadow-card-dark">
          <div className="mb-4 border-b border-slate-700 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Scissors className="w-4 h-4 text-amber-400" />
              So Sánh Doanh Thu Stylist
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Xếp theo doanh thu cao nhất</p>
          </div>

          <div className="h-64 w-full flex-1">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Đang tải dữ liệu thợ...
              </div>
            ) : stylistChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Chưa có dữ liệu cho khoảng thời gian này
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stylistChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#f8fafc' }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    formatter={(v) => [formatCurrency(v), 'Doanh thu']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '0.75rem',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Stylist Performance Detail Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 lg:col-span-2 shadow-card-dark">
          <div className="mb-4 border-b border-slate-700 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Bảng Hiệu Suất & Đánh Giá Stylist
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chi tiết số cuộc hẹn, tỷ lệ hoàn tất ca và doanh thu tạo ra
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 bg-slate-900/40 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold">Stylist</th>
                  <th className="py-3 px-4 font-bold text-center">Đánh giá</th>
                  <th className="py-3 px-4 font-bold text-center">Tổng ca</th>
                  <th className="py-3 px-4 font-bold text-center">Hoàn thành</th>
                  <th className="py-3 px-4 font-bold text-right">Doanh Thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {stylistData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      Chưa có dữ liệu thợ trong khoảng thời gian này
                    </td>
                  </tr>
                ) : (
                  stylistData.map((stylist) => {
                    const completionRate =
                      stylist.total_appointments > 0
                        ? Math.round((stylist.completed_appointments / stylist.total_appointments) * 100)
                        : 0;

                    return (
                      <tr key={stylist.hairdresser_id} className="hover:bg-slate-700/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                            {stylist.hairdresser_name.slice(0, 1)}
                          </div>
                          <div>
                            <span className="block font-bold text-sm">{stylist.hairdresser_name}</span>
                            <span className="text-[11px] text-slate-400">ID #{stylist.hairdresser_id}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30 text-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {stylist.average_rating ? Number(stylist.average_rating).toFixed(1) : '5.0'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-white">
                          {stylist.total_appointments} ca
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-emerald-400">
                              {stylist.completed_appointments} ca
                            </span>
                            <span className="text-[11px] text-slate-400">
                              ({completionRate}%)
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-amber-400 text-sm whitespace-nowrap">
                          {formatCurrency(stylist.total_revenue)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Popular Services Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-card-dark">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
          <Award className="w-4 h-4 text-amber-400" />
          Top Dịch Vụ Được Đặt & Tỷ Trọng Doanh Thu
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {popularServices.map((svc, idx) => (
            <div
              key={svc.service_id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-sm">
                  #{idx + 1}
                </span>
                <div>
                  <h4 className="font-bold text-sm text-white">{svc.service_name}</h4>
                  <span className="text-xs text-slate-400">{svc.category}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-semibold text-slate-300">
                  {svc.booking_count} lượt đặt
                </div>
                <div className="text-sm font-black text-amber-400 mt-0.5">
                  {formatCurrency(svc.total_revenue)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
