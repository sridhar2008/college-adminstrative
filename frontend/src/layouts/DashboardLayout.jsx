import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  CalendarCheck,
  Award,
  BookOpen,
  Users,
  Search,
  Bell,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  GraduationCap,
  Building2,
  FileText,
  ShieldCheck,
  ChevronRight,
  Database,
  Building,
  KeyRound
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role || 'student';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    const base = [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ];

    if (role === 'student') {
      base.push(
        { name: 'My Attendance', path: '/attendance', icon: CalendarCheck },
        { name: 'Internal Marks', path: '/marks', icon: Award },
        { name: 'Contact Diary', path: '/contacts', icon: BookOpen },
        { name: 'Student Lookup', path: '/search', icon: Search }
      );
    } else if (role === 'faculty' || role === 'subject_faculty') {
      base.push(
        { name: 'Mark Attendance', path: '/attendance', icon: CalendarCheck },
        { name: 'Course Marks', path: '/marks', icon: Award },
        { name: 'Student Lookup', path: '/search', icon: Search },
        { name: 'Academic Reports', path: '/reports', icon: FileText }
      );
    } else if (role === 'hod') {
      base.push(
        { name: 'Department Students', path: '/students/manage', icon: Users },
        { name: 'Attendance Monitor', path: '/attendance', icon: CalendarCheck },
        { name: 'Marks & Approvals', path: '/marks', icon: Award },
        { name: 'Department Reports', path: '/reports', icon: FileText }
      );
    } else if (role === 'admin') {
      base.push(
        { name: 'Student Data Generator', path: '/admin/generator', icon: Database },
        { name: 'Password & Credentials', path: '/admin/passwords', icon: KeyRound },
        { name: 'Student Registry', path: '/students/manage', icon: Users },
        { name: 'Departments & Degrees', path: '/departments/manage', icon: Building },
        { name: 'Attendance Overview', path: '/attendance', icon: CalendarCheck },
        { name: 'Academic Marks', path: '/marks', icon: Award },
        { name: 'Reports & Exports', path: '/reports', icon: FileText }
      );
    } else if (role === 'dean') {
      base.push(
        { name: 'Institution Registry', path: '/students/manage', icon: Users },
        { name: 'Credential Manager', path: '/admin/passwords', icon: KeyRound },
        { name: 'Departments & Degrees', path: '/departments/manage', icon: Building },
        { name: 'Attendance Overview', path: '/attendance', icon: CalendarCheck },
        { name: 'Academic Results', path: '/marks', icon: Award },
        { name: 'Student Search', path: '/search', icon: Search },
        { name: 'Reports & Exports', path: '/reports', icon: FileText },
        { name: 'Audit Trail', path: '/audit', icon: ShieldCheck }
      );
    } else if (role === 'parent') {
      base.push(
        { name: 'Ward Attendance', path: '/attendance', icon: CalendarCheck },
        { name: 'Ward Results', path: '/marks', icon: Award }
      );
    } else if (role === 'guest') {
      base.push(
        { name: 'Assigned Sessions', path: '/attendance', icon: CalendarCheck }
      );
    }

    return base;
  };

  const navLinks = getNavLinks();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-0 lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-18 px-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white block">Apex Engineering</span>
              <span className="text-xs text-cyan-400 font-medium tracking-wide">CSMS Academic Portal</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-sm">
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'Authenticated User'}</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-medium text-slate-400 capitalize">{user?.role_display || role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Main Menu</div>
          {navLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-18 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-30">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Engineering ERP System</span>
              <span>/</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{user?.role_display || role} Workspace</span>
            </div>
          </div>

          {/* Right Header Icons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/search')}
              className="hidden md:flex items-center space-x-2 px-3 py-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Roll Lookup</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700">⌘K</kbd>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
