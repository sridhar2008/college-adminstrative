import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, ShieldAlert, BookOpen, AlertCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GuestDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Expiry & Restriction Alert */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-start space-x-3 text-xs">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sm block">Restricted Guest Lecturer Access</span>
          <span>
            You are signed in under a guest instructor session. For data privacy and academic governance compliance,
            access to confidential student personal contacts, unrelated departments, and unassigned examination records is strictly restricted.
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Assigned Guest Sessions</h2>
          <span className="text-xs text-slate-400">Academic Year 2025-2026</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-cyan-400 px-2 py-0.5 rounded">
              GUEST-LEC-01
            </span>
            <span className="text-xs font-semibold text-emerald-600">Active Access</span>
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Special Topic: Applied Cryptography & Security</h3>
          <p className="text-xs text-slate-500">
            Assigned to Semester 5 Computer Science & Engineering students.
          </p>
          <div className="pt-2 flex justify-end">
            <Link to="/attendance" className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline">
              View Class Session & Attendance →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
