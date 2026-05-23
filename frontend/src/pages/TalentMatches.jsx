import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAIMatchedSeekers, getJobById, getUserResumeUrl, getProfilePictureUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Sparkles, MessageSquare, Zap, GraduationCap, Briefcase, Users, FileText } from 'lucide-react';

function TalentMatches() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { isEmployer } = useAuth();
    const [job, setJob] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isEmployer()) { navigate('/jobs'); return; }
        const load = async () => {
            try {
                const [jobRes, matchRes] = await Promise.all([
                    getJobById(jobId),
                    getAIMatchedSeekers(jobId),
                ]);
                setJob(jobRes.data?.data || jobRes.data);
                setMatches(matchRes.data?.data || []);
            } catch {
                setError('Failed to load AI matches. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [jobId]);

    const parseJsonSafe = (str) => { try { return str ? JSON.parse(str) : []; } catch { return []; } };

    const rankColors = ['bg-yellow-400', 'bg-gray-300', 'bg-amber-600', 'bg-brand-200', 'bg-brand-100'];
    const rankLabels = ['#1 Best Match', '#2', '#3', '#4', '#5'];

    if (loading) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-700" />AI is analyzing candidates...
            </p>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />Back
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-brand-700 to-brand-900 rounded-2xl p-6 mb-8 text-white">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-5 h-5 text-brand-300" />
                        <span className="text-sm font-medium text-brand-300">AI Talent Matching</span>
                    </div>
                    <h1 className="text-xl font-bold mb-1">{job?.title || 'Job'}</h1>
                    <p className="text-sm text-brand-200">{job?.company}{job?.location ? ` · ${job.location}` : ''}</p>
                </div>

                {error && (
                    <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
                )}

                {!error && matches.length === 0 && (
                    <div className="text-center py-16 bg-brand-100 rounded-2xl border border-gray-200">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium text-gray-600">No candidates found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            There are no job seekers with matching profiles yet. Check back later as more seekers join the platform.
                        </p>
                    </div>
                )}

                {matches.length > 0 && (
                    <>
                        <p className="text-sm text-gray-500 mb-5">
                            Showing <span className="font-semibold text-gray-800">{matches.length}</span> best-matched candidate{matches.length !== 1 ? 's' : ''} ranked by AI
                        </p>
                        <div className="space-y-4">
                            {matches.map((seeker, idx) => {
                                const skills = parseJsonSafe(seeker.skills);
                                const education = parseJsonSafe(seeker.education);
                                const experience = parseJsonSafe(seeker.experience);
                                const initials = seeker.name
                                    ? seeker.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                                    : '?';
                                return (
                                    <div key={seeker.id} className="bg-gradient-to-br from-white to-brand-100 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 p-5">
                                        <div className="flex items-start gap-4">
                                            {/* Rank badge */}
                                            <div className="flex-shrink-0 flex flex-col items-center gap-1">
                                                <div className={`w-12 h-12 ${rankColors[idx] || 'bg-gray-100'} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                                                    {idx + 1}
                                                </div>
                                                <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{rankLabels[idx] || `#${idx + 1}`}</span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                {/* Name & contact */}
                                                <div className="flex items-center gap-3 mb-3">
                                                    {seeker.profilePicturePath ? (
                                                        <img src={getProfilePictureUrl(seeker.id)} alt={seeker.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                            {initials}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <h3 className="font-semibold text-gray-900 truncate">{seeker.name}</h3>
                                                        <p className="text-xs text-gray-500 truncate">{seeker.email}</p>
                                                    </div>
                                                </div>

                                                {/* Skills */}
                                                {skills.length > 0 && (
                                                    <div className="mb-3">
                                                        <div className="flex items-center gap-1 mb-1.5">
                                                            <Zap className="w-3.5 h-3.5 text-brand-700" />
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Skills</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {skills.slice(0, 6).map(skill => (
                                                                <span key={skill} className="px-2 py-0.5 bg-brand-50 text-brand-800 text-xs font-medium rounded-full">{skill}</span>
                                                            ))}
                                                            {skills.length > 6 && (
                                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">+{skills.length - 6}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Education & Experience */}
                                                <div className="flex flex-wrap gap-3 mb-4">
                                                    {education[0] && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                            <GraduationCap className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                                            <span className="truncate">{education[0].degree}{education[0].school ? ` · ${education[0].school}` : ''}</span>
                                                        </div>
                                                    )}
                                                    {experience[0] && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                            <Briefcase className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                                                            <span className="truncate">{experience[0].role}{experience[0].company ? ` · ${experience[0].company}` : ''}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => navigate(`/seeker-profile/${seeker.id}`)}
                                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                                                    >
                                                        View Profile
                                                    </button>
                                                    {seeker.resumePath && (
                                                        <a
                                                            href={getUserResumeUrl(seeker.id)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors border border-brand-200"
                                                        >
                                                            <FileText className="w-3.5 h-3.5" />View Resume
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => navigate(`/messages?userId=${seeker.id}&name=${encodeURIComponent(seeker.name)}`)}
                                                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-700 hover:bg-brand-900 rounded-lg transition-colors"
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5" />Message
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default TalentMatches;
