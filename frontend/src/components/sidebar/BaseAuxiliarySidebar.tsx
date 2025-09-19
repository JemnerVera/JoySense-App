import React from 'react';

interface BaseAuxiliarySidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  color?: 'orange' | 'green' | 'blue';
  collapsedText?: string; // Texto personalizado cuando está colapsado
}

const BaseAuxiliarySidebar: React.FC<BaseAuxiliarySidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  title,
  icon,
  children,
  color = 'orange',
  collapsedText
}) => {
  return (
    <div 
      className={`bg-neutral-900 border-r border-neutral-700 transition-all duration-300 h-full flex flex-col flex-shrink-0 ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Título - Tactical Style */}
      <div className="h-16 flex items-center justify-center border-b border-neutral-700 p-4 flex-shrink-0">
        {isExpanded ? (
          <h3 className={`font-bold text-sm tracking-wider ${
            color === 'green' ? 'text-green-500' :
            color === 'blue' ? 'text-blue-500' :
            'text-orange-500'
          }`}>{title.toUpperCase()}</h3>
        ) : (
          <div className="flex items-center justify-center text-white">
            {collapsedText ? (
              <div className="text-lg font-bold">{collapsedText}</div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="text-xs font-bold tracking-wider">Joy</div>
                <div className="text-xs font-bold tracking-wider">Sense</div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Contenido del sidebar - Área scrolleable */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default BaseAuxiliarySidebar;
