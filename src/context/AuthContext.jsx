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

  const login = async (email, password) => {
    try {
      setLoading(true);
      // Determine if logging in as admin or student
      const role = email.includes('student') || email.includes('rahul') || email.includes('ananya') ? 'student' : 'admin';
      const res = await api.switchDemoRole(role);
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

  const register = async (userData) => {
    try {
      setLoading(true);
      const res = await api.registerStudent(userData);
      if (res.success && res.student) {
        setUser(res.student);
        localStorage.setItem('cloudlib_token', res.student.id);
        return { success: true };
      }
      return { success: false, message: 'Registration failed.' };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('cloudlib_token');
    // Switch to student view for demonstration or reset
    switchRole('student');
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'librarian';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAdmin,
        isStudent,
        switchRole,
        login,
        register,
        logout,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
