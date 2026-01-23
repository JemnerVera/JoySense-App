/**
 * PermisosTipoSidebar - Sidebar Auxiliar 2 para PERMISOS
 * Muestra PERMISOS GEO y PERMISOS CONF
 */

import React, { useMemo } from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import ProtectedParameterButton from '../ProtectedParameterButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSectionPermissions } from '../../hooks/useSectionPermissions';

interface PermisosTipoSidebarProps {
  selectedTipo: string;
  onTipoSelect: (tipo: string) => void;
  activeSubTab: 'status' | 'insert' | 'update' | 'asignar' | 'massive';
  onSubTabChange: (subTab: 'status' | 'insert' | 'update' | 'asignar' | 'massive') => void;
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  formData?: Record<string, any>;
  multipleData?: any[];
  massiveFormData?: Record<string, any>;
}

const PermisosTipoSidebar: React.FC<PermisosTipoSidebarProps> = ({
  selectedTipo,
  onTipoSelect,
  activeSubTab,
  onSubTabChange,
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  formData = {},
  multipleData = [],
  massiveFormData = {}
}) => {
  const { t } = useLanguage();

  // Tablas de geografía (para PERMISOS GEO)
  const geografiaTables = ['pais', 'empresa', 'fundo', 'ubicacion', 'nodo', /* 'localizacion' */];
  
  // Tablas de configuración (para PERMISOS CONF) - excluyendo geografía
  const configuracionTables = ['tipo', 'metrica', 'sensor', 'metricasensor', 'criticidad', 'umbral', 'regla'];

  // Verificar permisos para cada tipo
  const permisosGeoPermissions = useSectionPermissions({ tableNames: geografiaTables });
  const permisosConfPermissions = useSectionPermissions({ tableNames: configuracionTables });

  // Tipos de permisos disponibles (filtrados por permisos del usuario)
  const allPermisosTipos = [
    {
      id: 'permisos-geo',
      name: 'permisos-geo',
      displayName: 'GEOGRÁFICOS',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      hasAccess: permisosGeoPermissions.hasAccess,
      loading: permisosGeoPermissions.loading
    },
    {
      id: 'permisos-conf',
      name: 'permisos-conf',
      displayName: 'CONFIGURABLES',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      hasAccess: permisosConfPermissions.hasAccess,
      loading: permisosConfPermissions.loading
    }
  ];

  // Filtrar tipos basándose en permisos
  const permisosTipos = useMemo(() => {
    return allPermisosTipos.filter(tipo => {
      // Si aún se están cargando permisos, mostrar el tipo (evita parpadeo)
      if (tipo.loading) return true;
      // Mostrar solo si tiene acceso
      return tipo.hasAccess;
    });
  }, [
    permisosGeoPermissions.hasAccess,
    permisosGeoPermissions.loading,
    permisosConfPermissions.hasAccess,
    permisosConfPermissions.loading
  ]);

  const permisosIcon = (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  return (
    <BaseAuxiliarySidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title="PERMISOS"
      icon={permisosIcon}
      color="orange"
      collapsedText="Sense"
    >
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
          <nav className="space-y-1">
            {permisosTipos.map((tipo) => {
              const isActive = selectedTipo === tipo.id;
              return (
                <ProtectedParameterButton
                  key={tipo.id}
                  targetTable={tipo.id}
                  currentTable={selectedTipo}
                  activeSubTab={(activeSubTab === 'asignar' ? 'status' : activeSubTab) as 'status' | 'insert' | 'update' | 'massive'}
                  formData={formData}
                  multipleData={multipleData}
                  massiveFormData={massiveFormData}
                  onTableChange={(tipoId) => {
                    onTipoSelect(tipoId);
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
                    {tipo.icon}
                  </div>
                  {isExpanded && (
                    <span className="text-sm font-medium tracking-wider">{tipo.displayName}</span>
                  )}
                </ProtectedParameterButton>
              );
            })}
          </nav>
        </div>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default PermisosTipoSidebar;

