import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getBookmarks, toggleBookmark } from '../utils/bookmarks';
import { getJobById } from '../services/api';
import { BookmarkCheck, MapPin, Trash2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import BackButton from '../components/BackButton';

const ITEMS_PER_PAGE = 6;

function BookmarkedJobs() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const ids = getBookmarks(user.id);
        if (ids.length === 0) { setLoading(false); return; }
        Promise.allSettled(ids.map(id => getJobById(id))).then(results => {
            setJobs(results.filter(r => r.status === 'fulfilled').map(r => r.value.data.data).filter(Boolean));
        }).finally(() => setLoading(false));
    }, []);

    const handleRemove = (jobId) => {
        toggleBookmark(user.id, jobId);
        setJobs(prev => {
            const updated = prev.filter(j => j.id !== jobId);
            if (currentPage > Math.ceil(updated.length / ITEMS_PER_PAGE)) setCurrentPage(p => Math.max(1, p - 1));
            return updated;
        });
    };

    const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE);
    const paginatedJobs = jobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <BackButton />
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Saved Jobs</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{jobs.length} saved job{jobs.length !== 1 ? 's' : ''}</p>
                    </div>
                    <Link to="/jobs" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">Browse Jobs</Link>
                </div>

                {jobs.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 text-center py-20">
                        <BookmarkCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No saved jobs</h3>
                        <p className="text-sm text-gray-400 mb-5">Browse jobs and save the ones you're interested in!</p>
                        <Link to="/jobs" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-900 transition-colors">Browse Jobs</Link>
                    </div>
                ) : (
                    <>
                    <div className="space-y-3">
                        {paginatedJobs.map(job => (
                            <div key={job.id} className="bg-gradient-to-br from-white to-brand-100 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-200 transition-all duration-200 p-5 flex items-center justify-between gap-4 group">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors duration-200">{job.title}</h3>
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${job.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{job.active ? 'Active' : 'Closed'}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">{job.company}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {job.location && <span className="inline-flex items-center gap-1 text-xs text-gray-400"><MapPin className="w-3 h-3" />{job.location}</span>}
                                        {job.salaryRange && <span className="text-xs font-semibold text-brand-700">{job.salaryRange}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <Link to={`/jobs/${job.id}`}>
                                        <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-700 hover:bg-brand-900 text-white text-xs font-semibold rounded-lg transition-all duration-150 hover:shadow-md active:scale-95"><ExternalLink className="w-3.5 h-3.5" />View</button>
                                    </Link>
                                    <button onClick={() => handleRemove(job.id)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-all duration-150 active:scale-95"><Trash2 className="w-3.5 h-3.5" />Remove</button>
                                </div>
                            </div>
                        ))}
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

export default BookmarkedJobs;
