import React from 'react';

interface BaseAuxiliarySidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const BaseAuxiliarySidebar: React.FC<BaseAuxiliarySidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  title,
  icon,
  children
}) => {
  return (
    <div 
      className={`bg-gray-800 border-r border-gray-700 transition-all duration-300 h-full overflow-visible flex-shrink-0 ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Título - Altura uniforme con header */}
      <div className="h-14 flex items-center justify-center border-b border-gray-700">
        {isExpanded ? (
          <h3 className="text-white font-medium">{title}</h3>
        ) : (
          <div className="w-8 h-8 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      
      {/* Contenido del sidebar */}
      {children}
    </div>
  );
};

export default BaseAuxiliarySidebar;
