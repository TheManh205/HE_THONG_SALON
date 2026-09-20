import React, { useState, useEffect } from 'react';
import { serviceAPI, hairdresserAPI, appointmentAPI, aiAPI } from '../services/endpoints';
import { useToast } from '../contexts/ToastContext';
import {
  Scissors, Sparkles, Calendar, Clock, User, Phone, Mail,
  CheckCircle2, AlertCircle, Star, ChevronRight, ChevronLeft,
  ArrowRight, Bot, MapPin, Shield, Zap
} from 'lucide-react';

const STEPS = ['Chọn Dịch Vụ', 'Chọn Stylist', 'Chọn Lịch', 'Xác Nhận'];

export const PublicBookingPage = () => {
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [hairdressers, setHairdressers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [selectedStylistId, setSelectedStylistId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerGender, setCustomerGender] = useState('Female');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [overlapWarning, setOverlapWarning] = useState(null);

  // AI Modal
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiHairCondition, setAiHairCondition] = useState('');
  const [aiDesiredStyle, setAiDesiredStyle] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    try {
      const [svcRes, stylRes] = await Promise.all([
        serviceAPI.getAll({ active_only: true }),
        hairdresserAPI.getAll({ active_only: true })
      ]);
      setServices(svcRes.data);
      setHairdressers(stylRes.data);
      setCategories(['Tất cả', ...new Set(svcRes.data.map(s => s.category))]);
      if (stylRes.data.length > 0) setSelectedStylistId(stylRes.data[0].id);
    } catch {
      addToast('Không thể tải dữ liệu salon. Vui lòng thử lại!', 'error');
    }
  };

  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((a, c) => a + c.duration_minutes, 0);
  const totalPrice = selectedServices.reduce((a, c) => a + c.price, 0);
  const selectedStylist = hairdressers.find(h => h.id === selectedStylistId);

  useEffect(() => {
    if (selectedStylistId && selectedDate && selectedServiceIds.length > 0) fetchSlots();
  }, [selectedStylistId, selectedDate, selectedServiceIds]);

  const fetchSlots = async () => {
    setSlotsLoading(true); setOverlapWarning(null);
    try {
      const res = await appointmentAPI.getAvailableSlots({
        hairdresser_id: selectedStylistId,
        target_date: selectedDate,
        duration_minutes: totalDuration || 45,
      });
      setAvailableSlots(res.data);
      if (res.data.length > 0 && (!selectedTimeSlot || !res.data.includes(selectedTimeSlot))) {
        setSelectedTimeSlot(res.data[0]);
      } else if (res.data.length === 0) {
        setSelectedTimeSlot('');
        setOverlapWarning('Thợ không có ca làm việc hoặc đã kín lịch vào ngày này. Vui lòng chọn ngày khác!');
      }
    } catch { setAvailableSlots([]); } 
    finally { setSlotsLoading(false); }
  };

  const toggleService = (id) => {
    setSelectedServiceIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleNextStep = () => {
    if (step === 1 && selectedServiceIds.length === 0) { addToast('Vui lòng chọn ít nhất một dịch vụ!', 'error'); return; }
    if (step === 2 && !selectedStylistId) { addToast('Vui lòng chọn Stylist!', 'error'); return; }
    if (step === 3 && !selectedTimeSlot) { addToast('Vui lòng chọn khung giờ hẹn!', 'error'); return; }
    setStep(s => s + 1);
  };

  const handleConsultAI = async (e) => {
    e.preventDefault(); setAiLoading(true);
    try {
      const res = await aiAPI.getRecommendations({
        customer_name: customerName || 'Quý khách',
        gender: customerGender,
        hair_condition: aiHairCondition || 'Tóc khô xơ, hư tổn nhẹ',
        desired_style: aiDesiredStyle || 'Kiểu tóc thời trang trẻ trung tôn dáng mặt',
      });
      setAiResult(res.data);
    } catch { addToast('Không thể kết nối AI. Vui lòng thử lại!', 'error'); }
    finally { setAiLoading(false); }
  };

  const handleApplyAI = (recItems) => {
    setSelectedServiceIds(recItems.map(r => r.service_id));
    setIsAIModalOpen(false);
    addToast('Đã áp dụng combo AI gợi ý!', 'success');
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      addToast('Vui lòng nhập Họ tên và Số điện thoại!', 'error'); return;
    }
    setIsSubmitting(true);
    try {
      const response = await appointmentAPI.publicBook({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || null,
        customer_gender: customerGender,
        hairdresser_id: selectedStylistId,
        appointment_date: `${selectedDate}T${selectedTimeSlot}:00`,
        service_ids: selectedServiceIds,
        notes: notes.trim() || null,
      });
      setBookingSuccess(response.data);
      addToast('Đặt lịch thành công! Salon sẽ liên hệ xác nhận.', 'success');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Lịch hẹn bị trùng hoặc ngoài ca làm việc!';
      setOverlapWarning(detail);
      addToast(detail, 'error');
    } finally { setIsSubmitting(false); }
  };

  // Success Screen
  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-soft-lg border border-slate-200 p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-serif-salon mb-2">Đặt Lịch Thành Công!</h2>
          <p className="text-slate-500 text-sm mb-6">Salon THEMANH sẽ liên hệ xác nhận sớm nhất qua số điện thoại của bạn.</p>
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-left space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Mã lịch hẹn</span>
              <span className="font-bold text-slate-800">#{bookingSuccess.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Khách hàng</span>
              <span className="font-bold text-slate-800">{bookingSuccess.customer?.full_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Thợ làm tóc</span>
              <span className="font-bold text-amber-700">{bookingSuccess.hairdresser?.full_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Thời gian</span>
              <span className="font-bold text-slate-800">{selectedDate} · {selectedTimeSlot}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-2">
              <span className="text-slate-600 font-bold">Tổng tiền ước tính</span>
              <span className="font-black text-amber-600 text-base">{totalPrice.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
          <button onClick={() => { setBookingSuccess(null); setStep(1); setSelectedServiceIds([]); setSelectedTimeSlot(''); }}
            className="w-full py-3 rounded-2xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors shadow-glow-gold">
            Đặt Lịch Mới
          </button>
        </div>
      </div>
    );
  }

  const inputCls = "w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100 transition-all";
  const labelCls = "block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider";

  const heroBackground = "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1400&q=80";
  const serviceCards = [
    { title: 'TẤY TÓC NAM & NỮ', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80' },
    { title: 'BỘC MÀU TÓC NAM & NỮ', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80' },
    { title: 'NHUỘM CHẤM CHÂN', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80' },
  ];

  const packageCards = [
    {
      title: 'Tóc ngắn',
      items: ['Gội dịch vụ vừa gói', 'Uốn chuyên sâu', 'Ép chuyên sâu', 'Nhuộm chuyên sâu'],
    },
    {
      title: 'Tóc dài',
      items: ['Gội dịch vụ vừa gói', 'Uốn chuyên sâu', 'Ép chuyên sâu', 'Nhuộm chuyên sâu'],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f1ea] text-slate-800">
      <header className="sticky top-0 z-40 border-b border-[#e9dcc9] bg-[#f9f4ee]/90 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#1f1f1f] bg-[#111827] shadow-[0_0_0_6px_#f7d28a]">
                <Scissors className="h-7 w-7 rotate-45 text-[#f5d88f]" />
              </div>
              <div className="leading-none">
                <div className="text-[22px] font-black tracking-tight text-slate-900">
                  LUMIÈRE <span className="text-[#c89b3c]">SALON</span>
                </div>
                <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Studio hair salon
                </div>
              </div>
            </div>

            <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-700 lg:flex">
              <a href="#" className="hover:text-amber-600">Trang chủ</a>
              <a href="#" className="hover:text-amber-600">Giới thiệu</a>
              <a href="#" className="hover:text-amber-600">Dịch vụ</a>
              <a href="#" className="hover:text-amber-600">Bảng giá dịch vụ</a>
              <a href="#" className="hover:text-amber-600">Blog</a>
              <a href="#" className="hover:text-amber-600">Liên hệ</a>
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="hidden rounded-xl border border-purple-200 bg-purple-100 px-3 py-2 text-xs font-bold text-purple-700 transition hover:bg-purple-200 sm:inline-flex"
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" /> AI
              </button>
              <button className="rounded-xl bg-[#f3c76b] px-5 py-2.5 text-sm font-bold text-[#1f1f1f] shadow-[0_8px_20px_rgba(243,199,107,0.35)] transition hover:bg-[#efb94b]">
                ĐẶT LỊCH
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[30px] border border-[#edd9b3] bg-[#e9e1d7] shadow-[0_18px_34px_rgba(69,52,30,0.08)]">
          <div
            className="h-[440px] w-full bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.32), rgba(0,0,0,0.12)), url(${heroBackground})` }}
          >
            <div className="flex h-full items-end justify-start p-8 sm:p-10 lg:p-12">
              <button className="inline-flex items-center gap-2 rounded-full border border-[#f0d68b] bg-[#f0d68b] px-6 py-3 text-base font-bold text-[#1f1f1f] shadow-[0_10px_25px_rgba(240,214,139,0.35)] transition hover:bg-[#e8c15b]">
                ĐẶT LỊCH GIỜ <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="mt-12 text-center">
          <h2 className="text-3xl font-black uppercase tracking-[0.08em] text-slate-800">DỊCH VỤ NỔI BẬT</h2>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-[#d1b57b]" />
            <div className="text-[#d1b57b]">✦ ✦ ✦</div>
            <span className="h-px w-12 bg-[#d1b57b]" />
          </div>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-slate-500">
            Với vai trò là chủ yếu gia tạo mẫu và chăm sóc, Aura Salon luôn mang đến những trải nghiệm làm đẹp đẳng cấp cho mọi khách hàng.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {serviceCards.map((service) => (
              <div
                key={service.title}
                className="group overflow-hidden rounded-[22px] border border-[#e8d7bb] bg-white shadow-[0_10px_25px_rgba(0,0,0,0.03)]"
              >
                <div
                  className="relative h-72 bg-cover bg-center transition duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${service.image})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="rounded-xl bg-black/45 px-4 py-3 text-center text-lg font-black uppercase tracking-wide text-white backdrop-blur-sm">
                      {service.title}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 text-center">
          <h2 className="text-3xl font-black uppercase tracking-[0.08em] text-slate-800">GÓI DỊCH VỤ ĐẶC BIỆT</h2>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-[#d1b57b]" />
            <div className="text-[#d1b57b]">✦ ✦ ✦</div>
            <span className="h-px w-12 bg-[#d1b57b]" />
          </div>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-slate-500">
            Hãy lựa chọn gói đặt biệt phù hợp với nhu cầu của bạn, mang lại sự thoải mái và phong cách riêng cho từng khách hàng.
          </p>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {packageCards.map((pkg, index) => (
              <div
                key={pkg.title}
                className="rounded-[28px] border border-[#e7d4b1] bg-[#fffaf3] p-6 text-left shadow-[0_10px_25px_rgba(0,0,0,0.04)]"
              >
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-[#1e293b]">{pkg.title}</h3>
                  <span className="rounded-full border border-[#d4b36d] bg-[#fff0cd] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5a00]">
                    {index === 0 ? 'Phổ biến' : 'Nổi bật'}
                  </span>
                </div>

                <ul className="space-y-3 text-sm text-slate-600">
                  {pkg.items.map((item) => (
                    <li key={item} className="flex items-center gap-3 border-b border-[#f0e1c7] pb-3 last:border-b-0 last:pb-0">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#d5a85e]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Booking salon</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">Đặt lịch trực tuyến</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsAIModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700"
            >
              <Sparkles className="h-4 w-4" /> Tư Vấn AI
            </button>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-200 -z-0" />
              <div className="absolute left-0 h-0.5 bg-amber-400 -z-0 transition-all duration-500" style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
              {STEPS.map((label, idx) => {
                const num = idx + 1;
                const done = step > num; const active = step === num;
                return (
                  <div key={label} className="flex flex-col items-center gap-1.5 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${done ? 'bg-amber-500 border-amber-500 text-white' : active ? 'bg-white border-amber-500 text-amber-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : num}
                    </div>
                    <span className={`hidden text-[10px] font-bold sm:block ${active ? 'text-amber-600' : done ? 'text-slate-600' : 'text-slate-400'}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {step === 1 && (
              <div className="p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Chọn Dịch Vụ</h2>
                  <p className="text-sm text-slate-500">Có thể chọn nhiều dịch vụ cùng lúc</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${selectedCategory === cat ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-600'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.filter((s) => selectedCategory === 'Tất cả' || s.category === selectedCategory).map((svc) => {
                    const sel = selectedServiceIds.includes(svc.id);
                    return (
                      <button
                        key={svc.id}
                        onClick={() => toggleService(svc.id)}
                        className={`rounded-2xl border-2 p-4 text-left transition-all ${sel ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`text-sm font-bold ${sel ? 'text-amber-800' : 'text-slate-800'}`}>{svc.name}</p>
                            <p className="mt-0.5 text-[11px] text-slate-400">{svc.category}</p>
                          </div>
                          <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${sel ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}>
                            {sel && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" /> {svc.duration_minutes} phút
                          </span>
                          <span className={`text-sm font-black ${sel ? 'text-amber-700' : 'text-slate-700'}`}>
                            {svc.price.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedServiceIds.length > 0 && (
                  <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="text-sm">
                      <span className="font-bold text-amber-800">{selectedServiceIds.length} dịch vụ</span>
                      <span className="ml-2 text-amber-600">· {totalDuration} phút</span>
                    </div>
                    <span className="text-lg font-black text-amber-700">{totalPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Chọn Stylist</h2>
                  <p className="text-sm text-slate-500">Chọn thợ làm tóc phù hợp với bạn</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {hairdressers.map((h) => {
                    const sel = selectedStylistId === h.id;
                    return (
                      <button
                        key={h.id}
                        onClick={() => setSelectedStylistId(h.id)}
                        className={`rounded-2xl border-2 p-4 text-left transition-all ${sel ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-lg font-black text-amber-700">
                            {h.full_name?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-bold ${sel ? 'text-amber-800' : 'text-slate-800'}`}>{h.full_name}</p>
                            <p className="truncate text-[11px] text-slate-400">{h.specialization || 'Tạo kiểu tóc đa năng'}</p>
                          </div>
                          {sel && <CheckCircle2 className="ml-auto h-5 w-5 text-amber-500" />}
                        </div>
                        {h.experience_years && (
                          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
                            <Star className="h-3 w-3 text-amber-400" fill="currentColor" /> {h.experience_years} năm kinh nghiệm
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Chọn Lịch Hẹn</h2>
                  <p className="text-sm text-slate-500">Chọn ngày và giờ phù hợp với bạn</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Ngày Hẹn</label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      onChange={(e) => { setSelectedDate(e.target.value); setSelectedTimeSlot(''); }}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Stylist</label>
                    <div className="rounded-xl border border-slate-200 bg-amber-50 px-3.5 py-3 text-sm font-bold text-amber-700">
                      {selectedStylist?.full_name}
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Khung Giờ Khả Dụng</label>
                  {slotsLoading ? (
                    <div className="grid grid-cols-4 gap-2">
                      {[...Array(8)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />)}
                    </div>
                  ) : overlapWarning ? (
                    <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {overlapWarning}
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`rounded-xl border py-2.5 text-sm font-bold transition-all ${selectedTimeSlot === slot ? 'border-amber-400 bg-amber-500 text-white shadow-[0_8px_20px_rgba(245,158,11,0.25)]' : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700'}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                      Chưa có dữ liệu. Vui lòng chọn ngày và dịch vụ.
                    </div>
                  )}
                </div>
                {selectedTimeSlot && (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div className="text-sm">
                      <span className="font-bold text-emerald-800">Đã chọn: {selectedDate} lúc {selectedTimeSlot}</span>
                      <span className="ml-2 text-emerald-600">({totalDuration} phút)</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <form onSubmit={handleConfirmBooking} className="space-y-5 p-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Xác Nhận Thông Tin</h2>
                  <p className="text-sm text-slate-500">Nhập thông tin để salon liên hệ xác nhận lịch hẹn</p>
                </div>

                <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-700">Tóm Tắt Lịch Hẹn</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Thợ</span>
                    <span className="font-bold text-amber-700">{selectedStylist?.full_name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Thời gian</span>
                    <span className="font-bold text-slate-700">{selectedDate} · {selectedTimeSlot} ({totalDuration} phút)</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedServices.map((s) => (
                      <span key={s.id} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">{s.name}</span>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-sm">
                    <span className="font-bold text-slate-600">Tổng ước tính:</span>
                    <span className="text-base font-black text-amber-700">{totalPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Họ Và Tên *</label>
                    <input type="text" required placeholder="Nguyễn Văn A" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Số Điện Thoại *</label>
                    <input type="tel" required placeholder="0901 234 567" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email (Tùy Chọn)</label>
                    <input type="email" placeholder="email@example.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Giới Tính</label>
                    <select value={customerGender} onChange={(e) => setCustomerGender(e.target.value)} className={inputCls}>
                      <option value="Female">Nữ</option>
                      <option value="Male">Nam</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Ghi Chú Yêu Cầu</label>
                  <textarea rows={2} placeholder="Yêu cầu đặc biệt, dị ứng hóa chất..." value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
                </div>
                {overlapWarning && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {overlapWarning}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-3.5 text-base font-bold text-white shadow-[0_10px_20px_rgba(245,158,11,0.25)] transition hover:from-amber-600 hover:to-amber-500 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      Xác Nhận Đặt Lịch <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <button
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 1}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" /> Quay Lại
              </button>
              <span className="text-xs font-medium text-slate-400">Bước {step} / {STEPS.length}</span>
              {step < 4 && (
                <button
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white shadow-[0_10px_20px_rgba(245,158,11,0.25)] transition hover:bg-amber-600"
                >
                  Tiếp Theo <ChevronRight className="h-4 w-4" />
                </button>
              )}
              {step === 4 && <div className="w-24" />}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Shield, text: 'Bảo Mật Thông Tin', sub: '100% an toàn' },
              { icon: Zap, text: 'Xác Nhận Nhanh', sub: 'Trong 15 phút' },
              { icon: MapPin, text: 'LUMIÈRE SALON', sub: 'Salon chuyên nghiệp' },
            ].map((item) => (
              <div key={item.text} className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                <item.icon className="mx-auto mb-1.5 h-5 w-5 text-amber-500" />
                <p className="text-[11px] font-bold text-slate-700">{item.text}</p>
                <p className="text-[10px] text-slate-400">{item.sub}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {isAIModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-soft-lg">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Trợ Lý AI Gemini</h3>
                  <p className="text-xs text-slate-400">Tư vấn kiểu tóc & dịch vụ phù hợp</p>
                </div>
              </div>
              <button onClick={() => setIsAIModalOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
            </div>

            {!aiResult ? (
              <form onSubmit={handleConsultAI} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Tình Trạng Tóc Hiện Tại</label>
                  <textarea rows={2} placeholder="Ví dụ: Tóc khô xơ, gãy rụng, đã tẩy 2 lần..." value={aiHairCondition} onChange={(e) => setAiHairCondition(e.target.value)} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 transition focus:border-purple-400 focus:bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Mong Muốn / Kiểu Tóc Yêu Thích</label>
                  <textarea rows={2} placeholder="Ví dụ: Muốn nhuộm màu sáng, tóc bồng bềnh nhẹ nhàng..." value={aiDesiredStyle} onChange={(e) => setAiDesiredStyle(e.target.value)} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 transition focus:border-purple-400 focus:bg-white focus:outline-none" />
                </div>
                <button type="submit" disabled={aiLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white transition hover:bg-purple-700 disabled:opacity-60">
                  {aiLoading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                      AI đang phân tích...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Nhận Tư Vấn AI
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
                  <p className="text-sm font-bold text-purple-800">Phân tích AI: {aiResult.analysis_summary}</p>
                </div>
                <div className="space-y-2">
                  {aiResult.recommended_combos?.slice(0, 1).map((combo, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-bold text-amber-800">{combo.combo_name}</p>
                        <p className="mt-0.5 text-xs text-amber-600">{combo.reasoning}</p>
                      </div>
                      <div className="space-y-1.5 p-3">
                        {combo.services?.map((s, j) => (
                          <div key={j} className="flex justify-between text-xs">
                            <span className="font-medium text-slate-700">{s.service_name}</span>
                            <span className="font-bold text-slate-800">{s.price?.toLocaleString('vi-VN')}đ</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                        <span className="text-sm font-black text-slate-700">{combo.total_price?.toLocaleString('vi-VN')}đ</span>
                        <button onClick={() => handleApplyAI(combo.services || [])} className="rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-600">
                          Áp Dụng Combo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setAiResult(null)} className="w-full rounded-xl border border-slate-200 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Hỏi Lại</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
