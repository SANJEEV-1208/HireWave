import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markNotificationsRead, getUserById, getProfilePictureUrl, getUnreadMessageCount } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { Bell, ChevronDown, Briefcase, User, LogOut } from 'lucide-react';

function Navbar() {
    const { user, isAuthenticated, logout, isJobSeeker, isEmployer } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const navCls = (to) => `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === to || pathname.startsWith(to + '/') ? 'bg-white/20 text-white' : 'text-brand-200 hover:text-white hover:bg-white/10'}`;
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [hasProfilePicture, setHasProfilePicture] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const notifRef = useRef(null);
    const profileRef = useRef(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            getUnreadMessageCount().then(res => setUnreadMessages(res.data?.data || 0)).catch(() => {});
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            getUserById(user.id).then(res => {
                const data = res.data?.data || res.data;
                setHasProfilePicture(!!data.profilePicturePath);
            }).catch(() => {});
        }
    }, [isAuthenticated, user?.id]);

    useEffect(() => {
        const handle = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifDropdown(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    const handleNewNotification = useCallback((notif) => setNotifications(prev => [notif, ...prev]), []);
    const handleNewMessage = useCallback(() => setUnreadMessages(prev => prev + 1), []);

    useWebSocket({ token, onNotification: handleNewNotification, onMessage: handleNewMessage, enabled: isAuthenticated });

    const fetchNotifications = async () => {
        try {
            const res = await getNotifications();
            const data = res.data?.data || [];
            setNotifications(data);
            if (data.some(n => !n.isRead)) {
                markNotificationsRead().catch(() => {});
            }
        } catch {}
    };

    const handleBellClick = async () => {
        const wasOpen = showNotifDropdown;
        setShowNotifDropdown(!wasOpen);
        if (!wasOpen && notifications.some(n => !n.isRead)) {
            try {
                await markNotificationsRead();
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            } catch {}
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleLogout = () => {
        if (!window.confirm('Are you sure you want to logout?')) return;
        logout();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-50 bg-brand-900 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand */}
                    <Link to={isAuthenticated && isEmployer() ? '/my-jobs' : '/jobs'} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-lg text-white">HireWave</span>
                    </Link>

                    {/* Nav links */}
                    <div className="hidden md:flex items-center gap-1">
                        {(!isAuthenticated || isJobSeeker()) && (
                            <Link to="/jobs" className={navCls('/jobs')}>Jobs</Link>
                        )}
                        {isAuthenticated && isJobSeeker() && (
                            <>
                                <Link to="/my-applications" className={navCls('/my-applications')}>Applications</Link>
                                <Link to="/bookmarks" className={navCls('/bookmarks')}>Saved</Link>
                                <Link to="/messages" onClick={() => setUnreadMessages(0)} className={`${navCls('/messages')} flex items-center gap-1.5`}>
                                    Messages
                                    {unreadMessages > 0 && <span className="w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">{unreadMessages}</span>}
                                </Link>
                            </>
                        )}
                        {isAuthenticated && isEmployer() && (
                            <>
                                <Link to="/my-jobs" className={navCls('/my-jobs')}>My Jobs</Link>
                                <Link to="/post-job" className={navCls('/post-job')}>Post Job</Link>
                                <Link to="/applications-received" className={navCls('/applications-received')}>Applications</Link>
                                <Link to="/analytics" className={navCls('/analytics')}>Analytics</Link>
                                <Link to="/messages" onClick={() => setUnreadMessages(0)} className={`${navCls('/messages')} flex items-center gap-1.5`}>
                                    Messages
                                    {unreadMessages > 0 && <span className="w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">{unreadMessages}</span>}
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-1">
                        {!isAuthenticated ? (
                            <>
                                <Link to="/login" className="px-4 py-2 text-sm font-medium text-brand-200 hover:text-white transition-colors">Log in</Link>
                                <Link to="/register" className="px-4 py-2 bg-brand-500 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">Sign up</Link>
                            </>
                        ) : (
                            <>
                                {/* Notifications */}
                                <div className="relative" ref={notifRef}>
                                    <button onClick={handleBellClick} className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
                                        <Bell className="w-5 h-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">{unreadCount}</span>
                                        )}
                                    </button>
                                    {showNotifDropdown && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-soft overflow-hidden">
                                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                                <span className="text-sm font-semibold text-gray-900">Notifications</span>
                                                {unreadCount > 0 && <span className="text-xs text-brand-700 font-medium">{unreadCount} new</span>}
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <p className="text-center text-sm text-gray-400 py-8">No notifications yet</p>
                                                ) : (
                                                    notifications.slice(0, 10).map(n => (
                                                        <div key={n.id} className={`px-4 py-3 border-b border-gray-50 last:border-0 ${!n.isRead ? 'bg-brand-50' : ''}`}>
                                                            <p className="text-sm font-medium text-gray-800">{n.title}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                                                            <p className="text-xs text-gray-400 mt-1">{n.createdAt}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Profile */}
                                <div className="relative" ref={profileRef}>
                                    <button onClick={() => setShowProfileMenu(p => !p)} className="flex items-center gap-2 pl-2 pr-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                        {hasProfilePicture ? (
                                            <img src={getProfilePictureUrl(user.id)} alt={user?.name} className="w-7 h-7 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                {(user?.name || '?')[0].toUpperCase()}
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-brand-200 hidden sm:block">{user?.name?.split(' ')[0]}</span>
                                        <ChevronDown className="w-3.5 h-3.5 text-brand-200" />
                                    </button>
                                    {showProfileMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-soft overflow-hidden">
                                            <Link to="/profile" className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setShowProfileMenu(false)}>
                                                <User className="w-4 h-4 text-gray-400" />View Profile
                                            </Link>
                                            <div className="border-t border-gray-100" />
                                            <button onClick={() => { setShowProfileMenu(false); handleLogout(); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                                <LogOut className="w-4 h-4" />Log out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
