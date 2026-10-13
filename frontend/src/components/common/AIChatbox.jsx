import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Scissors, 
  Trash2, 
  ChevronRight, 
  Minimize2, 
  Maximize2,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
import { aiAPI } from '../../services/endpoints';
import { useToast } from '../../contexts/ToastContext';

export function AIChatbox({ onSelectService }) {
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Clear any legacy client-stored API key to keep browser clean
  useEffect(() => {
    try {
      localStorage.removeItem('salon_gemini_api_key');
    } catch {}
  }, []);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Chào bạn! Mình là Trợ lý Tạo mẫu Tóc AI của THE MANH Salon ✨. Bạn đang muốn tìm kiểu tóc hợp dáng mặt, tư vấn màu nhuộm tôn da hay phục hồi tóc hư tổn? Hãy nhắn tin cho mình nhé!',
      quickReplies: [
        '💇‍♀️ Tư vấn kiểu tóc hợp dáng mặt',
        '🎨 Nhuộm màu nào tôn sáng da?',
        '🌿 Tóc khô xơ nên phục hồi gói nào?',
        '💰 Bảng giá và dịch vụ hot',
      ],
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build lightweight conversation history
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await aiAPI.chat({
        message: text,
        history,
      });

      const data = res.data;
      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        suggestedServices: data.suggested_services || [],
        quickReplies: data.quick_replies || [],
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'Xin lỗi bạn, kết nối tới Stylist AI hiện đang bận. Bạn vui lòng thử lại sau giây lát hoặc kéo xuống bảng giá để xem trực tiếp các dịch vụ nhé!',
          quickReplies: ['Xem bảng giá dịch vụ', 'Đặt lịch hẹn ngay'],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Cuộc trò chuyện đã được làm mới. Hãy cho mình biết nhu cầu làm tóc của bạn nhé! ✨',
        quickReplies: [
          '💇‍♀️ Tư vấn kiểu tóc hợp dáng mặt',
          '🎨 Nhuộm màu nào tôn sáng da?',
          '🌿 Tóc khô xơ nên phục hồi gói nào?',
          '💰 Bảng giá và dịch vụ hot',
        ],
      },
    ]);
  };

  const handleBookService = (svc) => {
    if (onSelectService) {
      onSelectService(svc.service_id);
      addToast(`Đã chọn "${svc.service_name}" vào danh sách đặt lịch!`, 'success');
      // On mobile or small screens, auto minimize so customer sees the booking section
      if (window.innerWidth < 768) {
        setIsMinimized(true);
      }
    } else {
      const bookingEl = document.getElementById('services-section') || document.getElementById('booking-section');
      if (bookingEl) {
        bookingEl.scrollIntoView({ behavior: 'smooth' });
      }
      addToast(`Đã chuyển tới phần đặt lịch cho "${svc.service_name}"!`, 'info');
    }
  };

  return (
    <>
      {/* Floating Trigger Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-glow-gold hover:scale-105 active:scale-95 transition-all duration-300 border border-amber-300 group"
          title="Mở Trợ Lý Tư Vấn Tóc AI"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 animate-spin-slow text-slate-950" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
          </div>
          <span className="text-sm tracking-wide uppercase font-serif-salon">
            AI Stylist Tư Vấn
          </span>
          <span className="hidden sm:inline-block text-[10px] bg-slate-950/20 px-2 py-0.5 rounded-full font-bold">
            24/7
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 w-[94vw] sm:w-[430px] bg-slate-900/95 backdrop-blur-2xl border border-amber-500/40 rounded-3xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
            isMinimized ? 'h-[70px]' : 'h-[620px] max-h-[85vh]'
          }`}
          style={{
            boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 25px rgba(245,158,11,0.2)',
          }}
        >
          {/* Header */}
          <div className="chatbox-header px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-amber-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md">
                <Scissors className="w-5 h-5 -rotate-45 text-slate-950" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black !text-white keep-white uppercase tracking-wider font-serif-salon">
                    THE MANH AI Stylist
                  </h3>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
                <p className="text-[11px] !text-amber-200 font-medium flex items-center gap-1 keep-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Tư vấn kiểu tóc & bảng giá chuẩn 24/7
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearHistory}
                title="Xóa đoạn chat"
                className="chatbox-header-btn p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-white/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
                className="chatbox-header-btn p-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Đóng chatbox"
                className="chatbox-header-btn p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body (only when not minimized) */}
          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`flex gap-2.5 max-w-[88%] ${
                        msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-1 ${
                          msg.role === 'user'
                            ? 'bg-slate-700 text-slate-300'
                            : 'bg-amber-500 text-slate-950 font-black shadow-glow-gold'
                        }`}
                      >
                        {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4" />}
                      </div>

                      {/* Content Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold rounded-tr-sm'
                            : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>

                        {/* Suggested Services Cards */}
                        {msg.suggestedServices && msg.suggestedServices.length > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-slate-700/70 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                              Gợi ý dịch vụ phù hợp tại salon:
                            </span>
                            <div className="space-y-2">
                              {msg.suggestedServices.map((svc) => (
                                <div
                                  key={svc.service_id}
                                  className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between gap-2 hover:border-amber-400/60 transition-all"
                                >
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-bold text-[11px] text-white truncate">
                                      {svc.service_name}
                                    </h5>
                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                      <span className="text-amber-400 font-bold">
                                        {formatCurrency(svc.price)}
                                      </span>
                                      {svc.duration_minutes && (
                                        <>
                                          <span>•</span>
                                          <span className="flex items-center gap-0.5">
                                            <Clock className="w-2.5 h-2.5" />
                                            {svc.duration_minutes}p
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    {svc.reason && (
                                      <p className="text-[10px] text-slate-400/90 mt-1 italic line-clamp-2">
                                        {svc.reason}
                                      </p>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => handleBookService(svc)}
                                    type="button"
                                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm"
                                  >
                                    <span>Chọn đặt</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Replies Buttons */}
                    {msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="mt-2.5 ml-9 flex flex-wrap gap-1.5 max-w-[90%]">
                        {msg.quickReplies.map((qr, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(qr)}
                            className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 hover:border-amber-400 text-slate-300 transition-all active:scale-95 text-left"
                          >
                            {qr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-slate-800/90 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-[11px] text-slate-400 ml-1.5 font-medium">Stylist AI đang suy nghĩ...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
              <div className="p-3 bg-slate-950/80 border-t border-slate-800 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-2xl p-1.5 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Hỏi về kiểu tóc, màu nhuộm, giá tiền..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-all disabled:opacity-40 disabled:hover:bg-amber-500 active:scale-95"
                    title="Gửi tin nhắn"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Stylist AI THE MANH Salon
                  </span>
                  <span className="text-slate-500 font-medium">Tư vấn trực tuyến 24/7</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
