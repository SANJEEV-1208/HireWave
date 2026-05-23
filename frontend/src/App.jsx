import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PostJob from './pages/PostJob';
import MyJobs from './pages/MyJobs';
import JobDetails from './pages/JobDetails';
import MyApplications from './pages/MyApplications';
import ApplicationsReceived from './pages/ApplicationsReceived';
import EditJob from './pages/EditJob';
import BookmarkedJobs from './pages/BookmarkedJobs';
import Profile from './pages/Profile';
import SeekerProfile from './pages/SeekerProfile';
import CompanyProfile from './pages/CompanyProfile';
import Analytics from './pages/Analytics';
import Messages from './pages/Messages';
import VerifyEmail from './pages/VerifyEmail';
import ChatWidget from './components/ChatWidget';
import TalentSearch from './pages/TalentSearch';
import TalentMatches from './pages/TalentMatches';

const AUTH_ROUTES = ['/login', '/register'];

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
}

function PublicOnlyRoute({ children }) {
    const { isAuthenticated, isEmployer } = useAuth();
    if (isAuthenticated) return <Navigate to={isEmployer() ? '/my-jobs' : '/jobs'} replace />;
    return children;
}

function Layout() {
  const { pathname } = useLocation();
  return (
    <>
      {!AUTH_ROUTES.includes(pathname) && <Navbar />}
      {!AUTH_ROUTES.includes(pathname) && <ChatWidget />}
      <Routes>
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          <Route path="/verify-email" element={<PublicOnlyRoute><VerifyEmail /></PublicOnlyRoute>} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/post-job" element={<ProtectedRoute><PostJob /></ProtectedRoute>} />
          <Route path="/my-jobs" element={<ProtectedRoute><MyJobs /></ProtectedRoute>} />
          <Route path="/my-applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
          <Route path="/applications-received" element={<ProtectedRoute><ApplicationsReceived /></ProtectedRoute>} />
          <Route path="/edit-job/:id" element={<ProtectedRoute><EditJob /></ProtectedRoute>} />
          <Route path="/bookmarks" element={<ProtectedRoute><BookmarkedJobs /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/seeker-profile/:userId" element={<ProtectedRoute><SeekerProfile /></ProtectedRoute>} />
          <Route path="/company/:id" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/talent-search" element={<ProtectedRoute><TalentSearch /></ProtectedRoute>} />
          <Route path="/talent-matches/:jobId" element={<ProtectedRoute><TalentMatches /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;