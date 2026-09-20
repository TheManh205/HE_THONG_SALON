import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  appointmentAPI, hairdresserAPI, serviceAPI, customerAPI, invoiceAPI
} from '../services/endpoints';
import { AppointmentBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Calendar, Clock, User, Scissors, CheckCircle, XCircle,
  PlayCircle, Receipt, RotateCcw, Search, Filter, Plus,
  AlertCircle, DollarSign, ChevronDown, RefreshCw, X
} from 'lucide-react';

export const AppointmentsPage = () => {
  const { user, role, isAdmin, isReceptionist } = useAuth();
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

  useEffect(() => { fetchData(); }, [filterStatus, filterStylistId, filterDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterStylistId) params.hairdresser_id = filterStylistId;
      if (filterDate) { params.start_date = filterDate; params.end_date = filterDate; }

      const [appRes, stylRes, svcRes, custRes] = await Promise.all([
        appointmentAPI.getAll(params),
        hairdresserAPI.getAll({ active_only: true }),
        serviceAPI.getAll({ active_only: true }),
        customerAPI.getAll()
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
  const filteredAppointments = appointments.filter(app => {
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
    if (!window.confirm('Bạn có chắc muốn hủy lịch hẹn này không?')) return;
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
    setRescheduleTime(`${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`);
    setRescheduleStylistId(app.hairdresser_id || '');
    setRescheduleSlots([]);
    setIsRescheduleOpen(true);
  };

  const fetchRescheduleSlots = async () => {
    if (!rescheduleStylistId || !rescheduleDate || !selectedApp) return;
    setRescheduleLoading(true);
    try {
      const totalDur = selectedApp.appointment_services?.reduce((a, s) => a + (s.service?.duration_minutes || 0), 0) || 45;
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

  useEffect(() => { if (isRescheduleOpen) fetchRescheduleSlots(); }, [rescheduleStylistId, rescheduleDate, isRescheduleOpen]);

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) {
      addToast('Vui lòng chọn ngày và giờ mới!', 'error'); return;
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
        const totalDur = services.filter(s => newServiceIds.includes(s.id)).reduce((a, s) => a + s.duration_minutes, 0) || 45;
        const res = await appointmentAPI.getAvailableSlots({ hairdresser_id: newStylistId, target_date: newDate, duration_minutes: totalDur });
        setNewSlots(res.data);
        if (res.data.length > 0) setNewTime(res.data[0]);
      } catch { setNewSlots([]); }
      finally { setNewSlotsLoading(false); }
    };
    fetchSlots();
  }, [newStylistId, newDate, newServiceIds, isNewBookingOpen]);

  const handleNewBooking = async (e) => {
    e.preventDefault();
    if (!newCustId || !newStylistId || !newServiceIds.length) {
      addToast('Vui lòng chọn đầy đủ khách hàng, thợ và dịch vụ!', 'error'); return;
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
      setNewCustId(''); setNewStylistId(''); setNewServiceIds([]); setNewNotes('');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Tạo lịch thất bại!', 'error');
    }
  };

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100 transition-all";
  const labelCls = "block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider";

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'IN_PROGRESS', label: 'Đang phục vụ' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-serif-salon">Quản Lý Lịch Hẹn</h1>
          <p className="text-sm text-slate-500 mt-0.5">Theo dõi, xác nhận và xử lý tất cả lịch hẹn tại salon</p>
        </div>
        {(isAdmin || isReceptionist) && (
          <button
            onClick={() => { setIsNewBookingOpen(true); setNewSlots([]); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-glow-gold transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Tạo Lịch Hẹn Mới
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên khách, SĐT, thợ..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100 transition-all"
            />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputCls}>
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filterStylistId} onChange={(e) => setFilterStylistId(e.target.value)} className={inputCls}>
            <option value="">Tất cả thợ làm tóc</option>
            {hairdressers.map(h => <option key={h.id} value={h.id}>{h.full_name}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className={inputCls} />
        </div>
        {(filterStatus || filterStylistId || filterDate || searchText) && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">Đang lọc:</span>
            <button onClick={() => { setFilterStatus(''); setFilterStylistId(''); setFilterDate(''); setSearchText(''); }}
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
              <X className="w-3 h-3" /> Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-700">
            {loading ? 'Đang tải...' : `${filteredAppointments.length} lịch hẹn`}
          </span>
          <button onClick={fetchData} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-xl" />)}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-16 text-center">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Không có lịch hẹn nào phù hợp.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Khách Hàng</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Thợ & Thời Gian</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Dịch Vụ</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Giá</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng Thái</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800 text-sm">{app.customer?.full_name || 'N/A'}</p>
                      <p className="text-xs text-slate-400 font-mono">{app.customer?.phone}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-amber-700 text-sm">{app.hairdresser?.full_name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(app.appointment_date).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {app.appointment_services?.map((as) => (
                          <span key={as.id} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                            {as.service?.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-700 text-sm">
                      {app.total_price?.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-4 py-4">
                      <AppointmentBadge status={app.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {app.status === 'PENDING' && (isAdmin || isReceptionist) && (
                          <button onClick={() => handleUpdateStatus(app.id, 'CONFIRMED')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" /> Xác Nhận
                          </button>
                        )}
                        {app.status === 'CONFIRMED' && (
                          <button onClick={() => handleUpdateStatus(app.id, 'IN_PROGRESS')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
                            <PlayCircle className="w-3.5 h-3.5" /> Tiếp Nhận
                          </button>
                        )}
                        {(app.status === 'CONFIRMED' || app.status === 'IN_PROGRESS') && !app.has_invoice && (isAdmin || isReceptionist) && (
                          <button onClick={() => openCheckout(app)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                            <Receipt className="w-3.5 h-3.5" /> Thanh Toán
                          </button>
                        )}
                        {(app.status === 'PENDING' || app.status === 'CONFIRMED') && (isAdmin || isReceptionist) && (
                          <button onClick={() => openReschedule(app)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" /> Đổi Lịch
                          </button>
                        )}
                        {app.status !== 'COMPLETED' && app.status !== 'CANCELLED' && (isAdmin || isReceptionist) && (
                          <button onClick={() => handleCancel(app.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors">
                            <XCircle className="w-3.5 h-3.5" /> Hủy
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
      <Modal isOpen={isRescheduleOpen} onClose={() => setIsRescheduleOpen(false)} title="Đổi Lịch Hẹn">
        <form onSubmit={handleReschedule} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 font-medium">
            Lịch hẹn #{selectedApp?.id} · {selectedApp?.customer?.full_name}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Ngày Mới</label>
              <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Thợ Làm Tóc</label>
              <select value={rescheduleStylistId} onChange={(e) => setRescheduleStylistId(e.target.value)} className={inputCls}>
                {hairdressers.map(h => <option key={h.id} value={h.id}>{h.full_name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Giờ Khả Dụng</label>
            {rescheduleLoading ? (
              <div className="grid grid-cols-4 gap-2">
                {[...Array(8)].map((_, i) => <div key={i} className="h-9 bg-slate-100 animate-pulse rounded-lg" />)}
              </div>
            ) : rescheduleSlots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {rescheduleSlots.map(slot => (
                  <button key={slot} type="button" onClick={() => setRescheduleTime(slot)}
                    className={`py-2 text-sm font-bold rounded-lg border transition-all ${rescheduleTime === slot ? 'bg-amber-500 text-white border-amber-400 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50'}`}>
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                Không có khung giờ trống. Vui lòng chọn ngày hoặc thợ khác.
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsRescheduleOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Hủy Bỏ</button>
            <button type="submit" disabled={!rescheduleTime} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 shadow-sm disabled:opacity-50">Xác Nhận Đổi Lịch</button>
          </div>
        </form>
      </Modal>

      {/* Checkout Modal */}
      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Thanh Toán Dịch Vụ">
        {selectedApp && (
          <form onSubmit={handleCheckout} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="font-bold text-slate-700 text-sm">Lịch hẹn #{selectedApp.id} · {selectedApp.customer?.full_name}</p>
              <div className="flex flex-wrap gap-1">
                {selectedApp.appointment_services?.map(as => (
                  <span key={as.id} className="text-xs px-2 py-0.5 bg-white rounded-full border border-slate-200 text-slate-600">
                    {as.service?.name} — {as.price_at_booking?.toLocaleString('vi-VN')}đ
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-bold text-slate-600">Tổng tiền dịch vụ:</span>
                <span className="text-lg font-black text-slate-800">{selectedApp.total_price?.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Giảm Giá (đ)</label>
                <input type="number" min="0" value={checkoutDiscount} onChange={(e) => setCheckoutDiscount(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phương Thức</label>
                <select value={checkoutPaymentMethod} onChange={(e) => setCheckoutPaymentMethod(e.target.value)} className={inputCls}>
                  <option value="CASH">Tiền mặt</option>
                  <option value="TRANSFER">Chuyển khoản</option>
                  <option value="CARD">Thẻ ngân hàng</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <span className="font-bold text-emerald-700">Thực Thanh Toán:</span>
              <span className="text-xl font-black text-emerald-700">
                {Math.max(0, (selectedApp.total_price || 0) - (parseFloat(checkoutDiscount) || 0)).toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div>
              <label className={labelCls}>Công Thức Kỹ Thuật</label>
              <input type="text" placeholder="Oxyhair 6%, màu nâu caramel..." value={checkoutFormula} onChange={(e) => setCheckoutFormula(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ghi Chú</label>
              <textarea rows={2} value={checkoutNotes} onChange={(e) => setCheckoutNotes(e.target.value)} className={inputCls} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsCheckoutOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Hủy Bỏ</button>
              <button type="submit" disabled={checkoutLoading} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 shadow-sm disabled:opacity-50">
                {checkoutLoading ? 'Đang xử lý...' : 'Xác Nhận Thanh Toán'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* New Booking Modal */}
      <Modal isOpen={isNewBookingOpen} onClose={() => setIsNewBookingOpen(false)} title="Tạo Lịch Hẹn Mới">
        <form onSubmit={handleNewBooking} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Khách Hàng</label>
              <select value={newCustId} onChange={(e) => setNewCustId(e.target.value)} className={inputCls} required>
                <option value="">-- Chọn khách hàng --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Thợ Làm Tóc</label>
              <select value={newStylistId} onChange={(e) => setNewStylistId(e.target.value)} className={inputCls} required>
                <option value="">-- Chọn thợ --</option>
                {hairdressers.map(h => <option key={h.id} value={h.id}>{h.full_name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Dịch Vụ</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {services.map(svc => (
                <label key={svc.id} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${newServiceIds.includes(svc.id) ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-200'}`}>
                  <input type="checkbox" checked={newServiceIds.includes(svc.id)}
                    onChange={() => setNewServiceIds(prev => prev.includes(svc.id) ? prev.filter(id => id !== svc.id) : [...prev, svc.id])}
                    className="rounded" />
                  <span className="truncate">{svc.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Ngày Hẹn</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Giờ Khả Dụng</label>
              {newSlotsLoading ? <div className="h-10 bg-slate-100 animate-pulse rounded-xl" /> : newSlots.length > 0 ? (
                <select value={newTime} onChange={(e) => setNewTime(e.target.value)} className={inputCls}>
                  {newSlots.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className={inputCls} required />
              )}
            </div>
          </div>
          <div>
            <label className={labelCls}>Ghi Chú</label>
            <textarea rows={2} value={newNotes} onChange={(e) => setNewNotes(e.target.value)} className={inputCls} placeholder="Yêu cầu đặc biệt của khách..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsNewBookingOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Hủy Bỏ</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 shadow-sm">Tạo Lịch Hẹn</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
