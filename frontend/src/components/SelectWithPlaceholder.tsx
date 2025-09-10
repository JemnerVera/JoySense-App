import React, { useState, useRef, useEffect } from 'react';

interface SelectWithPlaceholderProps {
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  options: Array<{ value: any; label: string }>;
  placeholder: string;
  className?: string;
}

const SelectWithPlaceholder: React.FC<SelectWithPlaceholderProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className = "w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white font-mono"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (optionValue: any) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(option => 
    (value && value !== 0) && (
      option.value === value || 
      option.value === value?.toString() || 
      option.value?.toString() === value?.toString()
    )
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} cursor-pointer flex justify-between items-center`}
      >
        <span className={value && value !== 0 ? 'text-white' : 'text-neutral-400'} style={{fontFamily: 'monospace'}}>
          {selectedOption ? selectedOption.label.toUpperCase() : placeholder.toUpperCase()}
        </span>
        <span className="text-neutral-400">▼</span>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              className="px-3 py-2 hover:bg-neutral-800 cursor-pointer text-white font-mono tracking-wider"
            >
              {option.label.toUpperCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectWithPlaceholder;
