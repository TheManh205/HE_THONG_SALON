import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/endpoints';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield, UserCheck, Plus, Search, Edit2, Trash2,
  Lock, Mail, Phone, User, CheckCircle, XCircle, AlertTriangle, KeyRound
} from 'lucide-react';

export const UsersPage = () => {
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    role_id: 2,
    password: '',
    is_active: true
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        userAPI.getAll(),
        userAPI.getRoles()
      ]);
      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
      if (rolesRes.data?.length > 0 && !editingUser) {
        setFormData(prev => ({ ...prev, role_id: rolesRes.data[0].id }));
      }
    } catch (err) {
      console.error("Error fetching users/roles:", err);
      addToast('Không thể tải danh sách tài khoản hoặc vai trò', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      full_name: '',
      email: '',
      phone: '',
      role_id: roles[0]?.id || 2,
      password: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone || '',
      role_id: u.role_id,
      password: '', // blank unless changing
      is_active: u.is_active
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      if (editingUser) {
        // Update user
        const updatePayload = {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          role_id: Number(formData.role_id),
          is_active: formData.is_active
        };
        if (formData.password?.trim()) {
          updatePayload.password = formData.password.trim();
        }
        await userAPI.update(editingUser.id, updatePayload);
        addToast('Cập nhật tài khoản thành công!', 'success');
      } else {
        // Create user
        if (!formData.password || formData.password.length < 6) {
          addToast('Mật khẩu bắt buộc và phải có ít nhất 6 ký tự', 'warning');
          setFormSubmitting(false);
          return;
        }
        const createPayload = {
          username: formData.username.trim(),
          password: formData.password.trim(),
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role_id: Number(formData.role_id),
          is_active: formData.is_active
        };
        await userAPI.create(createPayload);
        addToast('Tạo tài khoản người dùng mới thành công!', 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Thao tác thất bại. Vui lòng kiểm tra lại.';
      addToast(msg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete.id === currentUser?.id) {
      addToast('Không thể xóa tài khoản của chính bạn đang đăng nhập!', 'warning');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${userToDelete.username}" (${userToDelete.full_name})?`)) {
      return;
    }
    try {
      await userAPI.delete(userToDelete.id);
      addToast('Đã xóa tài khoản thành công', 'info');
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Không thể xóa tài khoản';
      addToast(msg, 'error');
    }
  };

  const getUserRoleName = (u) => {
    // 1. If role is string (e.g. "admin", "receptionist", "hairdresser")
    if (typeof u?.role === 'string' && u.role.trim()) {
      return u.role.trim();
    }
    // 2. If role is object with name property
    if (u?.role && typeof u.role === 'object' && u.role.name) {
      return u.role.name;
    }
    // 3. Match from roles list by role_id
    if (u?.role_id && Array.isArray(roles) && roles.length > 0) {
      const foundRole = roles.find((r) => r.id === u.role_id);
      if (foundRole?.name) return foundRole.name;
    }
    // 4. Fallback to role_name property if present
    if (u?.role_name) {
      return u.role_name;
    }
    return '';
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q);

    if (roleFilter === 'ALL') {
      return matchesSearch;
    }

    const userRoleStr = getUserRoleName(u).toLowerCase();
    const targetFilter = roleFilter.toLowerCase();

    // Check by role name (exact or substring match) or role_id
    const matchesRole =
      userRoleStr === targetFilter ||
      userRoleStr.includes(targetFilter) ||
      targetFilter.includes(userRoleStr) ||
      String(u.role_id) === String(roleFilter);

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (roleName) => {
    const name = (roleName || '').toLowerCase();
    if (name.includes('admin') || name.includes('quản lý')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <Shield className="w-3 h-3" /> Quản Lý (Admin)
        </span>
      );
    }
    if (name.includes('receptionist') || name.includes('lễ tân')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <UserCheck className="w-3 h-3" /> Lễ Tân
        </span>
      );
    }
    if (name.includes('hairdresser') || name.includes('thợ') || name.includes('stylist')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-400 border border-blue-500/30">
          <User className="w-3 h-3" /> Thợ làm tóc (Hairdresser)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-slate-500/15 text-slate-300 border border-slate-500/30">
        <User className="w-3 h-3" /> {roleName || 'Nhân viên'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-800/80 border border-slate-700 p-6 rounded-3xl shadow-card-dark">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" /> Phân Quyền Hệ Thống (FR02 - RBAC)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-serif-salon">
            Quản Lý Tài Khoản & Vai Trò
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Thiết lập quyền hạn, quản trị người dùng nội bộ (Quản lý, Lễ tân, Thợ làm tóc).
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-glow-gold self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Thêm Tài Khoản Mới
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, username, email, sđt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Lọc Vai Trò:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="ALL">Tất cả vai trò</option>
            {roles && roles.length > 0 ? (
              roles.map((r) => {
                const roleKey = (r.name || '').toLowerCase();
                let label = r.description || r.name;
                if (roleKey.includes('admin') || roleKey.includes('quản lý')) {
                  label = 'Quản lý (Admin)';
                } else if (roleKey.includes('receptionist') || roleKey.includes('lễ tân')) {
                  label = 'Lễ tân (Receptionist)';
                } else if (roleKey.includes('hairdresser') || roleKey.includes('thợ') || roleKey.includes('stylist')) {
                  label = 'Thợ làm tóc (Hairdresser)';
                }
                return (
                  <option key={r.id} value={r.name.toLowerCase()}>
                    {label}
                  </option>
                );
              })
            ) : (
              <>
                <option value="admin">Quản lý (Admin)</option>
                <option value="receptionist">Lễ tân (Receptionist)</option>
                <option value="hairdresser">Thợ làm tóc (Hairdresser)</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-card-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="py-4 px-6">Họ & Tên / Tài Khoản</th>
                <th className="py-4 px-6">Email & SĐT</th>
                <th className="py-4 px-6 text-center">Vai Trò (Role)</th>
                <th className="py-4 px-6 text-center">Trạng Thái</th>
                <th className="py-4 px-6 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Không tìm thấy tài khoản người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleName = getUserRoleName(u) || 'Staff';

                  return (
                    <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-sm uppercase">
                            {u.full_name?.slice(0, 1) || u.username?.slice(0, 1)}
                          </div>
                          <div>
                            <span className="block font-bold text-white text-sm">{u.full_name}</span>
                            <span className="block text-xs font-mono text-amber-400/90 mt-0.5">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span className="flex items-center gap-1.5 text-xs text-slate-300">
                            <Mail className="w-3.5 h-3.5 text-slate-500" /> {u.email}
                          </span>
                          {u.phone && (
                            <span className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                              <Phone className="w-3.5 h-3.5 text-slate-500" /> {u.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center">
                        {getRoleBadge(roleName)}
                      </td>

                      <td className="py-4 px-6 text-center">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5" /> Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                            <XCircle className="w-3.5 h-3.5" /> Tạm khóa
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-2 rounded-xl border border-slate-700 bg-slate-900/60 hover:border-amber-400 text-slate-300 hover:text-amber-400 transition-colors"
                            title="Chỉnh sửa thông tin / phân quyền"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.id === currentUser?.id}
                            className={`p-2 rounded-xl border transition-colors ${
                              u.id === currentUser?.id
                                ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                                : 'border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                            }`}
                            title={u.id === currentUser?.id ? 'Không thể xóa chính mình' : 'Xóa tài khoản'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  {editingUser ? 'Chỉnh Sửa Quyền & Tài Khoản' : 'Thêm Mới Tài Khoản Nội Bộ'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phân quyền vai trò chuẩn RBAC theo chính sách Salon.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tên đăng nhập <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="ví dụ: receptionist02"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Họ và Tên <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="staff@themanhsalon.vn"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912345678"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Vai trò (Phân quyền RBAC) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name.toUpperCase()} - {r.description || r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {editingUser ? 'Đổi mật khẩu mới (Bỏ trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo'} {!editingUser && <span className="text-rose-400">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Nhập mật khẩu mới...' : 'Tối thiểu 6 ký tự'}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active_toggle"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="is_active_toggle" className="text-xs font-semibold text-slate-300">
                  Kích hoạt tài khoản này (Được phép đăng nhập hệ thống)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-glow-gold disabled:opacity-60"
                >
                  {formSubmitting ? 'Đang lưu...' : editingUser ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
