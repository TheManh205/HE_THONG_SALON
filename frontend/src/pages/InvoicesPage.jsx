import React, { useState, useEffect } from 'react';
import { invoiceAPI } from '../services/endpoints';
import { useToast } from '../contexts/ToastContext';
import { PaymentBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Receipt,
  Search,
  DollarSign,
  Printer,
  Calendar,
  CreditCard,
  CheckCircle2
} from 'lucide-react';

export const InvoicesPage = () => {
  const { addToast } = useToast();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoiceAPI.getAll();
      setInvoices(res.data);
    } catch (err) {
      addToast('Không thể tải danh sách hóa đơn', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-serif-salon text-slate-100 flex items-center gap-2.5">
          <Receipt className="w-6 h-6 text-salon-primary" />
          Hóa Đơn & Nhật Ký Thu Tiền
        </h1>
        <p className="text-xs text-salon-muted mt-1">
          Theo dõi các giao dịch đã hoàn tất và xuất hóa đơn dịch vụ
        </p>
      </div>

      {/* Invoices List */}
      <div className="glass-panel rounded-2xl border border-salon-border/60 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-salon-muted text-sm">Đang tải hóa đơn...</div>
        ) : invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-salon-muted uppercase text-[10px] tracking-wider border-b border-salon-border">
                <tr>
                  <th className="p-4">Mã Hóa Đơn</th>
                  <th className="p-4">Mã Lịch Hẹn</th>
                  <th className="p-4">Thời Gian Xuất</th>
                  <th className="p-4">Tổng Tiền</th>
                  <th className="p-4">Giảm Giá</th>
                  <th className="p-4">Thực Thu</th>
                  <th className="p-4">Phương Thức</th>
                  <th className="p-4">Trạng Thái</th>
                  <th className="p-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-salon-border/40 text-slate-200">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-salon-primary">#{inv.id}</td>
                    <td className="p-4 font-mono text-slate-400">#{inv.appointment_id}</td>
                    <td className="p-4 text-slate-300">
                      {new Date(inv.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-4 font-semibold">{inv.total_amount.toLocaleString('vi-VN')} đ</td>
                    <td className="p-4 text-rose-400">-{inv.discount_amount.toLocaleString('vi-VN')} đ</td>
                    <td className="p-4 font-bold text-emerald-400 text-sm">
                      {inv.final_amount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] border border-salon-border">
                        {inv.payment_method === 'CASH'
                          ? 'Tiền mặt'
                          : inv.payment_method === 'BANK_TRANSFER'
                          ? 'Chuyển khoản'
                          : 'Thẻ POS'}
                      </span>
                    </td>
                    <td className="p-4">
                      <PaymentBadge status={inv.payment_status} />
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setIsReceiptOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-salon-border"
                      >
                        Xem Phiếu Thu
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-salon-muted text-sm">
            Chưa có hóa đơn nào được tạo trong hệ thống.
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        title="Phiếu Thu Dịch Vụ Salon"
        maxWidth="max-w-md"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="bg-white text-slate-900 p-6 rounded-2xl shadow-md text-xs space-y-4 font-sans print:p-0">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h2 className="text-base font-extrabold tracking-tight uppercase">LUMIÈRE LUXURY HAIR SALON</h2>
                <p className="text-[10px] text-slate-500">123 Đường Thời Trang, Quận 1, TP. Hồ Chí Minh</p>
                <p className="text-[10px] text-slate-500">Hotline: 1900 6868</p>
                <h3 className="text-sm font-bold uppercase mt-2">PHIẾU THANH TOÁN DỊCH VỤ</h3>
                <span className="font-mono text-[11px] text-slate-600">Số: #{selectedInvoice.id}</span>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Thời gian:</span>
                  <span className="font-semibold">{new Date(selectedInvoice.created_at).toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Mã cuộc hẹn:</span>
                  <span className="font-mono font-semibold">#{selectedInvoice.appointment_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Phương thức:</span>
                  <span className="font-semibold">{selectedInvoice.payment_method}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Tổng tiền dịch vụ:</span>
                  <span>{selectedInvoice.total_amount.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Giảm giá / Ưu đãi:</span>
                  <span>-{selectedInvoice.discount_amount.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-300 text-slate-900">
                  <span>THỰC THU:</span>
                  <span className="text-emerald-700">{selectedInvoice.final_amount.toLocaleString('vi-VN')} VND</span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 space-y-0.5">
                <p>Cảm ơn Quý Khách đã trải nghiệm dịch vụ tại Lumière Salon!</p>
                <p>Bảo hành nếp uốn & màu nhuộm trong 7 ngày.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReceiptOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-salon-primary text-black hover:bg-salon-primaryHover flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> In Phiếu Thu
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
