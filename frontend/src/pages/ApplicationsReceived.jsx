import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API, { getProfilePictureUrl } from '../services/api';
import { Users, FileText, CheckCircle, XCircle, MessageSquare, User, X, Filter, ChevronLeft, ChevronRight, StickyNote } from 'lucide-react';
import { updateApplicationNotes } from '../services/api';
import CustomSelect from '../components/CustomSelect';
import BackButton from '../components/BackButton';

const statusColor = { PENDING: 'bg-amber-100 text-amber-700', ACCEPTED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-700' };
const ITEMS_PER_PAGE = 6;

function ApplicationsReceived() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(null);
    const [modalJobId, setModalJobId] = useState(null);
    const [resumePreviewUrl, setResumePreviewUrl] = useState(null);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [jobRoleFilter, setJobRoleFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [notes, setNotes] = useState({});
    const [savedNotes, setSavedNotes] = useState({});

    useEffect(() => { fetchApplications(); }, []);
    useEffect(() => { setCurrentPage(1); }, [statusFilter, jobRoleFilter]);

    const handleOpenModal = (group) => {
        setModalJobId(group.job?.id);
        const init = {};
        group.applications.forEach(a => { init[a.id] = a.employerNotes || ''; });
        setNotes(prev => ({ ...prev, ...init }));
    };

    const fetchApplications = async () => {
        try {
            const r = await API.get('/applications/employer/applications');
            const data = r.data?.data || (Array.isArray(r.data) ? r.data : []);
            setApplications([...data].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)));
        } catch { setError('Failed to load applications'); }
        finally { setLoading(false); }
    };

    const updateStatus = async (applicationId, newStatus) => {
        setUpdating(applicationId);
        try {
            const r = await API.put(`/applications/${applicationId}/status`, { status: newStatus });
            if (r.data.success) setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, status: newStatus } : a));
        } catch { alert('Failed to update status'); }
        finally { setUpdating(null); }
    };

    const openResumePreview = async (applicationId) => {
        try {
            const r = await API.get(`/applications/${applicationId}/resume`, { responseType: 'blob' });
            setResumePreviewUrl(URL.createObjectURL(new Blob([r.data], { type: r.headers['content-type'] || 'application/octet-stream' })));
        } catch { alert('Failed to load resume.'); }
    };

    const closeResumePreview = () => { if (resumePreviewUrl) URL.revokeObjectURL(resumePreviewUrl); setResumePreviewUrl(null); };

    const uniqueJobRoles = [...new Set(applications.map(a => a.job?.title).filter(Boolean))];

    const allGrouped = applications.reduce((groups, app) => {
        const jobId = app.job?.id;
        if (!groups[jobId]) groups[jobId] = { job: app.job, applications: [] };
        groups[jobId].applications.push(app);
        return groups;
    }, {});

    const visibleGroups = Object.values(allGrouped).filter(g => {
        const roleMatch = !jobRoleFilter || g.job?.title === jobRoleFilter;
        const statusMatch = statusFilter === 'ALL' || g.applications.some(a => a.status === statusFilter);
        return roleMatch && statusMatch;
    }).map(g => ({ ...g, applications: statusFilter === 'ALL' ? g.applications : g.applications.filter(a => a.status === statusFilter) }));

    const totalPages = Math.ceil(visibleGroups.length / ITEMS_PER_PAGE);
    const paginatedGroups = visibleGroups.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const modalGroup = modalJobId ? visibleGroups.find(g => g.job?.id === modalJobId) : null;

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <BackButton />
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Applications Received</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{applications.length} total application{applications.length !== 1 ? 's' : ''}</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
                    <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <CustomSelect
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                            { value: 'ALL', label: 'All Statuses' },
                            { value: 'PENDING', label: 'Pending' },
                            { value: 'ACCEPTED', label: 'Accepted' },
                            { value: 'REJECTED', label: 'Rejected' },
                        ]}
                    />
                    <CustomSelect
                        value={jobRoleFilter}
                        onChange={setJobRoleFilter}
                        placeholder="All Job Roles"
                        options={[{ value: '', label: 'All Job Roles' }, ...uniqueJobRoles.map(r => ({ value: r, label: r }))]}
                    />
                    {(statusFilter !== 'ALL' || jobRoleFilter) && (
                        <button onClick={() => { setStatusFilter('ALL'); setJobRoleFilter(''); }} className="text-sm text-brand-700 hover:text-brand-900 font-medium flex items-center gap-1"><X className="w-3.5 h-3.5" />Clear</button>
                    )}
                </div>

                {error && <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

                {visibleGroups.length === 0 ? (
                    <div className="bg-brand-100 rounded-2xl border border-gray-200 text-center py-20">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No applications yet</h3>
                        <p className="text-sm text-gray-400">Applications will appear here when job seekers apply to your listings.</p>
                    </div>
                ) : (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {paginatedGroups.map(group => (
                            <div key={group.job?.id} className="bg-gradient-to-br from-white to-brand-100 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-200 transition-all duration-200 p-5 cursor-pointer group" onClick={() => handleOpenModal(group)}>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors duration-200">{group.job?.title || 'Unknown Job'}</h3>
                                        <p className="text-sm text-gray-500">{group.job?.company}</p>
                                    </div>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 text-brand-900 text-xs font-semibold rounded-full">
                                        <Users className="w-3.5 h-3.5" />{group.applications.length}
                                    </span>
                                </div>
                                <div className="flex gap-1.5">
                                    {['PENDING', 'ACCEPTED', 'REJECTED'].map(s => {
                                        const count = group.applications.filter(a => a.status === s).length;
                                        if (count === 0) return null;
                                        return <span key={s} className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[s]}`}>{count} {s.charAt(0) + s.slice(1).toLowerCase()}</span>;
                                    })}
                                </div>
                                <p className="text-xs text-brand-700 font-medium mt-3 group-hover:translate-x-1 transition-transform duration-200 inline-block">Click to review →</p>
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

            {/* Modal */}
            {modalGroup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalJobId(null)}>
                    <div className="bg-brand-100 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h3 className="font-bold text-gray-900">{modalGroup.job?.title}</h3>
                                <p className="text-sm text-gray-500">{modalGroup.applications.length} applicant{modalGroup.applications.length !== 1 ? 's' : ''}</p>
                            </div>
                            <button onClick={() => setModalJobId(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="overflow-y-auto p-6 space-y-4">
                            {modalGroup.applications.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-8">No applicants yet.</p>
                            ) : (
                                modalGroup.applications.map(app => (
                                    <div key={app.id} className="border border-gray-200 rounded-xl p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            {app.jobSeeker?.profilePicturePath ? (
                                                <img src={getProfilePictureUrl(app.jobSeeker.id)} alt={app.jobSeeker.name} className="w-10 h-10 rounded-full object-cover border border-gray-100 flex-shrink-0" />
                                            ) : (
                                                <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center text-brand-900 font-bold text-sm flex-shrink-0">
                                                    {(app.jobSeeker?.name || 'A')[0].toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 text-sm">{app.jobSeeker?.name || 'Anonymous'}</p>
                                                <p className="text-xs text-gray-500">{app.jobSeeker?.email} · {new Date(app.appliedAt).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`flex-shrink-0 inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor[app.status] || 'bg-gray-100 text-gray-600'}`}>{app.status || 'PENDING'}</span>
                                        </div>
                                        {app.coverLetter && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-3 italic line-clamp-3">"{app.coverLetter}"</p>}
                                        <div className="flex flex-wrap gap-2">
                                            <Link to={`/seeker-profile/${app.jobSeeker?.id}`} state={{ name: app.jobSeeker?.name, email: app.jobSeeker?.email }} onClick={() => setModalJobId(null)}>
                                                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><User className="w-3 h-3" />Profile</button>
                                            </Link>
                                            {app.resumePath && (
                                                <button onClick={() => openResumePreview(app.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><FileText className="w-3 h-3" />Resume</button>
                                            )}
                                            <button onClick={() => { setModalJobId(null); navigate(`/messages?userId=${app.jobSeeker?.id}&name=${encodeURIComponent(app.jobSeeker?.name || 'Applicant')}`); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-900 bg-brand-50 hover:bg-brand-50 rounded-lg transition-colors"><MessageSquare className="w-3 h-3" />Message</button>
                                            {app.status === 'PENDING' && (
                                                <>
                                                    <button onClick={() => updateStatus(app.id, 'ACCEPTED')} disabled={updating === app.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"><CheckCircle className="w-3 h-3" />{updating === app.id ? '...' : 'Accept'}</button>
                                                    <button onClick={() => updateStatus(app.id, 'REJECTED')} disabled={updating === app.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"><XCircle className="w-3 h-3" />{updating === app.id ? '...' : 'Reject'}</button>
                                                </>
                                            )}
                                        </div>
                                        <div className="mt-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-xs font-medium text-gray-400 flex items-center gap-1"><StickyNote className="w-3 h-3" />Private Notes</p>
                                                {savedNotes[app.id] && <span className="text-xs text-green-600 font-medium">✓ Saved</span>}
                                            </div>
                                            <textarea
                                                value={notes[app.id] || ''}
                                                onChange={e => { setNotes(prev => ({ ...prev, [app.id]: e.target.value })); setSavedNotes(prev => ({ ...prev, [app.id]: false })); }}
                                                onBlur={() => {
                                                    const val = notes[app.id] || '';
                                                    updateApplicationNotes(app.id, val)
                                                        .then(() => {
                                                            setApplications(prev => prev.map(a => a.id === app.id ? { ...a, employerNotes: val } : a));
                                                            setSavedNotes(prev => ({ ...prev, [app.id]: true }));
                                                        })
                                                        .catch(() => {});
                                                }}
                                                placeholder="Add private notes (only you can see this)..."
                                                rows={2}
                                                className="w-full text-xs text-gray-600 border border-amber-200 rounded-lg p-2 resize-none bg-amber-50/60 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Resume preview */}
            {resumePreviewUrl && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closeResumePreview}>
                    <div className="bg-brand-100 rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                            <span className="font-medium text-gray-800">Resume Preview</span>
                            <button onClick={closeResumePreview} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <iframe src={resumePreviewUrl} className="flex-1 w-full rounded-b-2xl" title="Resume Preview" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default ApplicationsReceived;
