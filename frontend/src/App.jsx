import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './ErrorBoundary';
import Dashboard from './pages/Dashboard';
import FineTuneData from './pages/FineTuneData';
import Topics from './pages/Topics';
import Scrapes from './pages/Scrapes';
import Posts from './pages/Posts';
import KnowledgeBase from './pages/KnowledgeBase';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BionicWorkspace from './pages/BionicWorkspace';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import InstagramWorkspace from './pages/InstagramWorkspace';
import InstagramLedger from './pages/InstagramLedger';

// Simple Route Protection Component
function PrivateWrapper({ children }) {
  const navigate = useNavigate();
  const { user, fetchMe, token, isLoadingUser } = useAuthStore();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else if (!user && !isLoadingUser) {
      fetchMe();
    }
  }, [token, user, fetchMe, navigate, isLoadingUser]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (token && (!user || isLoadingUser)) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-white/5 border-t-teal-500 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Initializing OS Hub...</p>
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Dashboard Routes */}
          {/* Default to Workspace as Requested */}
          <Route path="/" element={<Navigate to="/workspace" replace />} />
          
          <Route path="/ledger" element={<PrivateWrapper><Dashboard /></PrivateWrapper>} />
          <Route path="/workspace" element={<PrivateWrapper><BionicWorkspace /></PrivateWrapper>} />
          <Route path="/instagram-workspace" element={<PrivateWrapper><InstagramWorkspace /></PrivateWrapper>} />
          <Route path="/instagram-ledger" element={<PrivateWrapper><InstagramLedger /></PrivateWrapper>} />
          <Route path="/topics" element={<PrivateWrapper><Topics /></PrivateWrapper>} />
          <Route path="/scrape" element={<PrivateWrapper><Scrapes /></PrivateWrapper>} />
          <Route path="/posts" element={<PrivateWrapper><Posts /></PrivateWrapper>} />
          <Route path="/vault" element={<PrivateWrapper><KnowledgeBase /></PrivateWrapper>} />
          <Route path="/finetune" element={<PrivateWrapper><FineTuneData /></PrivateWrapper>} />
          <Route path="/settings" element={<PrivateWrapper><Settings /></PrivateWrapper>} />
          
          {/* Legacy fallback */}
          <Route path="/dashboard" element={<Navigate to="/ledger" replace />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
