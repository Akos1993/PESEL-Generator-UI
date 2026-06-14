import React from 'react';
import { Database, Trash2, Download, ArrowLeft, FileText } from 'lucide-react';
import { Person, DbStatus } from './types';
import { TranslationKey } from './constants';

interface Props {
  people: Person[];
  isDarkMode: boolean;
  dbStatus: DbStatus;
  dbMessage: string;
  t: (key: TranslationKey) => string;
  onDeletePerson: (id: string) => void;
  onClearDatabase: () => void;
  onExport: () => void;
  onOpenReview: () => void;
  onBack: () => void;
}

const statusDotClass: Record<DbStatus, string> = {
  connected:    'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse',
  connecting:   'bg-amber-500 animate-pulse',
  disconnected: 'bg-rose-500',
  unconfigured: 'bg-rose-500',
};

const statusLabel: Record<DbStatus, string> = {
  connected:    'Connected',
  connecting:   'Connecting…',
  disconnected: 'Offline',
  unconfigured: 'Unconfigured',
};

const AdminView: React.FC<Props> = ({
  people,
  isDarkMode,
  dbStatus,
  dbMessage,
  t,
  onDeletePerson,
  onClearDatabase,
  onExport,
  onOpenReview,
  onBack,
}) => {
  const dark = isDarkMode;
  const pendingReviewCount = people.filter((p) => p.id_photo && p.verification_status !== 'verified').length;

  return (
    <div className={`min-h-screen p-8 ${dark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <Database className="text-indigo-500" /> {t('adminPanel')}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm opacity-60">
              <span>{t('totalRecords')}: {people.length}</span>
              <span className="opacity-40">•</span>
              <span className="flex items-center gap-1.5 text-xs font-bold">
                <span className={`w-2 h-2 rounded-full inline-block ${statusDotClass[dbStatus]}`} />
                Supabase: {statusLabel[dbStatus]}
              </span>
            </div>
            {dbMessage && (
              <p className="text-[10px] opacity-30 font-mono mt-1 max-w-xl truncate">{dbMessage}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenReview}
              className="relative flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              <FileText size={14} /> {t('reviewDocuments')}
              {pendingReviewCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                  {pendingReviewCount}
                </span>
              )}
            </button>
            <button
              onClick={onClearDatabase}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              <Trash2 size={14} /> Clear DB
            </button>
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-xs uppercase tracking-wider"
            >
              <Download size={14} /> {t('exportDb')}
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2.5 border rounded-xl font-bold hover:bg-white/10 transition-all text-xs uppercase tracking-wider"
            >
              <ArrowLeft size={14} /> {t('backToUser')}
            </button>
          </div>
        </header>

        {/* Table */}
        <div className={`rounded-2xl border overflow-hidden shadow-2xl ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <table className="w-full text-left">
            <thead className="bg-slate-500/10 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Identity</th>
                <th className="px-6 py-4">PESEL</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4 text-right">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-500/10">
              {people.length > 0 ? (
                people.map((p) => (
                  <tr key={p.id} className="hover:bg-indigo-500/5 transition-colors">
                    <td className="px-6 py-4 font-bold">
                      {p.firstName} {p.lastName}
                      <div className="text-[10px] opacity-40 font-normal mt-0.5">
                        {p.dob} · {p.nationality}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="bg-indigo-500/10 px-2 py-1 rounded text-indigo-500 font-bold text-xs">
                        {p.pesel}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        p.verification_status === 'verified'  ? 'bg-green-500/15 text-green-600'  :
                        p.verification_status === 'pending'   ? 'bg-amber-500/15 text-amber-600'  :
                        p.verification_status === 'rejected'  ? 'bg-red-500/15   text-red-600'    :
                        'bg-slate-500/10 text-slate-500'
                      }`}>
                        {p.verification_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right opacity-40 text-xs">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onDeletePerson(p.id)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center opacity-30 font-bold uppercase tracking-widest italic">
                    Database is empty
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
