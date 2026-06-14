import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  number?: number;
}

interface AccordionProps {
  items: AccordionItemProps[];
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  defaultOpen = false,
  number,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden hover:border-gray-300 transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          {number !== undefined && (
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
              {number}
            </span>
          )}
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <ChevronDown
          size={20}
          className={`flex-shrink-0 text-gray-600 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="px-6 py-4 bg-white border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};

const Accordion: React.FC<AccordionProps> = ({ items }) => {
  return (
    <div>
      {items.map((item, idx) => (
        <AccordionItem
          key={idx}
          title={item.title}
          defaultOpen={item.defaultOpen}
          number={item.number}
        >
          {item.children}
        </AccordionItem>
      ))}
    </div>
  );
};

export default Accordion;
export { AccordionItem };
