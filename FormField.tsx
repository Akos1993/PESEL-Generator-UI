import React from 'react';
import { Volume2, Mic, MicOff } from 'lucide-react';

export interface FormFieldProps {
  label: string;
  name: string;
  type: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onTTS: () => void;
  isAudioLoading: boolean;
  onDictate: () => void;
  isDictating: boolean;
  isDarkMode: boolean;
  readOutLoudLabel: string;
  dictateLabel: string;
  listeningLabel: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  type,
  value,
  required,
  placeholder,
  onChange,
  onTTS,
  isAudioLoading,
  onDictate,
  isDictating,
  isDarkMode,
  readOutLoudLabel,
  dictateLabel,
  listeningLabel,
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-[10px] font-black uppercase opacity-40 block tracking-widest">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          title={readOutLoudLabel}
          onClick={onTTS}
          className={`p-1.5 rounded-lg transition-all ${
            isAudioLoading
              ? 'text-indigo-500 animate-pulse bg-indigo-500/10'
              : 'hover:bg-slate-500/10 opacity-40 hover:opacity-100'
          }`}
        >
          <Volume2 size={12} />
        </button>
        <button
          type="button"
          title={dictateLabel}
          onClick={onDictate}
          className={`p-1.5 rounded-lg transition-all ${
            isDictating
              ? 'text-red-500 animate-bounce bg-red-500/10'
              : 'hover:bg-slate-500/10 opacity-40 hover:opacity-100'
          }`}
        >
          {isDictating ? <MicOff size={12} /> : <Mic size={12} />}
        </button>
      </div>
    </div>

    <div className="relative">
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-5 py-3.5 rounded-2xl border outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${
          isDarkMode
            ? 'bg-slate-800 border-slate-700 text-white'
            : 'bg-slate-50 border-slate-200'
        }`}
      />
      {isDictating && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          {listeningLabel}
        </div>
      )}
    </div>
  </div>
);

export default FormField;
