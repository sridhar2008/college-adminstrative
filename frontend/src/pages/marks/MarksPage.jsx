import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Award, FileSpreadsheet, CheckCircle, ShieldCheck } from 'lucide-react';

export default function MarksPage() {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        const res = await api.get('/marks/my-marks');
        setMarks(res.data);
      } catch (err) {
        console.error("Error loading marks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarks();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Academic Marks & Results</h1>
        <p className="text-sm text-slate-500">Internal Assessments (IA1, IA2, IA3), Assignments, and Examination Records.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Internal Assessment Scores</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                <th className="pb-3">Subject</th>
                <th className="pb-3">Assessment Type</th>
                <th className="pb-3 text-center">Marks Obtained</th>
                <th className="pb-3 text-center">Max Marks</th>
                <th className="pb-3 text-center">Weightage</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {marks.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-4">
                    <span className="font-semibold text-slate-900 dark:text-white block">{m.subject_name}</span>
                    <span className="text-xs font-mono text-slate-400">{m.subject_code}</span>
                  </td>
                  <td className="py-4 text-xs font-medium text-slate-600 dark:text-slate-300">{m.assessment_name}</td>
                  <td className="py-4 text-center font-bold text-slate-900 dark:text-white">{m.marks_obtained}</td>
                  <td className="py-4 text-center text-slate-500">{m.max_marks}</td>
                  <td className="py-4 text-center text-slate-500">{m.weightage_percent}%</td>
                  <td className="py-4 text-right">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>HOD Approved</span>
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
