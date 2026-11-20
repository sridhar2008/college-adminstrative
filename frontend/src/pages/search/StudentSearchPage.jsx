import React, { useState } from 'react';
import api from '../../services/api';
import { Search, ShieldAlert, CheckCircle, User, Calendar, Award, AlertCircle } from 'lucide-react';

export default function StudentSearchPage() {
  const [rollNumber, setRollNumber] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!rollNumber.trim()) return;

    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await api.get(`/students/lookup/${rollNumber.trim()}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error looking up student record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Roll Number Lookup</h1>
        <p className="text-sm text-slate-500">
          Server-side authorized lookup with least-privilege permission validation.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <form onSubmit={handleSearch} className="max-w-xl flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="Enter Roll Number (e.g. 2024CS101)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow shadow-blue-600/30 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && result.student && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
            {/* Student Header Card */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  {result.student.department_name} • {result.student.degree_level}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{result.student.full_name}</h2>
                <div className="flex gap-2 text-xs font-mono text-slate-500 mt-1">
                  <span>Roll: {result.student.roll_number}</span>
                  <span>•</span>
                  <span>Reg: {result.student.registration_number}</span>
                </div>
              </div>

              {result.attendance_summary && (
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center min-w-[120px]">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Attendance</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {result.attendance_summary.percentage}%
                  </span>
                </div>
              )}
            </div>

            {/* Recent Marks */}
            {result.recent_marks && result.recent_marks.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Verified Marks</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {result.recent_marks.map((m, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <span className="text-xs text-slate-500 block">{m.subject_name}</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{m.marks_obtained}</span>
                      <span className="text-xs text-slate-400"> / {m.max_marks}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
