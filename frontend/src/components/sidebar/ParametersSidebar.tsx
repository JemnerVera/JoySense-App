import React from 'react';
import TableSelector from '../TableSelector';

interface ParametersSidebarProps {
  selectedTable: string;
  onTableSelect: (table: string) => void;
  activeSubTab: string;
  onSubTabChange: (subTab: 'status' | 'insert' | 'update') => void;
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const ParametersSidebar: React.FC<ParametersSidebarProps> = ({
  selectedTable,
  onTableSelect,
  activeSubTab,
  onSubTabChange,
  isExpanded,
  onMouseEnter,
  onMouseLeave
}) => {
  // Definir todas las subpestañas disponibles
  const allSubTabs: Array<{
    id: 'status' | 'insert' | 'update';
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'status',
      label: 'Estado',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'insert',
      label: 'Crear',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      id: 'update',
      label: 'Actualizar',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    }
  ];

  // Todas las subpestañas están disponibles para todas las tablas
  const subTabs = allSubTabs;

  // Debug para verificar el estado del sidebar
  console.log('🔍 ParametersSidebar renderizado:', {
    selectedTable,
    activeSubTab,
    isExpanded,
    mouseHandlers: {
      onMouseEnter: typeof onMouseEnter,
      onMouseLeave: typeof onMouseLeave
    }
  });

  return (
    <div 
      className={`bg-gray-800 border-r border-gray-700 transition-all duration-300 h-full ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Título - Altura uniforme con header */}
      <div className="h-14 flex items-center justify-center border-b border-gray-700">
        {isExpanded && (
          <h3 className="text-white font-medium">Parámetros</h3>
        )}
      </div>
      
      {/* Selector de tabla */}
      {isExpanded && (
        <div className="p-4 border-b border-gray-700">
          <TableSelector
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
          />
        </div>
      )}
      
      {/* Subpestañas de parámetros */}
      <div className="py-4">
        {subTabs.map((subTab) => {
          const isActive = activeSubTab === subTab.id;
          return (
                        <button
                          key={subTab.id}
                          onClick={() => onSubTabChange(subTab.id)}
                          className={`w-full flex items-center transition-all duration-200 ${
                            isExpanded ? 'px-4 py-3 text-left' : 'px-4 py-3 justify-center'
                          } ${
                            isActive 
                              ? 'bg-blue-600 text-white' 
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
              <div className="flex-shrink-0">
                {subTab.icon}
              </div>
              {isExpanded && (
                <span className="ml-3 font-medium">{subTab.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ParametersSidebar;
