import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CalendarCheck, Award, AlertCircle, Clock, BookOpen, User, Phone, CheckCircle, IdCard, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import StudentIdCardModal from '../../components/StudentIdCardModal';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idCardData, setIdCardData] = useState(null);
  const [showIdCardModal, setShowIdCardModal] = useState(false);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const [attRes, marksRes, annRes] = await Promise.all([
          api.get('/attendance/my-summary'),
          api.get('/marks/my-marks'),
          api.get('/notifications/announcements'),
        ]);
        setAttendance(attRes.data);
        setMarks(marksRes.data);
        setAnnouncements(annRes.data);
      } catch (err) {
        console.error("Error loading student portal data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, []);

  // Compute aggregate attendance
  const totalConducted = attendance.reduce((sum, s) => sum + s.conducted_classes, 0);
  const totalAttended = attendance.reduce((sum, s) => sum + s.attended_classes, 0);
  const aggregatePct = totalConducted > 0 ? ((totalAttended / totalConducted) * 100).toFixed(1) : 100.0;
  const hasShortage = aggregatePct < 75.0;

  const handleOpenIdCard = async () => {
    try {
      // Find my student profile id
      const res = await api.get(`/students/lookup/${user?.roll_number || '2024CS101'}`);
      if (res.data?.student?.id) {
        const cardRes = await api.get(`/students/${res.data.student.id}/id-card`);
        setIdCardData(cardRes.data);
        setShowIdCardModal(true);
      }
    } catch (err) {
      alert("Failed to load your ID card data.");
    }
  };

  const handleUploadPhoto = async (photoBase64) => {
    if (!idCardData) return;
    try {
      await api.post(`/students/${idCardData.id}/photo`, { photo_data: photoBase64 });
      setIdCardData(prev => ({ ...prev, profile_image_url: photoBase64 }));
    } catch (err) {
      alert("Failed to upload photo. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading student profile & records...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Student Profile Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
            <span>B.Tech Computer Science & Engineering</span>
            <span>•</span>
            <span>Semester 3 (Year 2)</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">{user?.full_name || 'Arun Kumar'}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-300">
            <span className="bg-white/10 px-2.5 py-1 rounded-md font-mono">Roll: {user?.roll_number || '2024CS101'}</span>
            <span className="bg-white/10 px-2.5 py-1 rounded-md">Section A</span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-md font-semibold">Active Enrollment</span>
          </div>
        </div>

        {/* Aggregate Attendance Pill & ID Card button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleOpenIdCard}
            className="w-full sm:w-auto px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 transition cursor-pointer"
          >
            <IdCard className="w-4 h-4" />
            <span>Download / View Student ID</span>
          </button>

          <div className={`p-4 rounded-xl border backdrop-blur-sm text-center min-w-[150px] ${
            hasShortage ? 'bg-rose-500/20 border-rose-500/30 text-rose-200' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
          }`}>
            <span className="text-xs uppercase font-bold tracking-wider block">Overall Attendance</span>
            <span className="text-3xl font-black">{aggregatePct}%</span>
            <span className="text-[11px] block mt-0.5">{hasShortage ? '⚠️ Shortage Alert (<75%)' : '✓ Good Standing'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Attendance & Marks */}
        <div className="lg:col-span-8 space-y-6">
          {/* Subject Attendance Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <CalendarCheck className="w-5 h-5 text-blue-600" />
                <span>Subject Attendance Breakdown</span>
              </h2>
              <Link to="/attendance" className="text-xs text-blue-600 hover:underline font-semibold">View Detail</Link>
            </div>

            <div className="space-y-4">
              {attendance.map((s) => (
                <div key={s.subject_code} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{s.subject_name}</span>
                      <span className="text-xs text-slate-400 ml-2 font-mono">({s.subject_code})</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${s.status_alert ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                        {s.percentage}%
                      </span>
                      <span className="text-xs text-slate-400 ml-1.5">({s.attended_classes}/{s.conducted_classes})</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        s.status_alert ? 'bg-rose-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(s.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Internal Assessment Marks */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <span>Published Internal Marks</span>
              </h2>
              <Link to="/marks" className="text-xs text-blue-600 hover:underline font-semibold">Full Grade Sheet</Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                    <th className="pb-3">Subject</th>
                    <th className="pb-3">Assessment</th>
                    <th className="pb-3">Marks</th>
                    <th className="pb-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {marks.map((m) => (
                    <tr key={m.id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3 font-medium">{m.subject_name}</td>
                      <td className="py-3 text-xs text-slate-500">{m.assessment_name}</td>
                      <td className="py-3 font-bold text-slate-900 dark:text-white">
                        {m.marks_obtained} <span className="text-xs font-normal text-slate-400">/ {m.max_marks}</span>
                      </td>
                      <td className="py-3 text-xs text-slate-500 italic">{m.remarks || 'Verified'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Announcements & Quick Links */}
        <div className="lg:col-span-4 space-y-6">
          {/* College Announcements */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Official Announcements</h2>
            <div className="space-y-4">
              {announcements.map((a) => (
                <div key={a.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-600 dark:text-cyan-400 mb-1">
                    {a.is_pinned && <span className="bg-blue-100 dark:bg-blue-900/50 text-[10px] px-1.5 py-0.5 rounded">PINNED</span>}
                    <span>{a.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{a.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Diary Link */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-850 p-6 rounded-2xl border border-blue-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Personal Contact Diary</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Safely store emergency contacts and manage personal directory privacy consent.
            </p>
            <Link
              to="/contacts"
              className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline"
            >
              <span>Manage My Contacts</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Student ID Card Modal */}
      {showIdCardModal && idCardData && (
        <StudentIdCardModal
          idCardData={idCardData}
          onClose={() => setShowIdCardModal(false)}
          onUploadPhoto={handleUploadPhoto}
        />
      )}
    </div>
  );
}
