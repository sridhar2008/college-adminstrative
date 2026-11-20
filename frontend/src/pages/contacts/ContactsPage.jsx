import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BookOpen, Shield, Users, Lock, Plus, Edit, Trash2, CheckCircle2, X, Search, Globe, EyeOff } from 'lucide-react';

const CATEGORIES = [
  "ALL",
  "PARENT",
  "GUARDIAN",
  "EMERGENCY",
  "FRIEND",
  "FACULTY",
  "DEPT_OFFICE",
  "ADMIN_OFFICE"
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [activeTab, setActiveTab] = useState('private');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [contactForm, setContactForm] = useState({
    category: 'FRIEND',
    name: '',
    relationship: '',
    phone: '',
    email: '',
    is_public_in_directory: false,
    notes: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadContacts();
  }, [selectedCategory, search]);

  const loadContacts = async () => {
    try {
      const [privRes, dirRes] = await Promise.all([
        api.get('/contacts/my-diary', { params: { category: selectedCategory, search: search || undefined } }),
        api.get('/contacts/directory', { params: { category: selectedCategory, search: search || undefined } })
      ]);
      setContacts(privRes.data);
      setDirectory(dirRes.data);
    } catch (err) {
      console.error("Error loading contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    try {
      await api.post('/contacts/my-diary', contactForm);
      setMessage("Contact added successfully.");
      setAddModal(false);
      setContactForm({ category: 'FRIEND', name: '', relationship: '', phone: '', email: '', is_public_in_directory: false, notes: '' });
      loadContacts();
    } catch (err) {
      alert("Failed to add contact");
    }
  };

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    if (!editModal) return;
    try {
      await api.put(`/contacts/my-diary/${editModal.id}`, {
        name: editModal.name,
        relationship: editModal.relationship,
        phone: editModal.phone,
        email: editModal.email,
        is_public_in_directory: editModal.is_public_in_directory,
        notes: editModal.notes
      });
      setMessage("Contact updated successfully.");
      setEditModal(null);
      loadContacts();
    } catch (err) {
      alert("Failed to update contact");
    }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm("Delete this contact from your personal diary?")) return;
    try {
      await api.delete(`/contacts/my-diary/${id}`);
      setMessage("Contact deleted.");
      loadContacts();
    } catch (err) {
      alert("Error deleting contact");
    }
  };

  const handleToggleConsent = async (id) => {
    try {
      const res = await api.patch(`/contacts/my-diary/${id}/consent`);
      setMessage(res.data.message);
      loadContacts();
    } catch (err) {
      alert("Error toggling consent");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Contact Diary & Directory</h1>
          <p className="text-sm text-slate-500">
            Privacy-centric contact diary with explicit affirmative consent controls.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('private')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'private' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow' : 'text-slate-500'
              }`}
            >
              Private Diary ({contacts.length})
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'directory' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow' : 'text-slate-500'
              }`}
            >
              Consented Directory ({directory.length})
            </button>
          </div>

          <button
            onClick={() => setAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${
                selectedCategory === cat ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Private Diary Cards */}
      {activeTab === 'private' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c) => (
            <div key={c.id} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-cyan-400 px-2 py-0.5 rounded">
                    {c.category}
                  </span>
                  <button
                    onClick={() => handleToggleConsent(c.id)}
                    title="Click to toggle public directory consent"
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center space-x-1 ${
                      c.is_public_in_directory ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {c.is_public_in_directory ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{c.is_public_in_directory ? 'Consented' : 'Private'}</span>
                  </button>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2">{c.name}</h3>
                <p className="text-xs text-slate-500">{c.relationship}</p>
                <div className="pt-2 text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1">
                  <div>📞 {c.phone}</div>
                  {c.email && <div>✉️ {c.email}</div>}
                </div>
                {c.notes && <p className="text-xs text-slate-400 italic pt-1">{c.notes}</p>}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setEditModal({ ...c })}
                  className="p-1.5 text-slate-400 hover:text-amber-600 transition"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteContact(c.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Consented Directory Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {directory.map((d, idx) => (
            <div key={idx} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded">
                {d.category}
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{d.name}</h3>
              <p className="text-xs text-slate-500">{d.relationship}</p>
              {d.email && <div className="text-xs font-mono text-slate-600 dark:text-slate-300">✉️ {d.email}</div>}
              {d.notes && <p className="text-xs text-slate-400 italic">{d.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Contact Entry</h3>
              <button onClick={() => setAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Category</label>
                <select
                  value={contactForm.category}
                  onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                >
                  <option value="PARENT">Parent</option>
                  <option value="GUARDIAN">Guardian</option>
                  <option value="EMERGENCY">Emergency Contact</option>
                  <option value="FRIEND">Student Peer / Friend</option>
                  <option value="FACULTY">Faculty Member</option>
                  <option value="DEPT_OFFICE">Department Office</option>
                  <option value="ADMIN_OFFICE">Administrative Office</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Relationship</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Father, Roommate, Advisor"
                  value={contactForm.relationship}
                  onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9800000000"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="consent_check"
                  checked={contactForm.is_public_in_directory}
                  onChange={(e) => setContactForm({ ...contactForm, is_public_in_directory: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="consent_check" className="text-xs text-slate-600 dark:text-slate-300">
                  Affirmative consent: Allow display in public student directory
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setAddModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl shadow">Save Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Contact</h3>
              <button onClick={() => setEditModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleUpdateContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Contact Name</label>
                <input
                  type="text"
                  value={editModal.name}
                  onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Relationship</label>
                <input
                  type="text"
                  value={editModal.relationship}
                  onChange={(e) => setEditModal({ ...editModal, relationship: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editModal.phone}
                    onChange={(e) => setEditModal({ ...editModal, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={editModal.email || ''}
                    onChange={(e) => setEditModal({ ...editModal, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="consent_check_edit"
                  checked={editModal.is_public_in_directory}
                  onChange={(e) => setEditModal({ ...editModal, is_public_in_directory: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="consent_check_edit" className="text-xs text-slate-600 dark:text-slate-300">
                  Affirmative consent: Display in student directory
                </label>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setEditModal(null)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
