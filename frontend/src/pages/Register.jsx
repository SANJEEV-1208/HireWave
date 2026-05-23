import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, Eye, EyeOff, Search, Building2, X } from 'lucide-react';

function Register() {
    const navigate = useNavigate();
    const { register, loginWithGoogle } = useAuth();

    const [googleCredential, setGoogleCredential] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'JOB_SEEKER' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const handleGoogleRoleSelect = async (role) => {
        setGoogleLoading(true);
        setShowRoleModal(false);
        try {
            const result = await loginWithGoogle(googleCredential, role);
            if (result?.success) navigate(result.role === 'EMPLOYER' ? '/my-jobs' : '/jobs');
        } catch { setError('Google sign-up failed. Please try again.'); }
        finally { setGoogleLoading(false); setGoogleCredential(null); }
    };

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!formData.name || !formData.email || !formData.password) { setError('Please fill in all fields'); return; }
        if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
        if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            await register({ name: formData.name, email: formData.email, password: formData.password, role: formData.role });
            const registeredEmail = formData.email;
            setSuccess('Account created! Redirecting to email verification...');
            setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'JOB_SEEKER' });
            setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(registeredEmail)}`), 1500);
        } catch (err) { setError(err.message || 'Registration failed. Please try again.'); }
        finally { setLoading(false); }
    };

    const inputClass = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400 bg-white transition-shadow";

    return (
        <>
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-700 rounded-xl mb-4">
                            <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
                        <p className="text-sm text-gray-500 mt-1">Join thousands of professionals today</p>
                    </div>
                    <div className="bg-brand-100 rounded-2xl border border-gray-200 shadow-soft p-8">
                        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
                        {success && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="At least 6 characters" required className={inputClass + ' pr-10'} />
                                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter your password" required className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">I want to</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'JOB_SEEKER', label: 'Find a job', icon: Search, desc: 'Browse & apply for jobs' },
                                        { value: 'EMPLOYER', label: 'Hire talent', icon: Building2, desc: 'Post jobs & review applicants' },
                                    ].map(opt => (
                                        <label key={opt.value} className={`cursor-pointer rounded-xl border-2 p-3.5 transition-all ${formData.role === opt.value ? 'border-brand-700 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <input type="radio" name="role" value={opt.value} checked={formData.role === opt.value} onChange={handleChange} className="sr-only" />
                                            <opt.icon className={`w-5 h-5 mb-1.5 ${formData.role === opt.value ? 'text-brand-700' : 'text-gray-400'}`} />
                                            <p className={`text-sm font-semibold ${formData.role === opt.value ? 'text-brand-900' : 'text-gray-700'}`}>{opt.label}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" disabled={loading || googleLoading} className="w-full py-2.5 bg-brand-700 hover:bg-brand-900 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors mt-2">
                                {loading ? 'Creating account...' : 'Create account'}
                            </button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or sign up with</span></div>
                        </div>
                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={(res) => { setGoogleCredential(res.credential); setShowRoleModal(true); }}
                                onError={() => setError('Google sign-up failed. Please try again.')}
                                text="signup_with" width="100%"
                            />
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-6">
                            Already have an account?{' '}
                            <Link to="/login" className="text-brand-700 hover:text-brand-900 font-medium">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>

            {showRoleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowRoleModal(false); setGoogleCredential(null); }}>
                    <div className="bg-brand-100 rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Join as...</h3>
                                <p className="text-sm text-gray-500">Choose how you'd like to use HireWave</p>
                            </div>
                            <button onClick={() => { setShowRoleModal(false); setGoogleCredential(null); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { role: 'JOB_SEEKER', icon: '🔍', label: 'Job Seeker', desc: 'Browse & apply for jobs' },
                                { role: 'EMPLOYER', icon: '📢', label: 'Employer', desc: 'Post jobs & hire talent' },
                            ].map(opt => (
                                <button key={opt.role} onClick={() => handleGoogleRoleSelect(opt.role)} disabled={googleLoading}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-brand-700 hover:bg-brand-50 transition-all disabled:opacity-50">
                                    <span className="text-2xl">{opt.icon}</span>
                                    <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                                    <span className="text-xs text-gray-500 text-center">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Register;
