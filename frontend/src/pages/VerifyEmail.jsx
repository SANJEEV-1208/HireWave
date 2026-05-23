import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyEmail, resendVerification } from '../services/api';
import { MailCheck, CheckCircle, AlertCircle } from 'lucide-react';

function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
    const navigate = useNavigate();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!otp.trim()) { setError('Please enter the OTP.'); return; }
        setLoading(true); setError('');
        try {
            await verifyEmail(email, otp);
            setSuccess('Email verified! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
        } finally { setLoading(false); }
    };

    const handleResend = async () => {
        setResending(true); setError(''); setSuccess('');
        try {
            await resendVerification(email);
            setSuccess('A new OTP has been sent to your email.');
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally { setResending(false); }
    };

    const inputClass = "w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gradient-to-br from-white to-brand-100 placeholder:text-gray-400 text-center text-xl tracking-[0.5em] font-mono";

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MailCheck className="w-7 h-7 text-brand-700" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Verify Your Email</h1>
                    <p className="text-sm text-gray-500">We sent a 6-digit OTP to</p>
                    <p className="text-sm font-semibold text-brand-700 mt-0.5">{email}</p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 mb-4">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />{success}
                    </div>
                )}

                <form onSubmit={handleVerify} className="space-y-4">
                    <input
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className={inputClass}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={loading || otp.length < 6}
                        className="w-full py-3 bg-brand-700 hover:bg-brand-900 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
                    >
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                <div className="text-center mt-5">
                    <p className="text-sm text-gray-500">Didn't receive the email?{' '}
                        <button onClick={handleResend} disabled={resending} className="text-brand-700 font-medium hover:underline disabled:opacity-50">
                            {resending ? 'Sending...' : 'Resend OTP'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default VerifyEmail;
