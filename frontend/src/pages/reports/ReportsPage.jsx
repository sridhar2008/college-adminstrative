import React, { useState } from 'react';
import api from '../../services/api';
import { Download, FileText, CheckCircle } from 'lucide-react';

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadCSV = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/reports/students/export-csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'csms_student_registry.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to export student CSV:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Academic Reports & Registry Exports</h1>
        <p className="text-sm text-slate-500">Download authorized CSV and academic summaries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 mb-2">
              <FileText className="w-5 h-5" />
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Complete Student Registry (CSV)</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export comprehensive student registry including roll numbers, registration IDs, program categories, admission status, and college emails.
            </p>
          </div>
          <button
            onClick={handleDownloadCSV}
            disabled={downloading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow shadow-blue-600/30 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Generating CSV...' : 'Export CSV Spreadsheet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
