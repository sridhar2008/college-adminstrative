import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, CheckCircle2, AlertTriangle, Users, Clock, Filter, Plus } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await api.get('/attendance/my-summary');
        setAttendance(res.data);
      } catch (err) {
        console.error("Error loading attendance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance Management</h1>
          <p className="text-sm text-slate-500">Subject-wise daily and period attendance records.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Subject Attendance Summary</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                <th className="pb-3">Subject Code</th>
                <th className="pb-3">Subject Name</th>
                <th className="pb-3 text-center">Conducted</th>
                <th className="pb-3 text-center">Attended</th>
                <th className="pb-3 text-center">Percentage</th>
                <th className="pb-3 text-right">Eligibility Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {attendance.map((item) => (
                <tr key={item.subject_code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-4 font-mono font-bold text-blue-600 dark:text-cyan-400">{item.subject_code}</td>
                  <td className="py-4 font-medium text-slate-800 dark:text-slate-200">{item.subject_name}</td>
                  <td className="py-4 text-center text-slate-600 dark:text-slate-400">{item.conducted_classes}</td>
                  <td className="py-4 text-center font-semibold text-slate-900 dark:text-white">{item.attended_classes}</td>
                  <td className="py-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${
                      item.status_alert ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    }`}>
                      {item.percentage}%
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    {item.status_alert ? (
                      <span className="text-xs font-semibold text-rose-600 flex items-center justify-end space-x-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Shortage (&lt;75%)</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center justify-end space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Permitted for Exams</span>
                      </span>
                    )}
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
