import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { searchUsers, getProfilePictureUrl } from '../services/api';
import { Search, User, MessageSquare, Zap, GraduationCap, Briefcase } from 'lucide-react';

function TalentSearch() {
    const navigate = useNavigate();
    const { isEmployer } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (!isEmployer()) navigate('/jobs');
    }, []);

    const doSearch = async (q) => {
        if (!q.trim()) { setResults([]); setSearched(false); return; }
        setLoading(true);
        try {
            const res = await searchUsers(q, 'JOB_SEEKER');
            setResults(res.data?.data || []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    const handleQueryChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(debounceRef.current);
        if (!val.trim()) { setResults([]); setSearched(false); return; }
        debounceRef.current = setTimeout(() => doSearch(val), 400);
    };

    const parseJsonSafe = (str) => { try { return str ? JSON.parse(str) : []; } catch { return []; } };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Talent Search</h1>
                    <p className="text-sm text-gray-500">Find job seekers by name or skill</p>
                </div>

                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        value={query}
                        onChange={handleQueryChange}
                        placeholder="Search by name or skill (e.g. React, Python, John)..."
                        className="w-full pl-12 pr-4 py-3.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 shadow-sm"
                        autoFocus
                    />
                </div>

                {loading && (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {!loading && searched && results.length === 0 && (
                    <div className="text-center py-16">
                        <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium text-gray-500">No job seekers found</p>
                        <p className="text-sm text-gray-400 mt-1">Try a different name or skill</p>
                    </div>
                )}

                {!loading && !searched && (
                    <div className="text-center py-16">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium text-gray-500">Search for talent</p>
                        <p className="text-sm text-gray-400 mt-1">Enter a name or skill to find job seekers</p>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {results.map(seeker => {
                            const skills = parseJsonSafe(seeker.skills);
                            const education = parseJsonSafe(seeker.education);
                            const experience = parseJsonSafe(seeker.experience);
                            const initials = seeker.name
                                ? seeker.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                                : '?';
                            return (
                                <div key={seeker.id} className="bg-gradient-to-br from-white to-brand-100 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-5">
                                    <div className="flex items-center gap-4 mb-4">
                                        {seeker.profilePicturePath ? (
                                            <img src={getProfilePictureUrl(seeker.id)} alt={seeker.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                                        ) : (
                                            <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                                                {initials}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">{seeker.name}</h3>
                                            <p className="text-xs text-gray-500 truncate">{seeker.email}</p>
                                        </div>
                                    </div>

                                    {skills.length > 0 && (
                                        <div className="mb-3">
                                            <div className="flex items-center gap-1 mb-1.5">
                                                <Zap className="w-3.5 h-3.5 text-brand-700" />
                                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Skills</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {skills.slice(0, 5).map(skill => (
                                                    <span key={skill} className="px-2 py-0.5 bg-brand-50 text-brand-800 text-xs font-medium rounded-full">{skill}</span>
                                                ))}
                                                {skills.length > 5 && (
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">+{skills.length - 5}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-1 mb-4 min-h-[2.5rem]">
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

                                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => navigate(`/seeker-profile/${seeker.id}`)}
                                            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                                        >
                                            View Profile
                                        </button>
                                        <button
                                            onClick={() => navigate(`/messages?userId=${seeker.id}&name=${encodeURIComponent(seeker.name)}`)}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-brand-700 hover:bg-brand-900 rounded-lg transition-colors"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />Message
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TalentSearch;
