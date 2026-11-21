import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { GraduationCap, Lock, User, AlertCircle, CheckCircle2, Shield, ArrowRight } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDemos = async () => {
      try {
        const demos = await authService.getDemoAccounts();
        setDemoAccounts(demos);
      } catch (err) {
        console.error("Could not fetch demo accounts:", err);
      }
    };
    fetchDemos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = async (demo) => {
    setUsername(demo.username);
    setPassword(demo.password);
    setError('');
    setLoading(true);
    try {
      await login(demo.username, demo.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Card: Institution Overview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Official Institutional Gateway</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Apex Engineering College
            </h1>
            <p className="text-base text-slate-400 leading-relaxed">
              Centralized Student Management System (CSMS) supporting Undergraduate (UG 4-Year), Postgraduate (PG 2-Year), and Ph.D. scholars.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3 text-sm text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>Multi-tier role-based access for Deans, HODs, Professors & Students</span>
            </div>
            <div className="flex items-start space-x-3 text-sm text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>Strict server-side validation and object-level permission enforcement</span>
            </div>
            <div className="flex items-start space-x-3 text-sm text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>Subject-wise period attendance and configurable internal grading</span>
            </div>
          </div>
        </div>

        {/* Right Card: Login Form & 1-Click Role Switcher */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Portal Sign In</h2>
            </div>
            <p className="text-xs text-slate-400">Sign in using your Roll Number, Employee ID, or Institutional Email</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Roll Number / Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 2024CS101 or dean@engineering.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Institutional Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Academic Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Role Selector */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                1-Click Quick Demo Login (8 Roles)
              </span>
              <span className="text-[11px] text-slate-500">Click any role to test</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {demoAccounts.map((demo) => (
                <button
                  key={demo.code}
                  type="button"
                  onClick={() => selectDemoAccount(demo)}
                  className="p-2 text-left bg-slate-800/60 hover:bg-slate-750 hover:border-cyan-500/50 border border-slate-700/60 rounded-lg transition group cursor-pointer"
                  disabled={loading}
                >
                  <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 truncate">{demo.role}</p>
                  <p className="text-[10px] text-slate-400 truncate">{demo.username}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
