import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, CheckCircle2, AlertTriangle, Users, Clock, Plus, Filter, RefreshCw, X, ShieldCheck } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Faculty Attendance Marking State
  const [markModal, setMarkModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [periodNumber, setPeriodNumber] = useState(1);
  const [topicCovered, setTopicCovered] = useState('');
  const [studentRoster, setStudentRoster] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Student Correction Request State
  const [correctionModal, setCorrectionModal] = useState(false);
  const [corrForm, setCorrForm] = useState({ session_id: '', student_id: '', requested_status: 'PRESENT', reason: '' });

  const isFaculty = user?.role && ['faculty', 'subject_faculty', 'guest', 'hod', 'admin', 'dean'].includes(user.role);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const [sumRes, sessRes] = await Promise.all([
        api.get('/attendance/my-summary'),
        api.get('/attendance/sessions')
      ]);
      setAttendance(sumRes.data);
      setSessions(sessRes.data);

      if (isFaculty) {
        const classRes = await api.get('/attendance/classes');
        setAssignedClasses(classRes.data);
      }
    } catch (err) {
      console.error("Error loading attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const openMarkModalForClass = (cls) => {
    setSelectedClass(cls);
    // Initialize student roster with PRESENT default
    const roster = (cls.students || []).map(s => ({
      student_id: s.id,
      roll_number: s.roll_number,
      full_name: s.full_name,
      status: 'PRESENT',
      remarks: ''
    }));
    setStudentRoster(roster);
    setMarkModal(true);
    setError('');
    setMessage('');
  };

  const markAllStatus = (newStatus) => {
    setStudentRoster(prev => prev.map(s => ({ ...s, status: newStatus })));
  };

  const toggleStudentStatus = (studentId, status) => {
    setStudentRoster(prev => prev.map(s => s.student_id === studentId ? { ...s, status } : s));
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedClass) return;
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        subject_allocation_id: selectedClass.allocation_id,
        session_date: sessionDate,
        period_number: parseInt(periodNumber, 10),
        topic_covered: topicCovered || `Period ${periodNumber} Lecture`,
        records: studentRoster.map(s => ({
          student_id: s.student_id,
          status: s.status,
          remarks: s.remarks || null
        }))
      };

      const res = await api.post('/attendance/sessions', payload);
      setMessage(res.data.message);
      setMarkModal(false);
      fetchAttendanceData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to record attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/correction-request', corrForm);
      alert("Attendance correction request submitted to HOD.");
      setCorrectionModal(false);
    } catch (err) {
      alert(err.response?.data?.detail || "Submission failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance Management Console</h1>
          <p className="text-sm text-slate-500">
            Daily, period-wise, and subject attendance records with statutory 75% eligibility calculation.
          </p>
        </div>

        {isFaculty && assignedClasses.length > 0 && (
          <button
            onClick={() => openMarkModalForClass(assignedClasses[0])}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Mark Class Attendance</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Faculty Allocated Classes to Mark */}
      {isFaculty && assignedClasses.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Assigned Classes (One-Click Attendance Marking)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedClasses.map((cls) => (
              <div key={cls.allocation_id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-blue-600 dark:text-cyan-400">{cls.subject_code}</span>
                  <span className="text-slate-400">Sem {cls.semester_number} (Sec {cls.section_name})</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{cls.subject_name}</h3>
                <p className="text-xs text-slate-500">{cls.students?.length || 0} Enrolled Students</p>
                <button
                  onClick={() => openMarkModalForClass(cls)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition"
                >
                  Mark Period Attendance →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Subject Attendance Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span>Subject Attendance Summary & Exam Eligibility</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Subject Code</th>
                <th className="pb-3">Subject Name</th>
                <th className="pb-3 text-center">Conducted</th>
                <th className="pb-3 text-center">Attended</th>
                <th className="pb-3 text-center">Attendance %</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {attendance.map((item) => (
                <tr key={item.subject_code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 font-mono font-bold text-blue-600 dark:text-cyan-400">{item.subject_code}</td>
                  <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{item.subject_name}</td>
                  <td className="py-3 text-center text-slate-600 dark:text-slate-400">{item.conducted_classes}</td>
                  <td className="py-3 text-center font-bold text-slate-900 dark:text-white">{item.attended_classes}</td>
                  <td className="py-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-md font-bold text-xs ${
                      item.status_alert ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    }`}>
                      {item.percentage}%
                    </span>
                  </td>
                  <td className="py-3 text-right">
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

      {/* Recent Conducted Sessions History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          <span>Recent Class Sessions Audit Log</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Date</th>
                <th className="pb-3">Period</th>
                <th className="pb-3">Subject</th>
                <th className="pb-3">Topic Covered</th>
                <th className="pb-3 text-center">Attended / Total</th>
                <th className="pb-3 text-right">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 font-mono text-slate-600 dark:text-slate-300">{s.session_date}</td>
                  <td className="py-3 font-semibold text-blue-600 dark:text-cyan-400">Period {s.period_number}</td>
                  <td className="py-3 font-medium text-slate-900 dark:text-white">{s.subject_name} ({s.subject_code})</td>
                  <td className="py-3 text-slate-500 italic">{s.topic_covered}</td>
                  <td className="py-3 text-center font-semibold text-slate-800 dark:text-slate-200">{s.present_count} / {s.total_count}</td>
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

      {/* Interactive Faculty Attendance Marking Modal */}
      {markModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-cyan-400">{selectedClass.subject_code}</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedClass.subject_name}</h3>
              </div>
              <button onClick={() => setMarkModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            {error && <div className="p-3 bg-rose-500/10 text-rose-500 text-xs rounded-xl">{error}</div>}

            <form onSubmit={handleSubmitAttendance} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Session Date</label>
                  <input
                    type="date"
                    required
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Period (1 to 8)</label>
                  <select
                    value={periodNumber}
                    onChange={(e) => setPeriodNumber(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Topic Covered</label>
                  <input
                    type="text"
                    placeholder="e.g. Binary Search Trees"
                    value={topicCovered}
                    onChange={(e) => setTopicCovered(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Quick Bulk Marking Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-400">Class Roster ({studentRoster.length})</span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => markAllStatus('PRESENT')}
                    className="px-3 py-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-lg text-xs font-semibold"
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => markAllStatus('ABSENT')}
                    className="px-3 py-1 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg text-xs font-semibold"
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              {/* Roster Table */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                {studentRoster.map((s) => (
                  <div key={s.student_id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white mr-2">{s.roll_number}</span>
                      <span className="text-slate-600 dark:text-slate-300">{s.full_name}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {['PRESENT', 'ABSENT', 'ON_DUTY', 'MEDICAL_LEAVE'].map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => toggleStudentStatus(s.student_id, st)}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                            s.status === st
                              ? (st === 'PRESENT' ? 'bg-emerald-600 text-white' : (st === 'ABSENT' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'))
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {st === 'PRESENT' ? 'P' : (st === 'ABSENT' ? 'A' : (st === 'ON_DUTY' ? 'OD' : 'ML'))}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setMarkModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Submit & Lock Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
