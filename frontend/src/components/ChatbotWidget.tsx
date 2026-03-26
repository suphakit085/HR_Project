"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Trash2 } from "lucide-react";
import { chatbotAPI } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "สวัสดีค่ะ! ฉันเป็นผู้ช่วย HR AI 🤖 สามารถช่วยเรื่อง:\n\n• สร้าง Job Description\n• สรุปข้อมูลผู้สมัคร\n• ตอบคำถาม HR ทั่วไป\n\nมีอะไรให้ช่วยไหมคะ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contextCacheRef = useRef<{ text: string; fetchedAt: number } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getRuntimeContext = async (): Promise<string | undefined> => {
    const cache = contextCacheRef.current;
    if (cache && Date.now() - cache.fetchedAt < 30_000) {
      return cache.text;
    }

    try {
      const res = await chatbotAPI.getContextSummary();
      const text = typeof res.data?.context === "string" ? res.data.context : "";
      if (text) {
        contextCacheRef.current = { text, fetchedAt: Date.now() };
        return text;
      }
    } catch {
      // Context is optional. Chat should still work without it.
    }
    return undefined;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const runtimeContext = await getRuntimeContext();
      const res = await chatbotAPI.sendMessage({
        message: userMsg,
        session_id: sessionId || undefined,
        context: runtimeContext,
      });
      setSessionId(res.data.session_id);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "ขออภัยค่ะ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (sessionId) {
      chatbotAPI.clearSession(sessionId).catch(() => {});
    }
    contextCacheRef.current = null;
    setMessages([
      {
        role: "assistant",
        content: "เริ่มบทสนทนาใหม่ค่ะ มีอะไรให้ช่วยไหมคะ? 🤖",
      },
    ]);
    setSessionId(null);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 z-50 ${
          isOpen
            ? "bg-gray-700 rotate-0"
            : "bg-gradient-to-br from-teal-500 to-emerald-500 animate-pulse-glow"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 animate-slide-up overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">HR Assistant AI</h3>
                <p className="text-teal-100 text-xs">พร้อมช่วยเหลือ 24/7</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="text-white/70 hover:text-white transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-teal-500 text-white rounded-br-md"
                      : "bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="พิมพ์ข้อความ..."
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-700 placeholder-gray-400"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 rounded-xl flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
