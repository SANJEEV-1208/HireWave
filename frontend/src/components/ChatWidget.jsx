import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/api';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

const WELCOME = "Hi! I'm JobBot 🤖\nAsk me to find jobs (e.g. \"React jobs in Bangalore\") or any career question!";

function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: 'bot', text: WELCOME }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const send = async () => {
        const text = input.trim();
        if (!text || loading) return;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text }]);
        setLoading(true);
        try {
            const res = await sendChatMessage(text);
            setMessages(prev => [...prev, { role: 'bot', text: res.data.data }]);
        } catch {
            setMessages(prev => [...prev, { role: 'bot', text: 'Something went wrong. Please try again!' }]);
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {isOpen && (
                <div className="w-80 sm:w-96 bg-brand-100 rounded-2xl border border-gray-200 shadow-soft flex flex-col overflow-hidden" style={{ height: '460px' }}>
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3.5 bg-brand-700">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><Bot className="w-4 h-4 text-white" /></div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-white">JobBot</p>
                            <p className="text-xs text-brand-200">AI-powered job assistant</p>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-brand-700 text-white rounded-br-md' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'}`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm px-4 py-3 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full chat-dot" />
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full chat-dot" />
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full chat-dot" />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 bg-white">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                            placeholder="Ask about jobs or careers..."
                            disabled={loading}
                            className="flex-1 px-3.5 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 placeholder:text-gray-400"
                        />
                        <button onClick={send} disabled={loading || !input.trim()} className="w-9 h-9 bg-brand-700 hover:bg-brand-900 disabled:opacity-50 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0">
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            <button onClick={() => setIsOpen(v => !v)} className="w-14 h-14 bg-brand-700 hover:bg-brand-900 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105" title="Chat with JobBot">
                {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-6 h-6" />}
            </button>
        </div>
    );
}

export default ChatWidget;
