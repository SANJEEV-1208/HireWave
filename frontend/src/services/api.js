import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

const api = axios.create({ baseURL: BASE_URL });

// Separate instance for refresh calls — avoids re-triggering the response interceptor
const refreshApi = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
    failedQueue = [];
};

const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

api.interceptors.response.use(
    response => response,
    async error => {
        const status = error.response?.status;
        const originalRequest = error.config;

        if (status === 401 && !originalRequest._retry) {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) { clearSession(); return Promise.reject(error); }

            if (isRefreshing) {
                return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
                    .then(token => { originalRequest.headers.Authorization = `Bearer ${token}`; return api(originalRequest); });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const res = await refreshApi.post('/users/refresh', { refreshToken });
                const { token: newToken, refreshToken: newRefreshToken } = res.data.data;
                localStorage.setItem('token', newToken);
                localStorage.setItem('refreshToken', newRefreshToken);
                api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                clearSession();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export const register = (userData) => api.post('/users/register', userData);
export const login = (credentials) => api.post('/users/login', credentials);

// Job APIs
export const getJobs = () => api.get('/jobs');
export const getJobById = (id) => api.get(`/jobs/${id}`);
export const getAIRecommendations = () => api.get('/jobs/recommendations');
export const postJob = (employerId, jobData) => api.post(`/jobs/employer/${employerId}`, jobData);
export const searchJobs = (keyword) => api.get(`/jobs/search?keyword=${keyword}`);

// User APIs
export const getUserById = (id) => api.get(`/users/${id}`);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const uploadProfileResume = (userId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/users/${userId}/resume`, fd);
};
export const getUserResumeUrl = (userId) => `${BASE_URL}/users/${userId}/resume`;

// Application APIs
export const applyForJob = (jobId, file, coverLetter) => {
    const fd = new FormData();
    if (file) {
        fd.append('resume', file);
    } else {
        fd.append('useDefaultResume', 'true');
    }
    if (coverLetter) fd.append('coverLetter', coverLetter);
    return api.post(`/applications/apply/${jobId}`, fd);
};

export const forgotPasswordSendOtp = (email) => api.post('/users/forgot-password/send-otp', { email });
export const forgotPasswordReset = (email, otp, newPassword) => api.post('/users/forgot-password/reset', { email, otp, newPassword });
export const verifyEmail = (email, otp) => api.post('/users/verify-email', { email, otp });
export const resendVerification = (email) => api.post('/users/resend-verification', { email });
export const getApplicationResumeUrl = (applicationId) => `${BASE_URL}/applications/${applicationId}/resume`;
export const getMyApplications = () => api.get('/applications/my-applications');
export const getEmployerApplications = () => api.get('/applications/employer/applications');
export const updateApplicationStatus = (applicationId, status) => api.put(`/applications/${applicationId}/status`, { status });
export const updateApplicationNotes = (id, notes) => api.put(`/applications/${id}/notes`, { notes });

// Notification APIs
export const getNotifications = () => api.get('/notifications');
export const markNotificationsRead = () => api.put('/notifications/mark-read');

// Company logo APIs
export const uploadCompanyLogo = (userId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/users/${userId}/logo`, fd);
};
export const getCompanyLogoUrl = (userId) => `${BASE_URL}/users/${userId}/logo`;

// Profile picture APIs
export const uploadProfilePicture = (userId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/users/${userId}/profile-picture`, fd);
};
export const getProfilePictureUrl = (userId) => `${BASE_URL}/users/${userId}/profile-picture`;
export const deleteProfilePicture = (userId) => api.delete(`/users/${userId}/profile-picture`);

// Resume parser
export const parseResume = (userId) => api.get(`/users/${userId}/resume/parse`);

// Google OAuth
export const googleAuth = (credential, role) => api.post('/users/auth/google', { credential, role });

// Analytics APIs (employer only)
export const getAnalyticsSummary = () => api.get('/analytics/summary');
export const getAnalyticsOverTime = () => api.get('/analytics/applications-over-time');
export const getAnalyticsStatusDist = () => api.get('/analytics/status-distribution');
export const getAnalyticsTopJobs = () => api.get('/analytics/top-jobs');

// Chat / AI agent
export const sendChatMessage = (message) => api.post('/chat', { message });
export const generateCoverLetter = (jobId) => api.post(`/chat/cover-letter?jobId=${jobId}`);

// Real-time messaging
export const getConversations = () => api.get('/messages/conversations');
export const getConversation = (userId) => api.get(`/messages/conversation/${userId}`);
export const sendMessage = (recipientId, content) => api.post('/messages/send', { recipientId, content });
export const sendMessageWithFile = (recipientId, content, file) => {
    const fd = new FormData();
    fd.append('recipientId', recipientId);
    if (content) fd.append('content', content);
    if (file) fd.append('file', file);
    return api.post('/messages/send-with-file', fd);
};
export const getMessageAttachmentUrl = (messageId) => `${BASE_URL}/messages/${messageId}/attachment`;
export const markMessagesRead = (userId) => api.put(`/messages/read/${userId}`);
export const getUnreadMessageCount = () => api.get('/messages/unread-count');
export const recordProfileView = (seekerId) => api.post(`/profile-views/${seekerId}`);
export const reopenJob = (jobId) => api.patch(`/jobs/${jobId}/reopen`);

// Talent search & AI matching
export const searchUsers = (query, role) => api.get(`/users/search?query=${encodeURIComponent(query)}&role=${role}`);
export const getAIMatchedSeekers = (jobId) => api.get(`/jobs/${jobId}/ai-matches`);

export default api;
