import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Building2, Plus, Edit, BookOpen, Clock, CheckCircle2, X } from 'lucide-react';

export default function DepartmentManagementPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDeptModal, setAddDeptModal] = useState(false);
  const [addProgramModal, setAddProgramModal] = useState(null); // department object
  const [deptForm, setDeptForm] = useState({ code: '', name: '', established_year: 2020 });
  const [progForm, setProgForm] = useState({ name: '', code: '', degree_level: 'UG', duration_years: 4 });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', deptForm);
      setMessage("Department created successfully.");
      setAddDeptModal(false);
      setDeptForm({ code: '', name: '', established_year: 2020 });
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create department");
    }
  };

  const handleAddProgram = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/departments/${addProgramModal.id}/programs`, {
        ...progForm,
        total_semesters: progForm.duration_years * 2
      });
      setMessage("Program added successfully.");
      setAddProgramModal(null);
      setProgForm({ name: '', code: '', degree_level: 'UG', duration_years: 4 });
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to add program");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Department & Program Management</h1>
          <p className="text-sm text-slate-500">
            Configure institutional faculties, Undergrad (UG 4-Year), Postgrad (PG 2-Year), and Ph.D. programs.
          </p>
        </div>
        <button
          onClick={() => setAddDeptModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-cyan-400">
                  {dept.code}
                </span>
                <span className="text-xs text-slate-400">Est. {dept.established_year}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{dept.name}</h2>
              <div className="flex items-center space-x-4 text-xs text-slate-500 mt-2">
                <span>Students: <strong>{dept.student_count || 0}</strong></span>
                <span>•</span>
                <span>Faculty: <strong>{dept.faculty_count || 0}</strong></span>
              </div>

              {/* Offered Programs */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Offered Programs</span>
                {dept.programs?.map((p) => (
                  <div key={p.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{p.code} • {p.degree_level}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">{p.duration_years} Years ({p.total_semesters} Sems)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setAddProgramModal(dept)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Degree Program</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      {addDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Academic Department</h3>
              <button onClick={() => setAddDeptModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateDept} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AIDS"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence & Data Science"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Established Year</label>
                <input
                  type="number"
                  value={deptForm.established_year}
                  onChange={(e) => setDeptForm({ ...deptForm, established_year: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setAddDeptModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl">Save Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Program Modal */}
      {addProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Program to {addProgramModal.code}</h3>
              <button onClick={() => setAddProgramModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddProgram} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Program Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech Artificial Intelligence"
                  value={progForm.name}
                  onChange={(e) => setProgForm({ ...progForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Program Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BTECH-AIDS"
                  value={progForm.code}
                  onChange={(e) => setProgForm({ ...progForm, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Degree Level</label>
                  <select
                    value={progForm.degree_level}
                    onChange={(e) => setProgForm({ ...progForm, degree_level: e.target.value, duration_years: e.target.value === 'UG' ? 4 : (e.target.value === 'PG' ? 2 : 3) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                  >
                    <option value="UG">UG (B.Tech / B.E.)</option>
                    <option value="PG">PG (M.Tech / M.E.)</option>
                    <option value="PhD">Ph.D. Doctoral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Duration (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={progForm.duration_years}
                    onChange={(e) => setProgForm({ ...progForm, duration_years: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setAddProgramModal(null)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl">Save Program</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
