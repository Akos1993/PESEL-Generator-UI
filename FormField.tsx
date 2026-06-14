import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  isDarkMode: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  type,
  value,
  required,
  placeholder,
  onChange,
  isDarkMode,
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border rounded outline-none focus:ring-2 transition-all ${
        isDarkMode
          ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500'
          : 'bg-white border-gray-300 focus:ring-blue-500'
      }`}
    />
  </div>
);

export default FormField;
