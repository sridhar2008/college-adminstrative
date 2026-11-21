import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { KeyRound, Shield, Users, Search, RefreshCw, CheckCircle2, AlertTriangle, Lock, Eye, EyeOff, UserCheck } from 'lucide-react';

export default function UserPasswordGovernancePage() {
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(0);
  const limit = 20;

  // Single User Reset Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('College@123');
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Bulk Reset State
  const [bulkGroup, setBulkGroup] = useState('STUDENTS');
  const [bulkPassword, setBulkPassword] = useState('Student@123');
  const [bulkResetting, setBulkResetting] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Notification
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users-credentials', {
        params: {
          role_filter: roleFilter,
          search: search.trim() || undefined,
          limit,
          offset: page * limit
        }
      });
      setUsers(res.data.items);
      setTotalCount(res.data.total);
    } catch (err) {
      setError("Failed to load user credentials directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  const handleResetSinglePassword = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setResetting(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/admin/reset-user-password', {
        user_id: selectedUser.id,
        new_password: newPassword
      });
      setMessage(res.data.message);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset password.");
    } finally {
      setResetting(false);
    }
  };

  const handleBulkReset = async (e) => {
    e.preventDefault();
    setBulkResetting(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/admin/bulk-reset-passwords', {
        target_group: bulkGroup,
        default_password: bulkPassword
      });
      setMessage(res.data.message);
      setShowBulkModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to execute bulk password reset.");
    } finally {
      setBulkResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
            <Shield className="w-4 h-4" />
            <span>Administrative Governance & Security</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Institutional Credential Manager</h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            Enable, inspect, and reset access passwords for Students, Professors, HODs, Deans, and Staff members.
          </p>
        </div>

        <button
          onClick={() => setShowBulkModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/30 flex items-center space-x-2 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Cohort Bulk Password Reset</span>
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Roll No, Username, Full Name, or Email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
          >
            <option value="all">All Institutional Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Professors / Faculty</option>
            <option value="hod">Department HODs</option>
            <option value="dean">Deans</option>
            <option value="admin">Administrators</option>
            <option value="parent">Parents</option>
          </select>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-400 uppercase">
                <th className="py-3 px-4">Identifier / Roll No</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department / Office</th>
                <th className="py-3 px-4">Institutional Email</th>
                <th className="py-3 px-4 text-center">Account Status</th>
                <th className="py-3 px-4 text-right">Password Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">Loading user registry...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">No college members found matching query.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-cyan-400">
                      {u.identifier || u.username}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {u.full_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'student' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300' :
                        (u.role === 'dean' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                        (u.role === 'hod' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                        (u.role === 'faculty' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300')))
                      }`}>
                        {u.role_display}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{u.department_name}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                      }`}>
                        {u.is_active ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setNewPassword(u.role === 'student' ? 'Student@123' : (u.role === 'faculty' ? 'Faculty@123' : 'College@123'));
                        }}
                        className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Reset Password</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {Math.min(totalCount, page * limit + 1)} to {Math.min(totalCount, (page + 1) * limit)} of {totalCount} college accounts
          </span>
          <div className="flex space-x-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={(page + 1) * limit >= totalCount}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Single User Reset Password */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-cyan-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Reset Account Password</h3>
                <p className="text-xs text-slate-400">{selectedUser.full_name} ({selectedUser.identifier || selectedUser.username})</p>
              </div>
            </div>

            <form onSubmit={handleResetSinglePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  New Institutional Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Minimum 6 characters. Account will also be set to ENABLED.</p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {resetting ? "Updating..." : "Save New Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Password Reset */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-amber-400">Cohort Bulk Password Standardizer</h3>
                <p className="text-xs text-slate-400">Reset default login passwords for thousands of members simultaneously</p>
              </div>
            </div>

            <form onSubmit={handleBulkReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Select Target Cohort
                </label>
                <select
                  value={bulkGroup}
                  onChange={(e) => {
                    setBulkGroup(e.target.value);
                    if (e.target.value === 'STUDENTS') setBulkPassword('Student@123');
                    else if (e.target.value === 'FACULTY') setBulkPassword('Faculty@123');
                    else setBulkPassword('College@123');
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="STUDENTS">All Enrolled Students (All Departments, UG, PG, PhD)</option>
                  <option value="FACULTY">All Faculty & Professors (Professors, HODs, Lecturers)</option>
                  <option value="STAFF">Administrative & Support Staff</option>
                  <option value="ALL">Entire Institution (All Members)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Standard Password to Assign
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={bulkPassword}
                  onChange={(e) => setBulkPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Everyone in this group will be able to log in with their Roll No/Email and this password.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                ⚠️ <b>Notice:</b> This action updates real password hashes in the database with secure bcrypt hashing and re-enables all member accounts in the selected group.
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkResetting}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {bulkResetting ? "Standardizing Passwords..." : "Apply to All Selected Members"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
