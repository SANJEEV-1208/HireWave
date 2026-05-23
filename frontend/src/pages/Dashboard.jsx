import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Briefcase, PlusCircle, Eye, Pencil, X, CheckCircle, Users, BarChart2, Search, BookmarkCheck, FileText, UserCircle } from 'lucide-react';

function Dashboard() {
    const { user, isJobSeeker, isEmployer, isAdmin } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [jobsError, setJobsError] = useState('');

    useEffect(() => { if (isEmployer() && user?.id) fetchMyJobs(); }, [user]);

    const fetchMyJobs = async () => {
        setJobsLoading(true);
        try { const r = await api.get(`/jobs/employer/${user.id}`); setJobs(r.data.data || []); }
        catch { setJobsError('Failed to load your jobs'); }
        finally { setJobsLoading(false); }
    };

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Delete this job?')) return;
        try { await api.delete(`/jobs/${jobId}`); setJobs(jobs.filter(j => j.id !== jobId)); }
        catch { alert('Failed to delete job'); }
    };

    const handleCloseJob = async (jobId) => {
        try { await api.patch(`/jobs/${jobId}/close`); fetchMyJobs(); }
        catch { alert('Failed to close job'); }
    };

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome banner */}
                <div className="bg-gradient-to-br from-brand-700 to-brand-900 rounded-2xl p-8 text-white mb-8">
                    <p className="text-brand-200 text-sm font-medium mb-1">{greeting()},</p>
                    <h1 className="text-3xl font-bold mb-1">{user?.name || 'User'} 👋</h1>
                    <p className="text-brand-200 text-sm">
                        {isEmployer() ? 'Manage your job listings and applications from your dashboard.' : isAdmin() ? 'Monitor platform activity and manage users.' : 'Track your applications and discover new opportunities.'}
                    </p>
                </div>

                {/* Employer section */}
                {isEmployer() && (
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-gray-900">Your Job Listings</h2>
                            <Link to="/post-job" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700 hover:bg-brand-900 text-white text-sm font-semibold rounded-lg transition-colors">
                                <PlusCircle className="w-4 h-4" />Post a Job
                            </Link>
                        </div>
                        {jobsLoading ? (
                            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" /></div>
                        ) : jobsError ? (
                            <div className="text-center py-12 text-red-600 text-sm">{jobsError}</div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center py-20 bg-brand-100 rounded-2xl border border-gray-200">
                                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">No jobs posted yet</h3>
                                <p className="text-sm text-gray-400 mb-5">Post your first job to start receiving applications</p>
                                <Link to="/post-job" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-900 transition-colors">
                                    <PlusCircle className="w-4 h-4" />Post a Job
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {jobs.map(job => (
                                    <div key={job.id} className="bg-brand-100 rounded-2xl border border-gray-200 shadow-sm p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{job.title}</h3>
                                                <p className="text-sm text-gray-500">{job.company}</p>
                                            </div>
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${job.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {job.active ? 'Active' : 'Closed'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            <Link to={`/jobs/${job.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><Eye className="w-3.5 h-3.5" />View</Link>
                                            <Link to={`/edit-job/${job.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" />Edit</Link>
                                            {job.active && <button onClick={() => handleCloseJob(job.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"><X className="w-3.5 h-3.5" />Close</button>}
                                            <button onClick={() => handleDeleteJob(job.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><X className="w-3.5 h-3.5" />Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {jobs.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'Applications', to: '/applications-received', icon: Users },
                                    { label: 'Analytics', to: '/analytics', icon: BarChart2 },
                                    { label: 'Post Job', to: '/post-job', icon: PlusCircle },
                                    { label: 'My Jobs', to: '/my-jobs', icon: Briefcase },
                                ].map(a => (
                                    <Link key={a.to} to={a.to} className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-900 transition-all">
                                        <a.icon className="w-4 h-4" />{a.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Job Seeker section */}
                {isJobSeeker() && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: Search, label: 'Browse Jobs', desc: 'Find your next opportunity', to: '/jobs', color: 'bg-blue-50 text-blue-600' },
                            { icon: FileText, label: 'My Applications', desc: 'Track your submissions', to: '/my-applications', color: 'bg-purple-50 text-purple-600' },
                            { icon: BookmarkCheck, label: 'Saved Jobs', desc: 'Jobs you bookmarked', to: '/bookmarks', color: 'bg-green-50 text-green-600' },
                            { icon: UserCircle, label: 'My Profile', desc: 'Update your skills & resume', to: '/profile', color: 'bg-orange-50 text-orange-600' },
                        ].map(a => (
                            <Link key={a.to} to={a.to} className="bg-brand-100 rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-brand-200 transition-all group">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${a.color}`}>
                                    <a.icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-brand-700 transition-colors">{a.label}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Admin section */}
                {isAdmin() && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { icon: Users, label: 'All Users', desc: 'View and manage platform users', color: 'bg-blue-50 text-blue-600' },
                            { icon: Briefcase, label: 'All Jobs', desc: 'Monitor all job listings', color: 'bg-brand-50 text-brand-700' },
                            { icon: FileText, label: 'All Applications', desc: 'Review application activity', color: 'bg-purple-50 text-purple-600' },
                            { icon: BarChart2, label: 'Platform Stats', desc: 'View growth metrics', color: 'bg-green-50 text-green-600' },
                        ].map((a, i) => (
                            <div key={i} className="bg-brand-100 rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.color}`}><a.icon className="w-5 h-5" /></div>
                                <div><h3 className="font-semibold text-gray-800">{a.label}</h3><p className="text-xs text-gray-500 mt-0.5">{a.desc}</p></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
