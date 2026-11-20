import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, CalendarCheck, Award, Users, Plus, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        const [allocRes, sessRes] = await Promise.all([
          api.get('/faculty/my-allocations'),
          api.get('/attendance/sessions')
        ]);
        setAllocations(allocRes.data);
        setSessions(sessRes.data);
      } catch (err) {
        console.error("Faculty data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFacultyData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">Faculty Academic Console</span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-1">Welcome, {user?.full_name || 'Professor'}</h1>
          <p className="text-slate-300 text-sm mt-1">
            Assigned Courses, Class Attendance, Continuous Internal Assessment & Student Evaluation.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/attendance"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl text-xs font-semibold shadow flex items-center space-x-1.5"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Mark Attendance</span>
          </Link>
          <Link
            to="/marks"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shadow flex items-center space-x-1.5"
          >
            <Award className="w-4 h-4" />
            <span>Enter Marks</span>
          </Link>
        </div>
      </div>

      {/* Allocated Courses Cards */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Your Allocated Course Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allocations.map((a) => (
            <div key={a.allocation_id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-cyan-400">
                  {a.subject_code}
                </span>
                <span className="text-xs text-slate-400">Sem {a.semester_number} • Sec {a.section_name}</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{a.subject_name}</h3>
              <p className="text-xs text-slate-500">{a.credits} Credits • Theory Coursework</p>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <Link to="/attendance" className="text-xs font-semibold text-blue-600 hover:underline">Mark Today's Period</Link>
                <Link to="/marks" className="text-xs font-semibold text-indigo-600 hover:underline">Internal Marks</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Conducted Class Sessions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <CalendarCheck className="w-5 h-5 text-blue-600" />
          <span>Recently Conducted Lectures & Attendance Rates</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                <th className="pb-3">Date</th>
                <th className="pb-3">Period</th>
                <th className="pb-3">Subject</th>
                <th className="pb-3">Topic Covered</th>
                <th className="pb-3 text-center">Present / Total</th>
                <th className="pb-3 text-right">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.slice(0, 10).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 font-mono text-slate-600 dark:text-slate-300">{s.session_date}</td>
                  <td className="py-3 font-semibold text-blue-600 dark:text-cyan-400">Period {s.period_number}</td>
                  <td className="py-3 font-medium text-slate-900 dark:text-white">{s.subject_name} ({s.subject_code})</td>
                  <td className="py-3 text-slate-500 italic">{s.topic_covered}</td>
                  <td className="py-3 text-center text-slate-700 dark:text-slate-300 font-semibold">{s.present_count} / {s.total_count}</td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      {s.attendance_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
