import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  appointmentAPI, hairdresserAPI, serviceAPI, customerAPI, invoiceAPI
} from '../services/endpoints';
import { AppointmentBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Calendar, Clock, Scissors, CheckCircle, XCircle,
  PlayCircle, Receipt, RotateCcw, Search, Plus,
  RefreshCw, Phone
} from 'lucide-react';

export const AppointmentsPage = () => {
  const { isAdmin, isReceptionist } = useAuth();
  const { addToast } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [hairdressers, setHairdressers] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStylistId, setFilterStylistId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchText, setSearchText] = useState('');

  // Reschedule modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleStylistId, setRescheduleStylistId] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutDiscount, setCheckoutDiscount] = useState(0);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('CASH');
  const [checkoutFormula, setCheckoutFormula] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // New booking modal
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [newCustId, setNewCustId] = useState('');
  const [newStylistId, setNewStylistId] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('10:00');
  const [newServiceIds, setNewServiceIds] = useState([]);
  const [newNotes, setNewNotes] = useState('');
  const [newSlots, setNewSlots] = useState([]);
  const [newSlotsLoading, setNewSlotsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterStylistId, filterDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterStylistId) params.hairdresser_id = filterStylistId;
      if (filterDate) {
        params.start_date = filterDate;
        params.end_date = filterDate;
      }

      const [appRes, stylRes, svcRes, custRes] = await Promise.all([
        appointmentAPI.getAll(params),
        hairdresserAPI.getAll({ active_only: true }),
        serviceAPI.getAll({ active_only: true }),
        customerAPI.getAll(),
      ]);
      setAppointments(appRes.data);
      setHairdressers(stylRes.data);
      setServices(svcRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      addToast('Lỗi khi tải danh sách cuộc hẹn', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtered appointments by search
  const filteredAppointments = appointments.filter((app) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      app.customer?.full_name?.toLowerCase().includes(q) ||
      app.customer?.phone?.includes(q) ||
      app.hairdresser?.full_name?.toLowerCase().includes(q)
    );
  });

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      await appointmentAPI.updateStatus(appId, newStatus);
      addToast('Cập nhật trạng thái thành công!', 'success');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Cập nhật thất bại!', 'error');
    }
  };

  const handleCancel = async (appId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;
    try {
      await appointmentAPI.cancel(appId);
      addToast('Đã hủy lịch hẹn.', 'success');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Hủy thất bại!', 'error');
    }
  };

  // Reschedule
  const openReschedule = (app) => {
    setSelectedApp(app);
    const dt = new Date(app.appointment_date);
    setRescheduleDate(dt.toISOString().split('T')[0]);
    setRescheduleTime(
      `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
    );
    setRescheduleStylistId(app.hairdresser_id || '');
    setRescheduleSlots([]);
    setIsRescheduleOpen(true);
  };

  const fetchRescheduleSlots = async () => {
    if (!rescheduleStylistId || !rescheduleDate || !selectedApp) return;
    setRescheduleLoading(true);
    try {
      const totalDur =
        selectedApp.appointment_services?.reduce(
          (a, s) => a + (s.service?.duration_minutes || 0),
          0
        ) || 45;
      const res = await appointmentAPI.getAvailableSlots({
        hairdresser_id: rescheduleStylistId,
        target_date: rescheduleDate,
        duration_minutes: totalDur,
      });
      setRescheduleSlots(res.data);
    } catch {
      setRescheduleSlots([]);
    } finally {
      setRescheduleLoading(false);
    }
  };

  useEffect(() => {
    if (isRescheduleOpen) fetchRescheduleSlots();
  }, [rescheduleStylistId, rescheduleDate, isRescheduleOpen]);

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) {
      addToast('Vui lòng chọn ngày và giờ mới!', 'error');
      return;
    }
    try {
      await appointmentAPI.reschedule(selectedApp.id, {
        appointment_date: `${rescheduleDate}T${rescheduleTime}:00`,
        hairdresser_id: rescheduleStylistId || selectedApp.hairdresser_id,
      });
      addToast('Đổi lịch hẹn thành công!', 'success');
      setIsRescheduleOpen(false);
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Không thể đổi lịch hẹn!', 'error');
    }
  };

  // Checkout
  const openCheckout = (app) => {
    setSelectedApp(app);
    setCheckoutDiscount(0);
    setCheckoutPaymentMethod('CASH');
    setCheckoutFormula('');
    setCheckoutNotes('');
    setIsCheckoutOpen(true);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setCheckoutLoading(true);
    try {
      await invoiceAPI.create({
        appointment_id: selectedApp.id,
        discount_amount: parseFloat(checkoutDiscount) || 0,
        payment_method: checkoutPaymentMethod,
        formula_used: checkoutFormula || null,
        notes: checkoutNotes || null,
      });
      addToast('Thanh toán thành công! Hóa đơn đã được tạo.', 'success');
      setIsCheckoutOpen(false);
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Thanh toán thất bại!', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Fetch new booking slots
  useEffect(() => {
    if (!isNewBookingOpen || !newStylistId || !newDate || newServiceIds.length === 0) return;
    const fetchSlots = async () => {
      setNewSlotsLoading(true);
      try {
        const totalDur =
          services
            .filter((s) => newServiceIds.includes(s.id))
            .reduce((a, s) => a + s.duration_minutes, 0) || 45;
        const res = await appointmentAPI.getAvailableSlots({
          hairdresser_id: newStylistId,
          target_date: newDate,
          duration_minutes: totalDur,
        });
        setNewSlots(res.data);
        if (res.data.length > 0) setNewTime(res.data[0]);
      } catch {
        setNewSlots([]);
      } finally {
        setNewSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [newStylistId, newDate, newServiceIds, isNewBookingOpen]);

  const handleNewBooking = async (e) => {
    e.preventDefault();
    if (!newCustId || !newStylistId || !newServiceIds.length) {
      addToast('Vui lòng chọn đầy đủ khách hàng, thợ và dịch vụ!', 'error');
      return;
    }
    try {
      await appointmentAPI.adminCreate({
        customer_id: parseInt(newCustId),
        hairdresser_id: parseInt(newStylistId),
        appointment_date: `${newDate}T${newTime}:00`,
        service_ids: newServiceIds,
        notes: newNotes || null,
      });
      addToast('Tạo lịch hẹn thành công!', 'success');
      setIsNewBookingOpen(false);
      setNewCustId('');
      setNewStylistId('');
      setNewServiceIds([]);
      setNewNotes('');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Tạo lịch thất bại!', 'error');
    }
  };

  const statusOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'IN_PROGRESS', label: 'Đang phục vụ' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
  ];

  // Quick stats
  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;
  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const inProgressCount = appointments.filter((a) => a.status === 'IN_PROGRESS').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Page Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card-dark">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-glow-gold">
              <Calendar className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-serif-salon text-white">
              Quản Lý Đặt Lịch
            </h1>
          </div>
          <p className="text-sm text-slate-300 mt-2">
            Theo dõi, phân bổ ca làm việc và chuyển trạng thái lịch hẹn khách hàng
          </p>
        </div>

        {(isAdmin || isReceptionist) && (
          <button
            onClick={() => {
              setIsNewBookingOpen(true);
              setNewSlots([]);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-glow-gold shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Tạo Lịch Hẹn Mới</span>
          </button>
        )}
      </div>

      {/* Quick Status Pill Bar */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {statusOptions.map((opt) => {
          const isActive = filterStatus === opt.value;
          let count = appointments.length;
          if (opt.value === 'PENDING') count = pendingCount;
          else if (opt.value === 'CONFIRMED') count = confirmedCount;
          else if (opt.value === 'IN_PROGRESS') count = inProgressCount;
          else if (opt.value === 'COMPLETED') count = completedCount;
          else if (opt.value === 'CANCELLED') count = appointments.filter((a) => a.status === 'CANCELLED').length;

          return (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-glow-gold'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-black ${
                  isActive ? 'bg-slate-950/25 text-slate-950' : 'bg-slate-900 text-slate-300 border border-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-card-dark">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên khách, SĐT, thợ..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
            />
          </div>

          <select
            value={filterStylistId}
            onChange={(e) => setFilterStylistId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          >
            <option value="">Tất cả Stylist</option>
            {hairdressers.map((h) => (
              <option key={h.id} value={h.id}>
                Stylist: {h.full_name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFilterStatus('');
                setFilterStylistId('');
                setFilterDate('');
                setSearchText('');
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              Đặt Lại Lọc
            </button>
            <button
              onClick={fetchData}
              title="Tải lại danh sách"
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-card-dark">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-900/40">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Danh Sách Ca Làm ({filteredAppointments.length} lịch hẹn)
          </span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-700/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-16 text-center">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">
              Không tìm thấy lịch hẹn nào phù hợp bộ lọc.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 bg-slate-900/60 text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-6 font-bold">Khách Hàng</th>
                  <th className="py-3.5 px-4 font-bold">Stylist Phụ Trách</th>
                  <th className="py-3.5 px-4 font-bold">Thời Gian Hẹn</th>
                  <th className="py-3.5 px-4 font-bold">Dịch Vụ Đã Chọn</th>
                  <th className="py-3.5 px-4 font-bold">Tạm Tính</th>
                  <th className="py-3.5 px-4 font-bold text-center">Trạng Thái</th>
                  <th className="py-3.5 px-6 font-bold text-right">Chuyển Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/70">
                {filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-700/40 transition-colors">
                    {/* Customer */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                          {(app.customer?.full_name || 'K').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {app.customer?.full_name || 'Khách vãng lai'}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {app.customer?.phone || '—'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Stylist */}
                    <td className="py-4 px-4 font-semibold text-amber-300">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-amber-400" />
                        <span>{app.hairdresser?.full_name || 'Chưa gán'}</span>
                      </div>
                    </td>

                    {/* Date Time */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-white font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {new Date(app.appointment_date).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(app.appointment_date).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    {/* Services */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                        {app.appointment_services?.map((as) => (
                          <span
                            key={as.id}
                            className="inline-block rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-200 border border-slate-700"
                          >
                            {as.service?.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Total Price */}
                    <td className="py-4 px-4 font-black text-amber-400 text-sm whitespace-nowrap">
                      {app.total_price?.toLocaleString('vi-VN')} đ
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 text-center">
                      <AppointmentBadge status={app.status} />
                    </td>

                    {/* Action buttons (Pending -> Confirmed -> In Progress -> Completed) */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {/* PENDING -> CONFIRMED */}
                        {app.status === 'PENDING' && (isAdmin || isReceptionist) && (
                          <button
                            onClick={() => handleUpdateStatus(app.id, 'CONFIRMED')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-sm"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Xác Nhận
                          </button>
                        )}

                        {/* CONFIRMED -> IN_PROGRESS */}
                        {app.status === 'CONFIRMED' && (isAdmin || isReceptionist) && (
                          <button
                            onClick={() => handleUpdateStatus(app.id, 'IN_PROGRESS')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            Bắt Đầu Làm
                          </button>
                        )}

                        {/* IN_PROGRESS or CONFIRMED -> CHECKOUT / COMPLETED */}
                        {(app.status === 'CONFIRMED' || app.status === 'IN_PROGRESS') &&
                          !app.has_invoice &&
                          (isAdmin || isReceptionist) && (
                            <button
                              onClick={() => openCheckout(app)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              Thanh Toán & Xong
                            </button>
                          )}

                        {/* RESCHEDULE */}
                        {(app.status === 'PENDING' || app.status === 'CONFIRMED') &&
                          (isAdmin || isReceptionist) && (
                            <button
                              onClick={() => openReschedule(app)}
                              title="Đổi lịch hẹn"
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                        {/* CANCEL */}
                        {app.status !== 'COMPLETED' &&
                          app.status !== 'CANCELLED' &&
                          (isAdmin || isReceptionist) && (
                            <button
                              onClick={() => handleCancel(app.id)}
                              title="Hủy lịch hẹn"
                              className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title="Đổi Lịch Hẹn Khách Hàng"
      >
        <form onSubmit={handleReschedule} className="space-y-4 text-sm">
          <div>
            <label className="block font-bold text-white mb-1.5">Chọn Stylist</label>
            <select
              value={rescheduleStylistId}
              onChange={(e) => setRescheduleStylistId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-amber-400"
            >
              {hairdressers.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-white mb-1.5">Chọn Ngày Mới</label>
            <input
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block font-bold text-white mb-1.5">Chọn Giờ Rảnh</label>
            {rescheduleLoading ? (
              <p className="text-slate-400">Đang kiểm tra khung giờ trống...</p>
            ) : rescheduleSlots.length === 0 ? (
              <p className="text-rose-400">Không có khung giờ rảnh trong ngày này.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {rescheduleSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setRescheduleTime(slot)}
                    className={`py-2 rounded-lg border text-center font-bold text-xs ${
                      rescheduleTime === slot
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-glow-gold'
                        : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsRescheduleOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 font-bold hover:bg-slate-700"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black hover:bg-amber-400 shadow-glow-gold"
            >
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </Modal>

      {/* Checkout / Invoice Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Thanh Toán & Xuất Hóa Đơn"
      >
        <form onSubmit={handleCheckout} className="space-y-4 text-sm">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Khách hàng:</span>
              <span className="font-bold text-white">{selectedApp?.customer?.full_name}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Stylist:</span>
              <span className="font-bold text-amber-300">{selectedApp?.hairdresser?.full_name}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Tổng tiền dịch vụ:</span>
              <span className="font-black text-amber-400 text-base">
                {selectedApp?.total_price?.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-white mb-1.5">Giảm Giá (VNĐ)</label>
            <input
              type="number"
              min="0"
              value={checkoutDiscount}
              onChange={(e) => setCheckoutDiscount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block font-bold text-white mb-1.5">Phương Thức Thanh Toán</label>
            <select
              value={checkoutPaymentMethod}
              onChange={(e) => setCheckoutPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-amber-400"
            >
              <option value="CASH">Tiền mặt (CASH)</option>
              <option value="BANK_TRANSFER">Chuyển khoản (BANK_TRANSFER)</option>
              <option value="CREDIT_CARD">Thẻ tín dụng (CREDIT_CARD)</option>
              <option value="MOMO">Ví MoMo</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-white mb-1.5">Công Thức Tóc / Ghi Chú Kỹ Thuật</label>
            <textarea
              rows={2}
              value={checkoutFormula}
              onChange={(e) => setCheckoutFormula(e.target.value)}
              placeholder="VD: Thuốc nhuộm 8.1 + Oxy 6%..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-700">
            <span className="font-bold text-white text-base">Số Tiền Cần Thu:</span>
            <span className="text-xl font-black text-emerald-400">
              {Math.max(0, (selectedApp?.total_price || 0) - (Number(checkoutDiscount) || 0)).toLocaleString(
                'vi-VN'
              )}{' '}
              đ
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 font-bold hover:bg-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={checkoutLoading}
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black hover:bg-amber-400 shadow-glow-gold disabled:opacity-50"
            >
              {checkoutLoading ? 'Đang xử lý...' : 'Xác Nhận Thanh Toán'}
            </button>
          </div>
        </form>
      </Modal>

      {/* New Booking Modal */}
      <Modal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        title="Tạo Lịch Hẹn Mới Tại Quầy"
      >
        <form onSubmit={handleNewBooking} className="space-y-4 text-sm">
          <div>
            <label className="block font-bold text-white mb-1.5">Khách Hàng</label>
            <select
              value={newCustId}
              onChange={(e) => setNewCustId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-amber-400"
            >
              <option value="">-- Chọn khách hàng --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-white mb-1.5">Stylist Phụ Trách</label>
            <select
              value={newStylistId}
              onChange={(e) => setNewStylistId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-amber-400"
            >
              <option value="">-- Chọn Stylist --</option>
              {hairdressers.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-white mb-1.5">Dịch Vụ Sử Dụng</label>
            <div className="max-h-40 overflow-y-auto border border-slate-700 bg-slate-900 rounded-xl p-2.5 space-y-1.5">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-3 cursor-pointer p-1.5 hover:bg-slate-800 rounded-lg">
                  <input
                    type="checkbox"
                    checked={newServiceIds.includes(s.id)}
                    onChange={() =>
                      setNewServiceIds((prev) =>
                        prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                      )
                    }
                    className="accent-amber-500 w-4 h-4"
                  />
                  <span className="flex-1 font-semibold text-slate-200">{s.name}</span>
                  <span className="text-amber-400 font-bold">{s.price.toLocaleString('vi-VN')} đ</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-white mb-1.5">Ngày Hẹn</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block font-bold text-white mb-1.5">Giờ Hẹn</label>
              {newSlotsLoading ? (
                <p className="text-slate-400 py-2">Đang tìm slot rảnh...</p>
              ) : newSlots.length === 0 ? (
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-amber-400"
                />
              ) : (
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-amber-400"
                >
                  {newSlots.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block font-bold text-white mb-1.5">Ghi Chú</label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Yêu cầu riêng của khách..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsNewBookingOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 font-bold hover:bg-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black hover:bg-amber-400 shadow-glow-gold"
            >
              Tạo Lịch Hẹn
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AppointmentsPage;
