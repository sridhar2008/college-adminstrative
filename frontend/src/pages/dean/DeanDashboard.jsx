import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, GraduationCap, Building, Award, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function DeanDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/departments/stats');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load dean statistics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const COLORS = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B'];

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading institution analytics...</div>;
  }

  const degreeData = [
    { name: 'UG (4-Year)', value: stats?.degree_breakdown?.UG || 0 },
    { name: 'PG (2-Year)', value: stats?.degree_breakdown?.PG || 0 },
    { name: 'Ph.D. Scholars', value: stats?.degree_breakdown?.PhD || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">Institutional Governance</span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-1">Dean / Director Executive Overview</h1>
          <p className="text-slate-300 text-sm mt-1">Real-time statistics across all academic faculties, programs, and departments.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-semibold">Academic Year 2025-2026 Active</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Total Student Strength</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {stats?.total_students || 0}
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1">Enrolled across UG, PG & PhD</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Academic Faculty</span>
            <GraduationCap className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {stats?.total_faculty || 0}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">Professors, Assoc & Asst</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Active Departments</span>
            <Building className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {stats?.total_departments || 0}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">CSE, ECE, IT, MECH</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Accreditation Status</span>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            Tier-1 NBA / NAAC A++
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1">Compliant Regulations</p>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Comparison Bar Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Department Student & Faculty Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.department_statistics || []}>
                <XAxis dataKey="department_code" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="student_count" fill="#2563EB" name="Students" radius={[4, 4, 0, 0]} />
                <Bar dataKey="faculty_count" fill="#06B6D4" name="Faculty" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Degree Breakdown Pie Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Academic Programs Breakdown</h2>
            <p className="text-xs text-slate-500">Distribution by degree category</p>
          </div>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={degreeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label>
                  {degreeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around text-xs text-slate-500">
            <span className="flex items-center"><span className="w-2.5 h-2.5 bg-blue-600 rounded-full mr-1.5"></span>UG</span>
            <span className="flex items-center"><span className="w-2.5 h-2.5 bg-cyan-500 rounded-full mr-1.5"></span>PG</span>
            <span className="flex items-center"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-1.5"></span>PhD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
