import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';
import { Pencil, AlertCircle, CheckCircle, ArrowLeft, X } from 'lucide-react';

const inputClass = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400 bg-white";
const selectClass = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-gray-700";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

function EditJob() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ title: '', description: '', company: '', location: '', salaryRange: '', experience: '', workType: '', workMode: '', deadline: '' });
    const [requiredSkills, setRequiredSkills] = useState([]);
    const [skillInput, setSkillInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        API.get(`/jobs/${id}`).then(r => {
            const j = r.data.data;
            setFormData({ title: j.title || '', description: j.description || '', company: j.company || '', location: j.location || '', salaryRange: j.salaryRange || '', experience: j.experience || '', workType: j.workType || '', workMode: j.workMode || '', deadline: j.deadline || '' });
            try { setRequiredSkills(j.requiredSkills ? JSON.parse(j.requiredSkills) : []); } catch { setRequiredSkills([]); }
        }).catch(() => setError('Failed to load job details')).finally(() => setLoading(false));
    }, [id]);

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
        if (!formData.title || !formData.description || !formData.company || !formData.location) { setError('Please fill in all required fields'); return; }
        setSubmitting(true); setError(''); setSuccess('');
        try {
            const r = await API.put(`/jobs/${id}`, { ...formData, requiredSkills: JSON.stringify(requiredSkills) });
            if (r.data.success) { setSuccess('Job updated successfully!'); setTimeout(() => navigate('/my-jobs'), 1500); }
        } catch (err) { setError(err.response?.data?.message || 'Failed to update job'); }
        finally { setSubmitting(false); }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link to="/my-jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"><ArrowLeft className="w-4 h-4" />Back to My Jobs</Link>
                <div className="bg-brand-100 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><Pencil className="w-5 h-5 text-amber-600" /></div>
                        <div><h1 className="text-xl font-bold text-gray-900">Edit Job</h1><p className="text-sm text-gray-500">Update your job listing details</p></div>
                    </div>
                    <div className="p-8 space-y-5">
                        {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
                        {success && <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700"><CheckCircle className="w-4 h-4 flex-shrink-0" />{success}</div>}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className={labelClass}>Job Title *</label><input type="text" name="title" value={formData.title} onChange={handleChange} required className={inputClass} /></div>
                                <div><label className={labelClass}>Company Name *</label><input type="text" name="company" value={formData.company} onChange={handleChange} required className={inputClass} /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className={labelClass}>Location *</label><input type="text" name="location" value={formData.location} onChange={handleChange} required className={inputClass} /></div>
                                <div><label className={labelClass}>Salary Range</label><input type="text" name="salaryRange" value={formData.salaryRange} onChange={handleChange} className={inputClass} /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div><label className={labelClass}>Experience</label>
                                    <select name="experience" value={formData.experience} onChange={handleChange} className={selectClass}>
                                        <option value="">Select level</option>
                                        <option value="Fresher">Fresher</option>
                                        <option value="1-3 years">1–3 years</option>
                                        <option value="3-5 years">3–5 years</option>
                                        <option value="5-10 years">5–10 years</option>
                                        <option value="10+ years">10+ years</option>
                                    </select>
                                </div>
                                <div><label className={labelClass}>Work Type</label>
                                    <select name="workType" value={formData.workType} onChange={handleChange} className={selectClass}>
                                        <option value="">Select type</option>
                                        <option value="Full-time">Full-time</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Internship">Internship</option>
                                    </select>
                                </div>
                                <div><label className={labelClass}>Work Mode</label>
                                    <select name="workMode" value={formData.workMode} onChange={handleChange} className={selectClass}>
                                        <option value="">Select mode</option>
                                        <option value="Onsite">Onsite</option>
                                        <option value="Remote">Remote</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>
                            </div>
                            <div><label className={labelClass}>Deadline <span className="text-gray-400 font-normal">(optional)</span></label><input type="date" name="deadline" value={formData.deadline} onChange={handleChange} min={new Date().toISOString().split('T')[0]} className={inputClass} /></div>
                            <div>
                                <label className={labelClass}>Required Skills <span className="text-gray-400 font-normal">(optional — used for AI talent matching)</span></label>
                                <div className="min-h-[46px] flex flex-wrap gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-brand-500">
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
                            <div><label className={labelClass}>Job Description *</label><textarea name="description" value={formData.description} onChange={handleChange} rows={7} required className="w-full px-3.5 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400 bg-white resize-none" /></div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Link to="/my-jobs" className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</Link>
                                <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-brand-700 hover:bg-brand-900 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
                                    {submitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditJob;
