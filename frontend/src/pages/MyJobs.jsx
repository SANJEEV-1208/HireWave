import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Briefcase, PlusCircle, Eye, Pencil, Lock, Unlock, Trash2, MoreVertical, MapPin, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { reopenJob } from '../services/api';

const JOBS_PER_PAGE = 6;

function MyJobs() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => { fetchMyJobs(); }, []);
    useEffect(() => {
        const h = (e) => { if (!e.target.closest('[data-menu]')) setOpenMenuId(null); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const fetchMyJobs = async () => {
        try { const r = await api.get(`/jobs/employer/${user.id}`); setJobs(r.data.data); }
        catch { setError('Failed to load your jobs'); }
        finally { setLoading(false); }
    };

    const handleDeleteJob = async (jobId) => {
        setOpenMenuId(null);
        if (!window.confirm('Delete this job?')) return;
        try {
            await api.delete(`/jobs/${jobId}`);
            const updated = jobs.filter(j => j.id !== jobId);
            setJobs(updated);
            if (currentPage > Math.ceil(updated.length / JOBS_PER_PAGE)) setCurrentPage(p => Math.max(1, p - 1));
        } catch { alert('Failed to delete job'); }
    };

    const handleCloseJob = async (jobId) => {
        setOpenMenuId(null);
        try { await api.patch(`/jobs/${jobId}/close`); fetchMyJobs(); }
        catch { alert('Failed to close job'); }
    };

    const handleReopenJob = async (jobId) => {
        setOpenMenuId(null);
        try { await reopenJob(jobId); fetchMyJobs(); }
        catch { alert('Failed to reopen job'); }
    };

    const totalPages = Math.ceil(jobs.length / JOBS_PER_PAGE);
    const paginatedJobs = jobs.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE);

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{jobs.length} job{jobs.length !== 1 ? 's' : ''} posted</p>
                    </div>
                    <Link to="/post-job" className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 hover:bg-brand-900 text-white text-sm font-semibold rounded-lg transition-colors">
                        <PlusCircle className="w-4 h-4" />Post a Job
                    </Link>
                </div>

                {error && <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

                {jobs.length === 0 ? (
                    <div className="bg-brand-100 rounded-2xl border border-gray-200 text-center py-20">
                        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No jobs posted yet</h3>
                        <p className="text-sm text-gray-400 mb-5">Post your first job to start receiving applications</p>
                        <Link to="/post-job" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-900 transition-colors">
                            <PlusCircle className="w-4 h-4" />Post Your First Job
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {paginatedJobs.map(job => (
                                <div key={job.id} className="bg-gradient-to-br from-white to-brand-100 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-200 transition-all duration-200 p-5 relative group">
                                    {/* Menu */}
                                    <div className="absolute top-4 right-4" data-menu="true">
                                        <button onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                        {openMenuId === job.id && (
                                            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl border border-gray-200 shadow-soft overflow-hidden z-10">
                                                <Link to={`/jobs/${job.id}`} onClick={() => setOpenMenuId(null)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"><Eye className="w-3.5 h-3.5 text-gray-400" />View</Link>
                                                <Link to={`/edit-job/${job.id}`} onClick={() => setOpenMenuId(null)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"><Pencil className="w-3.5 h-3.5 text-gray-400" />Edit</Link>
                                                <Link to={`/talent-matches/${job.id}`} onClick={() => setOpenMenuId(null)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-brand-700 hover:bg-brand-50 transition-colors"><Sparkles className="w-3.5 h-3.5" />Find AI Matches</Link>
                                                {job.active && <button onClick={() => handleCloseJob(job.id)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition-colors"><Lock className="w-3.5 h-3.5" />Close</button>}
                                                {!job.active && <button onClick={() => handleReopenJob(job.id)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-green-700 hover:bg-green-50 transition-colors"><Unlock className="w-3.5 h-3.5" />Reopen</button>}
                                                <button onClick={() => handleDeleteJob(job.id)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3 pr-8">
                                        <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors duration-200 leading-tight">{job.title}</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">{job.company}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {job.location && <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full"><MapPin className="w-3 h-3" />{job.location}</span>}
                                        {job.workType && <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">{job.workType}</span>}
                                        {job.workMode && <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">{job.workMode}</span>}
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold ${job.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{job.active ? 'Active' : 'Closed'}</span>
                                        <span>👁 {job.viewCount || 0} views</span>
                                        <span>{new Date(job.postedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} onClick={() => setCurrentPage(p)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === currentPage ? 'bg-brand-700 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{p}</button>
                                ))}
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default MyJobs;
