import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserById, getProfilePictureUrl } from '../services/api';
import API from '../services/api';
import { Globe, MapPin, Briefcase, Monitor, ArrowLeft, Building2 } from 'lucide-react';

function CompanyProfile() {
    const { id } = useParams();
    const [employer, setEmployer] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([getUserById(id), API.get(`/jobs/employer/${id}`)])
            .then(([userRes, jobsRes]) => {
                setEmployer(userRes.data?.data || userRes.data);
                setJobs((jobsRes.data?.data || jobsRes.data || []).filter(j => j.active));
            }).catch(() => setError('Failed to load company profile.'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error || !employer) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <p className="text-lg font-semibold text-gray-800 mb-2">Company Not Found</p>
                <p className="text-sm text-gray-500 mb-4">{error}</p>
                <Link to="/jobs" className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-900 transition-colors">← Back to Jobs</Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"><ArrowLeft className="w-4 h-4" />Back to Jobs</Link>

                {/* Company header */}
                <div className="bg-brand-100 rounded-2xl border border-gray-200 shadow-sm p-8 mb-6">
                    <div className="flex items-start gap-6">
                        {employer.profilePicturePath ? (
                            <img src={getProfilePictureUrl(id)} alt="Logo" className="w-20 h-20 rounded-2xl object-cover border border-gray-200 flex-shrink-0" />
                        ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-900 rounded-2xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                                {(employer.name || 'C')[0].toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">{employer.name}</h1>
                            {employer.companyWebsite && (
                                <a href={employer.companyWebsite} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-900 mb-3 transition-colors">
                                    <Globe className="w-4 h-4" />{employer.companyWebsite}
                                </a>
                            )}
                            <p className="text-sm text-gray-600 leading-relaxed">{employer.companyDescription || 'No company description provided.'}</p>
                        </div>
                    </div>
                </div>

                {/* Jobs */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Open Positions</h2>
                    <span className="text-sm text-gray-500">{jobs.length} active job{jobs.length !== 1 ? 's' : ''}</span>
                </div>

                {jobs.length === 0 ? (
                    <div className="bg-brand-100 rounded-2xl border border-gray-200 text-center py-16">
                        <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-semibold text-gray-700 mb-1">No open positions</h3>
                        <p className="text-sm text-gray-400">This company has no active listings right now.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {jobs.map(job => (
                            <div key={job.id} className="bg-brand-100 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-brand-200 transition-all p-5">
                                <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                                <p className="text-sm text-gray-500 mb-3">{job.company}</p>
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {job.location && <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full"><MapPin className="w-3 h-3" />{job.location}</span>}
                                    {job.workType && <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full"><Briefcase className="w-3 h-3" />{job.workType}</span>}
                                    {job.workMode && <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full"><Monitor className="w-3 h-3" />{job.workMode}</span>}
                                </div>
                                <div className="flex items-center justify-between">
                                    {job.salaryRange && <span className="text-sm font-semibold text-brand-700">{job.salaryRange}</span>}
                                    <Link to={`/jobs/${job.id}`} className="text-sm font-medium text-brand-700 hover:text-brand-900 transition-colors">View Details →</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CompanyProfile;
