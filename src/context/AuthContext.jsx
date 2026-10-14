import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getProfile();
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.warn('Initial session fetch notice:', err.message);
      // Fallback demo admin
      setUser({
        id: 'user-admin-001',
        full_name: 'Dr. Sarah Mitchell',
        email: 'admin@cloudlib.edu',
        role: 'admin',
        student_id: 'FAC-LIB-001',
        department: 'Central Library & Information Science',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
        status: 'active',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('student'); // 'student' | 'admin'

  const openAuthModal = (tab = 'student') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const switchRole = async (targetRole) => {
    try {
      setLoading(true);
      const res = await api.switchDemoRole(targetRole);
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('cloudlib_token', res.user.id);
        return { success: true };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Student OTP Authentication
  const sendOtp = async (email) => {
    setError(null);
    try {
      const res = await api.sendOtp(email);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const loginWithOtp = async ({ email, otp, studentDetails }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.verifyOtp({ email, otp, studentDetails });
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('cloudlib_token', res.token || res.user.id);
        setIsAuthModalOpen(false);
      }
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Admin Login with Email & Password
  const adminLogin = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminLogin({ email, password });
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('cloudlib_token', res.token || res.user.id);
        setIsAuthModalOpen(false);
      }
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Student Password Login
  const studentPasswordLogin = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.studentLogin({ email, password });
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('cloudlib_token', res.token || res.user.id);
        setIsAuthModalOpen(false);
      }
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('cloudlib_token');
    // Switch to student view or prompt login
    setUser(null);
    openAuthModal('student');
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'librarian';
  const isStudent = user?.role === 'student';
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAdmin,
        isStudent,
        isAuthenticated,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        sendOtp,
        loginWithOtp,
        adminLogin,
        studentPasswordLogin,
        switchRole,
        logout,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
