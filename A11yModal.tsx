import React from 'react';
import { Accessibility, X, Type, Eye } from 'lucide-react';
import { TranslationKey } from '../constants';

interface Props {
  isOpen: boolean;
  isDarkMode: boolean;
  t: (key: TranslationKey) => string;
  fontScale: number;
  setFontScale: (v: number) => void;
  isHighContrast: boolean;
  setIsHighContrast: (v: boolean) => void;
  onClose: () => void;
}

const A11yModal: React.FC<Props> = ({
  isOpen,
  isDarkMode,
  t,
  fontScale,
  setFontScale,
  isHighContrast,
  setIsHighContrast,
  onClose,
}) => {
  if (!isOpen) return null;
  const dark = isDarkMode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-[2rem] border shadow-2xl p-8 space-y-6 ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>

        <div className="flex items-center justify-between">
          <h2 className="font-black text-xl flex items-center gap-2">
            <Accessibility size={20} className="text-indigo-500" />
            {t('a11yOptions')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-500/10 rounded-xl opacity-50 hover:opacity-100 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Font scale slider */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
            <Type size={11} /> {t('textSize')}
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs opacity-40 font-bold">A</span>
            <input
              type="range"
              min={0.8}
              max={1.4}
              step={0.1}
              value={fontScale}
              onChange={(e) => setFontScale(Number(e.target.value))}
              className="flex-1 accent-indigo-500"
            />
            <span className="text-base font-bold opacity-40">A</span>
          </div>
        </div>

        {/* High contrast toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-sm flex items-center gap-2">
              <Eye size={14} /> {t('highContrast')}
            </p>
            <p className="text-xs opacity-40 mt-0.5">{t('highContrastDesc')}</p>
          </div>
          <button
            onClick={() => setIsHighContrast(!isHighContrast)}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
              isHighContrast ? 'bg-indigo-500' : dark ? 'bg-slate-700' : 'bg-slate-200'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${
                isHighContrast ? 'left-6' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all text-sm"
        >
          {t('applyChanges')}
        </button>
      </div>
    </div>
  );
};

export default A11yModal;
