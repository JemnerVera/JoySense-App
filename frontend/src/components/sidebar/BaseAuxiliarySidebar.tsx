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
      className={`bg-neutral-900 border-r border-neutral-700 transition-all duration-300 h-full overflow-visible flex-shrink-0 ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Título - Tactical Style */}
      <div className="h-16 flex items-center justify-center border-b border-neutral-700 p-4">
        {isExpanded ? (
          <h3 className="text-orange-500 font-bold text-sm tracking-wider">{title.toUpperCase()}</h3>
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
