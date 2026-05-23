import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

function BackButton() {
    const { isEmployer } = useAuth();
    const to = isEmployer() ? '/my-jobs' : '/jobs';
    const label = isEmployer() ? 'My Jobs' : 'Jobs';
    return (
        <Link to={to} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 font-medium mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to {label}
        </Link>
    );
}

export default BackButton;
