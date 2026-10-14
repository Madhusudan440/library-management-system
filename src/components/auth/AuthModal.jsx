import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Lock,
  GraduationCap,
  Shield,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Smartphone,
  User,
  Building2,
  IdCard,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    openAuthModal,
    sendOtp,
    loginWithOtp,
    adminLogin,
    studentPasswordLogin,
    switchRole,
    user,
  } = useAuth();

  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState(authModalTab || 'student');
  const [studentAuthMode, setStudentAuthMode] = useState('otp'); // 'otp' | 'password'

  // Student OTP state
  const [otpStep, setOtpStep] = useState('email'); // 'email' | 'otp' | 'register'
  const [studentEmail, setStudentEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [demoOtpCode, setDemoOtpCode] = useState('');
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // New Student Registration fields
  const [studentDetails, setStudentDetails] = useState({
    full_name: '',
    student_id: '',
    department: 'Computer Science & Engineering',
    phone: '',
  });

  // Admin login state
  const [adminEmail, setAdminEmail] = useState('admin@cloudlib.edu');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // General loading & error
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const otpInputRefs = useRef([]);

  // Sync tab with AuthContext
  useEffect(() => {
    if (authModalTab) {
      setActiveTab(authModalTab);
    }
  }, [authModalTab]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isAuthModalOpen) return null;

  // 1. Handle Send OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!studentEmail || !studentEmail.includes('@')) {
      setErrorMsg('Please enter a valid university or personal email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await sendOtp(studentEmail);
      setIsNewStudent(res.isNewStudent);
      if (res.demoOtp) {
        setDemoOtpCode(res.demoOtp);
      }
      setOtpStep('otp');
      setCountdown(60);
      addToast({
        type: 'success',
        title: 'OTP Sent Successfully',
        message: `A 6-digit code has been sent to ${studentEmail}.`,
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle OTP Input Change (Auto-focus next box)
  const handleOtpBoxChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otpCode];
    newOtp[index] = val.slice(-1);
    setOtpCode(newOtp);

    // Auto advance
    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleAutoFillDemoOtp = () => {
    if (demoOtpCode && demoOtpCode.length === 6) {
      const digits = demoOtpCode.split('');
      setOtpCode(digits);
    }
  };

  // 3. Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const fullOtp = otpCode.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        email: studentEmail,
        otp: fullOtp,
      };

      if (otpStep === 'register') {
        payload.studentDetails = studentDetails;
      }

      const res = await loginWithOtp(payload);

      if (res.needsRegistration) {
        setOtpStep('register');
        setIsNewStudent(true);
        addToast({
          type: 'info',
          title: 'OTP Verified!',
          message: 'Welcome! Please fill in your student details to activate your library card.',
        });
      } else {
        addToast({
          type: 'success',
          title: 'Welcome to CloudLib Pro',
          message: res.message || 'Authenticated successfully!',
        });
        closeAuthModal();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Admin Login
  const handleAdminLogin = async (e) => {
    e?.preventDefault();
    if (!adminEmail || !adminPassword) {
      setErrorMsg('Please enter your administrator email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await adminLogin(adminEmail, adminPassword);
      addToast({
        type: 'success',
        title: 'Admin Access Granted',
        message: res.message || 'Logged in to Librarian Portal.',
      });
      closeAuthModal();
    } catch (err) {
      setErrorMsg(err.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 5. 1-Click Quick Demo Handlers (Essential for Examiners & Viva)
  const handleQuickDemoAdmin = async () => {
    setLoading(true);
    await switchRole('admin');
    addToast({
      type: 'success',
      title: 'Demo Admin Session Active',
      message: 'Logged in as Dr. Sarah Mitchell (Chief Librarian)',
    });
    setLoading(false);
    closeAuthModal();
  };

  const handleQuickDemoStudent = async () => {
    setLoading(true);
    await switchRole('student');
    addToast({
      type: 'success',
      title: 'Demo Student Session Active',
      message: 'Logged in as Rahul Sharma (CSE Dept, Roll: 2023CSE014)',
    });
    setLoading(false);
    closeAuthModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg glass-card bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 text-slate-800 dark:text-slate-100 transition-all">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/30 mb-3">
            {activeTab === 'student' ? <GraduationCap className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {activeTab === 'student' ? 'Student Access Portal' : 'Librarian & Admin Portal'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {activeTab === 'student'
              ? 'Sign in or register with secure 6-digit OTP to access loans & catalogue'
              : 'Authorized library staff authentication with administrative privileges'}
          </p>
        </div>

        {/* Tab Toggle: Student vs Admin */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl mb-6 border border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('student');
              setErrorMsg('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'student'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student (OTP Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin & Staff
          </button>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: STUDENT PORTAL (OTP & NEW STUDENT REGISTRATION) */}
        {activeTab === 'student' && (
          <div>
            {/* Step 1: Request OTP by Email */}
            {otpStep === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Student Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@cloudlib.edu or rollno@student.edu"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    New students will automatically receive a digital library card upon OTP verification!
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send 6-Digit Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Quick 1-Click Evaluation Pill */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[11px] text-slate-400 mb-2">Academic Viva / Instant Evaluation:</p>
                  <button
                    type="button"
                    onClick={handleQuickDemoStudent}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors border border-indigo-200/50 dark:border-indigo-900/50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    1-Click Student Login (Rahul Sharma)
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Enter 6-Digit OTP */}
            {otpStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Enter the 6-digit code sent to <strong className="text-indigo-600 dark:text-indigo-400">{studentEmail}</strong>
                  </p>

                  {/* Demo Helper Banner for Easy Evaluation */}
                  {demoOtpCode && (
                    <div
                      onClick={handleAutoFillDemoOtp}
                      className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium cursor-pointer hover:scale-[1.01] transition-transform flex items-center justify-between"
                      title="Click to auto-fill"
                    >
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Demo OTP Code: <strong className="font-mono text-sm tracking-widest">{demoOtpCode}</strong>
                      </span>
                      <span className="text-[10px] underline uppercase font-bold tracking-wider">Auto Fill</span>
                    </div>
                  )}
                </div>

                {/* 6 Digit Input Boxes */}
                <div className="flex justify-center gap-2 sm:gap-3">
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-lg font-black font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setOtpStep('email')}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium"
                  >
                    Change Email
                  </button>

                  <button
                    type="button"
                    disabled={countdown > 0 || loading}
                    onClick={handleSendOtp}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold disabled:opacity-50"
                  >
                    {countdown > 0 ? `Resend Code in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.join('').length !== 6}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Verify OTP & Proceed</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 3: Complete New Student Registration */}
            {otpStep === 'register' && (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0">
                    <IdCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Issue Digital Library Card</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      OTP verified for <strong className="text-indigo-600 dark:text-indigo-400">{studentEmail}</strong>. Please enter your details:
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Johnathan Doe"
                      value={studentDetails.full_name}
                      onChange={(e) => setStudentDetails({ ...studentDetails, full_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Roll No / Student ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2024CSE089"
                      value={studentDetails.student_id}
                      onChange={(e) => setStudentDetails({ ...studentDetails, student_id: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={studentDetails.phone}
                      onChange={(e) => setStudentDetails({ ...studentDetails, phone: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Department
                  </label>
                  <select
                    value={studentDetails.department}
                    onChange={(e) => setStudentDetails({ ...studentDetails, department: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Artificial Intelligence & ML">Artificial Intelligence & ML</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Business & Management Studies">Business & Management Studies</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading || !studentDetails.full_name || !studentDetails.student_id}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Issue Library Card & Enter Portal</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: ADMIN & LIBRARIAN PORTAL */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@cloudlib.edu"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Staff Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Default Demo Admin Password: <code>admin123</code></p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Authenticate as Librarian / Admin</span>
                </>
              )}
            </button>

            {/* Quick 1-Click Evaluation Pill */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[11px] text-slate-400 mb-2">Faculty & Evaluation Demo Shortcut:</p>
              <button
                type="button"
                onClick={handleQuickDemoAdmin}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 hover:bg-violet-100 transition-colors border border-violet-200/50 dark:border-violet-900/50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                1-Click Admin Login (Dr. Sarah Mitchell)
              </button>
            </div>
          </form>
        )}

        {/* Footer Security Highlights */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            Vercel Microservices
          </span>
          <span className="flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
            2FA 6-Digit OTP Engine
          </span>
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-violet-500" />
            Supabase PostgreSQL
          </span>
        </div>
      </div>
    </div>
  );
};
