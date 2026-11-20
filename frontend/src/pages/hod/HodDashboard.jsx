import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Users, GraduationCap, Award, CalendarCheck, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HodDashboard() {
  const { user } = useAuth();
  const [facultyList, setFacultyList] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [deptStats, setDeptStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHodData = async () => {
      try {
        const [facRes, corrRes, statsRes] = await Promise.all([
          api.get('/faculty'),
          api.get('/attendance/correction-requests'),
          api.get('/departments/stats')
        ]);
        setFacultyList(facRes.data);
        setCorrections(corrRes.data);
        setDeptStats(statsRes.data);
      } catch (err) {
        console.error("HOD data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHodData();
  }, []);

  const handleResolveCorrection = async (id, status) => {
    try {
      await api.patch(`/attendance/correction-requests/${id}`, { status });
      setCorrections(prev => prev.filter(c => c.id !== id));
      alert(`Correction request ${status.toLowerCase()}.`);
    } catch (err) {
      alert("Error resolving correction request");
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">Department Leadership</span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-1">Head of Department (HOD) Portal</h1>
          <p className="text-slate-300 text-sm mt-1">
            Department of {user?.department_name || 'Computer Science & Engineering'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/search"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow"
          >
            Lookup Department Students
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Department Faculty</span>
            <GraduationCap className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{facultyList.length}</div>
          <p className="text-xs text-slate-500 font-medium mt-1">Teaching & Research Faculty</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Pending Corrections</span>
            <CalendarCheck className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{corrections.filter(c => c.status === 'PENDING').length}</div>
          <p className="text-xs text-amber-500 font-medium mt-1">Awaiting HOD verification</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Degree Programs</span>
            <Award className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">UG, PG & PhD</div>
          <p className="text-xs text-emerald-600 font-medium mt-1">Full Curriculum Active</p>
        </div>
      </div>

      {/* Main Grid: Pending Corrections & Faculty Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Corrections Pending Review */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <CalendarCheck className="w-5 h-5 text-amber-500" />
              <span>Attendance Correction Requests</span>
            </h2>
          </div>

          {corrections.filter(c => c.status === 'PENDING').length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No pending attendance correction requests.</p>
          ) : (
            <div className="space-y-3">
              {corrections.filter(c => c.status === 'PENDING').map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold font-mono text-blue-600 dark:text-cyan-400">{c.student_roll} - {c.student_name}</span>
                    <span className="text-slate-400">{c.created_at.slice(0, 10)}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{c.comments}</p>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => handleResolveCorrection(c.id, 'REJECTED')}
                      className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-semibold rounded-lg"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleResolveCorrection(c.id, 'APPROVED')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow"
                    >
                      Approve Correction
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department Faculty Directory */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span>Department Faculty Members</span>
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px] overflow-y-auto">
            {facultyList.map((f) => (
              <div key={f.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{f.full_name}</span>
                  <span className="text-slate-400">{f.designation} • {f.qualification || 'M.Tech'}</span>
                  {f.specialization && <span className="text-slate-500 block italic">{f.specialization}</span>}
                </div>
                <span className="font-mono text-slate-400 text-[11px]">{f.employee_id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
