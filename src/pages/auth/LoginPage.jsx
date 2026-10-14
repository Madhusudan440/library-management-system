import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Check,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Sparkles,
  KeyRound,
  User,
  Building2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';

export const LoginPage = () => {
  const { adminLogin, studentPasswordLogin, forgotPasswordSendOtp, forgotPasswordReset } = useAuth();
  const { addToast } = useToast();

  // Primary mode: 'signin' | 'forgot-password' | 'register'
  const [viewMode, setViewMode] = useState('signin');

  // Role Tab in Sign In: 'admin' | 'student'
  const [roleTab, setRoleTab] = useState('admin');

  // Form Fields for Sign In
  const [email, setEmail] = useState('admin@college.com');
  const [password, setPassword] = useState('Madhu@123');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password / OTP State
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState('email'); // 'email' | 'otp'
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);

  // New Student Registration State
  const [regData, setRegData] = useState({
    full_name: '',
    email: '',
    student_id: '',
    department: 'Computer Science & Engineering',
    password: '',
    confirm_password: '',
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer for reset OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Lock body scroll on mobile devices while LoginPage is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;

    if (window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100dvh';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
    };
  }, []);

  // Handle mobile back button & history trap (preventing site from closing)
  useEffect(() => {
    // Seed initial history entries so pressing back doesn't close website
    window.history.replaceState({ app: 'cloudlib', page: 'login', view: 'signin' }, '');
    window.history.pushState({ app: 'cloudlib', page: 'login', view: 'signin' }, '');

    const handlePopState = (e) => {
      if (viewMode === 'forgot-password') {
        setViewMode('signin');
        setErrorMsg('');
        setSuccessMsg('');
        window.history.pushState({ app: 'cloudlib', page: 'login', view: 'signin' }, '');
      } else {
        // Prevent accidental closing of website on mobile back press
        window.history.pushState({ app: 'cloudlib', page: 'login', view: 'signin' }, '');
        addToast({
          type: 'info',
          title: 'CloudLib Pro',
          message: 'Sign in to access your library dashboard.',
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewMode]);

  // Handle Role Tab Switching
  const handleRoleTabChange = (role) => {
    setRoleTab(role);
    setErrorMsg('');
    setSuccessMsg('');
    if (role === 'admin') {
      setEmail('admin@college.com');
      setPassword('Madhu@123');
    } else {
      setEmail('rahul.cse@cloudlib.edu');
      setPassword('student123');
    }
  };

  // 1. Password Login Handler (No OTP required for routine login)
  const handleSignIn = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (roleTab === 'admin') {
        const res = await adminLogin(email.trim(), password);
        addToast({
          type: 'success',
          title: 'Admin Access Granted',
          message: `Welcome back, ${res?.user?.full_name || 'Administrator'}!`,
        });
      } else {
        const res = await studentPasswordLogin(email.trim(), password);
        addToast({
          type: 'success',
          title: 'Student Access Granted',
          message: `Welcome back, ${res?.user?.full_name || 'Student'}!`,
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid credentials. Please verify your password or use Forgot Password.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Forgot Password: Send OTP
  const handleSendResetOtp = async (e) => {
    e?.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setErrorMsg('Please enter a valid registered email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await forgotPasswordSendOtp(resetEmail.trim());
      if (res.demoOtp) {
        setDemoOtp(res.demoOtp);
      }
      setResetStep('otp');
      setCountdown(60);
      setSuccessMsg(`A 6-digit OTP code has been sent to ${resetEmail.trim()}`);
      addToast({
        type: 'success',
        title: 'Reset OTP Sent',
        message: `Verification code sent to ${resetEmail.trim()}`,
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send password reset OTP.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Input boxes handle
  const handleOtpBoxChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpCode];
    next[idx] = val.slice(-1);
    setOtpCode(next);
    if (val && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otpCode[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const fillDemoOtp = () => {
    if (demoOtp && demoOtp.length === 6) {
      const digits = demoOtp.split('');
      setOtpCode(digits);
      otpRefs.current[5]?.focus();
    }
  };

  // 3. Forgot Password: Verify OTP and Reset
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    const code = otpCode.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the OTP code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await forgotPasswordReset({
        email: resetEmail.trim(),
        otp: code,
        newPassword,
      });

      addToast({
        type: 'success',
        title: 'Password Reset Complete',
        message: 'Your password has been updated. You can now sign in.',
      });

      // Switch back to Sign In with updated credentials prefilled!
      setEmail(resetEmail.trim());
      setPassword(newPassword);
      setViewMode('signin');
      setSuccessMsg('Password updated successfully! Click SIGN IN to continue.');
      setResetStep('email');
      setOtpCode(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password. Please check the OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Fill quick demo credentials
  const fillSandboxAdmin = () => {
    setRoleTab('admin');
    setEmail('admin@college.com');
    setPassword('Madhu@123');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const fillSandboxStudent = () => {
    setRoleTab('student');
    setEmail('rahul.cse@cloudlib.edu');
    setPassword('student123');
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="fixed inset-0 lg:static w-full h-[100dvh] lg:h-auto lg:min-h-screen flex flex-col justify-between lg:flex-row bg-[#f8fafc] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-hidden lg:overflow-visible">
      
      {/* MOBILE ONLY: Top Header Bar with Image Gradient */}
      <div className="lg:hidden w-full bg-gradient-to-r from-[#1e1b4b] via-[#2e287a] to-[#3730a3] text-white px-4 py-2.5 flex items-center justify-between shadow-md shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
            <GraduationCap className="w-4 h-4 text-indigo-200" />
          </div>
          <div>
            <span className="text-xs font-black tracking-wider uppercase block leading-none text-white">
              SMART ACADEMIC
            </span>
            <span className="text-[9px] text-indigo-200/90 font-medium block">
              Cloud Library Pro
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] text-indigo-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live Portal</span>
        </div>
      </div>

      {/* DESKTOP ONLY: Left Column Deep Indigo Gradient Feature Panel (Matches Image 1 exactly) */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[48%] bg-gradient-to-br from-[#1e1b4b] via-[#2e287a] to-[#3730a3] text-white p-8 sm:p-12 lg:p-16 flex-col justify-between relative overflow-hidden shadow-2xl">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding (Image 1 top left: icon + SMART ACADEMIC) */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
            <GraduationCap className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <span className="text-white font-extrabold tracking-wider text-base uppercase">
              SMART ACADEMIC
            </span>
            <span className="text-[11px] block text-indigo-300 font-medium tracking-normal -mt-0.5">
              Cloud Library Management System
            </span>
          </div>
        </div>

        {/* Center Content (Image 1 Headline, Description & 3 Feature Checkmarks) */}
        <div className="relative z-10 my-10 lg:my-auto max-w-lg">
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] xl:text-[46px] font-black text-white leading-[1.15] mb-5 tracking-tight">
            Streamlined <br />
            Academic & Library <br />
            Management.
          </h1>

          <p className="text-indigo-200/90 text-sm sm:text-base leading-relaxed mb-8 font-normal">
            Access your courses, verify catalogue logs, enter/retrieve book issues,
            and explore 20+ technical literature volumes directly from a single unified portal.
          </p>

          {/* 3 Checkmarks with rounded square boxes (Image 1) */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/95 text-sm sm:text-[15px] font-medium">
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span>Complete attendance &amp; catalogue logs</span>
            </div>

            <div className="flex items-center gap-3 text-white/95 text-sm sm:text-[15px] font-medium">
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span>Secure, role-based private portal environments</span>
            </div>

            <div className="flex items-center gap-3 text-white/95 text-sm sm:text-[15px] font-medium">
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span>Real-time library circulation &amp; OTP password recovery</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer (Image 1 footer) */}
        <div className="relative z-10 pt-6 border-t border-indigo-400/20 text-xs text-indigo-300/70 font-medium flex flex-wrap items-center justify-between gap-2">
          <span>&copy; 2026 Academic Suite. All rights reserved.</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-indigo-200">
            Registered Sandbox Instance
          </span>
        </div>
      </div>

      {/* CENTER / RIGHT COLUMN: Container with Floating SIGN IN Card */}
      <div className="w-full lg:w-[50%] xl:w-[52%] flex-1 flex flex-col items-center justify-center p-3 sm:p-5 lg:p-14 bg-slate-50 dark:bg-[#0B0F19] overflow-hidden lg:overflow-visible">
        
        <div className="w-full max-w-[390px] sm:max-w-[420px] lg:max-w-[440px] bg-white dark:bg-[#111827] rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-4 sm:p-6 lg:p-10 transition-all">
          
          {/* VIEW MODE 1: REGULAR PASSWORD SIGN IN (Direct Password Login) */}
          {viewMode === 'signin' && (
            <>
              {/* Card Header (Image 1: SIGN IN) */}
              <div className="mb-3 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  SIGN IN
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
                  Enter your account credentials to access your dashboard.
                </p>
              </div>

              {/* Role Switching Tabs (Admin / Staff vs Student) */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 mb-3 sm:mb-5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleRoleTabChange('admin')}
                  className={`flex-1 py-1.5 sm:py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs ${
                    roleTab === 'admin'
                      ? 'bg-white dark:bg-[#1E293B] text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Librarian / Staff
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleTabChange('student')}
                  className={`flex-1 py-1.5 sm:py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs ${
                    roleTab === 'student'
                      ? 'bg-white dark:bg-[#1E293B] text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Student Portal
                </button>
              </div>

              {/* Success / Info Banner */}
              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Error Banner */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Password Login Form (Exact layout of Image 1) */}
              <form onSubmit={handleSignIn} className="space-y-2.5 sm:space-y-4">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 mb-1 sm:mb-1.5">
                    EMAIL / USERNAME
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={roleTab === 'admin' ? 'admin@college.com' : 'rahul.cse@cloudlib.edu'}
                      className="w-full pl-10 pr-4 py-2 sm:py-3 bg-[#eef2f6] dark:bg-slate-800/90 text-slate-900 dark:text-white text-base sm:text-sm rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                    <label className="block text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">
                      PASSWORD
                    </label>
                    {/* FORGOT PASSWORD LINK */}
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setViewMode('forgot-password');
                        setResetStep('email');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-[10px] sm:text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2 sm:py-3 bg-[#eef2f6] dark:bg-slate-800/90 text-slate-900 dark:text-white text-base sm:text-sm rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 outline-none transition-all tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Purple SIGN IN Button (Exact style of Image 1) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-1.5 sm:mt-2 py-2.5 sm:py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>SIGN IN</span>
                  )}
                </button>

                {/* Sandbox Credentials Box (Exact visual match to Image 1) */}
                <div className="pt-2 sm:pt-4">
                  <p className="text-center text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mb-1 sm:mb-2">
                    Local sandbox credentials are seeded in database.
                  </p>
                  
                  {roleTab === 'admin' ? (
                    <div
                      onClick={fillSandboxAdmin}
                      className="rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-2 sm:p-3 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 font-mono flex flex-col gap-0.5 sm:gap-1 cursor-pointer hover:border-indigo-400 transition-colors group"
                      title="Click to auto-fill admin credentials"
                    >
                      <div className="flex justify-between items-center">
                        <span>Username:</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">
                          admin@college.com
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Password:</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          Madhu@123
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={fillSandboxStudent}
                      className="rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-2 sm:p-3 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 font-mono flex flex-col gap-0.5 sm:gap-1 cursor-pointer hover:border-indigo-400 transition-colors group"
                      title="Click to auto-fill student credentials"
                    >
                      <div className="flex justify-between items-center">
                        <span>Username:</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">
                          rahul.cse@cloudlib.edu
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Password:</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          student123
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </>
          )}

          {/* VIEW MODE 2: FORGOT PASSWORD VIA OTP */}
          {viewMode === 'forgot-password' && (
            <div>
              {/* Header */}
              <div className="mb-3 sm:mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('signin');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 mb-1 sm:mb-2"
                >
                  &larr; Back to Sign In
                </button>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  RESET PASSWORD
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
                  Change your password securely via one-time verification code (OTP).
                </p>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* STEP 1: Enter Email to Send Reset OTP */}
              {resetStep === 'email' && (
                <form onSubmit={handleSendResetOtp} className="space-y-2.5 sm:space-y-4">
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 mb-1 sm:mb-1.5">
                      REGISTERED ACCOUNT EMAIL
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="e.g. admin@college.com or rahul.cse@cloudlib.edu"
                        className="w-full pl-10 pr-4 py-2 sm:py-3 bg-[#eef2f6] dark:bg-slate-800/90 text-slate-900 dark:text-white text-base sm:text-sm rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 sm:py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>SEND RESET OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="pt-1.5 sm:pt-2">
                    <p className="text-center text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mb-1.5">
                      Need quick test email?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setResetEmail('admin@college.com')}
                        className="flex-1 py-1 sm:py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] sm:text-[11px] font-mono hover:border-indigo-400 text-slate-700 dark:text-slate-300"
                      >
                        admin@college.com
                      </button>
                      <button
                        type="button"
                        onClick={() => setResetEmail('rahul.cse@cloudlib.edu')}
                        className="flex-1 py-1 sm:py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] sm:text-[11px] font-mono hover:border-indigo-400 text-slate-700 dark:text-slate-300"
                      >
                        rahul.cse@cloudlib.edu
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* STEP 2: Verify OTP & Enter New Password */}
              {resetStep === 'otp' && (
                <form onSubmit={handleResetPassword} className="space-y-2.5 sm:space-y-4">
                  <div className="text-center pb-1">
                    <span className="inline-block p-1.5 sm:p-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-0.5">
                      <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
                    </span>
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                      Enter the 6-digit verification code sent to:
                    </p>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      {resetEmail}
                    </p>
                  </div>

                  {/* 6 Digit Inputs */}
                  <div className="flex justify-center gap-1.5 sm:gap-2">
                    {otpCode.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-9 h-10 sm:w-11 sm:h-12 text-center text-base sm:text-lg font-bold bg-[#eef2f6] dark:bg-slate-800/90 text-slate-900 dark:text-white rounded-lg sm:rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ))}
                  </div>

                  {/* Demo OTP Banner for evaluation */}
                  {demoOtp && (
                    <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-[11px] sm:text-xs text-amber-800 dark:text-amber-300">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Reset OTP: <strong className="font-mono text-xs sm:text-sm">{demoOtp}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={fillDemoOtp}
                        className="px-2 py-0.5 sm:py-1 rounded bg-amber-200 dark:bg-amber-900/80 font-bold hover:bg-amber-300 text-[10px] sm:text-[11px]"
                      >
                        Auto-fill
                      </button>
                    </div>
                  )}

                  {/* New Password Fields */}
                  <div className="space-y-2 sm:space-y-3 pt-1">
                    <div>
                      <label className="block text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 mb-0.5 sm:mb-1">
                        NEW PASSWORD
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full pl-10 pr-10 py-2 sm:py-2.5 bg-[#eef2f6] dark:bg-slate-800/90 text-slate-900 dark:text-white text-base sm:text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 mb-0.5 sm:mb-1">
                        CONFIRM NEW PASSWORD
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-[#eef2f6] dark:bg-slate-800/90 text-slate-900 dark:text-white text-base sm:text-xs rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 sm:py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>UPDATE &amp; SAVE PASSWORD</span>
                    )}
                  </button>

                  <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                    <button
                      type="button"
                      onClick={() => setResetStep('email')}
                      className="hover:underline text-[11px] sm:text-xs"
                    >
                      &larr; Change Email
                    </button>
                    {countdown > 0 ? (
                      <span className="text-[11px] sm:text-xs">Resend in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendResetOtp}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline text-[11px] sm:text-xs"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Bottom Security / Cloud Status (Visible on desktop inside card) */}
          <div className="hidden lg:flex mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Supabase Cloud Connected
            </span>
            <span>Vercel Serverless Edge</span>
          </div>
        </div>
      </div>

      {/* MOBILE ONLY: Bottom Footer Bar with Image Gradient */}
      <div className="lg:hidden w-full bg-gradient-to-r from-[#1e1b4b] via-[#2e287a] to-[#3730a3] text-white px-4 py-2 flex items-center justify-between text-[10px] text-indigo-200/90 border-t border-indigo-400/20 shrink-0 z-20">
        <span>&copy; 2026 Academic Suite</span>
        <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-mono">Sandbox Instance</span>
      </div>
    </div>
  );
};
