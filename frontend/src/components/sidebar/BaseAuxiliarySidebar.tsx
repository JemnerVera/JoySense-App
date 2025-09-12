import React from 'react';

interface BaseAuxiliarySidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  color?: 'orange' | 'green' | 'blue';
}

const BaseAuxiliarySidebar: React.FC<BaseAuxiliarySidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  title,
  icon,
  children,
  color = 'orange'
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
          <h3 className={`font-bold text-sm tracking-wider ${
            color === 'green' ? 'text-green-500' :
            color === 'blue' ? 'text-blue-500' :
            'text-orange-500'
          }`}>{title.toUpperCase()}</h3>
        ) : (
          <div className="flex flex-col items-center justify-center text-white">
            <div className="text-xs font-bold tracking-wider">Joy</div>
            <div className="text-xs font-bold tracking-wider">Sense</div>
          </div>
        )}
      </div>
      
      {/* Contenido del sidebar */}
      {children}
    </div>
  );
};

export default BaseAuxiliarySidebar;
