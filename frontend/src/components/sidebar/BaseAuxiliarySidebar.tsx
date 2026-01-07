import React from 'react';

interface BaseAuxiliarySidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  color?: 'orange' | 'green' | 'blue' | 'gray' | 'red' | 'purple' | 'brown' | 'cyan';
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
      className={`bg-gray-100 dark:bg-neutral-900 border-r border-gray-300 dark:border-neutral-700 transition-all duration-300 h-full flex flex-col flex-shrink-0 ${
        isExpanded ? 'w-56' : 'w-14'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Título - Tactical Style */}
      {/* Altura alineada con el header del sidebar principal (h-16) para consistencia visual */}
      <div className="h-16 flex items-center justify-center border-b border-gray-300 dark:border-neutral-700 px-2 flex-shrink-0">
        {isExpanded ? (
          <h3 className={`font-bold text-xs tracking-wider text-center ${
            color === 'green' ? 'text-green-500' :
            color === 'blue' ? 'text-blue-500' :
            color === 'cyan' ? 'text-cyan-500' :
            color === 'gray' ? 'text-gray-500' :
            color === 'red' ? 'text-red-500' :
            color === 'purple' ? 'text-purple-500' :
            color === 'brown' ? 'text-amber-700' :
            'text-orange-500'
          }`}>{title.toUpperCase()}</h3>
        ) : (
          <div className="flex items-center justify-center text-gray-800 dark:text-white">
            {collapsedText ? (
              <div className="text-sm font-bold text-center leading-tight">{collapsedText}</div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="text-[10px] font-bold tracking-wider">Joy</div>
                <div className="text-[10px] font-bold tracking-wider">Sense</div>
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
