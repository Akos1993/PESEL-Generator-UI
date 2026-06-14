import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumb from './Breadcrumb';
import { Language, View } from './types';
import { TranslationKey } from './constants';

interface MainLayoutProps {
  lang: Language;
  setLang: (lang: Language) => void;
  currentView: View;
  onViewChange: (view: View) => void;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  lang,
  setLang,
  currentView,
  onViewChange,
  breadcrumbs = [],
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mapViewToSidebarView = (view: View): 'user' | 'admin' | 'review' => {
    if (view === 'login') return 'user';
    if (view === 'review') return 'review';
    return 'user';
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <Header
        lang={lang}
        setLang={setLang}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        menuOpen={sidebarOpen}
      />

      {/* Breadcrumb */}
      {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeView={mapViewToSidebarView(currentView)}
          onNavigate={(view) => {
            onViewChange(view);
            setSidebarOpen(false);
          }}
          isOpen={sidebarOpen}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-white text-gray-900">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
