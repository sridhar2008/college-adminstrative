import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BookOpen, Shield, Users, Lock, Plus, Check, Eye } from 'lucide-react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [activeTab, setActiveTab] = useState('private');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const [privRes, dirRes] = await Promise.all([
          api.get('/contacts/my-diary'),
          api.get('/contacts/directory'),
        ]);
        setContacts(privRes.data);
        setDirectory(dirRes.data);
      } catch (err) {
        console.error("Error loading contacts:", err);
      } finally {
        setLoading(false);
      }
    };
    loadContacts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Contact Diary & Directory</h1>
          <p className="text-sm text-slate-500">Fine-grained privacy controls for parent, emergency, and peer contact information.</p>
        </div>
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('private')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'private' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            My Private Diary ({contacts.length})
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'directory' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Consented Directory ({directory.length})
          </button>
        </div>
      </div>

      {activeTab === 'private' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              <Lock className="w-4 h-4" />
              <span>Strict Privacy: Parent & emergency numbers are never published or shared publicly.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((c) => (
              <div key={c.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-cyan-400 px-2 py-0.5 rounded">
                    {c.category}
                  </span>
                  {c.is_public_in_directory && (
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-semibold">
                      Publicly Consented
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{c.name}</h3>
                <p className="text-xs text-slate-500">{c.relationship}</p>
                <div className="pt-2 text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1">
                  <div>📞 {c.phone}</div>
                  {c.email && <div>✉️ {c.email}</div>}
                </div>
                {c.notes && <p className="text-xs text-slate-400 italic pt-1">{c.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Student-Approved Directory</h2>
          <p className="text-xs text-slate-500 mb-4">Entries appear here ONLY with explicit student consent.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {directory.map((d, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
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
        </div>
      )}
    </div>
  );
}
