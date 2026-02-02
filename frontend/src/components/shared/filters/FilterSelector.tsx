import React from 'react';

interface FilterSelectorProps {
  label: string;
  icon: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string | number; name: string }>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const FilterSelector: React.FC<FilterSelectorProps> = ({
  label,
  icon,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = 'Seleccionar...',
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-gray-300 text-sm font-medium">
        {icon} {label}:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-w-[150px] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterSelector;
