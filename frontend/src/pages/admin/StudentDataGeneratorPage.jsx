import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Database, Users, Download, Trash2, RefreshCw, AlertTriangle, CheckCircle, Sparkles, Filter } from 'lucide-react';

export default function StudentDataGeneratorPage() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedDegree, setSelectedDegree] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [studentCount, setStudentCount] = useState(50);
  const [phdYears, setPhdYears] = useState(3);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // 'generate' or 'clear'

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [deptRes, statsRes] = await Promise.all([
        api.get('/departments'),
        api.get('/admin/generator-stats')
      ]);
      setDepartments(deptRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  const handleGenerate = async () => {
    setConfirmModal(null);
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await api.post('/admin/generate-students', {
        department_id: selectedDept,
        degree_level: selectedDegree,
        target_year: selectedYear,
        count_per_group: parseInt(studentCount, 10),
        phd_years: parseInt(phdYears, 10)
      });
      setMessage(res.data.message);
      await fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error generating sample students.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setConfirmModal(null);
    setClearing(true);
    setMessage(null);
    setError(null);

    try {
      const res = await api.post('/admin/clear-sample-students');
      setMessage(res.data.message);
      await fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error clearing sample students.');
    } finally {
      setClearing(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/reports/students/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `csms_students_${selectedDept}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">STUDENT DATA GENERATOR</h1>
          <p className="text-sm text-slate-500">
            Generate 50 fictional students per department per year across UG (Years 1-4), PG (Years 1-2), and PhD scholars.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setConfirmModal('clear')}
            disabled={clearing || loading}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Sample Data</span>
          </button>
        </div>
      </div>

      {/* Notification Alerts */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generator Configuration Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-600" />
          <span>Generate Fictional Student Cohorts</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Department Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              <option value="all">All 20 Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>[{d.code}] {d.name}</option>
              ))}
            </select>
          </div>

          {/* Program / Degree Level */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Degree Level</label>
            <select
              value={selectedDegree}
              onChange={(e) => setSelectedDegree(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              <option value="ALL">All Programs (UG, PG, PhD)</option>
              <option value="UG">Undergraduate (UG 4-Year)</option>
              <option value="PG">Postgraduate (PG 2-Year)</option>
              <option value="PhD">Ph.D. Research Scholars</option>
            </select>
          </div>

          {/* Target Academic Year */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Academic Year / Cohort</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              <option value="ALL">All Cohort Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4 (UG Only)</option>
            </select>
          </div>

          {/* Student Count */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Count per Group</label>
            <input
              type="number"
              min="1"
              max="200"
              value={studentCount}
              onChange={(e) => setStudentCount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          {/* PhD Duration */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">PhD Duration (Years)</label>
            <input
              type="number"
              min="2"
              max="7"
              value={phdYears}
              onChange={(e) => setPhdYears(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setConfirmModal('generate')}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{loading ? 'Generating Records...' : 'Generate Students Now'}</span>
          </button>
        </div>
      </div>

      {/* Current College Statistics Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Department Enrollment Distribution</h3>
            <p className="text-xs text-slate-500">Live counts across all 20 engineering faculties</p>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase text-slate-400 font-bold block">Total Enrolled</span>
            <span className="text-2xl font-black text-blue-600 dark:text-cyan-400">{stats?.total_college_students || 0}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                <th className="pb-3">Code</th>
                <th className="pb-3">Department Name</th>
                <th className="pb-3 text-center">UG Students</th>
                <th className="pb-3 text-center">PG Students</th>
                <th className="pb-3 text-center">PhD Scholars</th>
                <th className="pb-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats?.departments?.map((d) => (
                <tr key={d.department_code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 font-mono font-bold text-blue-600 dark:text-cyan-400">{d.department_code}</td>
                  <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{d.department_name}</td>
                  <td className="py-3 text-center text-slate-600 dark:text-slate-400">{d.ug_students}</td>
                  <td className="py-3 text-center text-slate-600 dark:text-slate-400">{d.pg_students}</td>
                  <td className="py-3 text-center text-slate-600 dark:text-slate-400">{d.phd_scholars}</td>
                  <td className="py-3 text-right font-bold text-slate-900 dark:text-white">{d.total_students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-500">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {confirmModal === 'generate' ? 'Confirm Student Generation' : 'Confirm Sample Data Reset'}
              </h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              {confirmModal === 'generate'
                ? `You are about to generate ${studentCount} unique student records per cohort in the selected scope. Fictional accounts, parent records, and contacts will be created. Proceed?`
                : 'This will safely remove all generated sample students while keeping primary demo accounts intact. This action cannot be undone. Proceed?'}
            </p>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal === 'generate' ? handleGenerate : handleClear}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow ${
                  confirmModal === 'generate' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm & Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
