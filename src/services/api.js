// API Service for CloudLib Pro
const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('cloudlib_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth & OTP Authentication
  getProfile: () => request('/auth/profile'),
  sendOtp: (email) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOtp: (payload) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  adminLogin: (credentials) => request('/auth/admin-login', { method: 'POST', body: JSON.stringify(credentials) }),
  studentLogin: (credentials) => request('/auth/student-login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  switchDemoRole: (role) => request('/auth/switch-demo-role', { method: 'POST', body: JSON.stringify({ role }) }),
  updateProfile: (profileData) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  changePassword: (passwordData) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(passwordData) }),

  // Books
  getBooks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/books?${query}`);
  },
  getBookById: (id) => request(`/books/${id}`),
  getPopularBooks: () => request('/books/popular'),
  getRecentBooks: () => request('/books/recent'),
  createBook: (bookData) => request('/books', { method: 'POST', body: JSON.stringify(bookData) }),
  updateBook: (id, bookData) => request(`/books/${id}`, { method: 'PUT', body: JSON.stringify(bookData) }),
  deleteBook: (id) => request(`/books/${id}`, { method: 'DELETE' }),
  importCsvBooks: (csvData) => request('/books/import-csv', { method: 'POST', body: JSON.stringify({ csvData }) }),
  exportCsvUrl: () => `${API_BASE}/books/export-csv`,

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (catData) => request('/categories', { method: 'POST', body: JSON.stringify(catData) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Loans
  getLoans: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/loans?${query}`);
  },
  getMyLoans: () => request('/loans/my-loans'),
  issueBook: (payload) => request('/loans/issue', { method: 'POST', body: JSON.stringify(payload) }),
  returnBook: (payload) => request('/loans/return', { method: 'POST', body: JSON.stringify(payload) }),
  renewLoan: (payload) => request('/loans/renew', { method: 'POST', body: JSON.stringify(payload) }),

  // Reservations
  getReservations: () => request('/reservations'),
  getMyReservations: () => request('/reservations/my'),
  createReservation: (book_id) => request('/reservations', { method: 'POST', body: JSON.stringify({ book_id }) }),
  cancelReservation: (id) => request(`/reservations/${id}`, { method: 'DELETE' }),
  fulfillReservation: (id) => request(`/reservations/${id}/fulfill`, { method: 'PUT' }),

  // Students
  getStudents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/students?${query}`);
  },
  getStudentById: (id) => request(`/students/${id}`),
  registerStudent: (studentData) => request('/students', { method: 'POST', body: JSON.stringify(studentData) }),
  updateStudent: (id, studentData) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(studentData) }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // Analytics
  getDashboardStats: () => request('/analytics/dashboard'),
  getTrends: () => request('/analytics/trends'),
  getCategoryDistribution: () => request('/analytics/category-distribution'),
  getMostBorrowed: () => request('/analytics/most-borrowed'),
  getActiveBorrowers: () => request('/analytics/active-borrowers'),
  getShortageAlerts: () => request('/analytics/shortage-alerts'),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (settingsData) => request('/settings', { method: 'PUT', body: JSON.stringify(settingsData) }),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/audit?${query}`);
  },
  
  // Health
  getHealth: () => request('/health'),
};
