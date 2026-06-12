import React from 'react';
import { Lock } from 'lucide-react';
import { TranslationKey } from '../constants';

interface Props {
  isDarkMode: boolean;
  t: (key: TranslationKey) => string;
  adminPass: string;
  setAdminPass: (v: string) => void;
  onLogin: (e: React.FormEvent) => void;
  onBack: () => void;
}

const LoginView: React.FC<Props> = ({
  isDarkMode,
  t,
  adminPass,
  setAdminPass,
  onLogin,
  onBack,
}) => {
  const dark = isDarkMode;

  return (
    <div className={`min-h-screen flex items-center justify-center p-8 ${dark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
      <div className={`w-full max-w-md p-10 rounded-[2.5rem] border shadow-2xl ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>

        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-5 rounded-[1.5rem] text-white mb-6 shadow-2xl shadow-indigo-500/30">
            <Lock size={40} />
          </div>
          <h2 className="text-3xl font-black tracking-tighter">{t('adminLogin')}</h2>
        </div>

        <form onSubmit={onLogin} className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase opacity-50 block mb-2 tracking-widest">
              {t('password')}
            </label>
            <input
              type="password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              className={`w-full px-5 py-4 rounded-2xl border outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all ${
                dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs"
          >
            {t('login')}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full text-xs font-bold opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest"
          >
            {t('backToUser')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginView;
