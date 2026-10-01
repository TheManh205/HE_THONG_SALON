import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  serviceAPI,
  hairdresserAPI,
  appointmentAPI,
} from '../services/endpoints';
import { useToast } from '../contexts/ToastContext';
import { AppointmentBadge } from '../components/common/Badge';
import {
  Scissors,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Star,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Shield,
  History,
  ArrowRight,
  Check,
  Award,
  HeartHandshake
} from 'lucide-react';

const formatCurrency = (val) => {
  if (!val && val !== 0) return '0 đ';
  return `${Number(val).toLocaleString('vi-VN')} đ`;
};

export const PublicBookingPage = () => {
  const { addToast } = useToast();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('booking'); // 'booking' | 'my-bookings'

  // Data
  const [services, setServices] = useState([]);
  const [hairdressers, setHairdressers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [loading, setLoading] = useState(true);

  // 3-Step Booking Flow State
  const [step, setStep] = useState(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [selectedStylistId, setSelectedStylistId] = useState(null);

  // Tomorrow as default date
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Customer form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerGender, setCustomerGender] = useState('Nữ');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // My Bookings lookup state
  const [lookupPhone, setLookupPhone] = useState('');
  const [myBookings, setMyBookings] = useState([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);

  const bookingSectionRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [svcRes, stylRes] = await Promise.all([
        serviceAPI.getAll({ active_only: true }),
        hairdresserAPI.getAll({ active_only: true }),
      ]);
      setServices(svcRes.data);
      setHairdressers(stylRes.data);
      setCategories(['Tất cả', ...new Set(svcRes.data.map((s) => s.category))]);
      if (stylRes.data.length > 0) {
        setSelectedStylistId(stylRes.data[0].id);
      }
    } catch (err) {
      addToast('Không thể tải dữ liệu salon. Vui lòng tải lại trang!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((a, c) => a + c.duration_minutes, 0);
  const totalPrice = selectedServices.reduce((a, c) => a + c.price, 0);
  const selectedStylist = hairdressers.find((h) => h.id === selectedStylistId);

  // Fetch available slots when stylist, date or duration changes
  useEffect(() => {
    if (selectedStylistId && selectedDate && selectedServiceIds.length > 0) {
      fetchSlots();
    }
  }, [selectedStylistId, selectedDate, selectedServiceIds]);

  const fetchSlots = async () => {
    setSlotsLoading(true);
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
      }
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const toggleService = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectServiceAndScroll = (id) => {
    if (!selectedServiceIds.includes(id)) {
      setSelectedServiceIds((prev) => [...prev, id]);
    }
    setActiveTab('booking');
    setStep(1);
    bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToBooking = () => {
    setActiveTab('booking');
    bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Step 1 Validation
  const handleProceedToStep2 = () => {
    if (selectedServiceIds.length === 0) {
      addToast('Vui lòng chọn ít nhất 1 dịch vụ để tiếp tục!', 'warning');
      return;
    }
    setStep(2);
    bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Step 2 Validation
  const handleProceedToStep3 = () => {
    if (!selectedStylistId) {
      addToast('Vui lòng chọn thợ tóc (Stylist)!', 'warning');
      return;
    }
    if (!selectedTimeSlot) {
      addToast('Vui lòng chọn khung giờ hẹn còn rảnh!', 'warning');
      return;
    }
    setStep(3);
    bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Step 3: Confirm Booking
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      addToast('Vui lòng điền họ tên và số điện thoại!', 'warning');
      return;
    }
    if (!selectedTimeSlot) {
      addToast('Khung giờ hẹn không hợp lệ, vui lòng chọn lại!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || null,
        customer_gender: customerGender,
        hairdresser_id: selectedStylistId,
        appointment_date: `${selectedDate}T${selectedTimeSlot}:00`,
        service_ids: selectedServiceIds,
        notes: notes.trim() || null,
      };

      const res = await appointmentAPI.publicBook(payload);
      setBookingSuccess(res.data);
      addToast('Đặt lịch hẹn thành công!', 'success');
      setSelectedServiceIds([]);
      setNotes('');
      bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.detail || 'Đặt lịch thất bại, vui lòng thử lại!', 'error');
      if (err.response?.status === 409) {
        fetchSlots();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // My Bookings Lookup
  const handleLookupBookings = async (e) => {
    e.preventDefault();
    if (!lookupPhone.trim()) {
      addToast('Vui lòng nhập số điện thoại để tra cứu!', 'warning');
      return;
    }
    setIsLookingUp(true);
    setLookupDone(false);
    try {
      const res = await appointmentAPI.getMyBookings(lookupPhone.trim());
      setMyBookings(res.data);
      setLookupDone(true);
      if (res.data.length === 0) {
        addToast('Không tìm thấy lịch hẹn nào với số điện thoại này', 'info');
      }
    } catch (err) {
      addToast('Lỗi khi tra cứu lịch hẹn. Vui lòng kiểm tra lại!', 'error');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này không?')) return;
    try {
      await appointmentAPI.publicCancel(id, lookupPhone.trim());
      addToast('Đã hủy lịch hẹn thành công.', 'success');
      const res = await appointmentAPI.getMyBookings(lookupPhone.trim());
      setMyBookings(res.data);
    } catch (err) {
      addToast(err.response?.data?.detail || 'Không thể hủy lịch hẹn!', 'error');
    }
  };

  const filteredServices = services.filter((s) => {
    if (selectedCategory === 'Tất cả') return true;
    return s.category === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 1. Header & Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link to="/booking" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-glow-gold">
              <Scissors className="w-6 h-6 rotate-45" />
            </div>
            <div>
              <span className="block text-xl sm:text-2xl font-black tracking-wider text-white font-serif-salon">
                THEMANH SALON
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
                Haute Coiffure & Spa
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold uppercase tracking-wider text-slate-300">
            <a href="#services-section" className="hover:text-amber-400 transition-colors">
              Dịch Vụ Nổi Bật
            </a>
            <button
              onClick={() => {
                setActiveTab('booking');
                scrollToBooking();
              }}
              className={`hover:text-amber-400 transition-colors ${
                activeTab === 'booking' ? 'text-amber-400 underline underline-offset-8' : ''
              }`}
            >
              Đặt Lịch Online
            </button>
            <button
              onClick={() => {
                setActiveTab('my-bookings');
                bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`hover:text-amber-400 transition-colors ${
                activeTab === 'my-bookings' ? 'text-amber-400 underline underline-offset-8' : ''
              }`}
            >
              Tra Cứu Lịch Hẹn
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={scrollToBooking}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider hover:bg-amber-400 transition-all shadow-glow-gold"
            >
              <Calendar className="w-4 h-4" />
              <span>Đặt Lịch Ngay</span>
            </button>
            <Link
              to="/login"
              className="p-2.5 rounded-full border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Đăng nhập quản trị viên"
            >
              <User className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Banner */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-20 lg:py-28 border-b border-slate-800">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black tracking-widest uppercase backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Trải Nghiệm Làm Đẹp Đẳng Cấp Thượng Lưu</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-serif-salon tracking-tight leading-[1.15] text-white">
              Kiến Tạo Phong Cách <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200">
                Tự Tin Tỏa Sáng
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-2xl">
              Chào mừng bạn đến với THEMANH SALON. Nơi hội tụ các chuyên gia tạo mẫu tóc hàng đầu,
              quy trình chuẩn 5 sao, sản phẩm thảo dược hữu cơ cao cấp và không gian thư giãn tuyệt đối.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={scrollToBooking}
                className="px-8 py-3.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center gap-2 shadow-glow-gold"
              >
                <span>Đặt Lịch Làm Tóc (3 Bước)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('my-bookings');
                  bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 rounded-full border border-slate-700 bg-slate-900/80 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <History className="w-4 h-4 text-amber-400" />
                <span>Tra Cứu Lịch Hẹn Của Tôi</span>
              </button>
            </div>

            {/* Quick 3 guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-white">Stylist Master</h4>
                  <p className="text-xs text-slate-400">Đào tạo chuẩn quốc tế</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-white">100% Chính Hãng</h4>
                  <p className="text-xs text-slate-400">Mỹ phẩm Organic cao cấp</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-white">Bảo Hành Kiểu Tóc</h4>
                  <p className="text-xs text-slate-400">Chăm sóc tận tâm 7 ngày</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Services Catalog */}
      <section id="services-section" className="py-20 max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Menu Dịch Vụ Đỉnh Cao</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black font-serif-salon text-white">
            Dịch Vụ Nổi Bật & Bảng Giá
          </h2>
          <p className="text-sm text-slate-300">
            Chọn dịch vụ bạn yêu thích để trải nghiệm quy trình chăm sóc tóc chuyên sâu từ các Stylist tài năng
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center justify-center gap-2.5 flex-wrap mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-black shadow-glow-gold'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((svc) => {
            const isSelected = selectedServiceIds.includes(svc.id);
            return (
              <div
                key={svc.id}
                className={`bg-slate-800 border rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-card-dark ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-500/40 bg-slate-800/90 shadow-glow-gold'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 px-3 py-1 rounded-md border border-amber-500/30">
                      {svc.category}
                    </span>
                    <span className="text-xs text-slate-300 flex items-center gap-1.5 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> {svc.duration_minutes} phút
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{svc.name}</h3>
                  <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                    {svc.description || 'Dịch vụ tạo mẫu tóc cao cấp sử dụng sản phẩm thảo dược tiêu chuẩn châu Âu.'}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-700 mt-6 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] text-slate-400 uppercase font-bold">Giá trọn gói</span>
                    <span className="text-xl font-black text-amber-400">
                      {formatCurrency(svc.price)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSelectServiceAndScroll(svc.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-glow-gold'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Đã Chọn</span>
                      </>
                    ) : (
                      <>
                        <span>Chọn Đặt Lịch</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Booking Section or My Bookings Section */}
      <section
        ref={bookingSectionRef}
        className="py-16 bg-slate-950 border-t border-slate-800 scroll-mt-20"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {/* Section Switcher Tabs */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex rounded-full bg-slate-900 p-1.5 border border-slate-700 shadow-card-dark">
              <button
                onClick={() => {
                  setActiveTab('booking');
                  setBookingSuccess(null);
                }}
                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'booking'
                    ? 'bg-amber-500 text-slate-950 shadow-glow-gold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Đặt Lịch Hẹn (3 Bước)</span>
              </button>

              <button
                onClick={() => setActiveTab('my-bookings')}
                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'my-bookings'
                    ? 'bg-amber-500 text-slate-950 shadow-glow-gold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Tra Cứu Lịch Hẹn Của Tôi</span>
              </button>
            </div>
          </div>

          {/* TAB 1: 3-STEP BOOKING FLOW */}
          {activeTab === 'booking' && (
            <div>
              {/* Success View */}
              {bookingSuccess ? (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 shadow-card-dark animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                      Đặt Lịch Thành Công!
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white font-serif-salon mt-1">
                      Cảm Ơn Quý Khách Đã Đặt Hẹn
                    </h3>
                    <p className="text-sm text-slate-300 mt-2">
                      Mã lịch hẹn của bạn là <span className="font-bold text-amber-400 font-mono text-base">#{bookingSuccess.booking_code}</span>.
                      Salon đã gửi thông báo đến Stylist và sẽ liên hệ hỗ trợ bạn sớm nhất!
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-left space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Khách hàng:</span>
                      <span className="font-bold text-white">{bookingSuccess.customer?.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Số điện thoại:</span>
                      <span className="font-bold font-mono text-white">{bookingSuccess.customer?.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Stylist:</span>
                      <span className="font-bold text-amber-300">{bookingSuccess.hairdresser?.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Thời gian hẹn:</span>
                      <span className="font-bold text-emerald-400">
                        {new Date(bookingSuccess.appointment_date).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-2.5">
                      <span className="text-slate-400">Tổng chi phí dự kiến:</span>
                      <span className="font-black text-base text-amber-400">
                        {formatCurrency(bookingSuccess.total_price)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => {
                        setBookingSuccess(null);
                        setStep(1);
                        setSelectedServiceIds([]);
                      }}
                      className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-900 font-bold text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                    >
                      Đặt Thêm Lịch Mới
                    </button>
                    <button
                      onClick={() => {
                        setLookupPhone(bookingSuccess.customer?.phone || '');
                        setActiveTab('my-bookings');
                        handleLookupBookings({ preventDefault: () => {} });
                      }}
                      className="flex-1 py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-sm hover:bg-amber-400 transition-all shadow-glow-gold"
                    >
                      Xem Lịch Sử Của Tôi →
                    </button>
                  </div>
                </div>
              ) : (
                /* Stepper Form */
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-10 shadow-card-dark">
                  {/* Stepper Header (3 Steps) */}
                  <div className="max-w-2xl mx-auto mb-10">
                    <div className="flex items-center justify-between relative">
                      {/* Connecting Line */}
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-700 -translate-y-1/2 z-0" />
                      <div
                        className="absolute top-1/2 left-0 h-0.5 bg-amber-500 -translate-y-1/2 z-0 transition-all duration-300"
                        style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                      />

                      {/* Step 1 */}
                      <button
                        onClick={() => setStep(1)}
                        className="relative z-10 flex flex-col items-center gap-2 focus:outline-none"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-colors ${
                            step >= 1 ? 'bg-amber-500 text-slate-950 shadow-glow-gold' : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          1
                        </div>
                        <span
                          className={`text-xs font-black uppercase tracking-wider ${
                            step === 1 ? 'text-amber-400' : 'text-slate-400'
                          }`}
                        >
                          Chọn Dịch Vụ
                        </span>
                      </button>

                      {/* Step 2 */}
                      <button
                        onClick={() => selectedServiceIds.length > 0 && setStep(2)}
                        disabled={selectedServiceIds.length === 0}
                        className="relative z-10 flex flex-col items-center gap-2 focus:outline-none disabled:opacity-40"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-colors ${
                            step >= 2 ? 'bg-amber-500 text-slate-950 shadow-glow-gold' : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          2
                        </div>
                        <span
                          className={`text-xs font-black uppercase tracking-wider ${
                            step === 2 ? 'text-amber-400' : 'text-slate-400'
                          }`}
                        >
                          Thợ & Khung Giờ
                        </span>
                      </button>

                      {/* Step 3 */}
                      <button
                        onClick={() => selectedTimeSlot && setStep(3)}
                        disabled={!selectedTimeSlot}
                        className="relative z-10 flex flex-col items-center gap-2 focus:outline-none disabled:opacity-40"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-colors ${
                            step === 3 ? 'bg-amber-500 text-slate-950 shadow-glow-gold' : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          3
                        </div>
                        <span
                          className={`text-xs font-black uppercase tracking-wider ${
                            step === 3 ? 'text-amber-400' : 'text-slate-400'
                          }`}
                        >
                          Xác Nhận & Đặt
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* STEP 1: CHỌN DỊCH VỤ (MULTI-SELECT) */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="border-b border-slate-700 pb-4">
                        <h3 className="text-xl sm:text-2xl font-bold text-white font-serif-salon">
                          Bước 1: Chọn Các Dịch Vụ Muốn Làm
                        </h3>
                        <p className="text-sm text-slate-300 mt-1">
                          Bạn có thể chọn 1 hoặc nhiều dịch vụ cùng lúc. Hệ thống sẽ tự động tính tổng thời lượng và giá tiền.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.map((svc) => {
                          const isSelected = selectedServiceIds.includes(svc.id);
                          return (
                            <div
                              key={svc.id}
                              onClick={() => toggleService(svc.id)}
                              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                                isSelected
                                  ? 'border-amber-400 bg-slate-900 ring-2 ring-amber-500/30 shadow-glow-gold'
                                  : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 ${
                                    isSelected
                                      ? 'bg-amber-500 border-amber-400 text-slate-950'
                                      : 'border-slate-600 bg-slate-800'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                                <div>
                                  <h4 className="text-base font-bold text-white">{svc.name}</h4>
                                  <span className="text-xs text-slate-400 block mt-0.5 font-medium">
                                    {svc.category} • {svc.duration_minutes} phút
                                  </span>
                                </div>
                              </div>
                              <span className="font-black text-sm text-amber-400 whitespace-nowrap">
                                {formatCurrency(svc.price)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Step 1 Bottom Cart / Action */}
                      <div className="pt-6 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                          <div className="text-xs text-slate-400">
                            Đã chọn: <span className="font-bold text-white">{selectedServiceIds.length} dịch vụ</span>
                            {' • '}Thời gian dự kiến: <span className="font-bold text-white">{totalDuration} phút</span>
                          </div>
                          <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
                            Tạm tính: {formatCurrency(totalPrice)}
                          </div>
                        </div>

                        <button
                          onClick={handleProceedToStep2}
                          disabled={selectedServiceIds.length === 0}
                          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-glow-gold"
                        >
                          <span>Tiếp Tục: Chọn Thợ & Giờ</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: CHỌN STYLIST & KHUNG GIỜ RẢNH */}
                  {step === 2 && (
                    <div className="space-y-8">
                      <div className="border-b border-slate-700 pb-4">
                        <h3 className="text-xl sm:text-2xl font-bold text-white font-serif-salon">
                          Bước 2: Chọn Thợ Tóc (Stylist) & Khung Giờ Rảnh
                        </h3>
                        <p className="text-sm text-slate-300 mt-1">
                          Các khung giờ hiển thị bên dưới đã được tính toán trống và đủ cho thời lượng {totalDuration} phút của bạn.
                        </p>
                      </div>

                      {/* 1. Pick Stylist */}
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-3">
                          1. Chọn Thợ Làm Tóc (Stylist)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                          {hairdressers.map((stylist) => {
                            const isChosen = selectedStylistId === stylist.id;
                            return (
                              <div
                                key={stylist.id}
                                onClick={() => setSelectedStylistId(stylist.id)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                                  isChosen
                                    ? 'border-amber-400 bg-slate-900 ring-2 ring-amber-500/30 shadow-glow-gold'
                                    : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                                }`}
                              >
                                <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                                  {stylist.full_name.slice(0, 1)}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-white truncate">
                                    {stylist.full_name}
                                  </h4>
                                  <div className="flex items-center gap-1 text-xs text-amber-400 font-bold mt-0.5">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span>{stylist.rating ? Number(stylist.rating).toFixed(1) : '5.0'}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Pick Date & Time Slots */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-700">
                        {/* Date Picker */}
                        <div className="space-y-3">
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                            2. Chọn Ngày Hẹn
                          </label>
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                          />
                          <p className="text-xs text-slate-400">
                            Salon mở cửa từ 08:30 đến 20:30 hàng ngày.
                          </p>
                        </div>

                        {/* Slots Grid */}
                        <div className="lg:col-span-2 space-y-3">
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                            3. Chọn Khung Giờ Còn Rảnh ({selectedStylist?.full_name})
                          </label>

                          {slotsLoading ? (
                            <div className="p-8 text-center text-sm text-slate-400">
                              Đang kiểm tra lịch rảnh của Stylist...
                            </div>
                          ) : availableSlots.length === 0 ? (
                            <div className="p-6 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm">
                              <AlertCircle className="w-4 h-4 inline mr-2 text-amber-400" />
                              Stylist này không có ca làm việc hoặc đã kín lịch vào ngày đã chọn. Quý khách vui lòng chọn ngày khác hoặc chọn Stylist khác!
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                              {availableSlots.map((slot) => {
                                const isPicked = selectedTimeSlot === slot;
                                return (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setSelectedTimeSlot(slot)}
                                    className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                                      isPicked
                                        ? 'bg-amber-500 text-slate-950 shadow-glow-gold'
                                        : 'bg-slate-900 border border-slate-700 text-slate-200 hover:border-amber-400'
                                    }`}
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 2 Bottom Navigation */}
                      <div className="pt-6 border-t border-slate-700 flex items-center justify-between">
                        <button
                          onClick={() => setStep(1)}
                          className="px-6 py-3 rounded-full border border-slate-700 bg-slate-900 font-bold text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-1.5"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Quay Lại Bước 1</span>
                        </button>

                        <button
                          onClick={handleProceedToStep3}
                          disabled={!selectedTimeSlot}
                          className="px-8 py-3.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 disabled:opacity-40 transition-all flex items-center gap-2 shadow-glow-gold"
                        >
                          <span>Tiếp Tục: Điền Thông Tin</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: ĐIỀN THÔNG TIN & XÁC NHẬN */}
                  {step === 3 && (
                    <form onSubmit={handleConfirmBooking} className="space-y-8">
                      <div className="border-b border-slate-700 pb-4">
                        <h3 className="text-xl sm:text-2xl font-bold text-white font-serif-salon">
                          Bước 3: Thông Tin Liên Hệ & Xác Nhận Lịch Hẹn
                        </h3>
                        <p className="text-sm text-slate-300 mt-1">
                          Vui lòng kiểm tra lại thông tin và xác nhận. Salon sẽ liên hệ qua điện thoại trước giờ hẹn.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form Inputs (Left) */}
                        <div className="lg:col-span-2 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                Họ và Tên <span className="text-rose-400">*</span>
                              </label>
                              <div className="relative">
                                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  required
                                  placeholder="VD: Nguyễn Văn Anh"
                                  value={customerName}
                                  onChange={(e) => setCustomerName(e.target.value)}
                                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-700 bg-slate-900 text-sm font-medium text-white focus:outline-none focus:border-amber-400"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                Số Điện Thoại <span className="text-rose-400">*</span>
                              </label>
                              <div className="relative">
                                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="tel"
                                  required
                                  placeholder="VD: 0987654321"
                                  value={customerPhone}
                                  onChange={(e) => setCustomerPhone(e.target.value)}
                                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-700 bg-slate-900 text-sm font-medium text-white focus:outline-none focus:border-amber-400"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                Email (Nhận thông báo)
                              </label>
                              <div className="relative">
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="email"
                                  placeholder="VD: email@example.com"
                                  value={customerEmail}
                                  onChange={(e) => setCustomerEmail(e.target.value)}
                                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-700 bg-slate-900 text-sm font-medium text-white focus:outline-none focus:border-amber-400"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                Giới Tính
                              </label>
                              <select
                                value={customerGender}
                                onChange={(e) => setCustomerGender(e.target.value)}
                                className="w-full px-3.5 py-3 rounded-xl border border-slate-700 bg-slate-900 text-sm font-medium text-white focus:outline-none focus:border-amber-400"
                              >
                                <option value="Nữ">Nữ</option>
                                <option value="Nam">Nam</option>
                                <option value="Khác">Khác</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                              Yêu Cầu Riêng / Tình Trạng Tóc
                            </label>
                            <textarea
                              rows={3}
                              placeholder="VD: Tóc tôi vừa nhuộm cần phục hồi, thích kiểu uốn layer nhẹ..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="w-full px-3.5 py-3 rounded-xl border border-slate-700 bg-slate-900 text-sm font-medium text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        {/* Summary Receipt Box (Right) */}
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-card-dark">
                          <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
                            Phiếu Xác Nhận Lịch Hẹn
                          </h4>

                          <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Stylist:</span>
                              <span className="font-bold text-amber-300">{selectedStylist?.full_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Ngày hẹn:</span>
                              <span className="font-bold text-white">{selectedDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Khung giờ:</span>
                              <span className="font-bold text-emerald-400">{selectedTimeSlot}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Tổng thời gian:</span>
                              <span className="font-bold text-white">{totalDuration} phút</span>
                            </div>
                          </div>

                          <div className="border-t border-slate-800 pt-3">
                            <span className="block text-xs font-bold uppercase text-slate-400 mb-2">
                              Dịch vụ đã chọn:
                            </span>
                            <div className="space-y-2 max-h-36 overflow-y-auto">
                              {selectedServices.map((s) => (
                                <div key={s.id} className="flex justify-between text-xs">
                                  <span className="truncate pr-2 text-slate-200">{s.name}</span>
                                  <span className="font-bold text-amber-400 whitespace-nowrap">
                                    {formatCurrency(s.price)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                            <span className="text-sm font-black uppercase text-white">
                              Tổng Thanh Toán:
                            </span>
                            <span className="text-xl font-black text-amber-400">
                              {formatCurrency(totalPrice)}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-tight">
                            * Quý khách thanh toán trực tiếp tại quầy Salon sau khi hoàn tất dịch vụ.
                          </p>
                        </div>
                      </div>

                      {/* Step 3 Bottom Action */}
                      <div className="pt-6 border-t border-slate-700 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="px-6 py-3 rounded-full border border-slate-700 bg-slate-900 font-bold text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-1.5"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Quay Lại Bước 2</span>
                        </button>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-10 py-3.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 disabled:opacity-40 transition-all flex items-center gap-2 shadow-glow-gold"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isSubmitting ? 'Đang Xử Lý...' : 'Xác Nhận Đặt Lịch Ngay'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY BOOKINGS (TRA CỨU LỊCH SỬ ĐẶT LỊCH) */}
          {activeTab === 'my-bookings' && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-10 shadow-card-dark space-y-8">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto mb-2 shadow-glow-gold">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-serif-salon text-white">
                  Tra Cứu Lịch Sử Đặt Hẹn
                </h3>
                <p className="text-sm text-slate-300">
                  Nhập số điện thoại quý khách đã dùng khi đặt lịch để xem chi tiết lịch hẹn hoặc hủy ca nếu bận đột xuất.
                </p>
              </div>

              {/* Phone Input Form */}
              <form onSubmit={handleLookupBookings} className="max-w-md mx-auto flex gap-2">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="Nhập số điện thoại của bạn..."
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-full border border-slate-700 bg-slate-900 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLookingUp}
                  className="px-7 py-3 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 disabled:opacity-40 transition-all shrink-0 shadow-glow-gold"
                >
                  {isLookingUp ? 'Đang tìm...' : 'Tra Cứu'}
                </button>
              </form>

              {/* Bookings List Result */}
              {lookupDone && (
                <div className="space-y-4 pt-4 border-t border-slate-700">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Kết Quả Tra Cứu ({myBookings.length} lịch hẹn)
                  </h4>

                  {myBookings.length === 0 ? (
                    <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-700">
                      <p className="text-sm text-slate-300">
                        Chưa tìm thấy lịch hẹn nào với số điện thoại <span className="font-bold text-amber-400">{lookupPhone}</span>.
                      </p>
                      <button
                        onClick={() => {
                          setActiveTab('booking');
                          setStep(1);
                        }}
                        className="mt-4 px-6 py-2.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black"
                      >
                        Đặt Lịch Ngay
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {myBookings.map((b) => (
                        <div
                          key={b.id}
                          className="p-5 rounded-2xl border border-slate-700 bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-sm font-bold text-amber-400">
                                #{b.booking_code || b.id}
                              </span>
                              <AppointmentBadge status={b.status} />
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                              <span className="flex items-center gap-1.5 font-bold text-white">
                                <Clock className="w-4 h-4 text-amber-400" />
                                {new Date(b.appointment_date).toLocaleString('vi-VN')}
                              </span>
                              <span>Stylist: <strong className="text-amber-300">{b.hairdresser?.full_name}</strong></span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {b.appointment_services?.map((as) => (
                                <span
                                  key={as.id}
                                  className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700 font-medium"
                                >
                                  {as.service?.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                            <div className="text-right">
                              <span className="block text-[11px] text-slate-400 uppercase font-bold">Tổng tiền</span>
                              <span className="text-base font-black text-amber-400">
                                {formatCurrency(b.total_price)}
                              </span>
                            </div>

                            {/* Cancel button if pending or confirmed */}
                            {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                              <button
                                onClick={() => handleCancelBooking(b.id)}
                                className="px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/15 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-colors"
                              >
                                Hủy Lịch
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="bg-slate-950 text-white py-12 border-t border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Scissors className="w-5 h-5 rotate-45" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wider block text-sm">THEMANH SALON</span>
              <span className="text-[11px] text-slate-500">© 2026 All Rights Reserved.</span>
            </div>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <span>Hotline: 0988.888.888</span>
            <span>Giờ mở cửa: 08:30 - 20:30</span>
            <span>Địa chỉ: 123 Đường Phong Cách, Hà Nội</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicBookingPage;
