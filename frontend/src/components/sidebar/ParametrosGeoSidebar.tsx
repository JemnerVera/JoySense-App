import React, { useState, useEffect, useMemo } from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import ProtectedParameterButton from '../ProtectedParameterButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { JoySenseService } from '../../services/backend-api';
import { getParametrosGeoTables } from '../../config/tables.config';

interface ParametrosGeoSidebarProps {
  selectedTable: string;
  onTableSelect: (table: string) => void;
  activeSubTab: string;
  onSubTabChange: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  formData?: Record<string, any>;
  multipleData?: any[];
  massiveFormData?: Record<string, any>;
}

const ParametrosGeoSidebar: React.FC<ParametrosGeoSidebarProps> = ({
  selectedTable,
  onTableSelect,
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
  const { user } = useAuth();

  // Obtener las tablas de parámetros geo
  const allParametrosGeoTables = getParametrosGeoTables();
  
  // Obtener nombres de tablas para verificar permisos
  const tableNames = allParametrosGeoTables.map(table => table.name);
  
  // Estado para almacenar permisos individuales de cada tabla
  const [tablePermissionsMap, setTablePermissionsMap] = useState<Record<string, boolean>>({});
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  
  // Verificar permisos individuales para cada tabla
  useEffect(() => {
    const checkTablePermissions = async () => {
      if (!user) {
        setLoadingPermissions(false);
        return;
      }
      
      const permissions: Record<string, boolean> = {};
      
      // Verificar permisos para cada tabla
      await Promise.all(
        tableNames.map(async (tableName) => {
          try {
            const perms = await JoySenseService.getUserPermissions(tableName);
            permissions[tableName] = perms?.puede_ver === true;
          } catch (error) {
            console.error(`[ParametrosGeoSidebar] Error verificando permisos para ${tableName}:`, error);
            permissions[tableName] = false;
          }
        })
      );
      
      setTablePermissionsMap(permissions);
      setLoadingPermissions(false);
    };
    
    checkTablePermissions();
  }, [user, tableNames.join(',')]);
  
  // Filtrar tablas basándose en permisos
  const parametrosGeoTables = useMemo(() => {
    // Si aún se están cargando permisos, mostrar todas las tablas (evita parpadeo)
    if (loadingPermissions) {
      return allParametrosGeoTables;
    }
    
    // Filtrar solo las tablas que el usuario puede ver
    return allParametrosGeoTables.filter(table => {
      return tablePermissionsMap[table.name] === true;
    });
  }, [allParametrosGeoTables, tablePermissionsMap, loadingPermissions]);

  // Mapear nombres de tablas a nombres de visualización
  const getTableDisplayName = (tableName: string): string => {
    const displayNameMap: Record<string, string> = {
      'pais': 'PAIS',
      'empresa': 'EMPRESA',
      'fundo': 'FUNDO',
      'ubicacion': 'UBICACION',
      'nodo': 'NODO',
      'localizacion': 'LOCALIZACION',
      'asociacion': 'EQUIVALENCIA'
    };
    return displayNameMap[tableName] || tableName.toUpperCase();
  };

  // Mapear tablas a formato de sidebar con iconos
  const getTableIcon = (tableName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'pais': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'empresa': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      'fundo': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      'ubicacion': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      'nodo': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0v.75m-3-.75v.75m3 0h3m-3 0h-3m0 0H8.111m0 0H5.611m3 0v-.75m0 .75v-.75m0 0H5.611m0 0a1.5 1.5 0 100-3m3 3a1.5 1.5 0 100-3m0 3h3m-3 0h3m0 0v.75m0-.75v.75m0 0h3m-3 0h-3m3 0a1.5 1.5 0 100-3m0 3a1.5 1.5 0 100-3m0 3v.75m0 0H8.111m3 0H8.111" />
        </svg>
      ),
      'localizacion': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      'asociacion': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    };
    return iconMap[tableName] || (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

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
      title="PARAMETROS GEO"
      icon={parametrosGeoIcon}
      color="orange"
      collapsedText="Sense"
    >
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
          <nav className="space-y-1">
            {parametrosGeoTables.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-neutral-400">
                <p className="text-sm font-mono">No hay tablas disponibles</p>
              </div>
            ) : (
              parametrosGeoTables.map((table) => {
                // Solo marcar como activa si selectedTable no está vacío
                // Esto evita que se marque como activa cuando activeTab es exactamente 'configuracion-parametros-geo'
                const isActive = selectedTable !== '' && selectedTable === table.name;
                return (
                  <ProtectedParameterButton
                    key={table.name}
                    targetTable={table.name}
                    currentTable={selectedTable}
                    activeSubTab={activeSubTab as 'status' | 'insert' | 'update' | 'massive'}
                    formData={formData}
                    multipleData={multipleData}
                    massiveFormData={massiveFormData}
                    onTableChange={onTableSelect}
                    className={`w-full flex items-center p-3 rounded transition-colors ${
                      isExpanded ? 'gap-3' : 'justify-center'
                    } ${
                      isActive
                        ? "bg-orange-500 text-white"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {getTableIcon(table.name)}
                    </div>
                    {isExpanded && (
                      <span className="text-sm font-medium tracking-wider">{getTableDisplayName(table.name)}</span>
                    )}
                  </ProtectedParameterButton>
                );
              })
            )}
          </nav>
        </div>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default ParametrosGeoSidebar;

