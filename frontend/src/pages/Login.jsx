import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { forgotPasswordSendOtp, forgotPasswordReset } from '../services/api';
import { Briefcase, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const inputClass = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400 bg-white transition-shadow";

function AuthCard({ children, title, subtitle }) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-700 rounded-xl mb-4">
                        <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                </div>
                <div className="bg-brand-100 rounded-2xl border border-gray-200 shadow-soft p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}

function Login() {
    const navigate = useNavigate();
    const { login, loginWithGoogle } = useAuth();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('login');
    const [fpEmail, setFpEmail] = useState('');
    const [fpOtp, setFpOtp] = useState('');
    const [fpNewPassword, setFpNewPassword] = useState('');
    const [fpConfirm, setFpConfirm] = useState('');
    const [fpLoading, setFpLoading] = useState(false);
    const [fpError, setFpError] = useState('');
    const [fpMsg, setFpMsg] = useState('');

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        if (!formData.email || !formData.password) { setError('Please enter both email and password'); setLoading(false); return; }
        try {
            const result = await login(formData.email, formData.password);
            if (result.success) navigate(result.role === 'EMPLOYER' ? '/my-jobs' : '/jobs');
            else setError(result.message || 'Login failed. Please check your credentials.');
        } catch { setError('Login failed. Please try again.'); }
        finally { setLoading(false); }
    };

    const handleSendOtp = async () => {
        setFpError(''); setFpMsg('');
        if (!fpEmail) { setFpError('Please enter your email address.'); return; }
        setFpLoading(true);
        try {
            await forgotPasswordSendOtp(fpEmail);
            setMode('forgot-step2');
            setFpMsg(`OTP sent to ${fpEmail}. Check your inbox — valid for 10 minutes.`);
        } catch (err) { setFpError(err.response?.data?.message || 'No account found with that email.'); }
        finally { setFpLoading(false); }
    };

    const handleResetPassword = async () => {
        setFpError('');
        if (!fpOtp) { setFpError('Please enter the OTP.'); return; }
        if (!fpNewPassword || !fpConfirm) { setFpError('Please fill in both password fields.'); return; }
        if (fpNewPassword.length < 6) { setFpError('Password must be at least 6 characters.'); return; }
        if (fpNewPassword !== fpConfirm) { setFpError('Passwords do not match.'); return; }
        setFpLoading(true);
        try {
            await forgotPasswordReset(fpEmail, fpOtp, fpNewPassword);
            setFpMsg('Password reset successfully! You can now log in.');
            setTimeout(() => {
                setMode('login');
                setFpEmail(''); setFpOtp(''); setFpNewPassword(''); setFpConfirm('');
                setFpMsg(''); setFpError('');
            }, 2500);
        } catch (err) { setFpError(err.response?.data?.message || 'Failed to reset password.'); }
        finally { setFpLoading(false); }
    };

    const resetForgotFlow = () => {
        setMode('login');
        setFpEmail(''); setFpOtp(''); setFpNewPassword(''); setFpConfirm('');
        setFpError(''); setFpMsg('');
    };

    if (mode === 'login') return (
        <AuthCard title="Welcome back" subtitle="Sign in to your account to continue">
            {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required className={inputClass} />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <button type="button" onClick={() => setMode('forgot-step1')} className="text-xs text-brand-700 hover:text-brand-900 font-medium">Forgot password?</button>
                    </div>
                    <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" required className={inputClass + ' pr-10'} />
                        <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-2.5 bg-brand-700 hover:bg-brand-900 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors mt-2">
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or continue with</span></div>
            </div>
            <div className="flex justify-center">
                <GoogleLogin
                    onSuccess={async (res) => {
                        try {
                            const result = await loginWithGoogle(res.credential);
                            if (result?.success) navigate(result.role === 'EMPLOYER' ? '/my-jobs' : '/jobs');
                        } catch { setError('Google sign-in failed. Please try again.'); }
                    }}
                    onError={() => setError('Google sign-in failed. Please try again.')}
                    width="100%"
                />
            </div>
            <p className="text-center text-sm text-gray-500 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-brand-700 hover:text-brand-900 font-medium">Create one free</Link>
            </p>
        </AuthCard>
    );

    if (mode === 'forgot-step1') return (
        <AuthCard title="Reset password" subtitle="Enter your email and we'll send a 6-digit OTP">
            {fpError && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{fpError}</div>}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                    <input type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)} placeholder="you@example.com" autoFocus className={inputClass} />
                </div>
                <button onClick={handleSendOtp} disabled={fpLoading} className="w-full py-2.5 bg-brand-700 hover:bg-brand-900 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
                    {fpLoading ? 'Sending...' : 'Send OTP'}
                </button>
                <button type="button" onClick={resetForgotFlow} className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mt-2">
                    <ArrowLeft className="w-4 h-4" /> Back to login
                </button>
            </div>
        </AuthCard>
    );

    return (
        <AuthCard title="Create new password" subtitle={`Enter the OTP sent to ${fpEmail}`}>
            {fpMsg && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{fpMsg}</div>}
            {fpError && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{fpError}</div>}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">OTP code</label>
                    <input type="text" value={fpOtp} onChange={e => setFpOtp(e.target.value.replace(/\D/, '').slice(0, 6))} placeholder="6-digit code" maxLength={6} autoFocus className={inputClass + ' tracking-widest text-center text-lg font-semibold'} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                    <input type="password" value={fpNewPassword} onChange={e => setFpNewPassword(e.target.value)} placeholder="At least 6 characters" className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                    <input type="password" value={fpConfirm} onChange={e => setFpConfirm(e.target.value)} placeholder="Repeat new password" className={inputClass} />
                </div>
                <button onClick={handleResetPassword} disabled={fpLoading} className="w-full py-2.5 bg-brand-700 hover:bg-brand-900 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
                    {fpLoading ? 'Resetting...' : 'Reset password'}
                </button>
                <div className="flex justify-between text-sm">
                    <button type="button" onClick={() => { setMode('forgot-step1'); setFpOtp(''); setFpNewPassword(''); setFpConfirm(''); setFpError(''); }} className="text-gray-500 hover:text-gray-700">← Change email</button>
                    <button type="button" onClick={handleSendOtp} disabled={fpLoading} className="text-brand-700 hover:text-brand-900 font-medium">Resend OTP</button>
                </div>
            </div>
        </AuthCard>
    );
}

export default Login;
