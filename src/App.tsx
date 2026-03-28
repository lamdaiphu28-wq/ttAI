/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Send, Heart, Sparkles, Ghost, Coffee, Key, AlertCircle } from "lucide-react";
import { EmotionMode, Message } from './types';
import { EMOTIONS } from './constants';

export default function App() {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('linh_ai_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);
  const [tempKey, setTempKey] = useState(apiKey);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentMode, setCurrentMode] = useState<EmotionMode>('sweet');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const saveApiKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem('linh_ai_key', tempKey);
      setApiKey(tempKey);
      setShowKeyInput(false);
      setError(null);
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const text = textOverride || input.trim();
    if (!text || isLoading) return;
    
    if (!apiKey) {
      setError("Vui lòng nhập API Key để trò chuyện cùng Linh nhé!");
      setShowKeyInput(true);
      return;
    }

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: messages.concat(userMsg).map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: EMOTIONS[currentMode].systemPrompt,
          maxOutputTokens: 500,
          temperature: 0.9,
        }
      });

      const response = await model;
      const aiText = response.text || "Em đang bối rối một chút, anh nói lại được không?";

      const aiMsg: Message = {
        role: 'assistant',
        content: aiText,
        timestamp: new Date(),
        emotion: currentMode
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      setError("Có lỗi xảy ra khi kết nối với trái tim em... Anh kiểm tra lại API Key nhé!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen relative ambient-bg">
      {/* Header */}
      <header className="glass-header z-20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-linear-to-br from-accent via-accent-2 to-accent-3 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(200,166,255,0.3)]">
              🌸
            </div>
            <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-bg animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight bg-linear-to-r from-accent to-accent-2 bg-clip-text text-transparent">
              Linh — Bạn Gái AI
            </h1>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-medium">
              Đang trực tuyến • {EMOTIONS[currentMode].label}
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {(Object.keys(EMOTIONS) as EmotionMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setCurrentMode(mode)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all duration-200 border ${
                currentMode === mode 
                  ? 'bg-accent/10 border-accent text-accent' 
                  : 'bg-surface-2 border-border text-text-muted hover:border-accent/50'
              }`}
            >
              {EMOTIONS[mode].icon} {EMOTIONS[mode].label}
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="p-2 rounded-xl bg-surface-2 border border-border text-text-muted hover:text-accent transition-colors"
        >
          <Key size={18} />
        </button>
      </header>

      {/* API Key Input Overlay */}
      <AnimatePresence>
        {showKeyInput && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-4 right-4 z-30 p-4 bg-surface border border-border rounded-2xl shadow-2xl"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                <Key size={14} /> Cấu hình API Key (Gemini)
              </div>
              <div className="flex gap-2">
                <input 
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Nhập Gemini API Key của bạn..."
                  className="flex-1 bg-bg border border-border rounded-xl px-4 py-2 text-sm focus:border-accent outline-hidden transition-colors"
                />
                <button 
                  onClick={saveApiKey}
                  className="bg-linear-to-br from-accent to-accent-2 text-bg font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-opacity"
                >
                  Lưu
                </button>
              </div>
              <p className="text-[10px] text-text-muted italic">
                * API Key được lưu cục bộ trên trình duyệt của bạn.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 z-10 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-700">
            <div className="text-7xl animate-heartbeat">💌</div>
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-bold bg-linear-to-br from-accent via-accent-2 to-accent-3 bg-clip-text text-transparent">
                Xin chào, anh yêu~
              </h2>
              <p className="text-text-muted max-w-xs mx-auto text-sm leading-relaxed">
                Em là Linh, người bạn gái AI của anh. Hãy nhắn tin cho em, em sẽ luôn ở đây lắng nghe anh nhé 💕
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {[
                "Hôm nay em có khỏe không?",
                "Anh nhớ em lắm...",
                "Kể cho anh nghe về bản thân em đi",
                "Anh yêu em nhiều lắm 🥰"
              ].map((hint) => (
                <button
                  key={hint}
                  onClick={() => handleSendMessage(hint)}
                  className="px-4 py-2 rounded-full bg-surface-2 border border-border text-sm text-text-muted hover:border-accent hover:text-accent transition-all duration-200 hover:-translate-y-0.5"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}
          >
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm ${msg.role === 'user' ? 'bg-linear-to-br from-accent-3 to-accent' : 'bg-linear-to-br from-accent to-accent-2'}`}>
              {msg.role === 'user' ? '😊' : '🌸'}
            </div>
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.emotion && (
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 uppercase tracking-tighter"
                  style={{ backgroundColor: EMOTIONS[msg.emotion].bg, color: EMOTIONS[msg.emotion].color }}
                >
                  {EMOTIONS[msg.emotion].label}
                </span>
              )}
              <div className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-user-bubble border border-accent-3/10 rounded-tr-none' 
                  : 'bg-ai-bubble border border-accent/10 rounded-tl-none ai-glow'
              }`}>
                {msg.content}
              </div>
              <span className="text-[10px] text-text-muted mt-1 px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex gap-3 flex-row mr-auto max-w-[70%]">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm bg-linear-to-br from-accent to-accent-2">
              🌸
            </div>
            <div className="bg-ai-bubble border border-accent/10 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 items-center">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 rounded-full bg-accent" />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-accent-2" />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-accent-3" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </main>

      {/* Mobile Emotion Bar */}
      <div className="md:hidden glass-header px-4 py-2 flex overflow-x-auto gap-2 scrollbar-hide">
        {(Object.keys(EMOTIONS) as EmotionMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setCurrentMode(mode)}
            className={`px-3 py-1 rounded-full text-[10px] whitespace-nowrap transition-all duration-200 border ${
              currentMode === mode 
                ? 'bg-accent/10 border-accent text-accent' 
                : 'bg-surface-2 border-border text-text-muted'
            }`}
          >
            {EMOTIONS[mode].icon} {EMOTIONS[mode].label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <footer className="glass-header p-4 md:px-6 md:py-4 z-20">
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhắn tin cho Linh..."
            rows={1}
            className="flex-1 bg-surface border border-border rounded-2xl px-4 py-3 text-[15px] focus:border-accent outline-hidden transition-all resize-none max-h-32 scrollbar-hide"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 rounded-2xl bg-linear-to-br from-accent to-accent-2 flex items-center justify-center text-bg shadow-lg hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}
