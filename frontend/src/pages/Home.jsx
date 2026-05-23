import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getJobs, getUserById, getProfilePictureUrl, getAIRecommendations } from '../services/api';
import { getBookmarks, toggleBookmark } from '../utils/bookmarks';
import { Search, MapPin, Building2, Briefcase, Monitor, Calendar, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Zap, Sparkles, X } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

const JOBS_PER_PAGE = 6;

function computeMatch(job, skills) {
    if (!skills || skills.length === 0) return null;
    const haystack = ((job.title || '') + ' ' + (job.description || '')).toLowerCase();
    const matched = skills.filter(s => haystack.includes(s.toLowerCase()));
    return { matched: matched.length, total: skills.length, pct: Math.round(matched.length / skills.length * 100) };
}

function DeadlineBadge({ deadline }) {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline) - new Date()) / 86400000);
    if (days < 0) return null;
    if (days === 0) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Closes Today</span>;
    if (days <= 3) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Closes in {days}d</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"><Calendar className="w-3 h-3" />{new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>;
}

function Home() {
    const { user, isAuthenticated, isJobSeeker } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [recommendationsLoading, setRecommendationsLoading] = useState(false);
    const [userSkills, setUserSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ title: '', company: '', location: '', workType: '', workMode: '', experience: '', salary: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [bookmarkedIds, setBookmarkedIds] = useState([]);

    useEffect(() => { fetchJobs(); }, []);
    useEffect(() => {
        if (isAuthenticated && isJobSeeker() && user?.id) setBookmarkedIds(getBookmarks(user.id));
    }, [isAuthenticated, user]);

    const fetchJobs = async () => {
        try {
            const response = await getJobs();
            let jobsData = response.data?.data || (Array.isArray(response.data) ? response.data : []);
            setJobs(jobsData);
            if (isAuthenticated && isJobSeeker() && user?.id) {
                try {
                    const res = await getUserById(user.id);
                    const data = res.data?.data || res.data;
                    const skills = data.skills ? JSON.parse(data.skills) : [];
                    setUserSkills(skills);
                } catch {}
                fetchAIRecommendations();
            }
        } catch { setError('Failed to load jobs. Please try again later.'); }
        finally { setLoading(false); }
    };

    const fetchAIRecommendations = async () => {
        setRecommendationsLoading(true);
        try {
            const res = await getAIRecommendations();
            setRecommendedJobs(res.data?.data || []);
        } catch {
            setRecommendedJobs([]);
        } finally {
            setRecommendationsLoading(false);
        }
    };

    const handleFilterChange = (e) => { setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); setCurrentPage(1); };
    const clearFilters = () => { setFilters({ title: '', company: '', location: '', workType: '', workMode: '', experience: '', salary: '' }); setCurrentPage(1); };
    const handleBookmark = (e, jobId) => { e.preventDefault(); e.stopPropagation(); setBookmarkedIds(toggleBookmark(user.id, jobId)); };
    const hasActiveFilters = Object.values(filters).some(v => v !== '');
    const recommendedIds = new Set(recommendedJobs.map(j => j.id));
    const filteredJobs = jobs.filter(job => {
        if (recommendedIds.has(job.id)) return false;
        return (
            (!filters.title || job.title?.toLowerCase().includes(filters.title.toLowerCase())) &&
            (!filters.company || job.company?.toLowerCase().includes(filters.company.toLowerCase())) &&
            (!filters.location || job.location?.toLowerCase().includes(filters.location.toLowerCase())) &&
            (!filters.workType || job.workType === filters.workType) &&
            (!filters.workMode || job.workMode === filters.workMode) &&
            (!filters.experience || job.experience === filters.experience) &&
            (!filters.salary || job.salaryRange?.toLowerCase().includes(filters.salary.toLowerCase()))
        );
    });
    const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
    const paginatedJobs = filteredJobs.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE);

    const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white placeholder:text-gray-400";

    const JobCard = ({ job }) => {
        const match = isJobSeeker() ? computeMatch(job, userSkills) : null;
        const isBookmarked = bookmarkedIds.includes(job.id);
        return (
            <div className="bg-gradient-to-br from-white to-brand-100 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-200 transition-all duration-200 p-6 flex flex-col group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {job.employer?.profilePicturePath ? (
                            <img src={getProfilePictureUrl(job.employer.id)} alt={job.company} className="w-11 h-11 rounded-xl object-cover border border-gray-100 transition-transform duration-200 group-hover:scale-105" />
                        ) : (
                            <div className="w-11 h-11 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white font-bold text-base transition-transform duration-200 group-hover:scale-105">
                                {(job.company || 'C')[0].toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-brand-700 transition-colors duration-200 leading-tight">{job.title || 'Untitled'}</h3>
                            <p className="text-sm text-gray-500">{job.company || 'Unknown Company'}</p>
                        </div>
                    </div>
                    {isAuthenticated && isJobSeeker() && (
                        <button onClick={(e) => handleBookmark(e, job.id)} className={`p-1.5 rounded-lg transition-all duration-150 active:scale-75 hover:scale-110 ${isBookmarked ? 'text-brand-700 bg-brand-50' : 'text-gray-400 hover:text-brand-700 hover:bg-brand-50'}`} title={isBookmarked ? 'Remove bookmark' : 'Save job'}>
                            {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                    {job.location && <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-white/70 px-2.5 py-1 rounded-full transition-colors duration-150 hover:bg-white"><MapPin className="w-3 h-3" />{job.location}</span>}
                    {job.workType && <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-white/70 px-2.5 py-1 rounded-full transition-colors duration-150 hover:bg-white"><Briefcase className="w-3 h-3" />{job.workType}</span>}
                    {job.workMode && <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-white/70 px-2.5 py-1 rounded-full transition-colors duration-150 hover:bg-white"><Monitor className="w-3 h-3" />{job.workMode}</span>}
                    <DeadlineBadge deadline={job.deadline} />
                </div>
                {match && match.matched > 0 && (
                    <div className="mb-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${match.pct >= 70 ? 'bg-green-100 text-green-700' : match.pct >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                            <Zap className="w-3 h-3" />{match.matched}/{match.total} skills match · {match.pct}%
                        </span>
                    </div>
                )}
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                    {job.salaryRange ? (
                        <span className="text-sm font-semibold text-brand-700">{job.salaryRange}</span>
                    ) : <span />}
                    <Link to={`/jobs/${job.id}`} className="group/link text-sm font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1 transition-colors duration-150">
                        View details <ChevronRight className="w-4 h-4 transition-transform duration-150 group-hover/link:translate-x-1" />
                    </Link>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-brand-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-500">Loading jobs...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <p className="text-red-600 font-semibold mb-3">{error}</p>
                <button onClick={fetchJobs} className="px-4 py-2 bg-brand-700 hover:bg-brand-900 text-white text-sm font-medium rounded-lg transition-colors">Try Again</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            {!isAuthenticated && (
                <div className="bg-gradient-to-br from-brand-700 to-brand-900 text-white py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold mb-6 tracking-wide">🚀 Find your next opportunity</span>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your <span className="text-brand-200">Dream Job</span></h1>
                        <p className="text-lg text-brand-50 max-w-xl mx-auto">Discover job opportunities with top companies. Apply in seconds.</p>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* AI Recommended */}
                {isAuthenticated && isJobSeeker() && (recommendationsLoading || recommendedJobs.length > 0) && (
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-5">
                            <Sparkles className="w-5 h-5 text-brand-700" />
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Recommended for You</h2>
                                <p className="text-xs text-gray-500">
                                    {recommendationsLoading ? 'AI is finding your best matches...' : 'Picked by AI based on your profile'}
                                </p>
                            </div>
                        </div>
                        {recommendationsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-brand-100 rounded-2xl border border-gray-200 p-5 animate-pulse">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
                                        <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {recommendedJobs.map(job => <JobCard key={job.id} job={job} />)}
                            </div>
                        )}
                        <div className="border-t border-gray-200 mt-10" />
                    </div>
                )}

                {/* Header + Filters */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Latest Opportunities</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {hasActiveFilters ? `${filteredJobs.length} result${filteredJobs.length !== 1 ? 's' : ''} found` : `${jobs.length} job${jobs.length !== 1 ? 's' : ''} available`}
                        </p>
                    </div>
                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            <X className="w-4 h-4" />Clear filters
                        </button>
                    )}
                </div>

                {/* Filter bar */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" name="title" value={filters.title} onChange={handleFilterChange} placeholder="Job title" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white placeholder:text-gray-400" />
                        </div>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" name="company" value={filters.company} onChange={handleFilterChange} placeholder="Company" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white placeholder:text-gray-400" />
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" name="location" value={filters.location} onChange={handleFilterChange} placeholder="Location" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white placeholder:text-gray-400" />
                        </div>
                        <CustomSelect
                            value={filters.workType}
                            onChange={v => { setFilters(p => ({ ...p, workType: v })); setCurrentPage(1); }}
                            placeholder="Work type"
                            options={[
                                { value: '', label: 'Work type' },
                                { value: 'Full-time', label: 'Full-time' },
                                { value: 'Part-time', label: 'Part-time' },
                                { value: 'Contract', label: 'Contract' },
                                { value: 'Internship', label: 'Internship' },
                            ]}
                        />
                        <CustomSelect
                            value={filters.workMode}
                            onChange={v => { setFilters(p => ({ ...p, workMode: v })); setCurrentPage(1); }}
                            placeholder="Work mode"
                            options={[
                                { value: '', label: 'Work mode' },
                                { value: 'Onsite', label: 'Onsite' },
                                { value: 'Remote', label: 'Remote' },
                                { value: 'Hybrid', label: 'Hybrid' },
                            ]}
                        />
                        <CustomSelect
                            value={filters.experience}
                            onChange={v => { setFilters(p => ({ ...p, experience: v })); setCurrentPage(1); }}
                            placeholder="Experience"
                            options={[
                                { value: '', label: 'Experience' },
                                { value: 'Fresher', label: 'Fresher' },
                                { value: '1-3 years', label: '1–3 years' },
                                { value: '3-5 years', label: '3–5 years' },
                                { value: '5-10 years', label: '5–10 years' },
                                { value: '10+ years', label: '10+ years' },
                            ]}
                        />
                        <input
                            name="salary"
                            value={filters.salary}
                            onChange={handleFilterChange}
                            placeholder="Salary (e.g. 10 LPA)"
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* Job grid */}
                {paginatedJobs.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4">🔍</div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{hasActiveFilters ? 'No matching jobs found' : 'No jobs available'}</h3>
                        <p className="text-sm text-gray-500">{hasActiveFilters ? 'Try adjusting your filters.' : 'Check back soon for new opportunities.'}</p>
                        {hasActiveFilters && <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-900 transition-colors">Clear filters</button>}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {paginatedJobs.map(job => <JobCard key={job.id} job={job} />)}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages).map((p, idx, arr) => (
                            <React.Fragment key={p}>
                                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-gray-400 text-sm">...</span>}
                                <button onClick={() => setCurrentPage(p)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === currentPage ? 'bg-brand-700 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{p}</button>
                            </React.Fragment>
                        ))}
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;
