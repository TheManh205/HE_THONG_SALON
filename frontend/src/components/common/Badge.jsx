import React from 'react';

const STATUS_MAP = {
  PENDING: {
    cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400',
    label: 'Chờ xác nhận',
  },
  CONFIRMED: {
    cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dot: 'bg-blue-400',
    label: 'Đã xác nhận',
  },
  IN_PROGRESS: {
    cls: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    dot: 'bg-purple-400',
    label: 'Đang phục vụ',
  },
  COMPLETED: {
    cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'Hoàn thành',
  },
  CANCELLED: {
    cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dot: 'bg-rose-400',
    label: 'Đã hủy',
  },
};

export const AppointmentBadge = ({ status }) => {
  const s = STATUS_MAP[status] || {
    cls: 'bg-slate-800 text-slate-300 border-slate-700',
    dot: 'bg-slate-400',
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${s.cls}`}
    >
      <span className={`w-2 h-2 rounded-full ${s.dot} ${status === 'PENDING' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const map = {
    admin: {
      cls: 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm',
      label: 'Admin',
    },
    receptionist: {
      cls: 'bg-slate-700 text-slate-200 font-bold border-slate-600',
      label: 'Lễ Tân',
    },
    hairdresser: {
      cls: 'bg-slate-700 text-slate-200 font-bold border-slate-600',
      label: 'Thợ Tóc',
    },
  };
  const r = map[role] || {
    cls: 'bg-slate-800 text-slate-300 border-slate-700 font-bold',
    label: role,
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] border ${r.cls}`}>
      {r.label}
    </span>
  );
};

export const PaymentBadge = ({ status }) =>
  status === 'PAID' ? (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
      Đã thanh toán
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
      Chưa thanh toán
    </span>
  );
