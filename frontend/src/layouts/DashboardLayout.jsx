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
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Mobile Drawer & Desktop Static Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-900 text-slate-100 flex-col shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out lg:static lg:translate-x-0 lg:flex ${
          sidebarOpen
            ? 'flex translate-x-0'
            : 'hidden lg:flex -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 sm:h-18 px-5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-white block leading-tight truncate">
                Dhanalakshmi Srinivasan
              </span>
              <span className="text-[10px] text-cyan-400 font-medium tracking-wide block truncate">
                College of Engineering (3805)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-white truncate">{user?.full_name || 'Authenticated User'}</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-medium text-slate-400 capitalize truncate">{user?.role_display || role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3.5 py-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">Main Menu</div>
          {navLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-3 truncate">
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50 flex-shrink-0 ml-1" />
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors border border-rose-500/20"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 sm:h-18 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 z-30">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 min-w-0">
              <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0 hidden xs:block" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize truncate">
                {user?.role_display || role} Workspace
              </span>
            </div>
          </div>

          {/* Right Header Icons */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0">
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
              {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 bg-slate-50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
