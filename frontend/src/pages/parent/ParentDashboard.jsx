import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CalendarCheck, Award, AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWardData = async () => {
      try {
        const [attRes, marksRes] = await Promise.all([
          api.get('/attendance/my-summary'),
          api.get('/marks/my-marks')
        ]);
        setAttendance(attRes.data);
        setMarks(marksRes.data);
      } catch (err) {
        console.error("Parent portal loading error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWardData();
  }, []);

  const totalConducted = attendance.reduce((sum, s) => sum + s.conducted_classes, 0);
  const totalAttended = attendance.reduce((sum, s) => sum + s.attended_classes, 0);
  const aggregatePct = totalConducted > 0 ? ((totalAttended / totalConducted) * 100).toFixed(1) : 100.0;
  const hasShortage = aggregatePct < 75.0;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">Parent / Guardian Portal</span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-1">Ward Academic Overview: Arun Kumar</h1>
          <p className="text-slate-300 text-sm mt-1">
            Roll Number: <span className="font-mono font-bold text-white">2024CS101</span> • B.Tech Computer Science & Engineering (Semester 3)
          </p>
        </div>

        <div className={`p-4 rounded-xl border backdrop-blur-sm text-center min-w-[150px] ${
          hasShortage ? 'bg-rose-500/20 border-rose-500/30 text-rose-200' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
        }`}>
          <span className="text-[10px] uppercase font-bold tracking-wider block">Ward Attendance</span>
          <span className="text-2xl font-black">{aggregatePct}%</span>
          <span className="text-[10px] block mt-0.5">{hasShortage ? '⚠️ Low Attendance' : '✓ Good Standing'}</span>
        </div>
      </div>

      {/* Grid: Subject Attendance & Published Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Breakdown */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" />
            <span>Subject-Wise Attendance</span>
          </h2>

          <div className="space-y-4">
            {attendance.map((s) => (
              <div key={s.subject_code} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{s.subject_name} ({s.subject_code})</span>
                  <span className={`font-bold ${s.status_alert ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                    {s.percentage}% ({s.attended_classes}/{s.conducted_classes})
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.status_alert ? 'bg-rose-500' : 'bg-blue-600'}`}
                    style={{ width: `${Math.min(s.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Published Marks */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>Official Published Assessment Scores</span>
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {marks.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{m.subject_name}</span>
                  <span className="text-slate-400">{m.assessment_name} • Weightage {m.weightage_percent}%</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{m.marks_obtained} / {m.max_marks}</span>
                  <span className="block text-[10px] text-emerald-600 font-semibold">Grade: {m.grade_letter}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
