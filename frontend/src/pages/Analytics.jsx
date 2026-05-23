import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAnalyticsSummary, getAnalyticsOverTime, getAnalyticsStatusDist, getAnalyticsTopJobs } from '../services/api';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import BackButton from '../components/BackButton';
import { Briefcase, CheckCircle, Send, Eye } from 'lucide-react';

const STATUS_COLORS = { PENDING: '#f59e0b', ACCEPTED: '#10b981', REJECTED: '#ef4444' };
const formatDateTick = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function Analytics() {
    const { isAuthenticated, isEmployer } = useAuth();
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [overTime, setOverTime] = useState([]);
    const [statusDist, setStatusDist] = useState([]);
    const [topJobs, setTopJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated || !isEmployer()) { navigate('/login'); return; }
        Promise.all([getAnalyticsSummary(), getAnalyticsOverTime(), getAnalyticsStatusDist(), getAnalyticsTopJobs()])
            .then(([s, ot, sd, tj]) => {
                setSummary(s.data?.data || s.data);
                setOverTime(ot.data?.data || ot.data || []);
                const distMap = sd.data?.data || sd.data || {};
                setStatusDist(Object.entries(distMap).map(([name, value]) => ({ name, value: Number(value) })));
                setTopJobs(tj.data?.data || tj.data || []);
            }).catch(() => setError('Failed to load analytics data.'))
            .finally(() => setLoading(false));
    }, []);

    const totalApps = overTime.reduce((s, d) => s + d.count, 0);

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <p className="text-red-600 font-semibold mb-3">{error}</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-900 transition-colors">Try Again</button>
            </div>
        </div>
    );

    const statCards = [
        { label: 'Jobs Posted', value: summary?.totalJobsPosted ?? 0, icon: Briefcase, color: 'text-brand-700 bg-brand-50' },
        { label: 'Active Jobs', value: summary?.activeJobs ?? 0, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
        { label: 'Total Applications', value: summary?.totalApplications ?? 0, icon: Send, color: 'text-amber-600 bg-amber-50' },
        { label: 'Total Views', value: summary?.totalViews ?? 0, icon: Eye, color: 'text-blue-600 bg-blue-50' },
    ];

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <BackButton />
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Performance insights for your job postings</p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {statCards.map(s => (
                        <div key={s.label} className="bg-gradient-to-br from-white to-brand-100 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-brand-200 transition-all duration-200 p-5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
                    <div className="lg:col-span-2 bg-gradient-to-br from-white to-brand-100 rounded-2xl border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-bold text-gray-900">Applications Over Time</h2>
                            <span className="text-xs text-gray-400">Last 30 days · {totalApps} total</span>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={overTime} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fontSize: 11, fill: '#9ca3af' }} interval={4} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <Tooltip labelFormatter={formatDateTick} formatter={(v) => [v, 'Applications']} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fill="url(#appGradient)" dot={false} activeDot={{ r: 5, fill: '#6366f1' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-gradient-to-br from-white to-brand-100 rounded-2xl border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-bold text-gray-900">Status Breakdown</h2>
                            <span className="text-xs text-gray-400">All time</span>
                        </div>
                        {statusDist.length === 0 ? (
                            <div className="flex items-center justify-center h-52 text-sm text-gray-400">No data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={statusDist} cx="50%" cy="42%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                        {statusDist.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />)}
                                    </Pie>
                                    <Tooltip formatter={(v, name) => [v, name]} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Top jobs */}
                <div className="bg-gradient-to-br from-white to-brand-100 rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-bold text-gray-900">Top Jobs by Applications</h2>
                        <span className="text-xs text-gray-400">Top 5</span>
                    </div>
                    {topJobs.length === 0 ? (
                        <div className="text-center py-10 text-sm text-gray-400">No applications received yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(topJobs.length * 52, 160)}>
                            <BarChart data={topJobs} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="title" tick={{ fontSize: 12, fill: '#374151' }} width={160} tickLine={false} axisLine={false} />
                                <Tooltip formatter={(v, name) => [v, name === 'applications' ? 'Applications' : 'Views']} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                                <Bar dataKey="applications" fill="#6366f1" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 12, fill: '#6b7280' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Analytics;
