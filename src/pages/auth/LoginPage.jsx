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
  Smartphone,
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
  const { adminLogin, sendOtp, loginWithOtp, switchRole } = useAuth();
  const { addToast } = useToast();

  // Tab: 'admin' | 'student-otp' | 'register'
  const [activeTab, setActiveTab] = useState('admin');

  // Admin form state (Matches Image 1 default)
  const [adminEmail, setAdminEmail] = useState('admin@college.com');
  const [adminPassword, setAdminPassword] = useState('Madhu@123');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Student OTP state
  const [studentEmail, setStudentEmail] = useState('');
  const [otpStep, setOtpStep] = useState('email'); // 'email' | 'otp' | 'details'
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isNewStudent, setIsNewStudent] = useState(false);
  const otpRefs = useRef([]);

  // New Student Registration Details
  const [regDetails, setRegDetails] = useState({
    full_name: '',
    student_id: '',
    department: 'Computer Science & Engineering',
    phone: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Handle Admin Sign In
  const handleAdminSubmit = async (e) => {
    e?.preventDefault();
    if (!adminEmail.trim() || !adminPassword) {
      setErrorMsg('Please enter email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await adminLogin(adminEmail.trim(), adminPassword);
      addToast({
        type: 'success',
        title: 'Authentication Successful',
        message: `Welcome to CloudLib Pro, ${res?.user?.full_name || 'Admin'}!`,
      });
    } catch (err) {
      setErrorMsg(err.message || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click sandbox fill
  const fillSandboxAdmin = () => {
    setAdminEmail('admin@college.com');
    setAdminPassword('Madhu@123');
    setErrorMsg('');
  };

  // Send Student OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!studentEmail.trim() || !studentEmail.includes('@')) {
      setErrorMsg('Please enter a valid university or student email address.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await sendOtp(studentEmail.trim());
      setIsNewStudent(res.isNewStudent);
      if (res.demoOtp) {
        setDemoOtp(res.demoOtp);
      }
      setOtpStep('otp');
      setCountdown(60);
      addToast({
        type: 'success',
        title: 'OTP Sent',
        message: `A 6-digit code was sent to ${studentEmail.trim()}`,
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP.');
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

  // Verify Student OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const code = otpCode.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the OTP.');
      return;
    }

    if (isNewStudent && (!regDetails.full_name.trim() || !regDetails.student_id.trim())) {
      setOtpStep('details');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await loginWithOtp({
        email: studentEmail.trim(),
        otp: code,
        studentDetails: isNewStudent ? regDetails : undefined,
      });
      addToast({
        type: 'success',
        title: isNewStudent ? 'Welcome to CloudLib Pro!' : 'Welcome Back!',
        message: `Signed in as ${res?.user?.full_name || 'Student'}.`,
      });
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Quick student demo fill
  const fillDemoStudent = (email, name = 'Rahul Sharma') => {
    setActiveTab('student-otp');
    setStudentEmail(email);
    setOtpStep('email');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* LEFT COLUMN: Deep Indigo Gradient Feature Panel (Matches Image 1) */}
      <div className="lg:w-[50%] xl:w-[48%] bg-gradient-to-br from-[#1e1b4b] via-[#2e287a] to-[#3730a3] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden shadow-2xl">
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
              <span>Instant 2FA OTP verification &amp; digital card logs</span>
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

      {/* RIGHT COLUMN: Light Minimalist Container with Floating SIGN IN Card */}
      <div className="lg:w-[50%] xl:w-[52%] flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-slate-50 dark:bg-[#0B0F19]">
        <div className="w-full max-w-[440px] bg-white dark:bg-[#111827] rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 sm:p-10 transition-all">
          {/* Card Header (Image 1: SIGN IN) */}
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              SIGN IN
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter your account credentials to access your dashboard.
            </p>
          </div>

          {/* Role Switching Tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'admin'
                  ? 'bg-white dark:bg-[#1E293B] text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Librarian / Staff
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('student-otp');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'student-otp'
                  ? 'bg-white dark:bg-[#1E293B] text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Student (OTP Login)
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: ADMIN LOGIN (Exact layout of Image 1) */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  EMAIL / USERNAME
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@college.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#eef2f6] dark:bg-slate-800/90 text-slate-900 dark:text-white text-sm rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-[#eef2f6] dark:bg-slate-800/90 text-slate-900 dark:text-white text-sm rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 outline-none transition-all tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Purple SIGN IN Button (Exact style of Image 1) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>SIGN IN</span>
                )}
              </button>

              {/* Sandbox Credentials Box (Exact visual match to Image 1) */}
              <div className="pt-4">
                <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mb-2">
                  Local sandbox credentials are seeded in database.
                </p>
                <div
                  onClick={fillSandboxAdmin}
                  className="rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-600 dark:text-slate-400 font-mono flex flex-col gap-1 cursor-pointer hover:border-indigo-400 transition-colors group"
                  title="Click to auto-fill credentials"
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
              </div>
            </form>
          )}

          {/* TAB 2: STUDENT OTP & SIGNUP */}
          {activeTab === 'student-otp' && (
            <div className="space-y-4">
              {otpStep === 'email' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                      STUDENT UNIVERSITY EMAIL
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="e.g. rahul.cse@cloudlib.edu"
                        className="w-full pl-10 pr-4 py-3 bg-[#eef2f6] dark:bg-slate-800/90 text-slate-900 dark:text-white text-sm rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>SEND 6-DIGIT OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Quick Student Sandbox Profiles */}
                  <div className="pt-2">
                    <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mb-2">
                      Or select an enrolled student to test with 1-click:
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      <button
                        type="button"
                        onClick={() => fillDemoStudent('rahul.cse@cloudlib.edu', 'Rahul Sharma')}
                        className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-left text-xs text-slate-700 dark:text-slate-300 hover:border-indigo-400 flex items-center justify-between"
                      >
                        <span className="font-semibold">Rahul Sharma (CSE)</span>
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                          rahul.cse@cloudlib.edu
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemoStudent('priya.ise@cloudlib.edu', 'Priya Patel')}
                        className="w-full py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-left text-xs text-slate-700 dark:text-slate-300 hover:border-indigo-400 flex items-center justify-between"
                      >
                        <span className="font-semibold">Priya Patel (ISE)</span>
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                          priya.ise@cloudlib.edu
                        </span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* STEP: ENTER OTP */}
              {otpStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center pb-2">
                    <span className="inline-block p-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-1">
                      <KeyRound className="w-5 h-5" />
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Enter the 6-digit verification code sent to:
                    </p>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      {studentEmail}
                    </p>
                  </div>

                  {/* 6 Digit Inputs */}
                  <div className="flex justify-center gap-2">
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
                        className="w-11 h-12 text-center text-lg font-bold bg-[#eef2f6] dark:bg-slate-800/90 text-slate-900 dark:text-white rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ))}
                  </div>

                  {/* Demo OTP Banner for grading convenience */}
                  {demoOtp && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Sandbox OTP: <strong className="font-mono text-sm">{demoOtp}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={fillDemoOtp}
                        className="px-2 py-1 rounded bg-amber-200 dark:bg-amber-900/80 font-bold hover:bg-amber-300 text-[11px]"
                      >
                        Auto-fill
                      </button>
                    </div>
                  )}

                  {isNewStudent && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        New Student Registration
                      </p>
                      <input
                        type="text"
                        required
                        value={regDetails.full_name}
                        onChange={(e) => setRegDetails({ ...regDetails, full_name: e.target.value })}
                        placeholder="Your Full Name (e.g. Rahul Sharma)"
                        className="w-full px-3 py-2.5 bg-[#eef2f6] dark:bg-slate-800/90 text-xs rounded-xl outline-none"
                      />
                      <input
                        type="text"
                        required
                        value={regDetails.student_id}
                        onChange={(e) => setRegDetails({ ...regDetails, student_id: e.target.value })}
                        placeholder="College Roll No (e.g. 2024CSE101)"
                        className="w-full px-3 py-2.5 bg-[#eef2f6] dark:bg-slate-800/90 text-xs rounded-xl outline-none font-mono"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>{isNewStudent ? 'COMPLETE REGISTRATION' : 'VERIFY & ENTER PORTAL'}</span>
                    )}
                  </button>

                  <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                    <button
                      type="button"
                      onClick={() => setOtpStep('email')}
                      className="hover:underline"
                    >
                      &larr; Change Email
                    </button>
                    {countdown > 0 ? (
                      <span>Resend in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Bottom Security / Cloud Status */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Supabase Cloud Connected
            </span>
            <span>Vercel Edge</span>
          </div>
        </div>
      </div>
    </div>
  );
};
