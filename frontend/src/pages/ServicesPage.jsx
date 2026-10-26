import React, { useState, useEffect } from 'react';
import { serviceAPI } from '../services/endpoints';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/common/Modal';
import {
  Scissors,
  Plus,
  Clock,
  Edit2,
  Trash2,
  DollarSign,
  Search,
  Tag,
  RefreshCw
} from 'lucide-react';

export const ServicesPage = () => {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();

  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 45,
    price: 150000,
    category: 'Cắt & Tạo kiểu',
    image_url: '',
    is_active: true
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await serviceAPI.getAll({ active_only: false });
      setServices(res.data);
    } catch (err) {
      addToast('Không thể tải bảng dịch vụ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Tất cả', ...new Set(services.map((s) => s.category))];

  const filteredServices = services.filter((s) => {
    const matchesCat = selectedCategory === 'Tất cả' || s.category === selectedCategory;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      duration_minutes: 45,
      price: 150000,
      category: 'Cắt & Tạo kiểu',
      image_url: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price,
      category: service.category,
      image_url: service.image_url || '',
      is_active: service.is_active
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await serviceAPI.update(editingId, formData);
        addToast('Cập nhật dịch vụ thành công!', 'success');
      } else {
        await serviceAPI.create(formData);
        addToast('Tạo dịch vụ mới thành công!', 'success');
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Lỗi khi lưu dịch vụ', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn ngừng cung cấp dịch vụ này?')) return;
    try {
      await serviceAPI.delete(id);
      addToast('Đã dừng hoạt động dịch vụ', 'success');
      fetchServices();
    } catch (err) {
      addToast('Không thể xóa dịch vụ', 'error');
    }
  };

  const handleRestore = async (id) => {
    try {
      await serviceAPI.restore(id);
      addToast('Khôi phục dịch vụ thành công', 'success');
      fetchServices();
    } catch (err) {
      addToast('Không thể khôi phục dịch vụ', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-salon text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Scissors className="w-6 h-6 text-amber-500" />
            Danh Mục Dịch Vụ Salon
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý bảng giá, thời lượng từng dịch vụ và cấu hình AI recommendation
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-glow-gold transition-all"
          >
            <Plus className="w-4 h-4" /> Thêm Dịch Vụ Mới
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm dark:bg-slate-800/90 dark:border-slate-700 dark:shadow-card-dark flex flex-col sm:flex-row gap-4 items-center justify-between transition-colors">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-black shadow-glow-gold'
                  : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm tên dịch vụ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:border-amber-400 transition-colors"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 text-sm">Đang tải dịch vụ...</div>
        ) : (
          filteredServices.map((s) => (
            <div
              key={s.id}
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600 dark:shadow-card-dark ${
                s.is_active ? '' : 'opacity-60 border-rose-300 dark:border-rose-500/20'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-700 border border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30 text-[10px] font-bold uppercase">
                    {s.category}
                  </span>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      {!s.is_active && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30 text-[10px] font-bold uppercase mr-2">
                          Đã ngưng
                        </span>
                      )}
                      <button
                        title="Sửa"
                        onClick={() => openEditModal(s)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {s.is_active ? (
                        <button
                          title="Ngừng cung cấp"
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          title="Khôi phục"
                          onClick={() => handleRestore(s.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{s.name}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                    {s.description || 'Dịch vụ chuẩn salon cao cấp.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                <span className="font-extrabold text-base text-amber-600 dark:text-amber-400">
                  {s.price.toLocaleString('vi-VN')} VND
                </span>
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {s.duration_minutes} phút
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Cập Nhật Dịch Vụ' : 'Thêm Dịch Vụ Mới'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tên Dịch Vụ *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Danh Mục</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-amber-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              >
                <option value="Cắt & Tạo kiểu">Cắt & Tạo kiểu</option>
                <option value="Uốn & Duỗi">Uốn & Duỗi</option>
                <option value="Nhuộm màu & Tẩy">Nhuộm màu & Tẩy</option>
                <option value="Chăm sóc & Phục hồi">Chăm sóc & Phục hồi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Giá Tiền (VND) *</label>
              <input
                type="number"
                required
                min={0}
                step={10000}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Thời Lượng (Phút) *</label>
              <input
                type="number"
                required
                min={10}
                step={5}
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mô Tả Chi Tiết</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-salon-primary text-black hover:bg-salon-primaryHover shadow-glow-gold"
            >
              Lưu Dịch Vụ
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
