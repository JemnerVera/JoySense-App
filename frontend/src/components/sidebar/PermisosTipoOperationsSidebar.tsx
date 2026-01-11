/**
 * PermisosTipoOperationsSidebar - Sidebar Auxiliar 3 para PERMISOS
 * Muestra ESTADO, CREAR, ASIGNAR (por ORIGEN)
 * Filtra pestañas según permisos del usuario: ESTADO=puede_ver, CREAR=puede_insertar
 */

import React, { useMemo } from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUserPermissions } from '../../hooks/useUserPermissions';

interface PermisosTipoOperationsSidebarProps {
  selectedTipo: string;
  activeSubTab: 'status' | 'insert' | 'asignar';
  onSubTabChange: (subTab: 'status' | 'insert' | 'asignar') => void;
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  formData?: Record<string, any>;
  multipleData?: any[];
  massiveFormData?: Record<string, any>;
  selectedTable?: string; // Tabla actual para verificar permisos
}

const PermisosTipoOperationsSidebar: React.FC<PermisosTipoOperationsSidebarProps> = ({
  selectedTipo,
  activeSubTab,
  onSubTabChange,
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  formData = {},
  multipleData = [],
  massiveFormData = {},
  selectedTable = 'permiso' // Por defecto 'permiso' para la tabla de permisos
}) => {
  const { t } = useLanguage();

  // Obtener permisos del usuario para la tabla actual
  // El hook funciona con cualquier tabla (geografía o configuración)
  // Si selectedTable es 'permiso' o no está definido, verificamos permisos sobre 'permiso'
  // Si selectedTable es otra tabla (pais, empresa, etc.), verificamos permisos sobre esa tabla
  const { permissions, loading: permissionsLoading } = useUserPermissions({
    tableName: selectedTable || 'permiso',
    origenid: null, // Se determinará automáticamente según el tipo de tabla
    fuenteid: null // Se determinará automáticamente según el nombre de la tabla
  });

  // Determinar el título según el tipo seleccionado
  const getTitle = () => {
    if (selectedTipo === 'permisos-geo') {
      return 'PERMISOS GEO';
    } else if (selectedTipo === 'permisos-conf') {
      return 'PERMISOS CONF';
    }
    return 'PERMISOS';
  };

  // Operaciones disponibles: ESTADO, CREAR, ASIGNAR
  const allOperations = [
    {
      id: 'status' as const,
      label: t('subtabs.status') || 'ESTADO',
      requiredPermission: 'ver' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'insert' as const,
      label: t('subtabs.insert') || 'CREAR',
      requiredPermission: 'insertar' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      id: 'asignar' as const,
      label: 'ASIGNAR',
      requiredPermission: null, // ASIGNAR siempre está disponible (es para administradores)
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    }
  ];

  // Filtrar operaciones según permisos del usuario
  // IMPORTANTE: NO mostrar operaciones hasta que los permisos se hayan verificado
  const operations = useMemo(() => {
    // Si aún se están cargando permisos, NO mostrar ninguna operación (previene mostrar elementos sin permiso)
    if (permissionsLoading) {
      return [];
    }
    
    const filtered = allOperations.filter(op => {
      const operationId = op.id;
      
      // ASIGNAR siempre está disponible
      if (operationId === 'asignar') {
        return true;
      }
      
      // Verificar permiso requerido (solo cuando ya se cargaron)
      if (op.requiredPermission === 'ver') {
        return permissions.puede_ver;
      }
      if (op.requiredPermission === 'insertar') {
        return permissions.puede_insertar;
      }
      
      // Si no tiene permiso requerido, está permitida
      return true;
    });

    return filtered;
  }, [permissions, permissionsLoading, allOperations, selectedTable, selectedTipo]);

  const operationsIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  return (
    <BaseAuxiliarySidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={getTitle()}
      icon={operationsIcon}
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
              {operations.map((operation) => {
              const isActive = activeSubTab === operation.id;
              return (
                <button
                  key={operation.id}
                  type="button"
                  onClick={() => {
                    // Cambiar directamente el subtab sin protección de cambios (flujo especial de PERMISOS)
                    onSubTabChange(operation.id);
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
                </button>
              );
              })}
            </nav>
          )}
        </div>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default PermisosTipoOperationsSidebar;

