import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as loginApi, register as registerApi, googleAuth } from '../services/api';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken && isTokenExpired(storedToken)) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setLoading(false);
            return;
        }
        if (storedToken) {
            const userData = localStorage.getItem('user');
            if (userData) setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    // Register function
    const register = async (userData) => {
        try {
            const response = await registerApi(userData);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message);
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    };

    // Login function
    const login = async (email, password) => {
        try {
            const response = await loginApi({ email, password });
            if (response.data.success) {
                const { token, refreshToken, user } = response.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('user', JSON.stringify(user));
                setToken(token);
                setUser(user);
                return { success: true, role: user.role };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const loginWithGoogle = async (credential, role) => {
        const response = await googleAuth(credential, role);
        if (response.data.success) {
            const { token, refreshToken, user } = response.data.data;
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
            setToken(token);
            setUser(user);
            return { success: true, role: user.role };
        }
        return { success: false };
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try { await api.post('/users/logout', { refreshToken }); } catch {}
        }
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const isJobSeeker = () => user?.role === 'JOB_SEEKER';
    const isEmployer = () => user?.role === 'EMPLOYER';
    const isAdmin = () => user?.role === 'ADMIN';

    const value = {
        user,
        token,
        register,
        login,
        loginWithGoogle,
        logout,
        isJobSeeker,
        isEmployer,
        isAdmin,
        isAuthenticated: !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};