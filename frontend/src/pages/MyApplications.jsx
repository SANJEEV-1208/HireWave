import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';
import { FileText, MessageSquare, ExternalLink, Clock, CheckCircle, XCircle, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import BackButton from '../components/BackButton';

const ITEMS_PER_PAGE = 6;

const statusConfig = {
    PENDING:  { label: 'Under Review', color: 'bg-amber-100 text-amber-700', icon: Clock },
    ACCEPTED: { label: 'Accepted',     color: 'bg-green-100 text-green-700',  icon: CheckCircle },
    REJECTED: { label: 'Not Selected', color: 'bg-red-100 text-red-700',      icon: XCircle },
};

function MyApplications() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        API.get('/applications/my-applications').then(r => setApplications(r.data?.data || [])).catch(() => setError('Failed to load your applications')).finally(() => setLoading(false));
    }, []);

    const totalPages = Math.ceil(applications.length / ITEMS_PER_PAGE);
    const paginatedApplications = applications.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <BackButton />
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{applications.length} application{applications.length !== 1 ? 's' : ''} submitted</p>
                </div>

                {error && <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

                {applications.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 text-center py-20">
                        <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No applications yet</h3>
                        <p className="text-sm text-gray-400 mb-5">Start applying for jobs that match your skills</p>
                        <Link to="/jobs" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-900 transition-colors">Browse Jobs</Link>
                    </div>
                ) : (
                    <>
                    <div className="space-y-4">
                        {paginatedApplications.map(app => {
                            const s = statusConfig[app.status] || statusConfig.PENDING;
                            const SIcon = s.icon;
                            return (
                                <div key={app.id} className="bg-gradient-to-br from-white to-brand-100 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-200 transition-all duration-200 p-5 group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-base group-hover:text-brand-700 transition-colors duration-200">{app.job?.title || 'Unknown Job'}</h3>
                                            <p className="text-sm text-gray-500 mt-0.5">{app.job?.company || 'Unknown Company'}</p>
                                            {app.job?.location && <p className="text-xs text-gray-400 mt-1">📍 {app.job.location}</p>}
                                            <p className="text-xs text-gray-400 mt-1">Applied {new Date(app.appliedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
                                                <SIcon className="w-3 h-3" />{s.label}
                                            </span>
                                            <div className="flex gap-2">
                                                <Link to={`/jobs/${app.job?.id}`}>
                                                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white/70 hover:bg-white rounded-lg transition-all duration-150 hover:shadow-sm"><ExternalLink className="w-3 h-3" />View Job</button>
                                                </Link>
                                                {app.job?.employer?.id && (
                                                    <button onClick={() => navigate(`/messages?userId=${app.job.employer.id}&name=${encodeURIComponent(app.job?.company || 'Employer')}`)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-900 bg-brand-50 hover:bg-brand-100 rounded-lg transition-all duration-150 hover:shadow-sm"><MessageSquare className="w-3 h-3" />Message</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {app.coverLetter && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><FileText className="w-3 h-3" />Cover Letter</p>
                                            <p className="text-sm text-gray-600 line-clamp-2">{app.coverLetter}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages).map((p, idx, arr) => (
                                <React.Fragment key={p}>
                                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-gray-400 text-sm">…</span>}
                                    <button onClick={() => setCurrentPage(p)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === currentPage ? 'bg-brand-700 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{p}</button>
                                </React.Fragment>
                            ))}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    )}
                    </>
                )}
            </div>
        </div>
    );
}

export default MyApplications;
