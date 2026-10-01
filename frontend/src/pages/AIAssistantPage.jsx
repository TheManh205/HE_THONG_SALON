import React, { useState, useEffect } from 'react';
import { aiAPI, customerAPI } from '../services/endpoints';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles,
  Bot,
  MessageSquare,
  Scissors,
  FileText,
  Copy,
  Check,
  Send,
  User,
  ShieldCheck,
  Layers,
  Clock,
  DollarSign
} from 'lucide-react';

export const AIAssistantPage = () => {
  const { addToast } = useToast();
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState('advisor'); // 'advisor' | 'messaging' | 'summary'
  const [customers, setCustomers] = useState([]);

  // Module 1: Style Advisor State
  const [advisorName, setAdvisorName] = useState('Chị Thu Trang');
  const [advisorGender, setAdvisorGender] = useState('Female');
  const [advisorCondition, setAdvisorCondition] = useState('Tóc khô xơ, chẻ ngọn phần đuôi, đã từng tẩy tóc 1 lần');
  const [advisorStyle, setAdvisorStyle] = useState('Muốn nhuộm tone màu nâu tây ánh lạnh nhẹ nhàng, phục hồi tóc bóng mượt và cắt tỉa layer ôm mặt');
  const [advisorBudget, setAdvisorBudget] = useState('');
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorResult, setAdvisorResult] = useState(null);

  // Module 2: Auto Messaging State
  const [msgCustName, setMsgCustName] = useState('Anh Hoàng Long');
  const [msgType, setMsgType] = useState('REMINDER'); // REMINDER, AFTERCARE, RE_ENGAGE
  const [msgServices, setMsgServices] = useState('Cắt Tóc Nam Barber VIP & Gội Massage');
  const [msgTime, setMsgTime] = useState('14:30 chiều mai');
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgResult, setMsgResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Module 3: Summary State
  const [summaryCustId, setSummaryCustId] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await customerAPI.getAll();
      setCustomers(res.data);
      if (res.data.length > 0) {
        setSummaryCustId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Style Advisor Submit
  const handleAdvisorSubmit = async (e) => {
    e.preventDefault();
    setAdvisorLoading(true);
    setAdvisorResult(null);
    try {
      const res = await aiAPI.getRecommendations({
        customer_name: advisorName,
        gender: advisorGender,
        hair_condition: advisorCondition,
        desired_style: advisorStyle,
        budget_max: advisorBudget ? parseFloat(advisorBudget) : null
      });
      setAdvisorResult(res.data);
      addToast('AI Gemini đã phân tích và tạo combo đề xuất thành công!', 'success');
    } catch (err) {
      addToast('Lỗi khi gọi AI Advisor', 'error');
    } finally {
      setAdvisorLoading(false);
    }
  };

  // Handle Message Generation Submit
  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    setMsgLoading(true);
    setMsgResult(null);
    try {
      const res = await aiAPI.generateCareMessage({
        customer_name: msgCustName,
        message_type: msgType,
        service_names: msgServices,
        appointment_time: msgTime
      });
      setMsgResult(res.data);
      addToast('Đã sinh tin nhắn CSKH thành công!', 'success');
    } catch (err) {
      addToast('Lỗi khi sinh tin nhắn AI', 'error');
    } finally {
      setMsgLoading(false);
    }
  };

  // Handle Summary Submit
  const handleSummarySubmit = async (e) => {
    e.preventDefault();
    if (!summaryCustId) return;
    setSummaryLoading(true);
    setSummaryResult(null);
    try {
      const res = await aiAPI.summarizeHistory(summaryCustId);
      setSummaryResult(res.data);
      addToast('Đã trích xuất tóm tắt kỹ thuật từ AI!', 'success');
    } catch (err) {
      addToast('Lỗi khi tóm tắt lịch sử', 'error');
    } finally {
      setSummaryLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('Đã sao chép nội dung tin nhắn!', 'info');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 border border-purple-500/40 relative overflow-hidden">
        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/40">
            <Bot className="w-4 h-4 text-amber-300" /> Trung Tâm Trợ Lý AI Salon
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-salon text-slate-100">
            AI Gemini Smart Hair System
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Tích hợp SDK <span className="font-mono text-amber-300">google-genai</span> với Prompt Guarding nghiêm ngặt và cơ chế chống Hallucination (chỉ gợi ý dịch vụ có trong database).
          </p>
        </div>
      </div>

      {/* Module Tabs */}
      <div className="flex flex-wrap gap-3 pb-2 border-b border-salon-border/60">
        <button
          onClick={() => setActiveTab('advisor')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'advisor'
              ? 'bg-salon-primary text-black shadow-glow-gold'
              : 'glass-panel text-slate-300 hover:bg-slate-800 border border-salon-border'
          }`}
        >
          <Scissors className="w-4 h-4" /> 1. Tư Vấn Kiểu Tóc & Combo (Style Advisor)
        </button>

        {['admin', 'receptionist'].includes(role) && (
          <button
            onClick={() => setActiveTab('messaging')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'messaging'
                ? 'bg-purple-600 text-white shadow-glow-accent'
                : 'glass-panel text-slate-300 hover:bg-slate-800 border border-salon-border'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> 2. Sinh Tin Nhắn CSKH / Nhắc Hẹn
          </button>
        )}

        <button
          onClick={() => setActiveTab('summary')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'summary'
              ? 'bg-indigo-600 text-white shadow-glow-accent'
              : 'glass-panel text-slate-300 hover:bg-slate-800 border border-salon-border'
          }`}
        >
          <FileText className="w-4 h-4" /> 3. Tóm Tắt Hồ Sơ Kỹ Thuật
        </button>
      </div>

      {/* Tab 1: AI Style Advisor */}
      {activeTab === 'advisor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={handleAdvisorSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border border-salon-border/60 space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-serif-salon">
              <Scissors className="w-5 h-5 text-salon-primary" />
              Thông Tin Tư Vấn Tạo Mẫu
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tên Khách Hàng</label>
                <input
                  type="text"
                  required
                  value={advisorName}
                  onChange={(e) => setAdvisorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Giới Tính</label>
                <select
                  value={advisorGender}
                  onChange={(e) => setAdvisorGender(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
                >
                  <option value="Female">Nữ</option>
                  <option value="Male">Nam</option>
                  <option value="Other">Khác</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Tình Trạng Chất Tóc Hiện Tại *</label>
              <textarea
                rows={2}
                required
                value={advisorCondition}
                onChange={(e) => setAdvisorCondition(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Phong Cách / Nhu Cầu Mong Muốn *</label>
              <textarea
                rows={3}
                required
                value={advisorStyle}
                onChange={(e) => setAdvisorStyle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Ngân Sách Tối Đa (VND - Tùy chọn)</label>
              <input
                type="number"
                placeholder="Ví dụ: 1500000"
                value={advisorBudget}
                onChange={(e) => setAdvisorBudget(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={advisorLoading}
              className="w-full py-3 rounded-xl font-bold text-xs bg-salon-primary text-black hover:bg-salon-primaryHover shadow-glow-gold transition-all flex items-center justify-center gap-2"
            >
              {advisorLoading ? (
                <span>AI Gemini đang phân tích chất tóc...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Phân Tích & Gợi Ý Combo Dịch Vụ
                </>
              )}
            </button>
          </form>

          {/* Results Box */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-salon-border/60 flex flex-col justify-between">
            {advisorResult ? (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-amber-300" /> Lời Khuyên Của Chuyên Gia AI:
                  </h3>
                  <p className="text-xs text-slate-100 leading-relaxed">{advisorResult.styling_advice}</p>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Combo Dịch Vụ Đề Xuất (Đã Validate qua Database):
                  </h4>
                  {advisorResult.recommended_services?.map((svc) => (
                    <div
                      key={svc.service_id}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-salon-border flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-100 block">{svc.service_name}</span>
                        <span className="text-salon-muted text-[11px]">{svc.reason}</span>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="font-bold text-amber-300 block">{svc.price.toLocaleString('vi-VN')} đ</span>
                        <span className="text-[10px] text-slate-500">{svc.duration_minutes} phút</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-salon-border space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-300">Hướng Dẫn Chăm Sóc Tại Nhà:</h4>
                  <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                    {advisorResult.home_care_tips?.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex justify-between items-center text-xs">
                  <span className="text-slate-300">Tổng thời lượng & chi phí dự tính:</span>
                  <span className="font-black text-sm text-emerald-400">
                    {advisorResult.total_duration_minutes} phút • {advisorResult.total_estimated_price.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-salon-muted">
                <Bot className="w-12 h-12 text-slate-600" />
                <p className="text-sm">Nhập thông tin bên trái để nhận gợi ý chuyên sâu từ AI Gemini.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: AI Customer Care Messaging */}
      {activeTab === 'messaging' && ['admin', 'receptionist'].includes(role) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={handleMessageSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border border-salon-border/60 space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-serif-salon">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              Cấu Hình Soạn Tin Nhắn
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Loại Tin Nhắn</label>
              <select
                value={msgType}
                onChange={(e) => setMsgType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
              >
                <option value="REMINDER">Nhắc Lịch Hẹn Sắp Tới (Reminder)</option>
                <option value="AFTERCARE">Cẩm Nang Chăm Sóc Sau Làm Tóc (Post-Service Aftercare)</option>
                <option value="RE_ENGAGE">Tri Ân & Mời Khách Quay Lại (Re-engagement / Voucher)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Tên Khách Hàng</label>
              <input
                type="text"
                required
                value={msgCustName}
                onChange={(e) => setMsgCustName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Dịch Vụ Đã/Sắp Làm</label>
              <input
                type="text"
                required
                value={msgServices}
                onChange={(e) => setMsgServices(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
              />
            </div>

            {msgType === 'REMINDER' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Thời Gian Lịch Hẹn</label>
                <input
                  type="text"
                  value={msgTime}
                  onChange={(e) => setMsgTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={msgLoading}
              className="w-full py-3 rounded-xl font-bold text-xs bg-purple-600 text-white hover:bg-purple-500 shadow-glow-accent transition-all flex items-center justify-center gap-2"
            >
              {msgLoading ? 'Gemini đang soạn tin...' : 'Tự Động Sinh Tin Nhắn Bằng AI'}
            </button>
          </form>

          {/* Generated Message Box */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-salon-border/60 flex flex-col justify-between">
            {msgResult ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-salon-border/60">
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{msgResult.title}</h3>
                    <span className="text-[11px] text-purple-300">Kênh: {msgResult.channel}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(msgResult.message_content)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-salon-border transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Đã Sao Chép' : 'Sao Chép'}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-salon-border text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {msgResult.message_content}
                </div>

                <p className="text-[11px] text-salon-muted">
                  💡 Bạn có thể dán nội dung này trực tiếp vào ứng dụng Zalo ZNS hoặc SMS Brandname để gửi tới khách hàng.
                </p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-salon-muted">
                <MessageSquare className="w-12 h-12 text-slate-600" />
                <p className="text-sm">Chọn loại tin nhắn và nhấn sinh tin nhắn để xem nội dung.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Customer History Summarizer */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={handleSummarySubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border border-salon-border/60 space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-serif-salon">
              <FileText className="w-5 h-5 text-indigo-400" />
              Chọn Hồ Sơ Khách Hàng Cần Tóm Tắt
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Khách Hàng</label>
              <select
                value={summaryCustId}
                onChange={(e) => setSummaryCustId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-salon-border text-xs text-slate-100"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={summaryLoading}
              className="w-full py-3 rounded-xl font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-500 shadow-glow-accent transition-all flex items-center justify-center gap-2"
            >
              {summaryLoading ? 'Đang trích xuất dữ liệu...' : 'Tóm Tắt Hồ Sơ Kỹ Thuật'}
            </button>
          </form>

          {/* Summary Box */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-salon-border/60 flex flex-col justify-between">
            {summaryResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-300" /> Tóm Tắt Nhanh Cho Stylist:
                  </h3>
                  <p className="text-xs text-slate-100 leading-relaxed">{summaryResult.summary}</p>
                </div>

                {summaryResult.frequent_stylist && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-salon-border text-xs flex justify-between">
                    <span className="text-slate-400">Stylist quen thuộc:</span>
                    <span className="font-bold text-amber-300">{summaryResult.frequent_stylist}</span>
                  </div>
                )}

                {summaryResult.preferred_styles_or_colors?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-salon-border space-y-1.5">
                    <span className="text-xs font-bold text-slate-300 block">Sở Thích / Tone Màu Thường Làm:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {summaryResult.preferred_styles_or_colors.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {summaryResult.technical_notes?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-salon-border space-y-1.5">
                    <span className="text-xs font-bold text-slate-300 block">Ghi Chú Kỹ Thuật:</span>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                      {summaryResult.technical_notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-salon-muted">
                <FileText className="w-12 h-12 text-slate-600" />
                <p className="text-sm">Chọn khách hàng để xem tóm tắt kỹ thuật.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
