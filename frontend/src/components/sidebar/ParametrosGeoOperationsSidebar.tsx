import React, { useMemo, useEffect } from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import ProtectedSubTabButton from '../ProtectedSubTabButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTableConfig } from '../../config/tables.config';
import { useUserPermissions } from '../../hooks/useUserPermissions';

interface ParametrosGeoOperationsSidebarProps {
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

const ParametrosGeoOperationsSidebar: React.FC<ParametrosGeoOperationsSidebarProps> = ({
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
  const { t } = useLanguage();
  const config = getTableConfig(selectedTable);

  // Obtener permisos del usuario para la tabla actual
  const { permissions, loading: permissionsLoading } = useUserPermissions({
    tableName: selectedTable,
    origenid: null, // Se determinará automáticamente
    fuenteid: null // Se determinará automáticamente
  });

  // Log cuando permissionsLoading cambia

  // Operaciones disponibles según la tabla
  const getAllOperations = (): Array<{
    id: 'status' | 'insert' | 'update' | 'massive';
    label: string;
    icon: React.ReactNode;
    requiredPermission?: 'ver' | 'insertar' | 'actualizar';
  }> => [
    {
      id: 'status',
      label: t('parameters.operations.status'),
      requiredPermission: 'ver',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'insert',
      label: t('parameters.operations.create'),
      requiredPermission: 'insertar',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      id: 'update',
      label: t('parameters.operations.update'),
      requiredPermission: 'actualizar',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      id: 'massive',
      label: t('parameters.operations.massive'),
      requiredPermission: 'insertar', // Operaciones masivas requieren insertar
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    }
  ];

  const allOperations = getAllOperations();

  // Filtrar operaciones según permisos de la tabla y permisos del usuario
  // IMPORTANTE: NO mostrar operaciones hasta que los permisos se hayan verificado
  const availableOperations = useMemo(() => {
    // Si aún se están cargando permisos, NO mostrar ninguna operación (previene mostrar elementos sin permiso)
    if (permissionsLoading) {
      return [];
    }
    
    const filtered = allOperations.filter(op => {
      // Verificar permisos de configuración de la tabla
      if (op.id === 'insert' && !config?.allowInsert) {
        return false;
      }
      if (op.id === 'update' && !config?.allowUpdate) {
        return false;
      }
      if (op.id === 'massive' && !config?.allowMassive) {
        return false;
      }
      
      // Verificar permisos del usuario (solo cuando ya se cargaron)
      if (op.requiredPermission === 'ver' && !permissions.puede_ver) {
        return false;
      }
      if (op.requiredPermission === 'insertar' && !permissions.puede_insertar) {
        return false;
      }
      if (op.requiredPermission === 'actualizar' && !permissions.puede_actualizar) {
        return false;
      }
      
      return true;
    });

    return filtered;
  }, [allOperations, config, permissions, permissionsLoading, selectedTable]);

  const parametrosGeoIcon = (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <BaseAuxiliarySidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title="OPERACIONES"
      icon={parametrosGeoIcon}
      color="orange"
      collapsedText="App"
    >
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
          {/* Mostrar loading state mientras se verifican permisos */}
          {permissionsLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          )}
          
          {/* Solo mostrar operaciones después de verificar permisos */}
          {!permissionsLoading && (
            <nav className="space-y-1">
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
                  onTabChange={(tab) => {
                    if (tab !== 'asignar') {
                      onSubTabChange(tab);
                    }
                  }}
                  className={`w-full flex items-center p-3 rounded transition-colors ${
                    isExpanded ? 'gap-3' : 'justify-center'
                  } ${
                    isActive
                      ? "bg-orange-500 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800"
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
          )}
        </div>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default ParametrosGeoOperationsSidebar;

