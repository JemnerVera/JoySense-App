import React from 'react';
import TableSelector from '../TableSelector';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';

interface ParametersSidebarProps {
  selectedTable: string;
  onTableSelect: (table: string) => void;
  activeSubTab: string;
  onSubTabChange: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
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
    id: 'status' | 'insert' | 'update' | 'massive';
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
    },
    {
      id: 'massive',
      label: 'Masivo',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    }
  ];

  // Filtrar subpestañas según la tabla seleccionada
  const getSubTabs = () => {
    if (selectedTable === 'audit_log_umbral') {
      // Solo Estado para AUDIT LOG UMBRAL
      return allSubTabs.filter(tab => tab.id === 'status');
    } else if (selectedTable === 'usuario') {
      // Solo Estado y Actualizar para USUARIO (sin Crear)
      return allSubTabs.filter(tab => tab.id !== 'insert' && tab.id !== 'massive');
    } else if (selectedTable === 'sensor' || selectedTable === 'metricasensor' || selectedTable === 'usuarioperfil' || selectedTable === 'umbral') {
      // Para tablas de multiple insert: Estado, Crear, Actualizar y Masivo
      return allSubTabs;
    } else {
      // Para otras tablas: Estado, Crear, Actualizar (sin Masivo)
      return allSubTabs.filter(tab => tab.id !== 'massive');
    }
  };
  
  const subTabs = getSubTabs();

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

  const parametersIcon = (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  return (
    <BaseAuxiliarySidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title="Parámetros"
      icon={parametersIcon}
      color="orange"
    >
      {/* Selector de tabla */}
      {isExpanded && (
        <div className="p-4 border-b border-neutral-700">
          <TableSelector
            selectedTable={selectedTable}
            onTableSelect={onTableSelect}
          />
        </div>
      )}
      
      {/* Subpestañas de parámetros - Tactical Style */}
      <div className="py-4">
        <nav className="space-y-2">
          {subTabs.map((subTab) => {
            const isActive = activeSubTab === subTab.id;
            return (
              <button
                key={subTab.id}
                onClick={() => onSubTabChange(subTab.id)}
                className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                  isActive
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <div className="flex-shrink-0">
                  {subTab.icon}
                </div>
                {isExpanded && (
                  <span className="text-sm font-medium tracking-wider">{subTab.label.toUpperCase()}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default ParametersSidebar;
