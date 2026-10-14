import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, UserCheck, AlertCircle, Eye, Check } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const StudentManagement = () => {
  const { success, error: toastError } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    student_id: '',
    department: 'Computer Science & Engineering',
    phone: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadStudents();
  }, [search]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await api.getStudents({ search });
      if (res.success) {
        setStudents(res.students || []);
      }
    } catch (err) {
      toastError('Failed to retrieve students.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setFormError('');
      const res = await api.registerStudent(formData);
      if (res.success) {
        success(res.message);
        setIsRegisterOpen(false);
        setFormData({
          full_name: '',
          email: '',
          student_id: '',
          department: 'Computer Science & Engineering',
          phone: '',
        });
        loadStudents();
      } else {
        setFormError(res.message);
      }
    } catch (err) {
      setFormError(err.message || 'Registration failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewStudent = async (student) => {
    setSelectedStudent(student);
    try {
      const res = await api.getStudentById(student.id);
      if (res.success) {
        setStudentDetails(res.student);
        setIsDetailOpen(true);
      }
    } catch (err) {
      toastError('Failed to fetch student details.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Registered Student Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Student account credentials, borrowing quotas, active checkout limits, and academic departments.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="btn-gradient px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Register Student
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="glass-card p-4 rounded-3xl flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll number, or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
          {students.length} Students Registered
        </span>
      </div>

      {/* Students Table */}
      {loading ? (
        <LoadingSpinner text="Retrieving student profiles..." />
      ) : students.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl">
          <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No students found
          </h3>
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-400 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Student Profile</th>
                  <th className="py-3.5 px-4">Roll / Student ID</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Active Checkouts</th>
                  <th className="py-3.5 px-4">Standing</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                          alt={student.full_name}
                          className="w-9 h-9 rounded-xl object-cover shrink-0 ring-2 ring-indigo-500/20"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{student.full_name}</div>
                          <div className="text-xs text-slate-400">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                      {student.student_id || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {student.department}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={student.overdueLoansCount > 0 ? 'overdue' : student.activeLoansCount > 0 ? 'issued' : 'default'}>
                        {student.activeLoansCount || 0} active ({student.overdueLoansCount || 0} overdue)
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={student.status}>{student.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewStudent(student)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Loan Records
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Student Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register New Student Account"
        subtitle="Enrolls student in the library database and provisions borrowing limits"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs sm:text-sm">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Priya Sundaram"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Academic Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="priya.cse@cloudlib.edu"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student ID / Roll No *
              </label>
              <input
                type="text"
                required
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                placeholder="BT21CSE105"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Contact
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 00000"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department *
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Artificial Intelligence & ML">Artificial Intelligence & ML</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics & Communication">Electronics & Communication</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="btn-gradient py-2.5 px-6 rounded-xl font-semibold flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {formLoading ? 'Registering...' : 'Register Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Student Details & Loan Records Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={studentDetails?.full_name || 'Student Details'}
        subtitle={`Roll No: ${studentDetails?.student_id} • ${studentDetails?.department}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
            Circulation & Borrowing History
          </h4>

          {studentDetails?.loans?.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No borrowing history recorded for this student.</p>
          ) : (
            <div className="space-y-2">
              {studentDetails?.loans?.map((loan) => (
                <div key={loan.id} className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{loan.book_title}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{loan.loan_code} • Issued {new Date(loan.issue_date).toLocaleDateString()}</span>
                  </div>
                  <Badge variant={loan.status}>{loan.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
