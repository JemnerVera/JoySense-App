import React from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import ProtectedSubTabButton from '../ProtectedSubTabButton';

interface ParametersOperationsSidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  selectedTable: string;
  activeSubTab: 'status' | 'insert' | 'update' | 'massive';
  onSubTabChange: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  formData?: Record<string, any>;
  multipleData?: any[];
  massiveFormData?: Record<string, any>;
}

const ParametersOperationsSidebar: React.FC<ParametersOperationsSidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  selectedTable,
  activeSubTab,
  onSubTabChange,
  formData = {},
  multipleData = [],
  massiveFormData = {}
}) => {
  // Definir todas las operaciones disponibles
  const allOperations: Array<{
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

  // Icono para el sidebar de operaciones
  const operationsIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  // Filtrar operaciones según la tabla seleccionada
  const getAvailableOperations = () => {
    if (selectedTable === 'audit_log_umbral') {
      // Solo Estado para AUDIT LOG UMBRAL
      return allOperations.filter(op => op.id === 'status');
    } else if (selectedTable === 'usuario') {
      // Estado, Crear y Actualizar para USUARIO (sin Masivo)
      return allOperations.filter(op => op.id !== 'massive');
    } else if (selectedTable === 'correo') {
      // Solo Estado y Actualizar para CORREO (sin Crear ni Masivo)
      return allOperations.filter(op => op.id === 'status' || op.id === 'update');
    } else if (selectedTable === 'sensor' || selectedTable === 'metricasensor' || selectedTable === 'umbral') {
      // Para tablas de multiple insert: Estado, Crear, Actualizar y Masivo
      return allOperations;
    } else {
      // Para otras tablas: Estado, Crear, Actualizar (sin Masivo)
      return allOperations.filter(op => op.id !== 'massive');
    }
  };

  const availableOperations = getAvailableOperations();

  // Obtener el nombre de la tabla seleccionada para mostrar en el título
  const getTableDisplayName = (tableValue: string): string => {
    const tableNames: Record<string, string> = {
      'pais': 'País',
      'empresa': 'Empresa',
      'fundo': 'Fundo',
      'ubicacion': 'Ubicación',
      'localizacion': 'Localización',
      'entidad': 'Entidad',
      'tipo': 'Tipo',
      'nodo': 'Nodo',
      'sensor': 'Sensor',
      'metricasensor': 'Métrica Sensor',
      'metrica': 'Métrica',
      'umbral': 'Umbral',
      'perfilumbral': 'Perfil Umbral',
      'audit_log_umbral': 'Audit Log Umbral',
      'criticidad': 'Criticidad',
      'medio': 'Medio',
      'contacto': 'Contacto',
      'correo': 'Correo',
      'usuario': 'Usuario',
      'usuarioperfil': 'Usuario Perfil',
      'perfil': 'Perfil'
    };
    
    return tableNames[tableValue] || tableValue;
  };

  return (
    <BaseAuxiliarySidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={selectedTable ? `${getTableDisplayName(selectedTable)}` : "Operaciones"}
      icon={operationsIcon}
      color="orange"
      collapsedText="..."
    >
      
      {/* Operaciones disponibles - Tactical Style */}
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
          <nav className="space-y-2">
          {availableOperations.map((operation) => {
            const isActive = activeSubTab === operation.id;
            return (
              <ProtectedSubTabButton
                key={operation.id}
                targetTab={operation.id}
                currentTab={activeSubTab}
                selectedTable={selectedTable}
                formData={formData}
                multipleData={multipleData}
                massiveFormData={massiveFormData}
                onTabChange={onSubTabChange}
                className={`w-full flex items-center p-3 rounded transition-colors ${
                  isExpanded ? 'gap-3' : 'justify-center'
                } ${
                  isActive
                    ? "bg-orange-500 text-white"
                    : "text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-800"
                }`}
              >
                <div className="flex-shrink-0">
                  {operation.icon}
                </div>
                {isExpanded && (
                  <span className="text-sm font-medium tracking-wider">{operation.label.toUpperCase()}</span>
                )}
              </ProtectedSubTabButton>
            );
          })}
          </nav>
        </div>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default ParametersOperationsSidebar;
