import React, { useRef, useEffect } from 'react';

interface OverlayDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  icon: string;
  selectedValue?: string;
  placeholder: string;
  children: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
}

const OverlayDropdown: React.FC<OverlayDropdownProps> = ({
  isOpen,
  onToggle,
  title,
  icon,
  selectedValue,
  placeholder,
  children,
  className = "relative",
  buttonClassName = "w-full px-4 py-2 min-w-[120px] max-w-[200px] bg-gradient-to-r from-green-800 to-green-900 hover:from-green-900 hover:to-green-950 text-white rounded-lg font-medium text-sm flex items-center justify-between header-button depth-effect dashboard-filter transition-all duration-300 transform hover:scale-105",
  dropdownClassName = "w-full mt-2 rounded-lg dropdown-menu glass-effect max-h-64 overflow-y-auto"
}) => {
  console.log(`🚀 OverlayDropdown ${title} - Componente renderizado`);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug: Log cuando el dropdown se abre/cierra
  useEffect(() => {
    console.log(`OverlayDropdown ${title}: isOpen = ${isOpen}`);
    if (isOpen) {
      console.log(`OverlayDropdown ${title}: Overlay should be visible`);
    }
  }, [isOpen, title]);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onToggle();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <div className={className} ref={dropdownRef}>
      <button
        className={buttonClassName}
        onClick={onToggle}
      >
        <div className="flex items-center space-x-2">
          <span>{icon}</span>
          <span className={`truncate ${selectedValue ? 'text-white' : 'text-green-400'}`}>
            {selectedValue || placeholder}
          </span>
        </div>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Overlay semitransparente cuando está abierto */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 transition-opacity duration-300"
          style={{ zIndex: 9998 }}
          onClick={onToggle}
        />
      )}

      {/* Dropdown con efecto de overlay */}
      <div 
        className={`absolute transition-all duration-300 ease-in-out ${
          isOpen 
            ? 'opacity-100 transform translate-y-0 scale-100' 
            : 'opacity-0 transform -translate-y-2 scale-95 pointer-events-none'
        }`}
        style={{
          zIndex: 9999,
          top: '100%',
          left: 0,
          right: 0
        }}
      >
        <div className={dropdownClassName}>
          <div className="p-4">
            <h3 className="text-white text-sm font-medium mb-3">{icon} {title}</h3>
            <div className="space-y-2">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverlayDropdown;
