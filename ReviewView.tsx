import React from 'react';
import { FileText, ArrowLeft, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { Person } from './types';
import { TranslationKey } from './constants';

interface Props {
  people: Person[];
  isDarkMode: boolean;
  t: (key: TranslationKey) => string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onBack: () => void;
}

const isPdf = (url: string): boolean => url.toLowerCase().split('?')[0].endsWith('.pdf');

const ReviewView: React.FC<Props> = ({ people, isDarkMode, t, onApprove, onReject, onBack }) => {
  const dark = isDarkMode;

  // Documents uploaded to the bucket, awaiting a human verification decision.
  const queue = people.filter((p) => p.idphoto && p.verificationstatus !== 'verified');

  return (
    <div className={`min-h-screen p-8 ${dark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <FileText className="text-indigo-500" /> {t('reviewPanel')}
            </h1>
            <p className="text-sm opacity-60 mt-2">{t('reviewQueue')}: {queue.length}</p>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 border rounded-xl font-bold hover:bg-white/10 transition-all text-xs uppercase tracking-wider"
          >
            <ArrowLeft size={14} /> {t('backToAdmin')}
          </button>
        </header>

        {/* Queue */}
        {queue.length === 0 ? (
          <div className={`rounded-[2.5rem] border-2 border-dashed min-h-[300px] flex flex-col items-center justify-center p-12 text-center ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
            <FileText size={48} className="opacity-10 mb-4" />
            <p className="opacity-30 font-bold text-sm">{t('noPendingDocs')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queue.map((p) => (
              <div key={p.id} className={`rounded-[2rem] border overflow-hidden shadow-xl ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>

                {/* Document preview */}
                <a
                  href={p.idphoto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block aspect-[4/3] flex items-center justify-center overflow-hidden ${dark ? 'bg-slate-950' : 'bg-slate-100'}`}
                >
                  {p.idphoto && isPdf(p.idphoto) ? (
                    <div className="flex flex-col items-center gap-2 text-indigo-400">
                      <FileText size={40} />
                      <span className="text-xs font-black uppercase tracking-wider">PDF — {t('viewDocument')}</span>
                    </div>
                  ) : (
                    <img src={p.idphoto} alt={`${p.firstname} ${p.lastname}`} className="w-full h-full object-contain" />
                  )}
                </a>

                {/* Details */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black">{p.firstname} {p.lastname}</p>
                      <p className="text-xs opacity-50 mt-0.5">{p.nationality} · {p.dob}</p>
                    </div>
                    <code className="bg-indigo-500/10 px-2 py-1 rounded text-indigo-500 font-bold text-[10px] whitespace-nowrap">{p.pesel}</code>
                  </div>

                  <a
                    href={p.idphoto}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-400 transition-colors"
                  >
                    <ExternalLink size={12} /> {t('viewDocument')}
                  </a>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => onApprove(p.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all"
                    >
                      <CheckCircle2 size={14} /> {t('approve')}
                    </button>
                    <button
                      onClick={() => onReject(p.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-rose-700 transition-all"
                    >
                      <XCircle size={14} /> {t('reject')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ReviewView;
