import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserById, updateUser, uploadProfileResume, getUserResumeUrl, uploadCompanyLogo, getCompanyLogoUrl, uploadProfilePicture, getProfilePictureUrl, deleteProfilePicture, parseResume } from '../services/api';
import { User, Phone, Mail, Plus, X, Upload, FileText, Camera, Building2, Globe, GraduationCap, Briefcase, Sparkles, CheckCircle, AlertCircle, Save } from 'lucide-react';
import BackButton from '../components/BackButton';

const inputClass = "w-full px-3.5 py-2.5 text-sm border border-brand-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400 bg-gradient-to-br from-white to-brand-100";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

function SectionCard({ icon: Icon, title, children }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Icon className="w-4 h-4 text-brand-700" />{title}
            </h2>
            {children}
        </div>
    );
}

function Profile() {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState('');
    const [education, setEducation] = useState([]);
    const [experience, setExperience] = useState([]);
    const [resumePath, setResumePath] = useState('');
    const [resumeUploading, setResumeUploading] = useState(false);
    const [resumeMsg, setResumeMsg] = useState('');
    const [profilePicturePath, setProfilePicturePath] = useState('');
    const [picUploading, setPicUploading] = useState(false);
    const [picMsg, setPicMsg] = useState('');
    const picInputRef = useRef(null);
    const [companyDescription, setCompanyDescription] = useState('');
    const [companyWebsite, setCompanyWebsite] = useState('');
    const [companyLogoPath, setCompanyLogoPath] = useState('');
    const [logoUploading, setLogoUploading] = useState(false);
    const [logoMsg, setLogoMsg] = useState('');
    const logoInputRef = useRef(null);
    const [parsedSkills, setParsedSkills] = useState([]);
    const [selectedParseSkills, setSelectedParseSkills] = useState(new Set());
    const [parseBannerVisible, setParseBannerVisible] = useState(false);
    const [parseLoading, setParseLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState('');
    const [saveError, setSaveError] = useState('');
    const resumeInputRef = useRef(null);
    const isEmployer = user?.role === 'EMPLOYER';
    const [github, setGithub] = useState('');

    useEffect(() => {
        getUserById(user.id).then(res => {
            const data = res.data.data || res.data;
            setName(data.name || user.name || '');
            setPhone(data.phone || '');
            setSkills(data.skills ? JSON.parse(data.skills) : []);
            setEducation(data.education ? JSON.parse(data.education) : []);
            setExperience(data.experience ? JSON.parse(data.experience) : []);
            setResumePath(data.resumePath || '');
            setProfilePicturePath(data.profilePicturePath || '');
            setCompanyDescription(data.companyDescription || '');
            setCompanyWebsite(data.companyWebsite || '');
            setGithub(data.githubProfile || '');
            setCompanyLogoPath(data.companyLogoPath || '');
        }).catch(() => setName(user.name || '')).finally(() => setLoading(false));
    }, []);

    const addSkill = () => {
        const t = skillInput.trim();
        if (t && !skills.includes(t)) { setSkills([...skills, t]); setSkillInput(''); }
    };

    const handlePicUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setPicUploading(true); setPicMsg('');
        try { const res = await uploadProfilePicture(user.id, file); setProfilePicturePath(res.data.data?.profilePicturePath || ''); setPicMsg('Picture updated!'); setTimeout(() => setPicMsg(''), 3000); }
        catch { setPicMsg('Failed to upload picture.'); }
        finally { setPicUploading(false); if (picInputRef.current) picInputRef.current.value = ''; }
    };

    const handlePicDelete = async () => {
        if (!window.confirm('Remove your profile picture?')) return;
        try { await deleteProfilePicture(user.id); setProfilePicturePath(''); setPicMsg('Picture removed.'); setTimeout(() => setPicMsg(''), 3000); }
        catch { setPicMsg('Failed to remove picture.'); }
    };

    const handleParseResume = async () => {
        setParseLoading(true); setParseBannerVisible(false); setResumeMsg('');
        try {
            const res = await parseResume(user.id);
            const detected = res.data?.data?.detectedSkills || [];
            setParsedSkills(detected); setSelectedParseSkills(new Set(detected)); setParseBannerVisible(true);
        } catch (err) { setResumeMsg(`Parse failed: ${err.response?.data?.message || err.message}`); }
        finally { setParseLoading(false); }
    };

    const handleAddParsedSkills = () => {
        const toAdd = [...selectedParseSkills].filter(s => !skills.includes(s));
        if (toAdd.length > 0) { setSkills(prev => [...prev, ...toAdd]); setResumeMsg(`${toAdd.length} skill${toAdd.length !== 1 ? 's' : ''} added! Click Save to keep them.`); setTimeout(() => setResumeMsg(''), 5000); }
        setParseBannerVisible(false);
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setResumeUploading(true); setResumeMsg(''); setParseBannerVisible(false);
        try {
            const res = await uploadProfileResume(user.id, file);
            setResumePath(res.data.data?.resumePath || ''); setResumeMsg('Resume uploaded!'); setTimeout(() => setResumeMsg(''), 3000);
            if (file.name.toLowerCase().endsWith('.pdf')) handleParseResume();
        } catch { setResumeMsg('Failed to upload resume.'); }
        finally { setResumeUploading(false); if (resumeInputRef.current) resumeInputRef.current.value = ''; }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setLogoUploading(true); setLogoMsg('');
        try { const res = await uploadCompanyLogo(user.id, file); setCompanyLogoPath(res.data.data?.companyLogoPath || ''); setLogoMsg('Logo uploaded!'); setTimeout(() => setLogoMsg(''), 3000); }
        catch { setLogoMsg('Failed to upload logo.'); }
        finally { setLogoUploading(false); if (logoInputRef.current) logoInputRef.current.value = ''; }
    };

    const handleSave = async () => {
        if (!isEmployer && !github.trim()) { setSaveError('GitHub profile is required for job seekers.'); return; }
        setSaving(true); setSaveSuccess(''); setSaveError('');
        try {
            await updateUser(user.id, { name, phone, skills: JSON.stringify(skills), education: JSON.stringify(education), experience: JSON.stringify(experience), companyDescription, companyWebsite, githubProfile: github });
            setSaveSuccess('Profile saved!'); setTimeout(() => setSaveSuccess(''), 3000);
        } catch (err) {
            setSaveError([403, 401].includes(err.response?.status) ? 'Session expired. Please log out and log back in.' : err.response?.data?.message || 'Failed to save profile.');
        } finally { setSaving(false); }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
                <BackButton />
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                    <div className="flex items-center gap-3">
                        {saveSuccess && <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium"><CheckCircle className="w-4 h-4" />{saveSuccess}</span>}
                        {saveError && <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium"><AlertCircle className="w-4 h-4" />{saveError}</span>}
                        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-700 hover:bg-brand-900 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
                            <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </div>

                {/* Profile Picture + Basic Info */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-start gap-5 mb-5">
                        <div className="relative flex-shrink-0">
                            {profilePicturePath ? (
                                <img src={getProfilePictureUrl(user.id)} alt={name} className="w-20 h-20 rounded-2xl object-cover border border-gray-200" />
                            ) : (
                                <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                                    {(name || '?')[0].toUpperCase()}
                                </div>
                            )}
                            <button onClick={() => picInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 shadow-sm transition-colors">
                                <Camera className="w-3.5 h-3.5" />
                            </button>
                            <input ref={picInputRef} type="file" accept="image/png,image/jpeg,image/jpg" onChange={handlePicUpload} className="sr-only" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">{name || 'Your Name'}</p>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                            <div className="flex gap-2 mt-2">
                                {picUploading ? <span className="text-xs text-gray-400">Uploading...</span> : (
                                    <>
                                        <button onClick={() => picInputRef.current?.click()} className="text-xs text-brand-700 hover:text-brand-900 font-medium">{profilePicturePath ? 'Change photo' : 'Upload photo'}</button>
                                        {profilePicturePath && <><span className="text-gray-300">·</span><button onClick={handlePicDelete} className="text-xs text-red-500 hover:text-red-600">Remove</button></>}
                                    </>
                                )}
                            </div>
                            {picMsg && <p className="text-xs text-gray-500 mt-1">{picMsg}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}><span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-gray-400" />Full Name</span></label>
                            <input value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Your full name" />
                        </div>
                        <div>
                            <label className={labelClass}><span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />Phone Number</span></label>
                            <input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="+91 99999 99999" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}><span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" />Email (read-only)</span></label>
                            <input value={user?.email || ''} readOnly className={inputClass + ' !bg-gray-50 text-gray-500 cursor-not-allowed'} />
                        </div>
                        {!isEmployer && (
                            <div className="sm:col-span-2">
                                <label className={labelClass}>
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                                        GitHub Profile <span className="text-red-400 font-normal">(required)</span>
                                    </span>
                                </label>
                                <input type="url" value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/username" className={inputClass} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Resume */}
                {!isEmployer && (
                    <SectionCard icon={FileText} title="Resume">
                        <div className="flex items-center gap-4 mb-4">
                            {resumePath ? (
                                <a href={getUserResumeUrl(user.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
                                    <FileText className="w-4 h-4" />View Resume
                                </a>
                            ) : <p className="text-sm text-gray-400">No resume uploaded yet.</p>}
                            <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                                <Upload className="w-4 h-4 text-gray-400" />{resumeUploading ? 'Uploading...' : resumePath ? 'Replace' : 'Upload Resume'}
                                <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="sr-only" />
                            </label>
                            {resumePath && (
                                <button onClick={handleParseResume} disabled={parseLoading} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-900 border border-brand-200 rounded-lg text-sm font-medium hover:bg-brand-50 disabled:opacity-60 transition-colors">
                                    <Sparkles className="w-4 h-4" />{parseLoading ? 'Parsing...' : 'Parse Skills'}
                                </button>
                            )}
                        </div>
                        {resumeMsg && <p className={`text-sm mt-2 ${resumeMsg.startsWith('Parse failed') ? 'text-red-600' : 'text-gray-600'}`}>{resumeMsg}</p>}
                        {parseBannerVisible && (
                            <div className="mt-4 p-4 bg-brand-50 border border-brand-200 rounded-xl">
                                <p className="text-sm font-semibold text-brand-900 mb-3">Skills detected from your resume:</p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {parsedSkills.map(s => (
                                        <button key={s} onClick={() => setSelectedParseSkills(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; })} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${selectedParseSkills.has(s) ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-200'}`}>{s}</button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleAddParsedSkills} className="px-4 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-900 transition-colors">Add Selected ({selectedParseSkills.size})</button>
                                    <button onClick={() => setParseBannerVisible(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Dismiss</button>
                                </div>
                            </div>
                        )}
                    </SectionCard>
                )}

                {/* Skills */}
                {!isEmployer && (
                    <SectionCard icon={Sparkles} title="Skills">
                        <div className="flex gap-2 mb-4">
                            <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add a skill (e.g., React, Python)" className={inputClass} />
                            <button onClick={addSkill} className="px-4 py-2.5 bg-brand-700 hover:bg-brand-900 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"><Plus className="w-4 h-4" /></button>
                        </div>
                        {skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {skills.map(skill => (
                                    <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-900 text-sm font-medium rounded-full">
                                        {skill}
                                        <button onClick={() => setSkills(skills.filter(s => s !== skill))} className="text-brand-500 hover:text-brand-900 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                    </span>
                                ))}
                            </div>
                        ) : <p className="text-sm text-gray-400">No skills added yet. Add skills to improve your job matches.</p>}
                    </SectionCard>
                )}

                {/* Education */}
                {!isEmployer && (
                    <SectionCard icon={GraduationCap} title="Education">
                        <div className="space-y-3 mb-4">
                            {education.map((edu, i) => (
                                <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl relative">
                                    <input value={edu.school} onChange={e => { const u = [...education]; u[i] = { ...u[i], school: e.target.value }; setEducation(u); }} placeholder="School / University" className={inputClass} />
                                    <input value={edu.degree} onChange={e => { const u = [...education]; u[i] = { ...u[i], degree: e.target.value }; setEducation(u); }} placeholder="Degree / Field" className={inputClass} />
                                    <div className="flex gap-2">
                                        <input value={edu.year} onChange={e => { const u = [...education]; u[i] = { ...u[i], year: e.target.value }; setEducation(u); }} placeholder="Year" className={inputClass} />
                                        <button onClick={() => setEducation(education.filter((_, idx) => idx !== i))} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setEducation([...education, { school: '', degree: '', year: '' }])} className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-900 font-medium">
                            <Plus className="w-4 h-4" />Add Education
                        </button>
                    </SectionCard>
                )}

                {/* Experience */}
                {!isEmployer && (
                    <SectionCard icon={Briefcase} title="Work Experience">
                        <div className="space-y-3 mb-4">
                            {experience.map((exp, i) => (
                                <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl">
                                    <input value={exp.company} onChange={e => { const u = [...experience]; u[i] = { ...u[i], company: e.target.value }; setExperience(u); }} placeholder="Company" className={inputClass} />
                                    <input value={exp.role} onChange={e => { const u = [...experience]; u[i] = { ...u[i], role: e.target.value }; setExperience(u); }} placeholder="Role / Title" className={inputClass} />
                                    <div className="flex gap-2">
                                        <input value={exp.duration} onChange={e => { const u = [...experience]; u[i] = { ...u[i], duration: e.target.value }; setExperience(u); }} placeholder="e.g., 2021–2023" className={inputClass} />
                                        <button onClick={() => setExperience(experience.filter((_, idx) => idx !== i))} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setExperience([...experience, { company: '', role: '', duration: '' }])} className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-900 font-medium">
                            <Plus className="w-4 h-4" />Add Experience
                        </button>
                    </SectionCard>
                )}

                {/* Company Info (Employer only) */}
                {isEmployer && (
                    <SectionCard icon={Building2} title="Company Information">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 mb-4">
                                {companyLogoPath ? (
                                    <img src={getCompanyLogoUrl(user.id)} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs font-medium">No logo</div>
                                )}
                                <div>
                                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                                        <Upload className="w-4 h-4 text-gray-400" />{logoUploading ? 'Uploading...' : 'Upload Logo'}
                                        <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleLogoUpload} className="sr-only" />
                                    </label>
                                    {logoMsg && <p className="text-xs text-gray-500 mt-1">{logoMsg}</p>}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}><span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-gray-400" />Company Website</span></label>
                                <input value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="https://yourcompany.com" className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Company Description</label>
                                <textarea value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} rows={4} placeholder="Tell job seekers about your company..." className="w-full px-3.5 py-3 text-sm border border-brand-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400 bg-gradient-to-br from-white to-brand-100 resize-none" />
                            </div>
                        </div>
                    </SectionCard>
                )}

                <div className="flex justify-end pb-4">
                    <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-6 py-3 bg-brand-700 hover:bg-brand-900 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
                        <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Profile;
