import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Database, Users, Building2, BookOpen, Download, ShieldCheck, Plus, ArrowRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await api.get('/departments/stats');
        setStats(res.data);
      } catch (err) {
        console.error("Admin stats failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">Institutional Governance</span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-1">Administrative Staff Console</h1>
          <p className="text-slate-300 text-sm mt-1">
            College Academic Registry, Department Operations & Enrollment Management.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/generator"
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl text-xs font-semibold shadow flex items-center space-x-1.5"
          >
            <Database className="w-4 h-4" />
            <span>Student Data Generator</span>
          </Link>
          <Link
            to="/students/manage"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shadow flex items-center space-x-1.5"
          >
            <Users className="w-4 h-4" />
            <span>Manage Students</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Total Students</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats?.total_students || 0}</div>
          <p className="text-xs text-emerald-600 font-medium mt-1">Across 20 Departments</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Undergraduate (UG)</span>
            <BookOpen className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats?.degree_breakdown?.UG || 0}</div>
          <p className="text-xs text-slate-500 font-medium mt-1">4-Year B.Tech Cohorts</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Postgraduate (PG)</span>
            <BookOpen className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats?.degree_breakdown?.PG || 0}</div>
          <p className="text-xs text-slate-500 font-medium mt-1">2-Year M.Tech Cohorts</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Ph.D. Scholars</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats?.degree_breakdown?.PhD || 0}</div>
          <p className="text-xs text-slate-500 font-medium mt-1">Configurable Research Groups</p>
        </div>
      </div>

      {/* Quick Operation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 mb-2">
              <Database className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Student Data Generator</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Populate or adjust cohorts of 50 students per department per year with custom parameters, preview, and safe clear options.
            </p>
          </div>
          <Link
            to="/admin/generator"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold text-center block shadow"
          >
            Open Data Generator →
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-600 mb-2">
              <Building2 className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Departments & Degrees</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Configure engineering faculties, Undergrad (UG), Postgrad (PG), and Ph.D. program durations and semester limits.
            </p>
          </div>
          <Link
            to="/departments/manage"
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold text-center block shadow"
          >
            Manage Departments →
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 mb-2">
              <Users className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Student Registry & Operations</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Add new student admissions, edit profile information, change academic status, promote cohorts, and CSV export.
            </p>
          </div>
          <Link
            to="/students/manage"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold text-center block shadow"
          >
            Manage Student Registry →
          </Link>
        </div>
      </div>
    </div>
  );
}
