import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getConversations, getConversation, sendMessage, sendMessageWithFile, getMessageAttachmentUrl, markMessagesRead, searchUsers } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { MessageSquare, Send, Paperclip, FileText, X, Search, SquarePen } from 'lucide-react';

function Messages() {
    const { user, isAuthenticated, isEmployer } = useAuth();
    const [searchParams] = useSearchParams();
    const token = localStorage.getItem('token');

    const [conversations, setConversations] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedUserName, setSelectedUserName] = useState('');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [attachedFile, setAttachedFile] = useState(null);
    const fileInputRef = useRef(null);
    const bottomRef = useRef(null);

    // New conversation search
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchDebounceRef = useRef(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        const uid = searchParams.get('userId');
        const name = searchParams.get('name');
        if (uid) selectConversation(Number(uid), name || 'User');
    }, []);

    useEffect(() => {
        if (showSearch && searchInputRef.current) searchInputRef.current.focus();
    }, [showSearch]);

    const handleSearchQueryChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        clearTimeout(searchDebounceRef.current);
        if (!val.trim()) { setSearchResults([]); return; }
        searchDebounceRef.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const role = isEmployer() ? 'JOB_SEEKER' : 'EMPLOYER';
                const res = await searchUsers(val, role);
                setSearchResults(res.data?.data || []);
            } catch {
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 400);
    };

    const handleSearchSelect = (u) => {
        selectConversation(u.id, u.name);
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    const toggleSearch = () => {
        setShowSearch(s => !s);
        setSearchQuery('');
        setSearchResults([]);
    };

    useEffect(() => { if (isAuthenticated) loadConversations(); }, [isAuthenticated]);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const loadConversations = async () => {
        try { const r = await getConversations(); setConversations(r.data?.data || []); } catch {}
    };

    const selectConversation = async (userId, name) => {
        setSelectedUserId(userId); setSelectedUserName(name);
        try {
            const r = await getConversation(userId);
            setMessages(r.data?.data || []);
            await markMessagesRead(userId);
            setConversations(prev => prev.map(c => {
                const pid = c.senderId === user?.id ? c.recipientId : c.senderId;
                return pid === userId ? { ...c, isRead: true } : c;
            }));
        } catch {}
    };

    const handleSend = async () => {
        const text = input.trim();
        if ((!text && !attachedFile) || sending || !selectedUserId) return;
        setInput(''); setSending(true);
        const file = attachedFile;
        setAttachedFile(null);
        try {
            const r = file
                ? await sendMessageWithFile(selectedUserId, text, file)
                : await sendMessage(selectedUserId, text);
            const msg = r.data?.data;
            if (msg) setMessages(prev => [...prev, msg]);
            loadConversations();
        } catch {} finally { setSending(false); }
    };

    const handleNewMessage = useCallback((msg) => {
        if (msg.senderId === selectedUserId || msg.recipientId === selectedUserId) {
            setMessages(prev => [...prev, msg]);
            markMessagesRead(msg.senderId).catch(() => {});
        }
        loadConversations();
    }, [selectedUserId]);

    const handleReadReceipt = useCallback(() => {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    }, []);

    useWebSocket({ token, onMessage: handleNewMessage, onReadReceipt: handleReadReceipt, enabled: isAuthenticated });

    const getPartner = (conv) => {
        if (!user) return { id: null, name: '' };
        const isMe = conv.senderId === user.id;
        return { id: isMe ? conv.recipientId : conv.senderId, name: isMe ? conv.recipientName : conv.senderName };
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
                <div className="flex bg-brand-100 rounded-2xl border border-gray-200 shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
                    {/* Sidebar */}
                    <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col bg-gray-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversations</p>
                                <button onClick={toggleSearch} title="New conversation" className={`p-1 rounded transition-colors ${showSearch ? 'text-brand-700 bg-brand-50' : 'text-gray-400 hover:text-brand-700'}`}>
                                    <SquarePen className="w-4 h-4" />
                                </button>
                            </div>
                            {showSearch && (
                                <div className="mt-2 relative">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        <input
                                            ref={searchInputRef}
                                            value={searchQuery}
                                            onChange={handleSearchQueryChange}
                                            placeholder={isEmployer() ? 'Search job seekers...' : 'Search employers...'}
                                            className="w-full pl-8 pr-7 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                                        />
                                        {searchQuery && (
                                            <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    {(searchLoading || searchResults.length > 0 || (searchQuery && !searchLoading)) && (
                                        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-52 overflow-y-auto">
                                            {searchLoading && <p className="text-xs text-gray-400 text-center py-3">Searching...</p>}
                                            {!searchLoading && searchResults.map(u => (
                                                <button key={u.id} onClick={() => handleSearchSelect(u)} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
                                                    <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-800 text-xs font-bold flex-shrink-0">
                                                        {(u.name || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-gray-800 truncate">{u.name}</p>
                                                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                                    </div>
                                                </button>
                                            ))}
                                            {!searchLoading && searchQuery && searchResults.length === 0 && (
                                                <p className="text-xs text-gray-400 text-center py-3">No users found</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-10">No conversations yet</p>
                            ) : (
                                conversations.map((conv, i) => {
                                    const partner = getPartner(conv);
                                    const active = partner.id === selectedUserId;
                                    const unread = !conv.isRead && conv.recipientId === user?.id;
                                    return (
                                        <div key={i} onClick={() => selectConversation(partner.id, partner.name)} className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors border-b border-gray-100 last:border-0 ${active ? 'bg-brand-50 border-l-2 border-l-brand-700' : 'hover:bg-gray-100'}`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${active ? 'bg-brand-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                                {(partner.name || '?')[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className={`text-sm font-medium truncate ${active ? 'text-brand-900' : 'text-gray-800'}`}>{partner.name}</p>
                                                    {unread && <div className="w-2 h-2 bg-brand-700 rounded-full flex-shrink-0" />}
                                                </div>
                                                <p className="text-xs text-gray-400 truncate mt-0.5">{conv.content}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Thread */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {!selectedUserId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mb-4"><MessageSquare className="w-8 h-8 text-brand-500" /></div>
                                <p className="text-base font-semibold text-gray-700 mb-1">No conversation selected</p>
                                <p className="text-sm text-gray-400">Click a conversation or use the Message button on an application</p>
                            </div>
                        ) : (
                            <>
                                <div className="px-5 py-4 border-b border-gray-100 bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-brand-50 rounded-full flex items-center justify-center text-brand-900 font-bold text-sm">
                                            {selectedUserName[0]?.toUpperCase()}
                                        </div>
                                        <p className="font-semibold text-gray-900">{selectedUserName}</p>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50">
                                    {messages.map((msg, i) => {
                                        const isMine = msg.senderId === user?.id;
                                        const isImage = msg.attachmentName && /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.attachmentName);
                                        const isPdf = msg.attachmentName && /\.pdf$/i.test(msg.attachmentName);
                                        return (
                                            <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[65%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? 'bg-brand-700 text-white rounded-br-md' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'}`}>
                                                    {msg.content && <p>{msg.content}</p>}
                                                    {msg.attachmentPath && isImage && (
                                                        <a href={getMessageAttachmentUrl(msg.id)} target="_blank" rel="noreferrer">
                                                            <img src={getMessageAttachmentUrl(msg.id)} alt={msg.attachmentName} className="mt-2 max-w-full rounded-xl max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                                                        </a>
                                                    )}
                                                    {msg.attachmentPath && !isImage && (
                                                        <a href={getMessageAttachmentUrl(msg.id)} target="_blank" rel="noreferrer" className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${isMine ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-gray-50 hover:bg-gray-100 text-brand-700'}`}>
                                                            <FileText className="w-4 h-4 flex-shrink-0" />
                                                            <span className="text-xs font-medium truncate">{msg.attachmentName}</span>
                                                        </a>
                                                    )}
                                                    <span className={`flex items-center justify-end gap-1 text-xs mt-1 ${isMine ? 'text-brand-200' : 'text-gray-400'}`}>
                                                        {msg.sentAt?.slice(11, 16)}
                                                        {isMine && <span className={msg.isRead ? 'text-teal-300' : 'text-white/40'}>{msg.isRead ? '✓✓' : '✓'}</span>}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={bottomRef} />
                                </div>
                                <div className="px-4 py-3 border-t border-gray-100 bg-white flex flex-col gap-2">
                                    {attachedFile && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-900">
                                            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="truncate flex-1">{attachedFile.name}</span>
                                            <button onClick={() => { setAttachedFile(null); fileInputRef.current.value = ''; }} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded-full transition-colors flex-shrink-0" title="Attach file">
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="sr-only" onChange={e => { if (e.target.files[0]) setAttachedFile(e.target.files[0]); }} />
                                        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Type a message..." disabled={sending} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 placeholder:text-gray-400" />
                                        <button onClick={handleSend} disabled={sending || (!input.trim() && !attachedFile)} className="w-10 h-10 bg-brand-700 hover:bg-brand-900 disabled:opacity-50 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0">
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Messages;
