import React, { useState, useEffect } from 'react';
import { customerAPI, aiAPI } from '../services/endpoints';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/common/Modal';
import {
  Users,
  Search,
  Plus,
  History,
  Sparkles,
  Phone,
  Mail,
  User,
  Calendar,
  DollarSign,
  Edit2,
  Bot
} from 'lucide-react';

export const CustomersPage = () => {
  const { addToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // History modal
  const [selectedCust, setSelectedCust] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState(null);
  const [isAISummaryOpen, setIsAISummaryOpen] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  // Create / Edit modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    gender: 'Female',
    notes: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerAPI.getAll({ search: search || undefined });
      setCustomers(res.data);
    } catch (err) {
      addToast('Lỗi khi tải danh sách khách hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistory = async (cust) => {
    setSelectedCust(cust);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await customerAPI.getHistory(cust.id);
      setHistoryList(res.data);
    } catch (err) {
      addToast('Lỗi khi tải lịch sử làm tóc', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSummarizeWithAI = async (cust) => {
    setSelectedCust(cust);
    setIsAISummaryOpen(true);
    setAiSummaryLoading(true);
    setAiSummary(null);
    try {
      const res = await aiAPI.summarizeHistory(cust.id);
      setAiSummary(res.data);
    } catch (err) {
      addToast('Không thể tóm tắt AI', 'error');
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await customerAPI.update(editingId, formData);
        addToast('Cập nhật thông tin khách hàng thành công!', 'success');
      } else {
        await customerAPI.create(formData);
        addToast('Thêm mới khách hàng thành công!', 'success');
      }
      setIsFormOpen(false);
      fetchCustomers();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Lỗi khi lưu khách hàng', 'error');
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      gender: 'Female',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingId(cust.id);
    setFormData({
      full_name: cust.full_name,
      phone: cust.phone,
      email: cust.email || '',
      gender: cust.gender || 'Female',
      notes: cust.notes || '',
    });
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-salon text-slate-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-salon-primary" />
            Hồ Sơ Khách Hàng & Lịch Sử Kỹ Thuật
          </h1>
          <p className="text-xs text-salon-muted mt-1">
            Quản lý thông tin, theo dõi công thức thuốc nhuộm/uốn và tóm tắt hồ sơ bằng AI Gemini
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-salon-primary text-black hover:bg-salon-primaryHover shadow-glow-gold transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm Khách Hàng
        </button>
      </div>

      {/* Search Filter */}
      <div className="glass-panel p-4 rounded-2xl border border-salon-border/60">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên, số điện thoại hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-salon-border text-xs text-slate-100 focus:outline-none focus:border-salon-primary"
          />
        </div>
      </div>

      {/* Customer Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-salon-muted text-sm">Đang tải khách hàng...</div>
        ) : customers.length > 0 ? (
          customers.map((cust) => (
            <div
              key={cust.id}
              className="glass-panel rounded-2xl p-5 border border-salon-border/60 hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-slate-100">{cust.full_name}</h3>
                    <span className="text-xs text-salon-muted flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-salon-primary" /> {cust.phone}
                    </span>
                  </div>
                  <button
                    onClick={() => openEditModal(cust)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold pt-1 border-t border-salon-border/40">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Số lần làm tóc</span>
                    <span className="text-amber-300 font-bold">{cust.appointment_count || 0} lần</span>
                  </div>
                  <div className="border-l border-salon-border/40 pl-4">
                    <span className="text-slate-400 block text-[10px]">Tổng chi tiêu</span>
                    <span className="text-emerald-400 font-bold">
                      {(cust.total_spent || 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {cust.notes && (
                  <p className="text-xs text-salon-muted bg-slate-900/40 p-2.5 rounded-xl border border-salon-border/30 line-clamp-2">
                    {cust.notes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-salon-border/40">
                <button
                  onClick={() => handleOpenHistory(cust)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-salon-border transition-all flex items-center justify-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5 text-salon-primary" /> Xem Lịch Sử
                </button>
                <button
                  onClick={() => handleSummarizeWithAI(cust)}
                  className="py-2 px-3 rounded-xl text-xs font-bold bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/30 transition-all flex items-center gap-1"
                  title="Tóm tắt hồ sơ khách hàng bằng AI Gemini"
                >
                  <Bot className="w-3.5 h-3.5 text-amber-300" /> Tóm Tắt AI
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-salon-muted text-sm">
            Không tìm thấy khách hàng nào.
          </div>
        )}
      </div>

      {/* Service History Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Lịch Sử Dịch Vụ: ${selectedCust?.full_name}`}
        maxWidth="max-w-3xl"
      >
        {historyLoading ? (
          <div className="py-8 text-center text-salon-muted text-sm">Đang tải lịch sử...</div>
        ) : historyList.length > 0 ? (
          <div className="space-y-4">
            {historyList.map((h) => (
              <div key={h.id} className="p-4 rounded-2xl bg-slate-900/70 border border-salon-border space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-salon-primary">{h.service_names}</span>
                  <span className="text-slate-400">
                    {new Date(h.completed_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  <span className="text-amber-300 font-medium">Stylist thực hiện:</span> {h.hairdresser?.full_name || 'Thợ Salon'}
                </div>
                {h.formula_or_color_code && (
                  <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200">
                    <strong>🧪 Công thức / Kỹ thuật:</strong> {h.formula_or_color_code}
                  </div>
                )}
                {h.notes && (
                  <p className="text-xs text-slate-400">💬 Ghi chú: {h.notes}</p>
                )}
                <div className="text-right text-xs font-bold text-emerald-400">
                  Chi phí: {h.cost?.toLocaleString('vi-VN')} VND
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-salon-muted text-sm">
            Khách hàng chưa có lịch sử làm tóc nào được lưu.
          </div>
        )}
      </Modal>

      {/* AI Summary Modal */}
      <Modal
        isOpen={isAISummaryOpen}
        onClose={() => setIsAISummaryOpen(false)}
        title="Tóm Tắt Hồ Sơ Kỹ Thuật Bằng AI Gemini"
      >
        {aiSummaryLoading ? (
          <div className="py-12 text-center space-y-3">
            <Bot className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
            <p className="text-xs text-purple-200">Gemini đang phân tích toàn bộ lịch sử và ghi chú của khách hàng...</p>
          </div>
        ) : aiSummary ? (
          <div className="space-y-4">
            <div className="glass-panel-gold p-4 rounded-2xl border border-purple-500/40 space-y-2">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Tổng Quan Nhanh Cho Thợ Làm Tóc:
              </h4>
              <p className="text-xs text-slate-100 leading-relaxed">{aiSummary.summary}</p>
            </div>

            {aiSummary.frequent_stylist && (
              <div className="p-3 rounded-xl bg-slate-900 border border-salon-border text-xs flex justify-between">
                <span className="text-slate-400">Thợ làm quen thuộc:</span>
                <span className="font-bold text-amber-300">{aiSummary.frequent_stylist}</span>
              </div>
            )}

            {aiSummary.preferred_styles_or_colors?.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-salon-border space-y-1.5">
                <span className="text-xs font-bold text-slate-300 block">Gu Màu / Kiểu Tóc Ưa Thích:</span>
                <div className="flex flex-wrap gap-1.5">
                  {aiSummary.preferred_styles_or_colors.map((style, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs">
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {aiSummary.technical_notes?.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-salon-border space-y-1.5">
                <span className="text-xs font-bold text-slate-300 block">Lưu Ý Kỹ Thuật & Công Thức:</span>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  {aiSummary.technical_notes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Create / Edit Customer Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Cập Nhật Khách Hàng' : 'Thêm Khách Hàng Mới'}
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Họ và Tên *</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Số Điện Thoại *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Giới Tính</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
              >
                <option value="Female">Nữ</option>
                <option value="Male">Nam</option>
                <option value="Other">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Ghi Chú Đặc Biệt Về Chất Tóc</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-salon-border/50">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-salon-primary text-black hover:bg-salon-primaryHover shadow-glow-gold"
            >
              Lưu Thông Tin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
