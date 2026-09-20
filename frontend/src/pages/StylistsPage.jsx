import React, { useState, useEffect } from 'react';
import { hairdresserAPI } from '../services/endpoints';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/common/Modal';
import {
  UserCheck,
  Calendar,
  Clock,
  Star,
  Phone,
  Edit,
  Plus,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const DAYS_OF_WEEK = [
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
  'Chủ Nhật',
];

export const StylistsPage = () => {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();

  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Schedule modal
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedules, setSchedules] = useState([]);

  // Stylist Create/Edit modal
  const [isStylistModalOpen, setIsStylistModalOpen] = useState(false);
  const [editingStylistId, setEditingStylistId] = useState(null);
  const [stylistForm, setStylistForm] = useState({
    full_name: '',
    phone: '',
    bio: '',
    avatar_url: '',
    rating: 5.0,
    is_active: true
  });

  useEffect(() => {
    fetchStylists();
  }, []);

  const fetchStylists = async () => {
    setLoading(true);
    try {
      const res = await hairdresserAPI.getAll({ active_only: false });
      setStylists(res.data);
    } catch (err) {
      addToast('Không thể tải danh sách thợ làm tóc', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openScheduleModal = (stylist) => {
    setSelectedStylist(stylist);
    // Initialize 7 days of week
    const currentSchedules = [];
    for (let dow = 0; dow < 7; dow++) {
      const found = stylist.schedules?.find((s) => s.day_of_week === dow);
      if (found) {
        currentSchedules.push({
          day_of_week: dow,
          start_time: typeof found.start_time === 'string' ? found.start_time.slice(0, 5) : '08:30',
          end_time: typeof found.end_time === 'string' ? found.end_time.slice(0, 5) : '20:00',
          is_day_off: found.is_day_off,
        });
      } else {
        currentSchedules.push({
          day_of_week: dow,
          start_time: '08:30',
          end_time: '20:00',
          is_day_off: dow === 0,
        });
      }
    }
    setSchedules(currentSchedules);
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      const formatted = schedules.map((s) => ({
        day_of_week: s.day_of_week,
        start_time: `${s.start_time}:00`,
        end_time: `${s.end_time}:00`,
        is_day_off: s.is_day_off,
      }));
      await hairdresserAPI.updateSchedules(selectedStylist.id, formatted);
      addToast('Cập nhật ca làm việc thành công!', 'success');
      setIsScheduleModalOpen(false);
      fetchStylists();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Không thể lưu lịch làm việc', 'error');
    }
  };

  const updateScheduleItem = (dow, field, value) => {
    setSchedules((prev) =>
      prev.map((s) => (s.day_of_week === dow ? { ...s, [field]: value } : s))
    );
  };

  const openCreateStylist = () => {
    setEditingStylistId(null);
    setStylistForm({
      full_name: '',
      phone: '',
      bio: '',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      rating: 5.0,
      is_active: true
    });
    setIsStylistModalOpen(true);
  };

  const openEditStylist = (s) => {
    setEditingStylistId(s.id);
    setStylistForm({
      full_name: s.full_name,
      phone: s.phone || '',
      bio: s.bio || '',
      avatar_url: s.avatar_url || '',
      rating: s.rating || 5.0,
      is_active: s.is_active
    });
    setIsStylistModalOpen(true);
  };

  const handleSaveStylist = async (e) => {
    e.preventDefault();
    try {
      if (editingStylistId) {
        await hairdresserAPI.update(editingStylistId, stylistForm);
        addToast('Cập nhật hồ sơ thợ thành công!', 'success');
      } else {
        await hairdresserAPI.create(stylistForm);
        addToast('Thêm thợ làm tóc mới thành công!', 'success');
      }
      setIsStylistModalOpen(false);
      fetchStylists();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Lỗi khi lưu thông tin thợ', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-salon text-slate-100 flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-salon-primary" />
            Đội Ngũ Stylist & Thiết Lập Ca Làm Việc
          </h1>
          <p className="text-xs text-salon-muted mt-1">
            Quản lý thông tin thợ tạo mẫu và cài đặt khung giờ làm việc theo từng ngày trong tuần
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateStylist}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-salon-primary text-black hover:bg-salon-primaryHover shadow-glow-gold transition-all"
          >
            <Plus className="w-4 h-4" /> Thêm Stylist Mới
          </button>
        )}
      </div>

      {/* Stylists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-salon-muted text-sm">Đang tải danh sách stylist...</div>
        ) : (
          stylists.map((s) => (
            <div
              key={s.id}
              className="glass-panel rounded-3xl p-6 border border-salon-border/60 hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4 text-center">
                <img
                  src={s.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
                  alt={s.full_name}
                  className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-salon-primary/50"
                />
                <div>
                  <h3 className="font-bold text-lg text-slate-100">{s.full_name}</h3>
                  <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-semibold mt-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{s.rating?.toFixed(1) || '5.0'} / 5.0</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-salon-muted">{s.phone || 'Chưa cập nhật SĐT'}</span>
                  </div>
                </div>

                <p className="text-xs text-salon-muted line-clamp-3 leading-relaxed text-left">
                  {s.bio || 'Chuyên gia tạo mẫu tóc tại Lumière Salon.'}
                </p>

                {/* Weekly schedule preview badge */}
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-salon-border/40 text-left text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Lịch làm việc tuần:
                  </span>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {DAYS_OF_WEEK.map((d, idx) => {
                      const sched = s.schedules?.find((sc) => sc.day_of_week === idx);
                      const isOff = sched ? sched.is_day_off : idx === 0;
                      return (
                        <div
                          key={idx}
                          title={`${d}: ${isOff ? 'Nghỉ' : `${sched?.start_time?.slice(0,5)} - ${sched?.end_time?.slice(0,5)}`}`}
                          className={`py-1 rounded text-[10px] font-bold ${
                            isOff ? 'bg-rose-950/40 text-rose-400 border border-rose-500/20' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          T{idx === 6 ? 'CN' : idx + 2}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-salon-border/50">
                <button
                  onClick={() => openScheduleModal(s)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-salon-border transition-all flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-salon-primary" /> Cài Đặt Ca Làm
                </button>
                {isAdmin && (
                  <button
                    onClick={() => openEditStylist(s)}
                    className="p-2 rounded-xl text-xs bg-slate-800 text-slate-300 hover:text-white border border-salon-border"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Schedule Configuration Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={`Thiết Lập Ca Làm Việc: ${selectedStylist?.full_name}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4">
          <p className="text-xs text-salon-muted mb-3">
            Hệ thống sẽ tự động đối chiếu các khung giờ này khi khách hàng đặt lịch để ngăn chặn trùng ca.
          </p>

          <div className="space-y-2.5">
            {schedules.map((s) => (
              <div
                key={s.day_of_week}
                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  s.is_day_off ? 'bg-slate-900/40 border-slate-800 opacity-60' : 'bg-slate-900 border-salon-border'
                }`}
              >
                <div className="w-24 font-bold text-slate-200">
                  {DAYS_OF_WEEK[s.day_of_week]}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">Bắt đầu:</span>
                    <input
                      type="time"
                      disabled={s.is_day_off}
                      value={s.start_time}
                      onChange={(e) => updateScheduleItem(s.day_of_week, 'start_time', e.target.value)}
                      className="px-2 py-1 rounded bg-slate-800 border border-salon-border text-slate-100 disabled:opacity-30"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">Kết thúc:</span>
                    <input
                      type="time"
                      disabled={s.is_day_off}
                      value={s.end_time}
                      onChange={(e) => updateScheduleItem(s.day_of_week, 'end_time', e.target.value)}
                      className="px-2 py-1 rounded bg-slate-800 border border-salon-border text-slate-100 disabled:opacity-30"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => updateScheduleItem(s.day_of_week, 'is_day_off', !s.is_day_off)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      s.is_day_off
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {s.is_day_off ? 'Nghỉ làm' : 'Đi làm'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-salon-border/50">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-salon-primary text-black hover:bg-salon-primaryHover shadow-glow-gold"
            >
              Lưu Toàn Bộ Ca Làm
            </button>
          </div>
        </form>
      </Modal>

      {/* Stylist Profile Modal */}
      <Modal
        isOpen={isStylistModalOpen}
        onClose={() => setIsStylistModalOpen(false)}
        title={editingStylistId ? 'Cập Nhật Hồ Sơ Stylist' : 'Thêm Stylist Mới'}
      >
        <form onSubmit={handleSaveStylist} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Họ và Tên Stylist *</label>
            <input
              type="text"
              required
              value={stylistForm.full_name}
              onChange={(e) => setStylistForm({ ...stylistForm, full_name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Số Điện Thoại</label>
              <input
                type="tel"
                value={stylistForm.phone}
                onChange={(e) => setStylistForm({ ...stylistForm, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Đánh Giá (Rating)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={stylistForm.rating}
                onChange={(e) => setStylistForm({ ...stylistForm, rating: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">URL Ảnh Đại Diện (Avatar)</label>
            <input
              type="text"
              value={stylistForm.avatar_url}
              onChange={(e) => setStylistForm({ ...stylistForm, avatar_url: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Giới Thiệu Kinh Nghiệm & Thế Mạnh</label>
            <textarea
              rows={3}
              value={stylistForm.bio}
              onChange={(e) => setStylistForm({ ...stylistForm, bio: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-salon-border/50">
            <button
              type="button"
              onClick={() => setIsStylistModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-salon-primary text-black hover:bg-salon-primaryHover shadow-glow-gold"
            >
              Lưu Hồ Sơ
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
