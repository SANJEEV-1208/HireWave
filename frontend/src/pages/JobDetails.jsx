import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API, { applyForJob, getUserById, generateCoverLetter } from '../services/api';
import { isBookmarked, toggleBookmark } from '../utils/bookmarks';
import { MapPin, Building2, Briefcase, Monitor, Calendar, Bookmark, BookmarkCheck, ArrowLeft, Zap, Sparkles, CheckCircle, Upload, FileText, Send, X } from 'lucide-react';
import BackButton from '../components/BackButton';

function computeMatch(job, userSkills) {
    if (!userSkills || userSkills.length === 0) return null;
    try {
        const required = job.requiredSkills ? JSON.parse(job.requiredSkills) : null;
        if (required && required.length > 0) {
            const matched = required.filter(r => userSkills.some(s => s.toLowerCase() === r.toLowerCase()));
            return { matched: matched.length, total: required.length, pct: Math.round(matched.length / required.length * 100) };
        }
    } catch {}
    const haystack = ((job.title || '') + ' ' + (job.description || '')).toLowerCase();
    const matched = userSkills.filter(s => haystack.includes(s.toLowerCase()));
    return { matched: matched.length, total: userSkills.length, pct: Math.round(matched.length / userSkills.length * 100) };
}

function JobDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, isJobSeeker } = useAuth();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [applying, setApplying] = useState(false);
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [generatingCL, setGeneratingCL] = useState(false);
    const [resumeChoice, setResumeChoice] = useState('saved');
    const [newResumeFile, setNewResumeFile] = useState(null);
    const [applicationStatus, setApplicationStatus] = useState(null);
    const [applyError, setApplyError] = useState('');
    const [applySuccess, setApplySuccess] = useState('');
    const [bookmarked, setBookmarked] = useState(false);
    const [defaultResumePath, setDefaultResumePath] = useState('');
    const [seekerProfileIncomplete, setSeekerProfileIncomplete] = useState(false);
    const [userSkills, setUserSkills] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchJobDetails();
        if (isAuthenticated && isJobSeeker()) { checkApplicationStatus(); loadDefaultResume(); }
    }, [id]);

    useEffect(() => {
        if (isAuthenticated && isJobSeeker() && user?.id && id) setBookmarked(isBookmarked(user.id, parseInt(id)));
    }, [id, user]);

    const fetchJobDetails = async () => {
        try { const r = await API.get(`/jobs/${id}`); setJob(r.data.data); }
        catch { setError('Failed to load job details.'); }
        finally { setLoading(false); }
    };

    const checkApplicationStatus = async () => {
        try {
            const r = await API.get('/applications/my-applications');
            const app = r.data.data?.find(a => a.job?.id === parseInt(id));
            if (app) setApplicationStatus(app.status);
        } catch {}
    };

    const loadDefaultResume = async () => {
        try {
            const res = await getUserById(user.id);
            const data = res.data.data || res.data;
            setDefaultResumePath(data.resumePath || '');
            const skills = data.skills ? JSON.parse(data.skills) : [];
            setUserSkills(skills);
            setSeekerProfileIncomplete(!data.name || !data.phone || skills.length === 0 || !data.resumePath);
        } catch {}
    };

    const handleGenerateCoverLetter = async () => {
        setGeneratingCL(true); setApplyError('');
        try { const res = await generateCoverLetter(job.id); setCoverLetter(res.data?.data || ''); }
        catch { setApplyError('Failed to generate cover letter. Please try again.'); }
        finally { setGeneratingCL(false); }
    };

    const handleApplyClick = () => {
        setApplyError('');
        if (seekerProfileIncomplete) {
            setApplyError('Your profile is incomplete. Please add your phone number, at least one skill, and upload a resume in My Profile before applying.');
            return;
        }
        setShowApplyForm(true);
    };

    const submitApplication = async () => {
        if (resumeChoice === 'upload' && !newResumeFile) { setApplyError('Please select a resume file to upload.'); return; }
        if (resumeChoice === 'saved' && !defaultResumePath) { setApplyError('No saved resume found. Please upload one in My Profile or choose to upload a new resume.'); return; }
        setApplying(true); setApplyError(''); setApplySuccess('');
        try {
            const file = resumeChoice === 'upload' ? newResumeFile : null;
            const r = await applyForJob(id, file, coverLetter);
            if (r.data.success) {
                setApplySuccess('Application submitted successfully!');
                setShowApplyForm(false); setCoverLetter(''); setNewResumeFile(null); setResumeChoice('saved');
                checkApplicationStatus();
                setTimeout(() => setApplySuccess(''), 4000);
            }
        } catch (err) { setApplyError(err.response?.data?.message || 'Failed to submit application'); }
        finally { setApplying(false); }
    };

    const statusBadge = (status) => {
        const map = { PENDING: 'bg-amber-100 text-amber-700', ACCEPTED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-700' };
        return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error || !job) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <p className="text-lg font-semibold text-gray-800 mb-2">Job Not Found</p>
                <p className="text-sm text-gray-500 mb-4">{error || 'This job listing may have been removed.'}</p>
                <Link to="/jobs" className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-900 transition-colors">← Back to Jobs</Link>
            </div>
        </div>
    );

    const match = isAuthenticated && isJobSeeker() ? computeMatch(job, userSkills) : null;
    const deadline = job.deadline ? Math.ceil((new Date(job.deadline) - new Date()) / 86400000) : null;

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <BackButton />

                <div className="bg-brand-100 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-8 border-b border-gray-100">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-14 h-14 bg-gradient-to-br from-brand-50 to-brand-200 rounded-xl flex items-center justify-center text-brand-900 font-bold text-xl flex-shrink-0">
                                {(job.company || 'C')[0].toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">{job.title}</h1>
                                <Link to={`/company/${job.employer?.id}`} className="text-base font-medium text-brand-700 hover:text-brand-900 transition-colors">{job.company}</Link>
                            </div>
                            {isAuthenticated && isJobSeeker() && (
                                <button onClick={() => { const u = toggleBookmark(user.id, parseInt(id)); setBookmarked(u.includes(parseInt(id))); }} className={`p-2.5 rounded-xl transition-all ${bookmarked ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-500 hover:bg-brand-50 hover:text-brand-700'}`}>
                                    {bookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {job.location && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
                            {job.workType && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full"><Briefcase className="w-3.5 h-3.5" />{job.workType}</span>}
                            {job.workMode && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full"><Monitor className="w-3.5 h-3.5" />{job.workMode}</span>}
                            {job.experience && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full">🎯 {job.experience}</span>}
                            {job.salaryRange && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-900 text-sm font-semibold rounded-full">💰 {job.salaryRange}</span>}
                            {deadline !== null && (
                                deadline <= 0 ? <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-full">Deadline Passed</span>
                                : deadline === 0 ? <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-full"><Calendar className="w-3.5 h-3.5" />Closes Today</span>
                                : deadline <= 3 ? <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full"><Calendar className="w-3.5 h-3.5" />Closes in {deadline}d</span>
                                : <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full"><Calendar className="w-3.5 h-3.5" />{new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            )}
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full ${job.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{job.active ? '✓ Active' : '✗ Closed'}</span>
                        </div>

                        {/* Match banner */}
                        {match && match.matched > 0 && (
                            <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${match.pct >= 70 ? 'bg-green-50 text-green-700 border border-green-200' : match.pct >= 40 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                                <Zap className="w-4 h-4" />
                                You match <strong className="mx-1">{match.matched} of {match.total} skills</strong> for this role · {match.pct}%
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-3 mt-5">
                            {isAuthenticated && isJobSeeker() && job.active && !applicationStatus && !showApplyForm && (
                                <button onClick={handleApplyClick} className="px-5 py-2.5 bg-brand-700 hover:bg-brand-900 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
                                    <Send className="w-4 h-4" />Apply Now
                                </button>
                            )}
                            {applicationStatus && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                                    Your application: {statusBadge(applicationStatus)}
                                </div>
                            )}
                            {isAuthenticated && job.employer?.id === user?.id && (
                                <Link to={`/edit-job/${job.id}`} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors">✏️ Edit Job</Link>
                            )}
                        </div>
                        {applySuccess && <div className="mt-3 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700"><CheckCircle className="w-4 h-4" />{applySuccess}</div>}
                        {applyError && <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{applyError}</div>}
                    </div>

                    {/* Apply form */}
                    {showApplyForm && (
                        <div className="p-8 border-b border-gray-100 bg-brand-50/30">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-gray-900">Apply for {job.title}</h3>
                                <button onClick={() => { setShowApplyForm(false); setApplyError(''); setCoverLetter(''); setNewResumeFile(null); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700">Cover Letter <span className="text-gray-400 font-normal">(optional)</span></label>
                                        <button type="button" onClick={handleGenerateCoverLetter} disabled={generatingCL} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-full transition-opacity disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #598392, #01161e)' }}>
                                            <Sparkles className="w-3.5 h-3.5" />{generatingCL ? 'Generating...' : 'Generate with AI'}
                                        </button>
                                    </div>
                                    <textarea rows={5} value={coverLetter} onChange={e => setCoverLetter(e.target.value)} placeholder="Introduce yourself and explain why you're a great fit..." maxLength={2000}
                                        className="w-full px-3.5 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400 bg-white resize-none" />
                                    <p className="text-xs text-gray-400 mt-1">{coverLetter.length}/2000 characters</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Resume</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[{ value: 'saved', label: 'Use saved resume', note: defaultResumePath ? '✓ on file' : '✗ none' }, { value: 'upload', label: 'Upload new resume', note: null }].map(opt => (
                                            <label key={opt.value} className={`cursor-pointer flex items-center gap-2.5 p-3.5 rounded-xl border-2 transition-all ${resumeChoice === opt.value ? 'border-brand-700 bg-white' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                                <input type="radio" name="resumeChoice" value={opt.value} checked={resumeChoice === opt.value} onChange={() => setResumeChoice(opt.value)} className="sr-only" />
                                                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${resumeChoice === opt.value ? 'border-brand-700 bg-brand-700' : 'border-gray-300'}`}>
                                                    {resumeChoice === opt.value && <div className="w-full h-full rounded-full bg-white scale-50" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">{opt.label}</p>
                                                    {opt.note && <p className={`text-xs ${defaultResumePath ? 'text-green-600' : 'text-red-500'}`}>{opt.note}</p>}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    {resumeChoice === 'upload' && (
                                        <div className="mt-3">
                                            <label className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-200 transition-colors">
                                                <Upload className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">{newResumeFile ? newResumeFile.name : 'Choose file (PDF, DOC, DOCX · max 10MB)'}</span>
                                                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={e => setNewResumeFile(e.target.files[0] || null)} className="sr-only" />
                                            </label>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={submitApplication} disabled={applying} className="px-5 py-2.5 bg-brand-700 hover:bg-brand-900 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
                                        <Send className="w-4 h-4" />{applying ? 'Submitting...' : 'Submit Application'}
                                    </button>
                                    <button onClick={() => { setShowApplyForm(false); setApplyError(''); setCoverLetter(''); setNewResumeFile(null); setResumeChoice('saved'); }} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Body */}
                    <div className="p-8 space-y-8">
                        {(() => {
                            try {
                                const skills = job.requiredSkills ? JSON.parse(job.requiredSkills) : [];
                                if (skills.length === 0) return null;
                                return (
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-brand-700" />Required Skills
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {skills.map(skill => {
                                                const has = isAuthenticated && isJobSeeker() && userSkills.some(s => s.toLowerCase() === skill.toLowerCase());
                                                return (
                                                    <span key={skill} className={`px-3 py-1.5 text-sm font-medium rounded-full ${has ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700'}`}>
                                                        {has ? '✓ ' : ''}{skill}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        {isAuthenticated && isJobSeeker() && (
                                            <p className="text-xs text-gray-400 mt-2">Skills in green are ones you already have</p>
                                        )}
                                    </div>
                                );
                            } catch { return null; }
                        })()}
                        <div>
                            <h2 className="text-base font-bold text-gray-900 mb-3">Job Description</h2>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                        </div>
                        {job.employer && (
                            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                                <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-400" />About the Employer</h2>
                                <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Company:</span> {job.employer.name}</p>
                                <p className="text-sm text-gray-600 mt-1"><span className="font-medium text-gray-700">Email:</span> {job.employer.email}</p>
                            </div>
                        )}
                        <div className="text-xs text-gray-400">Posted {new Date(job.postedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JobDetails;
