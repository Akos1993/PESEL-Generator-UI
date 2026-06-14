import React from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { Language } from './types';
import { LANGUAGE_CONFIG } from './constants';

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onMenuToggle: () => void;
  menuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  setIsDarkMode,
  lang,
  setLang,
  onMenuToggle,
  menuOpen,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left: Logo and branding */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-700"
            title="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded text-white text-lg font-bold">
              🦅
            </div>
            <div className="hidden sm:block text-sm">
              <div className="font-bold text-gray-900">gov.pl</div>
              <div className="text-xs text-gray-600">Serwis Rzeczypospolitej Polskiej</div>
            </div>
          </div>
        </div>

        {/* Right: Language switcher, theme toggle, mObywatel */}
        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
            {(['PL', 'UKR', 'ENG'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 text-xs font-semibold transition-all rounded ${
                  lang === l
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={`Switch to ${l}`}
              >
                <span className="mr-1">{LANGUAGE_CONFIG[l].flag}</span>
                {l}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
            title="Toggle dark mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* mObywatel button */}
          <button className="hidden md:flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold text-sm transition-colors">
            👤 mObywatel
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
