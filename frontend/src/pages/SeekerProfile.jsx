import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getUserById, recordProfileView } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Mail, Phone, GraduationCap, Briefcase, Zap } from 'lucide-react';

const GithubIcon = () => (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
);

function SeekerProfile() {
    const { userId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { isEmployer } = useAuth();
    const [profile, setProfile] = useState({ name: state?.name || '', email: state?.email || '', phone: '', skills: [], education: [], experience: [], githubProfile: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            getUserById(userId).then(res => {
                const data = res.data.data || res.data;
                setProfile({
                    name: data.name || state?.name || '',
                    email: data.email || state?.email || '',
                    phone: data.phone || '',
                    skills: data.skills ? JSON.parse(data.skills) : [],
                    education: data.education ? JSON.parse(data.education) : [],
                    experience: data.experience ? JSON.parse(data.experience) : [],
                    githubProfile: data.githubProfile || '',
                });
                if (isEmployer()) recordProfileView(userId).catch(() => {});
            }).catch(() => {}).finally(() => setLoading(false));
        } else { setLoading(false); }
    }, [userId]);

    const initials = profile.name ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />Back
                </button>

                {/* Header */}
                <div className="bg-brand-100 rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">{initials}</div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{profile.name || 'Applicant'}</h1>
                            <div className="flex flex-wrap gap-3 mt-1">
                                {profile.email && <span className="inline-flex items-center gap-1 text-sm text-gray-500"><Mail className="w-3.5 h-3.5" />{profile.email}</span>}
                                {profile.phone && <span className="inline-flex items-center gap-1 text-sm text-gray-500"><Phone className="w-3.5 h-3.5" />{profile.phone}</span>}
                                {profile.githubProfile && (
                                    <a href={profile.githubProfile} target="_blank" rel="noreferrer"
                                       className="inline-flex items-center gap-1 text-sm text-brand-700 hover:text-brand-900 hover:underline transition-colors">
                                        <GithubIcon />GitHub Profile
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Skills */}
                <div className="bg-brand-100 rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
                    <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-brand-700" />Skills</h2>
                    {profile.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map(skill => <span key={skill} className="px-3 py-1.5 bg-brand-50 text-brand-900 text-sm font-medium rounded-full">{skill}</span>)}
                        </div>
                    ) : <p className="text-sm text-gray-400">No skills listed.</p>}
                </div>

                {/* Education */}
                <div className="bg-brand-100 rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
                    <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-brand-700" />Education</h2>
                    {profile.education.length > 0 ? (
                        <div className="space-y-3">
                            {profile.education.map((edu, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"><GraduationCap className="w-4 h-4 text-blue-600" /></div>
                                    <div>
                                        <p className="font-medium text-gray-800 text-sm">{edu.school}</p>
                                        <p className="text-sm text-gray-500">{edu.degree}{edu.year ? ` · ${edu.year}` : ''}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-gray-400">No education listed.</p>}
                </div>

                {/* Experience */}
                <div className="bg-brand-100 rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-brand-700" />Work Experience</h2>
                    {profile.experience.length > 0 ? (
                        <div className="space-y-3">
                            {profile.experience.map((exp, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0"><Briefcase className="w-4 h-4 text-brand-700" /></div>
                                    <div>
                                        <p className="font-medium text-gray-800 text-sm">{exp.role}</p>
                                        <p className="text-sm text-gray-500">{exp.company}{exp.duration ? ` · ${exp.duration}` : ''}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-gray-400">No work experience listed.</p>}
                </div>
            </div>
        </div>
    );
}

export default SeekerProfile;
