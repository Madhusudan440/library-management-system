import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './components/common/Toast';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// Pages
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { StudentDashboard } from './pages/dashboard/StudentDashboard';
import { BookCatalog } from './pages/books/BookCatalog';
import { LoanManagement } from './pages/loans/LoanManagement';
import { StudentLoans } from './pages/loans/StudentLoans';
import { ReservationManagement } from './pages/reservations/ReservationManagement';
import { StudentReservations } from './pages/reservations/StudentReservations';
import { StudentManagement } from './pages/students/StudentManagement';
import { AnalyticsReports } from './pages/reports/AnalyticsReports';
import { LibrarySettings } from './pages/settings/LibrarySettings';
import { AuditLogs } from './pages/audit/AuditLogs';
import { UserProfile } from './pages/profile/UserProfile';
import { AuthModal } from './components/auth/AuthModal';

function MainApp() {
  const { isAdmin, isStudent } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('admin-dashboard');
  const [tabAction, setTabAction] = useState(null);

  // Sync tab if role switches
  React.useEffect(() => {
    if (isAdmin && activeTab.startsWith('student-')) {
      setActiveTab('admin-dashboard');
    } else if (isStudent && activeTab.startsWith('admin-')) {
      setActiveTab('student-dashboard');
    }
  }, [isAdmin, isStudent]);

  const handleNavigate = (tab, options = {}) => {
    setActiveTab(tab);
    if (options.action) {
      setTabAction(options.action);
    } else {
      setTabAction(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (activeTab) {
      // Admin Views
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'admin-books':
        return <BookCatalog key={`admin-books-${tabAction}`} initialAction={tabAction} />;
      case 'admin-loans':
        return <LoanManagement key={`admin-loans-${tabAction}`} initialAction={tabAction} />;
      case 'admin-students':
        return <StudentManagement />;
      case 'admin-reservations':
        return <ReservationManagement />;
      case 'admin-analytics':
        return <AnalyticsReports />;
      case 'admin-settings':
        return <LibrarySettings />;
      case 'admin-audit':
        return <AuditLogs />;

      // Student Views
      case 'student-dashboard':
        return <StudentDashboard onNavigate={handleNavigate} />;
      case 'student-catalog':
        return <BookCatalog />;
      case 'student-loans':
        return <StudentLoans />;
      case 'student-reservations':
        return <StudentReservations />;

      // Shared Views
      case 'user-profile':
        return <UserProfile />;

      default:
        return isAdmin ? (
          <AdminDashboard onNavigate={handleNavigate} />
        ) : (
          <StudentDashboard onNavigate={handleNavigate} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Fixed Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        setActiveTab={handleNavigate}
      />

      <div className="flex-1 flex w-full">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          setActiveTab={handleNavigate}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all duration-200">
          {renderContent()}
        </main>
      </div>

      {/* Global Authentication & OTP Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            <MainApp />
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
