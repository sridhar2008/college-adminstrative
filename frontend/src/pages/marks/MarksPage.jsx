import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Award, FileSpreadsheet, CheckCircle2, ShieldCheck, Plus, Send, RefreshCw, X, AlertCircle } from 'lucide-react';

export default function MarksPage() {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [assessmentTypes, setAssessmentTypes] = useState([]);
  const [gradingRules, setGradingRules] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Faculty Entry State
  const [entryModal, setEntryModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [marksGrid, setMarksGrid] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const isFaculty = user?.role && ['faculty', 'subject_faculty', 'hod', 'admin', 'dean'].includes(user.role);
  const isAdminOrHOD = user?.role && ['hod', 'admin', 'dean'].includes(user.role);

  useEffect(() => {
    fetchMarksData();
  }, []);

  const fetchMarksData = async () => {
    try {
      const [marksRes, assessRes, rulesRes] = await Promise.all([
        api.get('/marks/my-marks'),
        api.get('/marks/assessment-types'),
        api.get('/marks/grading-rules')
      ]);
      setMarks(marksRes.data);
      setAssessmentTypes(assessRes.data);
      setGradingRules(rulesRes.data);

      if (isFaculty) {
        const clsRes = await api.get('/attendance/classes');
        setAssignedClasses(clsRes.data);
        if (clsRes.data.length > 0) {
          setSelectedClass(clsRes.data[0]);
        }
      }
      if (assessRes.data.length > 0) {
        setSelectedAssessment(assessRes.data[0].id);
      }
    } catch (err) {
      console.error("Marks loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openEntryForClass = (cls) => {
    setSelectedClass(cls);
    const initialGrid = (cls.students || []).map(s => ({
      student_id: s.id,
      roll_number: s.roll_number,
      full_name: s.full_name,
      marks_obtained: 85.0,
      remarks: 'Satisfactory'
    }));
    setMarksGrid(initialGrid);
    setEntryModal(true);
  };

  const handleMarksChange = (studentId, val) => {
    setMarksGrid(prev => prev.map(s => s.student_id === studentId ? { ...s, marks_obtained: parseFloat(val) || 0 } : s));
  };

  const handleSubmitMarks = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedAssessment) return;
    setSubmitting(true);
    setMessage('');

    try {
      const payload = {
        subject_id: selectedClass.subject_id,
        assessment_type_id: selectedAssessment,
        semester_id: "sem3", // Linked semester
        entries: marksGrid.map(m => ({
          student_id: m.student_id,
          marks_obtained: m.marks_obtained,
          remarks: m.remarks
        }))
      };

      await api.post('/marks/bulk-entry', payload);
      setMessage("Marks successfully saved and submitted for HOD approval.");
      setEntryModal(false);
      fetchMarksData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit marks");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishResults = async () => {
    if (!window.confirm("Publish semester examination results for all students? GPA & CGPA will be computed.")) return;
    try {
      const res = await api.post('/marks/publish-semester-results', {
        semester_id: "all",
        department_id: "all"
      });
      setMessage(res.data.message);
      fetchMarksData();
    } catch (err) {
      alert("Error publishing results");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Academic Marks & Examination Results</h1>
          <p className="text-sm text-slate-500">
            Internal Assessments (IA1, IA2, IA3), Assignments, Lab Practicals, and Semester Grade Sheets.
          </p>
        </div>

        <div className="flex gap-2">
          {isFaculty && assignedClasses.length > 0 && (
            <button
              onClick={() => openEntryForClass(assignedClasses[0])}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Enter Course Marks</span>
            </button>
          )}

          {isAdminOrHOD && (
            <button
              onClick={handlePublishResults}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Publish Semester Results</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Configurable Grading Rules Reference */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Institutional Grading Scale (Configurable)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {gradingRules.map((r) => (
            <div key={r.grade_letter} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-lg font-black text-blue-600 dark:text-cyan-400 block">{r.grade_letter}</span>
              <span className="text-[10px] text-slate-400 block font-semibold">{r.min_score} - {r.max_score}%</span>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mt-1">GP: {r.grade_point}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Published Student Marks Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <span>Verified Internal Assessment Scores</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Subject</th>
                <th className="pb-3">Assessment Type</th>
                <th className="pb-3 text-center">Marks Obtained</th>
                <th className="pb-3 text-center">Max Marks</th>
                <th className="pb-3 text-center">Weightage</th>
                <th className="pb-3 text-center">Calculated Grade</th>
                <th className="pb-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {marks.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3">
                    <span className="font-semibold text-slate-900 dark:text-white block">{m.subject_name}</span>
                    <span className="font-mono text-slate-400 text-[10px]">{m.subject_code}</span>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300 font-medium">{m.assessment_name}</td>
                  <td className="py-3 text-center font-bold text-slate-900 dark:text-white text-sm">{m.marks_obtained}</td>
                  <td className="py-3 text-center text-slate-500">{m.max_marks}</td>
                  <td className="py-3 text-center text-slate-500">{m.weightage_percent}%</td>
                  <td className="py-3 text-center">
                    <span className="px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-cyan-400 font-black">
                      {m.grade_letter} (GP: {m.grade_point})
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Approved</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enter Marks Modal */}
      {entryModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-cyan-400">{selectedClass.subject_code}</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Enter Assessment Marks</h3>
              </div>
              <button onClick={() => setEntryModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmitMarks} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Assessment Type</label>
                <select
                  value={selectedAssessment}
                  onChange={(e) => setSelectedAssessment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                >
                  {assessmentTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Max: {t.max_marks})</option>
                  ))}
                </select>
              </div>

              {/* Roster Marks Grid */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                {marksGrid.map((s) => (
                  <div key={s.student_id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white mr-2">{s.roll_number}</span>
                      <span className="text-slate-600 dark:text-slate-300">{s.full_name}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={s.marks_obtained}
                        onChange={(e) => handleMarksChange(s.student_id, e.target.value)}
                        className="w-20 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-center font-bold text-xs"
                      />
                      <span className="text-slate-400">/ 100</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setEntryModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save & Submit Marks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
