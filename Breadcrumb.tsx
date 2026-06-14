import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors">
          <Home size={16} />
          <span className="hidden sm:inline">Home</span>
        </button>

        {items.map((item, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight size={16} className="text-gray-400" />
            {item.onClick ? (
              <button
                onClick={item.onClick}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-gray-700 font-medium">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default Breadcrumb;
