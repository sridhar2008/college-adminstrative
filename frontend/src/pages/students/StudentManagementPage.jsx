import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Search, Filter, Plus, Edit, Trash2, ArrowUpRight, Upload, Download, Eye, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function StudentManagementPage() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(0);
  const limit = 20;
  const [loading, setLoading] = useState(true);

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null); // student object
  const [viewModal, setViewModal] = useState(null); // student object
  const [promoteModal, setPromoteModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Add Form state
  const [newStudent, setNewStudent] = useState({
    full_name: '',
    roll_number: '',
    registration_number: '',
    department_id: '',
    program_id: '',
    batch_id: '',
    current_semester_id: '',
    section_id: '',
    dob: '2005-05-15',
    gender: 'Male',
    blood_group: 'O+',
    college_email: '',
    phone: '',
    residential_address: '',
    parent_name: '',
    parent_phone: '',
    parent_occupation: '',
    admission_status: 'CONFIRMED',
    academic_status: 'ACTIVE'
  });

  const [programsForDept, setProgramsForDept] = useState([]);

  useEffect(() => {
    fetchInitialFilters();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, selectedDept, selectedStatus, page]);

  const fetchInitialFilters = async () => {
    try {
      const [deptRes, structRes] = await Promise.all([
        api.get('/departments'),
        api.get('/admin/academic-structure')
      ]);
      setDepartments(deptRes.data);
      setAcademicYears(structRes.data.academic_years || []);
    } catch (err) {
      console.error("Filter loading failed:", err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students', {
        params: {
          search: search || undefined,
          department_id: selectedDept,
          academic_status: selectedStatus,
          limit,
          offset: page * limit
        }
      });
      setStudents(res.data.items);
      setTotalCount(res.data.total);
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeptChange = (deptId) => {
    setNewStudent({ ...newStudent, department_id: deptId });
    const dept = departments.find(d => d.id === deptId);
    if (dept && dept.programs) {
      setProgramsForDept(dept.programs);
      if (dept.programs.length > 0) {
        setNewStudent(prev => ({ ...prev, department_id: deptId, program_id: dept.programs[0].id }));
      }
    } else {
      setProgramsForDept([]);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await api.post('/students', newStudent);
      setMessage("Student registered successfully!");
      setAddModal(false);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editModal) return;

    try {
      await api.put(`/students/${editModal.id}`, {
        full_name: editModal.full_name,
        dob: editModal.dob,
        gender: editModal.gender,
        blood_group: editModal.blood_group,
        phone: editModal.phone,
        residential_address: editModal.residential_address,
        academic_status: editModal.academic_status
      });
      setMessage("Student updated successfully.");
      setEditModal(null);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  const handleStatusChange = async (studentId, newStatus) => {
    try {
      await api.patch(`/students/${studentId}/status`, { academic_status: newStatus });
      fetchStudents();
    } catch (err) {
      alert("Failed to change status");
    }
  };

  const handleDeactivate = async (studentId) => {
    if (!window.confirm("Are you sure you want to deactivate this student account?")) return;
    try {
      await api.delete(`/students/${studentId}`);
      setMessage("Student deactivated.");
      fetchStudents();
    } catch (err) {
      alert("Error deactivating student");
    }
  };

  const handleCSVImport = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const res = await api.post('/students/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(res.data.message);
      setImportModal(false);
      setCsvFile(null);
      fetchStudents();
    } catch (err) {
      alert("CSV import failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleCSVExport = async () => {
    try {
      const response = await api.get('/reports/students/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'csms_students_registry.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Information & Registry</h1>
          <p className="text-sm text-slate-500">
            Institution-wide registry ({totalCount} Enrolled Students across 20 Departments)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCSVExport}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setImportModal(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by Roll No, Registration No, or Student Name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => { setSelectedDept(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.code}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="GRADUATED">Graduated</option>
            <option value="PROVISIONAL">Provisional</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-400 uppercase">
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Degree</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">Loading student registry...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">No student records found matching filters.</td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-cyan-400">{s.roll_number}</td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{s.full_name}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{s.department_name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        s.degree_level === 'UG' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                        (s.degree_level === 'PG' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300')
                      }`}>
                        {s.degree_level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">Sem {s.semester_number} ({s.section_name})</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{s.college_email}</td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={s.academic_status}
                        onChange={(e) => handleStatusChange(s.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bg-transparent cursor-pointer ${
                          s.academic_status === 'ACTIVE' ? 'border-emerald-500 text-emerald-600' :
                          (s.academic_status === 'SUSPENDED' ? 'border-rose-500 text-rose-600' : 'border-amber-500 text-amber-600')
                        }`}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="GRADUATED">GRADUATED</option>
                        <option value="PROVISIONAL">PROVISIONAL</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setViewModal(s)}
                          title="View Profile"
                          className="p-1 text-slate-400 hover:text-blue-600 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditModal({ ...s })}
                          title="Edit Student"
                          className="p-1 text-slate-400 hover:text-amber-600 transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeactivate(s.id)}
                          title="Deactivate Student"
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {Math.min(totalCount, page * limit + 1)} to {Math.min(totalCount, (page + 1) * limit)} of {totalCount} students
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * limit >= totalCount}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Register New Student</h3>
              <button onClick={() => setAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            {error && <div className="p-3 bg-rose-500/10 text-rose-500 text-xs rounded-lg">{error}</div>}

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arun Kumar"
                    value={newStudent.full_name}
                    onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2024CS150"
                    value={newStudent.roll_number}
                    onChange={(e) => setNewStudent({ ...newStudent, roll_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Registration Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 312424104050"
                    value={newStudent.registration_number}
                    onChange={(e) => setNewStudent({ ...newStudent, registration_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Institutional Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. arun.2024cs150@engineering.edu"
                    value={newStudent.college_email}
                    onChange={(e) => setNewStudent({ ...newStudent, college_email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Department</label>
                  <select
                    required
                    value={newStudent.department_id}
                    onChange={(e) => handleDeptChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>[{d.code}] {d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Program</label>
                  <select
                    required
                    value={newStudent.program_id}
                    onChange={(e) => setNewStudent({ ...newStudent, program_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                  >
                    <option value="">Select Program</option>
                    {programsForDept.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.degree_level})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={newStudent.dob}
                    onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Gender</label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    placeholder="Father/Mother name"
                    value={newStudent.parent_name}
                    onChange={(e) => setNewStudent({ ...newStudent, parent_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Parent Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 9400000000"
                    value={newStudent.parent_phone}
                    onChange={(e) => setNewStudent({ ...newStudent, parent_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setAddModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl shadow">Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Student: {editModal.roll_number}</h3>
              <button onClick={() => setEditModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Student Full Name</label>
                <input
                  type="text"
                  value={editModal.full_name}
                  onChange={(e) => setEditModal({ ...editModal, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editModal.phone || ''}
                    onChange={(e) => setEditModal({ ...editModal, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Academic Status</label>
                  <select
                    value={editModal.academic_status}
                    onChange={(e) => setEditModal({ ...editModal, academic_status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="GRADUATED">GRADUATED</option>
                    <option value="PROVISIONAL">PROVISIONAL</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setEditModal(null)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">{viewModal.degree_level} • {viewModal.department_name}</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{viewModal.full_name}</h3>
              </div>
              <button onClick={() => setViewModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-400">Roll Number:</span> <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{viewModal.roll_number}</span></div>
                <div><span className="text-slate-400">Registration:</span> <span className="font-mono text-slate-800 dark:text-slate-200">{viewModal.registration_number}</span></div>
                <div><span className="text-slate-400">Email:</span> <span className="text-slate-800 dark:text-slate-200">{viewModal.college_email}</span></div>
                <div><span className="text-slate-400">Phone:</span> <span className="text-slate-800 dark:text-slate-200">{viewModal.phone || 'N/A'}</span></div>
                <div><span className="text-slate-400">Gender / Blood:</span> <span className="text-slate-800 dark:text-slate-200">{viewModal.gender} ({viewModal.blood_group || 'N/A'})</span></div>
                <div><span className="text-slate-400">Date of Birth:</span> <span className="text-slate-800 dark:text-slate-200">{viewModal.dob}</span></div>
                <div><span className="text-slate-400">Program:</span> <span className="text-slate-800 dark:text-slate-200">{viewModal.program_name}</span></div>
                <div><span className="text-slate-400">Current Semester:</span> <span className="text-slate-800 dark:text-slate-200">Sem {viewModal.semester_number} (Sec {viewModal.section_name})</span></div>
              </div>
              {viewModal.residential_address && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block">Address:</span>
                  <span className="text-slate-700 dark:text-slate-300">{viewModal.residential_address}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setViewModal(null)} className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white rounded-xl">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Import Students from CSV</h3>
              <button onClick={() => setImportModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-500">
              Upload a UTF-8 CSV containing columns: Roll Number, Registration Number, Student Name, Email, Department, Program.
            </p>
            <form onSubmit={handleCSVImport} className="space-y-4">
              <input
                type="file"
                accept=".csv"
                required
                onChange={(e) => setCsvFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setImportModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl">Upload & Import</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
