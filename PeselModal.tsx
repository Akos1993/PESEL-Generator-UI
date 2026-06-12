import React from 'react';
import { Fingerprint, X } from 'lucide-react';
import { TranslationKey } from './constants';

interface Props {
  explanation: string | null;
  isDarkMode: boolean;
  t: (key: TranslationKey) => string;
  onClose: () => void;
}

const PeselModal: React.FC<Props> = ({ explanation, isDarkMode, t, onClose }) => {
  if (!explanation) return null;
  const dark = isDarkMode;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-[2rem] border shadow-2xl overflow-hidden ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-8 py-5 border-b ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
          <h2 className="font-black flex items-center gap-2">
            <Fingerprint size={18} className="text-indigo-500" />
            {t('explainStructure')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-500/10 rounded-xl opacity-40 hover:opacity-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — renders Markdown-lite from getPeselExplanation */}
        <div className="p-8 overflow-y-auto max-h-[60vh] space-y-3">
          {explanation.split('\n').map((line, i) => {
            if (line.startsWith('### '))
              return <h3 key={i} className="font-black text-lg text-indigo-500">{line.slice(4)}</h3>;
            if (line.startsWith('**') && line.endsWith('**'))
              return <p key={i} className="font-black mt-3">{line.slice(2, -2)}</p>;
            if (/^\d+\./.test(line))
              return <p key={i} className="text-sm leading-relaxed pl-2 border-l-2 border-indigo-500/20">{line}</p>;
            if (line.startsWith('* '))
              return <p key={i} className="text-xs opacity-30 italic mt-4">{line.slice(2)}</p>;
            if (!line.trim()) return null;
            return <p key={i} className="text-sm opacity-70 leading-relaxed">{line}</p>;
          })}
        </div>
      </div>
    </div>
  );
};

export default PeselModal;
