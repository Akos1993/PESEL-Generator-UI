import React from 'react';
import { Home, FileText, Lock, HelpCircle } from 'lucide-react';

interface SidebarProps {
  activeView: 'generator' | 'mydata' | 'help';
  onNavigate: (view: 'generator' | 'mydata' | 'help') => void;
  onAdminClick: () => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, onAdminClick, isOpen }) => {
  const menuItems = [
    { id: 'generator', label: 'Strona główna', icon: Home, desc: 'Generator PESEL' },
    { id: 'mydata', label: 'Moja data', icon: FileText, desc: 'Moje wnioski' },
    { id: 'help', label: 'Pomoc', icon: HelpCircle, desc: 'Dokumentacja' },
  ] as const;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 lg:hidden z-40"
          onClick={() => {
            // Menu toggle handled by parent
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative lg:translate-x-0 top-[57px] lg:top-0 left-0 h-[calc(100vh-57px)] lg:h-screen w-64 bg-gray-50 border-r border-gray-200 transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                item.id === activeView
                  ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} className="mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm">{item.label}</div>
                <div className="text-xs text-gray-600">{item.desc}</div>
              </div>
            </button>
          ))}

          {/* Admin button */}
          <button
            onClick={onAdminClick}
            className="w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-colors text-left text-gray-700 hover:bg-gray-100 mt-6 border-t pt-4"
          >
            <Lock size={20} className="mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm">Panel Administratora</div>
              <div className="text-xs text-gray-600">Zaloguj się</div>
            </div>
          </button>
        </nav>

        {/* Footer info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <p className="text-xs text-gray-500 leading-relaxed">
            Serwis Rzeczypospolitej Polskiej dla cudzoziemców ubiegających się o numer PESEL.
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
