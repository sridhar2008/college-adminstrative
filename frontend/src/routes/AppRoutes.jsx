import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Login from '../pages/auth/Login';
import DeanDashboard from '../pages/dean/DeanDashboard';
import HodDashboard from '../pages/hod/HodDashboard';
import FacultyDashboard from '../pages/faculty/FacultyDashboard';
import GuestDashboard from '../pages/guest/GuestDashboard';
import StudentDashboard from '../pages/student/StudentDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ParentDashboard from '../pages/parent/ParentDashboard';
import AttendancePage from '../pages/attendance/AttendancePage';
import MarksPage from '../pages/marks/MarksPage';
import ContactsPage from '../pages/contacts/ContactsPage';
import StudentSearchPage from '../pages/search/StudentSearchPage';
import ReportsPage from '../pages/reports/ReportsPage';
import StudentDataGeneratorPage from '../pages/admin/StudentDataGeneratorPage';
import StudentManagementPage from '../pages/students/StudentManagementPage';
import DepartmentManagementPage from '../pages/departments/DepartmentManagementPage';
import UserPasswordGovernancePage from '../pages/admin/UserPasswordGovernancePage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Verifying Session...</span>
        </div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const RoleDashboardRouter = () => {
  const { user } = useAuth();
  const role = user?.role || 'student';

  switch (role) {
    case 'dean':
      return <DeanDashboard />;
    case 'hod':
      return <HodDashboard />;
    case 'faculty':
    case 'subject_faculty':
      return <FacultyDashboard />;
    case 'guest':
      return <GuestDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'parent':
      return <ParentDashboard />;
    case 'student':
    default:
      return <StudentDashboard />;
  }
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<RoleDashboardRouter />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="marks" element={<MarksPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="search" element={<StudentSearchPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit" element={<DeanDashboard />} />

        {/* Admin & Management Specific Routes */}
        <Route path="admin/generator" element={<StudentDataGeneratorPage />} />
        <Route path="admin/passwords" element={<UserPasswordGovernancePage />} />
        <Route path="students/manage" element={<StudentManagementPage />} />
        <Route path="departments/manage" element={<DepartmentManagementPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
