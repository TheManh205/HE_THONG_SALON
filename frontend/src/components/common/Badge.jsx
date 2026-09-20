import React from 'react';

const STATUS_MAP = {
  PENDING:     { cls: 'bg-[#f5f5f3] text-[#111111] border-black/10',  dot: 'bg-[#111111]', label: 'Chờ xác nhận' },
  CONFIRMED:   { cls: 'bg-[#f5f5f3] text-[#111111] border-black/10', dot: 'bg-[#4b5563]', label: 'Đã xác nhận' },
  IN_PROGRESS: { cls: 'bg-[#f5f5f3] text-[#111111] border-black/10', dot: 'bg-[#374151]', label: 'Đang phục vụ' },
  COMPLETED:   { cls: 'bg-[#f5f5f3] text-[#111111] border-black/10', dot: 'bg-[#111111]', label: 'Hoàn thành' },
  CANCELLED:   { cls: 'bg-slate-100 text-slate-500 border-slate-200',  dot: 'bg-slate-400', label: 'Đã hủy' },
};

export const AppointmentBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { cls: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400', label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === 'PENDING' ? 'pulse-dot' : ''}`} />
      {s.label}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const map = {
    admin:        { cls: 'bg-black text-white border-black',     label: 'Admin' },
    manager:      { cls: 'bg-black text-white border-black',     label: 'Quản Lý' },
    receptionist: { cls: 'bg-[#f5f5f3] text-[#111111] border-black/10',  label: 'Lễ Tân' },
    hairdresser:  { cls: 'bg-[#f5f5f3] text-[#111111] border-black/10', label: 'Thợ Làm Tóc' },
  };
  const r = map[role] || { cls: 'bg-slate-100 text-slate-600 border-slate-200', label: role };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${r.cls}`}>
      {r.label}
    </span>
  );
};

export const PaymentBadge = ({ status }) => (
  status === 'PAID'
    ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f5f5f3] text-[#111111] border border-black/10">Đã thanh toán</span>
    : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Chưa thanh toán</span>
);
