import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API, { getUserById } from '../services/api';
import { Briefcase, AlertCircle, CheckCircle, ArrowLeft, X } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

const inputClass = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400 bg-gradient-to-br from-white to-brand-100";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

function PostJob() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({ title: '', description: '', company: '', location: '', salaryRange: '', experience: '', workType: '', workMode: '', deadline: '' });
    const [requiredSkills, setRequiredSkills] = useState([]);
    const [skillInput, setSkillInput] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [profileIncomplete, setProfileIncomplete] = useState(false);
    const [profileChecking, setProfileChecking] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        getUserById(user.id).then(res => {
            const data = res.data?.data || res.data;
            setProfileIncomplete(!data.name || !data.companyDescription || !data.profilePicturePath);
        }).catch(() => {}).finally(() => setProfileChecking(false));
    }, [user?.id]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSkillKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const skill = skillInput.trim().replace(/,$/, '');
            if (skill && !requiredSkills.includes(skill)) setRequiredSkills(prev => [...prev, skill]);
            setSkillInput('');
        }
    };
    const removeSkill = (skill) => setRequiredSkills(prev => prev.filter(s => s !== skill));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (profileIncomplete) { setError('Please complete your profile before posting a job.'); return; }
        const { title, description, company, location, salaryRange, experience, workType, workMode } = formData;
        if (!title || !description || !company || !location || !salaryRange || !experience || !workType || !workMode) { setError('Please fill in all required fields.'); return; }
        if (!window.confirm('Post this job?')) return;
        setLoading(true);
        try {
            const r = await API.post(`/jobs/employer/${user.id}`, { ...formData, requiredSkills: JSON.stringify(requiredSkills) });
            if (r.data.success) {
                setSuccess('Job posted successfully! Redirecting...');
                setFormData({ title: '', description: '', company: '', location: '', salaryRange: '', experience: '', workType: '', workMode: '', deadline: '' });
                setRequiredSkills([]);
                setTimeout(() => navigate('/my-jobs'), 1500);
            } else { setError(r.data.message || 'Failed to post job'); }
        } catch (err) {
            setError(err.response?.status === 403 ? 'Permission denied. Only employers can post jobs.' : err.response?.data?.message || 'Failed to post job. Please try again.');
        } finally { setLoading(false); }
    };

    if (!user) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <p className="text-lg font-semibold text-gray-800 mb-4">Login required to post jobs</p>
                <Link to="/login" className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-900 transition-colors">Go to Login</Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link to="/my-jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />Back to My Jobs
                </Link>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center"><Briefcase className="w-5 h-5 text-brand-700" /></div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Post a New Job</h1>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                    </div>
                    <div className="p-8 space-y-5">
                        {!profileChecking && profileIncomplete && (
                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-amber-800">Profile incomplete</p>
                                    <p className="text-sm text-amber-700 mt-0.5">Add your <strong>company logo</strong> and <strong>company description</strong> before posting jobs.</p>
                                </div>
                                <Link to="/profile" className="flex-shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors">Complete Profile</Link>
                            </div>
                        )}
                        {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
                        {success && <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700"><CheckCircle className="w-4 h-4 flex-shrink-0" />{success}</div>}

                        <form onSubmit={handleSubmit}>
                            <fieldset disabled={profileIncomplete} className={`space-y-5 ${profileIncomplete ? 'opacity-50 pointer-events-none' : ''}`} style={{ border: 'none', padding: 0, margin: 0 }}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div><label className={labelClass}>Job Title *</label><input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Senior Java Developer" required className={inputClass} /></div>
                                    <div><label className={labelClass}>Company Name *</label><input type="text" name="company" value={formData.company} onChange={handleChange} placeholder="Your company name" required className={inputClass} /></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div><label className={labelClass}>Location *</label><input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Remote, New York" required className={inputClass} /></div>
                                    <div><label className={labelClass}>Salary Range *</label><input type="text" name="salaryRange" value={formData.salaryRange} onChange={handleChange} placeholder="e.g., ₹8–12 LPA" required className={inputClass} /></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Experience *</label>
                                        <CustomSelect
                                            value={formData.experience}
                                            onChange={v => setFormData(p => ({ ...p, experience: v }))}
                                            placeholder="Select level"
                                            options={[
                                                { value: 'Fresher', label: 'Fresher' },
                                                { value: '1-3 years', label: '1–3 years' },
                                                { value: '3-5 years', label: '3–5 years' },
                                                { value: '5-10 years', label: '5–10 years' },
                                                { value: '10+ years', label: '10+ years' },
                                            ]}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Work Type *</label>
                                        <CustomSelect
                                            value={formData.workType}
                                            onChange={v => setFormData(p => ({ ...p, workType: v }))}
                                            placeholder="Select type"
                                            options={[
                                                { value: 'Full-time', label: 'Full-time' },
                                                { value: 'Part-time', label: 'Part-time' },
                                                { value: 'Contract', label: 'Contract' },
                                                { value: 'Internship', label: 'Internship' },
                                            ]}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Work Mode *</label>
                                        <CustomSelect
                                            value={formData.workMode}
                                            onChange={v => setFormData(p => ({ ...p, workMode: v }))}
                                            placeholder="Select mode"
                                            options={[
                                                { value: 'Onsite', label: 'Onsite' },
                                                { value: 'Remote', label: 'Remote' },
                                                { value: 'Hybrid', label: 'Hybrid' },
                                            ]}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Application Deadline <span className="text-gray-400 font-normal">(optional)</span></label>
                                    <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} min={new Date().toISOString().split('T')[0]} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Required Skills <span className="text-gray-400 font-normal">(optional — used for AI talent matching)</span></label>
                                    <div className="min-h-[46px] flex flex-wrap gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-gradient-to-br from-white to-brand-100 focus-within:ring-2 focus-within:ring-brand-500">
                                        {requiredSkills.map(skill => (
                                            <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-900 text-xs font-medium rounded-full">
                                                {skill}
                                                <button type="button" onClick={() => removeSkill(skill)} className="text-brand-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            value={skillInput}
                                            onChange={e => setSkillInput(e.target.value)}
                                            onKeyDown={handleSkillKeyDown}
                                            placeholder={requiredSkills.length === 0 ? 'e.g. React, Java, Python — press Enter to add' : 'Add more...'}
                                            className="flex-1 min-w-[200px] text-sm bg-transparent outline-none placeholder:text-gray-400 py-0.5"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Press Enter or comma after each skill</p>
                                </div>
                                <div>
                                    <label className={labelClass}>Job Description *</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows={7} placeholder="Describe the role, responsibilities, requirements, and benefits..." required className="w-full px-3.5 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400 bg-gradient-to-br from-white to-brand-100 resize-none" />
                                </div>
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Link to="/my-jobs" className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</Link>
                                    <button type="submit" disabled={loading || profileIncomplete} className="px-6 py-2.5 bg-brand-700 hover:bg-brand-900 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
                                        {loading ? 'Posting...' : 'Post Job'}
                                    </button>
                                </div>
                            </fieldset>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PostJob;
