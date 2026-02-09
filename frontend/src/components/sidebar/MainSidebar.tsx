import React, { useState, useMemo, useRef, useEffect } from 'react';
import SidebarFilters from '../SidebarFilters';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMenuPermissions } from '../../hooks/useMenuPermissions';
import { slideToggle } from '../../utils/sidebarAnimations';
import { getDispositivosTables, getUsuariosTables, getParametrosGeoTables, getNotificacionesTables, type TableConfig } from '../../config/tables.config';
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { getTableConfig } from '../../config/tables.config';
import '../../styles/sidebar-template.css';

interface MainSidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onTabChange: (tab: string) => void;
  activeTab: string;
  authToken: string;
  selectedTable?: string;
  activeSubTab?: string;
  dashboardSubTab?: 'mediciones' | 'mapeo' | 'status-nodos' | 'status-alertas' | 'metrica' | 'umbrales';
}

// Interfaces para niveles anidados
interface SubMenuLevel4 {
  id: 'status' | 'insert' | 'update' | 'massive' | 'asignar' | string;
  label: string;
  icon: React.ReactNode;
  subMenus?: SubMenuLevel4[]; // Nivel 5: Para submenús anidados (ej: operaciones bajo variantes de REGLA)
  hasOperations?: boolean; // Indica si este nivel tiene operaciones
}

interface SubMenuLevel3 {
  id: string;
  label: string;
  icon: React.ReactNode;
  subMenus?: SubMenuLevel4[]; // Nivel 4: Operaciones
  hasOperations?: boolean; // Indica si este nivel 3 tiene operaciones (nivel 4)
}

interface SubMenuLevel2 {
  id: string;
  label: string;
  icon: React.ReactNode;
  subMenus?: SubMenuLevel3[]; // Nivel 3: Tablas/opciones
}

const MainSidebar: React.FC<MainSidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  onTabChange,
  activeTab,
  authToken,
  selectedTable,
  activeSubTab,
  dashboardSubTab
}) => {
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<Set<string>>(new Set());
  const [openSubMenusLevel3, setOpenSubMenusLevel3] = useState<Set<string>>(new Set());
  const subMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const subMenuRefsLevel3 = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const prevMainTabRef = useRef<string | null>(null);
  
  // Cargar permisos del nuevo sistema de menú
  const { menuAccess, loading: menuLoading, hasAccess } = useMenuPermissions();

  // Estado de carga general mientras se verifican permisos
  const isLoadingPermissions = menuLoading;

  // Función para verificar si tiene acceso a un menú padre (como CONFIGURACIÓN)
  // Retorna true si tiene acceso directo O a cualquiera de sus submenús
  const hasAccessToMenu = (menuName: string): boolean => {
    // Buscar si existe un menú con ese nombre y tiene acceso
    const hasDirectAccess = menuAccess.some(item => 
      item.menu === menuName && item.tiene_acceso
    );
    
    if (hasDirectAccess) return true;
    
    // Si no tiene acceso directo, buscar en submenús
    const parentMenu = menuAccess.find(m => m.menu === menuName);
    if (parentMenu) {
      const hasChildAccess = menuAccess.some(item => 
        item.padreid === parentMenu.menuid && item.tiene_acceso
      );
      return hasChildAccess;
    }
    
    return false;
  };

  // Función helper para crear operaciones (nivel 4)
  const createOperations = (tableName: string): SubMenuLevel4[] => {
    const operations: SubMenuLevel4[] = [
      {
        id: 'status',
        label: t('parameters.operations.status'),
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      },
      {
        id: 'insert',
        label: t('parameters.operations.create'),
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )
      },
      {
        id: 'update',
        label: t('parameters.operations.update'),
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )
      },
      {
        id: 'massive',
        label: t('parameters.operations.massive'),
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      }
    ];

    // Para permisos, agregar operación 'asignar'
    if (tableName.startsWith('permisos-')) {
      operations.push({
        id: 'asignar',
        label: 'ASIGNAR',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        )
      });
    }

    return operations;
  };

  // Función helper para crear icono de tabla basado en nombre
  const getTableIcon = (tableName: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      'tipo': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      'metrica': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      'sensor': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      'metricasensor': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      'pais': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'empresa': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      'fundo': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      'usuario': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      'criticidad': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      'umbral': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      'regla': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      'entidad': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      'entidad_localizacion': (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    };

    return iconMap[tableName] || (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  // Función helper para crear niveles 3 desde tablas de configuración
  const createTablesLevel3 = (tables: TableConfig[], parentId: string): SubMenuLevel3[] => {
    return tables.map(table => ({
      id: table.name,
      label: table.displayName.toUpperCase(),
      icon: getTableIcon(table.name),
      hasOperations: true,
      subMenus: createOperations(`${parentId}-${table.name}`)
    } as SubMenuLevel3));
  };

  // Obtener tablas dinámicamente (solo cuando se necesiten)
  const dispositivosTables = useMemo(() => getDispositivosTables(), []);
  const usuariosTables = useMemo(() => getUsuariosTables(), []);
  const parametrosGeoTables = useMemo(() => getParametrosGeoTables(), []);
  const notificacionesTables = useMemo(() => getNotificacionesTables(), []);

  // Construir el array de pestañas de forma inmutable con sub-menús
  const mainTabs = useMemo(() => {
    const tabs = [
      {
        id: 'reportes',
        label: t('tabs.reports'),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        color: 'blue',
        requiresPermission: true,
        requiredMenu: 'REPORTES',
        subMenus: [
          {
            id: 'dashboard',
            label: t('subtabs.dashboard'),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
            subMenus: [
              {
                id: 'mediciones',
                label: 'MEDICIONES',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )
              },
              {
                id: 'mapeo',
                label: 'MAPEO DE NODOS',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                )
              },
              {
                id: 'status-nodos',
                label: 'STATUS DE NODOS',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                id: 'status-alertas',
                label: 'STATUS DE ALERTAS',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )
              },
              {
                id: 'metrica',
                label: 'MÉTRICA POR LOCALIZACIÓN',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )
              },
              {
                id: 'umbrales',
                label: 'UMBRALES POR LOCALIZACIÓN',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )
              }
            ]
          },
          {
            id: 'historial',
            label: 'HISTORIAL',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            subMenus: [
              {
                id: 'alertas',
                label: t('subtabs.alerts'),
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )
              },
              {
                id: 'mensajes',
                label: t('subtabs.messages'),
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )
              }
            ]
          }
        ]
      },
      {
        id: 'agrupacion',
        label: 'AGRUPACIÓN',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        ),
        color: 'green',
        requiresPermission: true,
        requiredMenu: 'AGRUPACIÓN',
        subMenus: [
          {
            id: 'entidad',
            label: 'CARPETA',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            ),
            hasOperations: true,
            subMenus: createOperations('agrupacion-entidad')
          },
          {
            id: 'entidad_localizacion',
            label: 'LOCALIZACIÓN POR CARPETA',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
            hasOperations: true,
            subMenus: createOperations('agrupacion-entidad_localizacion')
          }
        ]
      },
      {
        id: 'configuracion',
        label: 'CONFIGURACIÓN',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        color: 'orange',
        requiresPermission: true,
        requiredMenu: 'CONFIGURACIÓN',
        subMenus: [
          {
            id: 'dispositivos',
            label: 'DISPOSITIVOS',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            ),
            subMenus: createTablesLevel3(dispositivosTables, 'configuracion-dispositivos')
          },
          {
            id: 'usuarios',
            label: 'USUARIOS',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ),
            subMenus: createTablesLevel3(usuariosTables, 'configuracion-usuarios')
          },
          {
            id: 'parametros-geo',
            label: 'PARÁMETROS GEO',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            subMenus: createTablesLevel3(parametrosGeoTables, 'configuracion-parametros-geo')
          },
          {
            id: 'notificaciones',
            label: 'NOTIFICACIONES',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            ),
            subMenus: notificacionesTables.map(table => {
              // Para REGLA, mostrar un grupo con las variantes
              if (table.name === 'regla') {
                return {
                  id: 'regla',
                  label: 'REGLAS',
                  icon: getTableIcon(table.name),
                  subMenus: [
                    {
                      id: 'regla',
                      label: 'REGLA (REGLA & UMBRAL)',
                      icon: getTableIcon('regla'),
                      hasOperations: true,
                      subMenus: createOperations('configuracion-notificaciones-regla-regla')
                    },
                    {
                      id: 'regla_perfil',
                      label: 'REGLA PERFIL',
                      icon: getTableIcon('regla'),
                      hasOperations: true,
                      subMenus: createOperations('configuracion-notificaciones-regla-regla_perfil')
                    },
                    {
                      id: 'regla_objeto',
                      label: 'REGLA OBJETO',
                      icon: getTableIcon('regla'),
                      hasOperations: true,
                      subMenus: createOperations('configuracion-notificaciones-regla-regla_objeto')
                    }
                  ]
                } as SubMenuLevel2;
              }
              // Para CRITICIDAD y UMBRAL, tienen operaciones directas (nivel 4)
              return {
                id: table.name,
                label: table.displayName.toUpperCase(),
                icon: getTableIcon(table.name),
                hasOperations: true,
                subMenus: createOperations(`configuracion-notificaciones-${table.name}`)
              } as SubMenuLevel2;
            })
          },
          {
            id: 'permisos',
            label: 'PERMISOS',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ),
            subMenus: [
              {
                id: 'permisos-geo',
                label: 'PERMISOS GEO',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                hasOperations: true,
                subMenus: createOperations('configuracion-permisos-permisos-geo')
              },
              {
                id: 'permisos-conf',
                label: 'PERMISOS CONF',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                hasOperations: true,
                subMenus: createOperations('configuracion-permisos-permisos-conf')
              }
            ]
          },
          {
            id: 'reportes-administrador',
            label: 'REPORTES ADMINISTRADOR',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )
          }
        ]
      },
      {
        id: 'ajustes',
        label: 'AJUSTES',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        ),
        color: 'gray',
        requiresPermission: true,
        requiredMenu: 'AJUSTES',
        subMenus: [
          {
            id: 'basicas',
            label: 'AJUSTES GENERALES',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )
          }
        ]
      }
    ];

    // Si aún se están cargando permisos, no mostrar ninguna pestaña
    if (isLoadingPermissions) {
      return [];
    }

    // Filtrar pestañas basándose en permisos
    const filteredTabs = tabs.filter(tab => {
      if (!tab.requiresPermission) {
        return true;
      }

      // Si requiere permiso para AGRUPACIÓN: acceso al padre o a cualquier hijo (nombres exactos como en joysense.menu)
      if (tab.id === 'agrupacion') {
        return (
          hasAccessToMenu('AGRUPACIÓN') ||
          hasAccess('CARPETA') ||
          hasAccess('LOCALIZACIÓN POR CARPETA') ||
          hasAccess('ENTIDAD') ||
          hasAccess('ENTIDAD LOCALIZACION')
        );
      }

      // Si requiere permiso para 'CONFIGURACIÓN', verificar acceso
      if (tab.id === 'configuracion') {
        return hasAccessToMenu('CONFIGURACIÓN');
      }

      // Si requiere permiso para 'REPORTES', verificar acceso
      if (tab.id === 'reportes') {
        return hasAccessToMenu('REPORTES');
      }

      // Si requiere permiso para 'AJUSTES', verificar acceso
      if (tab.id === 'ajustes') {
        return hasAccessToMenu('AJUSTES');
      }

      return false;
    });

    return filteredTabs;
  }, [t, hasAccess, hasAccessToMenu, isLoadingPermissions, menuAccess]);

  // Función para cerrar todos los menús abiertos
  const closeAllMenus = async () => {
    console.log('🔴 closeAllMenus - menús abiertos antes de cerrar:', {
      openSubMenus: Array.from(openSubMenus),
      openSubMenusLevel3: Array.from(openSubMenusLevel3)
    });
    
    const otherOpenMenus = Array.from(openSubMenus);
    for (const otherMenuId of otherOpenMenus) {
      const otherElement = subMenuRefs.current[otherMenuId];
      if (otherElement) {
        console.log('  ❌ Cerrando menú nivel 2:', otherMenuId);
        await slideToggle(otherElement);
      }
    }
    
    const otherLevel3Menus = Array.from(openSubMenusLevel3);
    for (const otherMenuId of otherLevel3Menus) {
      const otherElement = subMenuRefsLevel3.current[otherMenuId];
      if (otherElement) {
        console.log('  ❌ Cerrando menú nivel 3:', otherMenuId);
        await slideToggle(otherElement);
      }
    }
    
    setOpenSubMenus(new Set());
    setOpenSubMenusLevel3(new Set());
    console.log('🟢 closeAllMenus completado');
  };

  // Función para manejar el click en un elemento del menú con sub-menús
  const handleMenuClick = async (tabId: string, hasSubMenus: boolean) => {
    console.log('🖱️ handleMenuClick:', { tabId, hasSubMenus });
    
    if (!hasSubMenus) {
      // Si no tiene sub-menús, navegar directamente
      // Cerrar todos los sub-menús abiertos
      console.log('  → Cerrando todos los menús porque es pestaña principal sin submenús');
      await closeAllMenus();
      console.log('  → Cambiando tab a:', tabId);
      onTabChange(tabId);
      return;
    }

    // Si tiene sub-menús, expandir/colapsar
    console.log('  → Pestaña con submenús, cerrando los demás y abriendo este');
    const subMenuElement = subMenuRefs.current[tabId];
    if (!subMenuElement) {
      console.log('  ⚠️ No se encontró elemento de submenú para:', tabId);
      onTabChange(tabId);
      return;
    }

    const isOpen = openSubMenus.has(tabId);
    
    console.log('  → Estado actual: isOpen =', isOpen);
    console.log('  → Cambiando tab a:', tabId);
    
    // Cambiar la pestaña activa
    onTabChange(tabId);
    
    // Cerrar otros sub-menús abiertos (comportamiento "open-current-submenu")
    if (!isOpen) {
      console.log('  → Abriendo este menú por primera vez, cerrando los otros');
      const otherOpenMenus = Array.from(openSubMenus);
      for (const otherMenuId of otherOpenMenus) {
        const otherElement = subMenuRefs.current[otherMenuId];
        if (otherElement) {
          console.log('    ❌ Cerrando otro menú:', otherMenuId);
          await slideToggle(otherElement);
        }
      }
      
      console.log('  → Abriendo el menú actual');
      await slideToggle(subMenuElement);
      
      const newOpenMenus = new Set([tabId]);
      setOpenSubMenus(newOpenMenus);
      setOpenSubMenusLevel3(new Set());
      console.log('  → Estado actualizado:', { openSubMenus: Array.from(newOpenMenus) });
    } else {
      console.log('  → Menú ya estaba abierto, cerrándolo');
      await slideToggle(subMenuElement);
      setOpenSubMenus(new Set());
      setOpenSubMenusLevel3(new Set());
      console.log('  → Menú cerrado');
    }
  };

  // Función para manejar el click en un sub-elemento (nivel 2)
  const handleSubMenuClick = (parentId: string, subMenuId: string) => {
    const fullTabId = `${parentId}-${subMenuId}`;
    onTabChange(fullTabId);
  };

  // Función para manejar nivel 2 con colapsado
  const handleLevel2MenuClick = async (parentId: string, subMenuId: string, hasLevel3Menus: boolean) => {
    console.log('🖱️ handleLevel2MenuClick:', { parentId, subMenuId, hasLevel3Menus });
    
    const subMenuKey = `${parentId}-${subMenuId}`;
    
    if (!hasLevel3Menus) {
      // Si no tiene nivel 3, solo navegar
      console.log('  → Sin nivel 3, navegando a:', subMenuKey);
      onTabChange(subMenuKey);
      return;
    }

    // Si tiene nivel 3, expandir/colapsar
    const subMenuElement = subMenuRefsLevel3.current[subMenuKey];
    if (!subMenuElement) {
      console.log('  ⚠️ No se encontró elemento para:', subMenuKey);
      onTabChange(subMenuKey);
      return;
    }

    const isOpen = openSubMenusLevel3.has(subMenuKey);
    
    console.log('  → Estado actual: isOpen =', isOpen);
    console.log('  → Navegando a:', subMenuKey);
    
    // Cambiar la pestaña activa
    onTabChange(subMenuKey);
    
    // Cerrar otros sub-menús nivel 2 del MISMO PADRE (otros hermanos)
    if (!isOpen) {
      console.log('  → Abriendo este menú por primera vez, cerrando los otros');
      // Filtrar todos los menús de nivel 2 abiertos que pertenecen al mismo padre
      const otherOpenMenus = Array.from(openSubMenusLevel3).filter(key => {
        // Solo incluir elementos de nivel 2 (parentId-subMenuId, sin un tercer componente)
        const parts = key.split('-');
        return parts.length === 2 && key.startsWith(`${parentId}-`) && key !== subMenuKey;
      });
      
      for (const otherMenuKey of otherOpenMenus) {
        const otherElement = subMenuRefsLevel3.current[otherMenuKey];
        if (otherElement) {
          console.log('    ❌ Cerrando otro menú nivel 2:', otherMenuKey);
          await slideToggle(otherElement);
        }
      }
      
      console.log('  → Abriendo el menú actual');
      await slideToggle(subMenuElement);
      
      const newOpenMenus = new Set(openSubMenusLevel3);
      otherOpenMenus.forEach(key => newOpenMenus.delete(key));
      newOpenMenus.add(subMenuKey);
      setOpenSubMenusLevel3(newOpenMenus);
      console.log('  → Estado actualizado:', { openSubMenusLevel3: Array.from(newOpenMenus) });
    } else {
      console.log('  → Menú ya estaba abierto, cerrándolo');
      await slideToggle(subMenuElement);
      const newOpenMenus = new Set(openSubMenusLevel3);
      newOpenMenus.delete(subMenuKey);
      setOpenSubMenusLevel3(newOpenMenus);
      console.log('  → Menú cerrado');
    }
  };

  // Función para manejar el click en nivel 3 (tablas)
  const handleSubMenuLevel3Click = async (parentId: string, level2Id: string, level3Id: string, hasSubMenus: boolean) => {
    const fullTabId = `${parentId}-${level2Id}-${level3Id}`;
    
    console.log(`[LEVEL3-CLICK] Clicked: parentId=${parentId}, level2Id=${level2Id}, level3Id=${level3Id}, hasSubMenus=${hasSubMenus}`);
    console.log(`[LEVEL3-CLICK] fullTabId=${fullTabId}`);
    console.log(`[LEVEL3-CLICK] Current openSubMenusLevel3:`, Array.from(openSubMenusLevel3));
    
    if (!hasSubMenus) {
      // Si no tiene operaciones (nivel 4), navegar directamente
      onTabChange(fullTabId);
      return;
    }

    // Si tiene operaciones (nivel 4), expandir/colapsar
    const subMenuKey = `${parentId}-${level2Id}-${level3Id}`;
    const subMenuElement = subMenuRefsLevel3.current[subMenuKey];
    console.log(`[LEVEL3-CLICK] subMenuKey=${subMenuKey}, element found=${!!subMenuElement}`);
    
    if (!subMenuElement) {
      // Si no existe el elemento pero tiene sub-menús, intentar navegar de todas formas
      console.log(`[LEVEL3-CLICK] ⚠️ Element not found, navigating instead`);
      onTabChange(fullTabId);
      return;
    }

    const isOpen = openSubMenusLevel3.has(subMenuKey);
    console.log(`[LEVEL3-CLICK] Current state: isOpen=${isOpen}`);
    
    // Cerrar otros sub-menús nivel 3 abiertos del mismo nivel 2
    if (!isOpen) {
      // CORRECCIÓN: Buscar hermanos de nivel 3 (otros items que tengan el mismo parentId-level2Id)
      // pero excluir los elementos de nivel 2 (que son parentId-level2Id sin más guiones después)
      const level3OnlyId = level3Id.split('-')[0]; // Tomar solo la primera parte antes de cualquier guión
      const level2Prefix = `${parentId}-${level2Id}`; // Este es el prefijo para nivel 2
      const level3Prefix = `${parentId}-${level2Id}-${level3OnlyId}`; // Este es el prefijo para nivel 3
      
      const otherOpenMenus = Array.from(openSubMenusLevel3).filter(key => {
        // Excluir si es un elemento de nivel 2 (parentId-level2Id exactamente)
        if (key === level2Prefix) {
          console.log(`[LEVEL3-CLICK] Ignorando elemento de nivel 2: ${key}`);
          return false;
        }
        
        // Buscar hermanos: elementos que comienzan con parentId-level2Id-XX (nivel 3 o 4)
        // pero que NO sean el actual (subMenuKey)
        const isBrother = key.startsWith(`${level2Prefix}-`) && key !== subMenuKey;
        
        if (isBrother) {
          const keyParts = key.split('-');
          const keyLevel3 = keyParts[2]; // La tercera parte es el nivel 3 ID
          console.log(`[LEVEL3-CLICK] Candidato hermano: ${key}, nivel3=${keyLevel3}, currentLevel3=${level3OnlyId}`);
        }
        
        return isBrother;
      });
      
      console.log(`[LEVEL3-CLICK] level2Prefix=${level2Prefix}, level3OnlyId=${level3OnlyId}`);
      console.log(`[LEVEL3-CLICK] Hermanos a cerrar:`, otherOpenMenus);
      
      // Luego animar después de actualizar el estado
      for (const otherMenuKey of otherOpenMenus) {
        const otherElement = subMenuRefsLevel3.current[otherMenuKey];
        if (otherElement) {
          console.log(`[LEVEL3-CLICK] ✓ Cerrando hermano: ${otherMenuKey}`);
          await slideToggle(otherElement);
        }
      }
      
      // Actualizar estado: cerrar hermanos y abrir el actual ATOMICAMENTE
      setOpenSubMenusLevel3(prev => {
        const newSet = new Set(prev);
        otherOpenMenus.forEach(key => newSet.delete(key));
        newSet.add(subMenuKey);
        console.log(`[LEVEL3-CLICK] Estado actualizado (con hermanos cerrados):`, Array.from(newSet));
        return newSet;
      });
    } else {
      // Si ya estaba abierto, solo cerrarlo
      console.log(`[LEVEL3-CLICK] Toggle actual: ${subMenuKey} (ya estaba abierto)`);
      await slideToggle(subMenuElement);
      
      setOpenSubMenusLevel3(prev => {
        const newSet = new Set(prev);
        newSet.delete(subMenuKey);
        console.log(`[LEVEL3-CLICK] ✓ Cerrado: ${subMenuKey}`);
        return newSet;
      });
    }
    
    // Si no estaba abierto, mostrar animación de apertura
    if (!isOpen) {
      console.log(`[LEVEL3-CLICK] Toggle actual: ${subMenuKey} (abriendo)`);
      // La animación ya se hizo arriba, solo actualizamos el estado
    }
  };

  // Función para manejar el click en nivel 4 (operaciones)
  const handleSubMenuLevel4Click = (parentId: string, level2Id: string, level3Id: string, level4Id: string) => {
    // Construir la ruta completa: parentId-level2Id-level3Id-level4Id
    const fullTabId = `${parentId}-${level2Id}-${level3Id}-${level4Id}`;
    onTabChange(fullTabId);
  };

  // Efecto para mantener abierto el sub-menú del activeTab (todos los niveles)
  useEffect(() => {
    if (!activeTab || !isExpanded) return;

    const parts = activeTab.split('-');
    const mainTabId = parts[0];
    const tab = mainTabs.find(t => t.id === mainTabId);
    
    console.log('📂 Efecto de apertura:', {
      activeTab,
      mainTabId,
      partsLength: parts.length,
      tieneSubMenus: tab?.subMenus?.length || 0,
      openSubMenus: Array.from(openSubMenus)
    });
    
    // Actualizar la referencia de la pestaña anterior (para el próximo cambio)
    prevMainTabRef.current = mainTabId;
    
    // Solo hacer algo si la tab actual tiene submenús que abrir
    if (tab && tab.subMenus && tab.subMenus.length > 0 && parts.length > 1) {
      const shouldBeOpen = activeTab.startsWith(`${mainTabId}-`);
      
      console.log('  → Debería abrir submenús:', { shouldBeOpen, yaEstaAbierto: openSubMenus.has(mainTabId) });
      
      // Nivel 2: Abrir si hay al menos nivel 2
      if (shouldBeOpen && !openSubMenus.has(mainTabId)) {
        const subMenuElement = subMenuRefs.current[mainTabId];
        if (subMenuElement) {
          const computedStyle = window.getComputedStyle(subMenuElement);
          if (computedStyle.display === 'none' || computedStyle.height === '0px') {
            slideToggle(subMenuElement).then(() => {
              setOpenSubMenus(prev => {
                const newSet = new Set(prev);
                newSet.add(mainTabId);
                return newSet;
              });
            });
          } else {
            setOpenSubMenus(prev => {
              const newSet = new Set(prev);
              newSet.add(mainTabId);
              return newSet;
            });
          }
        }
      }

      // Nivel 3: Abrir si hay nivel 3 o 4
      if (parts.length >= 3) {
        const level2Id = parts[1];
        const level3Key = `${mainTabId}-${level2Id}`;
        const subMenus = tab.subMenus as SubMenuLevel2[] | undefined;
        const subMenu = subMenus?.find((sm: SubMenuLevel2) => sm.id === level2Id);
        
        if (subMenu && subMenu.subMenus && subMenu.subMenus.length > 0) {
          // Cerrar otros hermanos de nivel 3 del mismo nivel 2
          const otherLevel3Menus = Array.from(openSubMenusLevel3).filter(key => 
            key.startsWith(`${mainTabId}-${level2Id}-`) && key !== level3Key
          );
          
          console.log(`[EFFECT Level3] Preparando: level3Key=${level3Key}, otherMenus=${otherLevel3Menus.join(',')}`);
          
          // Cerrar hermanos
          for (const otherMenuKey of otherLevel3Menus) {
            const otherElement = subMenuRefsLevel3.current[otherMenuKey];
            if (otherElement && window.getComputedStyle(otherElement).display !== 'none') {
              console.log(`[EFFECT Level3] ✓ Cerrando: ${otherMenuKey}`);
              slideToggle(otherElement);
            }
          }
          
          // Actualizar estado para cerrar hermanos
          if (otherLevel3Menus.length > 0) {
            setOpenSubMenusLevel3(prev => {
              const newSet = new Set(prev);
              otherLevel3Menus.forEach(key => newSet.delete(key));
              return newSet;
            });
          }
          
          if (!openSubMenusLevel3.has(level3Key)) {
            const level3Element = subMenuRefsLevel3.current[level3Key];
            if (level3Element) {
              const computedStyle = window.getComputedStyle(level3Element);
              if (computedStyle.display === 'none' || computedStyle.height === '0px') {
                slideToggle(level3Element).then(() => {
                  setOpenSubMenusLevel3(prev => {
                    const newSet = new Set(prev);
                    newSet.add(level3Key);
                    return newSet;
                  });
                });
              } else {
                setOpenSubMenusLevel3(prev => {
                  const newSet = new Set(prev);
                  newSet.add(level3Key);
                  return newSet;
                });
              }
            }
          }

          // Nivel 4: Abrir si hay nivel 4
          if (parts.length >= 4) {
            const level3Id = parts[2];
            const level4Key = `${mainTabId}-${level2Id}-${level3Id}`;
            const level3Menu = (subMenu.subMenus as SubMenuLevel3[] | undefined)?.find((sm) => sm.id === level3Id);
            
            console.log('[MainSidebar Level4] CHECK', { 
              activeTab, 
              parts: parts.join('-'), 
              level3Id, 
              level4Key, 
              hasLevel3Menu: !!level3Menu, 
              subMenusLength: level3Menu?.subMenus?.length,
              willOpen: level3Menu && level3Menu.subMenus && level3Menu.subMenus.length > 0
            });
            
            if (level3Menu && level3Menu.subMenus && level3Menu.subMenus.length > 0) {
              if (!openSubMenusLevel3.has(level4Key)) {
                const level4Element = subMenuRefsLevel3.current[level4Key];
                if (level4Element) {
                  const computedStyle = window.getComputedStyle(level4Element);
                  if (computedStyle.display === 'none' || computedStyle.height === '0px') {
                    slideToggle(level4Element).then(() => {
                      setOpenSubMenusLevel3(prev => {
                        const newSet = new Set(prev);
                        newSet.add(level4Key);
                        return newSet;
                      });
                    });
                  } else {
                    setOpenSubMenusLevel3(prev => {
                      const newSet = new Set(prev);
                      newSet.add(level4Key);
                      return newSet;
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isExpanded]);

  const getTabColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-400';
      case 'blue': return 'text-blue-400';
      case 'orange': return 'text-orange-400';
      case 'red': return 'text-red-400';
      case 'gray': return 'text-gray-400';
      case 'purple': return 'text-purple-400';
      case 'brown': return 'text-amber-700';
      case 'cyan': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  const getActiveTabColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'blue': return 'bg-blue-600';
      case 'orange': return 'bg-orange-500';
      case 'red': return 'bg-red-500';
      case 'gray': return 'bg-gray-600';
      case 'purple': return 'bg-purple-600';
      case 'brown': return 'bg-amber-800';
      case 'cyan': return 'bg-cyan-600';
      default: return 'bg-gray-600';
    }
  };

  // Colores de la plantilla en Tailwind
  const TEMPLATE_COLORS = {
    textColor: '#b3b8d4',
    secondaryTextColor: '#dee2ec',
    bgColor: '#0c1e35',
    secondaryBgColor: '#0b1a2c',
    borderColor: 'rgba(83, 93, 125, 0.3)',
  };

  return (
    <aside 
      className={`sidebar h-full w-full overflow-x-hidden transition-all duration-300 ${
        isCollapsed ? 'collapsed' : ''
      }`}
      style={{
        backgroundColor: TEMPLATE_COLORS.bgColor,
        color: TEMPLATE_COLORS.textColor,
        borderRight: `1px solid ${TEMPLATE_COLORS.borderColor}`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Área de detección invisible extendida cuando está colapsado */}
      {!isExpanded && (
        <>
          <div 
            className="absolute -right-4 top-0 bottom-0 w-8 z-50 cursor-pointer"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{ pointerEvents: 'auto' }}
          />
          <div 
            className="absolute -left-4 top-0 bottom-0 w-8 z-50 cursor-pointer"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{ pointerEvents: 'auto' }}
          />
        </>
      )}

      <div className="sidebar-layout h-full flex flex-col relative z-20">
        {/* Sidebar Header - Logo */}
        <div 
          className="sidebar-header flex items-center px-5 flex-shrink-0 border-b transition-all duration-300"
          style={{
            height: '64px',
            minHeight: '64px',
            borderBottomColor: TEMPLATE_COLORS.borderColor,
          }}
        >
          {isExpanded ? (
            <div className="flex items-center space-x-3">
              <img src="/Logo - icono.png" alt="JoySense" className="w-8 h-8" />
              <img 
                src="/Logo - texto.png" 
                alt="JoySense" 
                className="h-6 w-auto overflow-hidden text-ellipsis whitespace-nowrap"
              />
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <img src="/Logo - icono.png" alt="JoySense" className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Sidebar Content - Filters and Menu */}
        <div 
          className="sidebar-content flex-grow overflow-y-auto transition-all duration-300"
          style={{ padding: '10px 0' }}
        >
          {/* Global Filters - Mostrar siempre arriba del menú */}
          {isExpanded && !isLoadingPermissions && (
            <>
              <div 
                className="filters-section px-5 py-4 transition-all duration-300"
                style={{ 
                  borderBottom: `1px solid ${TEMPLATE_COLORS.borderColor}`,
                }}
              >
                <SidebarFilters authToken={authToken} />
              </div>
              {/* División visual entre filtros y menú */}
              <div 
                style={{ 
                  height: '1px',
                  backgroundColor: TEMPLATE_COLORS.borderColor,
                  margin: '8px 0',
                  opacity: 0.5
                }}
              />
            </>
          )}

          {/* Main Menu */}
          {isLoadingPermissions ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: TEMPLATE_COLORS.secondaryTextColor }}></div>
            </div>
          ) : (
            <nav className="menu open-current-submenu">
              <ul className="list-none p-0 m-0">
                {mainTabs.map((tab) => {
                  const isActive = activeTab === tab.id || activeTab.startsWith(tab.id + '-');
                  const hasSubMenus = tab.subMenus && tab.subMenus.length > 0;
                  const isSubMenuOpen = openSubMenus.has(tab.id);
                  
                  return (
                    <li 
                      key={tab.id}
                      className={`menu-item transition-colors ${isActive ? 'active' : ''} ${isExpanded && hasSubMenus ? 'sub-menu' : ''} ${isSubMenuOpen ? 'open' : ''}`}
                    >
                      <button
                        onClick={() => {
                          handleMenuClick(tab.id, hasSubMenus || false);
                        }}
                        className="flex items-center h-12 px-5 cursor-pointer transition-all duration-300 w-full text-left border-0 bg-transparent relative"
                        style={{ color: isActive ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = TEMPLATE_COLORS.secondaryTextColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = isActive ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor;
                        }}
                      >
                        <span 
                          className="menu-icon flex-shrink-0 flex items-center justify-center"
                          style={{
                            fontSize: '1.2rem',
                            width: '35px',
                            minWidth: '35px',
                            height: '35px',
                            marginRight: '10px',
                            borderRadius: '2px',
                            transition: 'color 0.3s',
                          }}
                        >
                          {tab.icon}
                        </span>
                        {isExpanded && (
                          <>
                            <span 
                              className="menu-title flex-grow overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-300"
                              style={{ fontSize: '0.9rem' }}
                            >
                              {tab.label.toUpperCase()}
                            </span>
                            {hasSubMenus && (
                              <span 
                                className="sub-menu-indicator"
                                style={{
                                  width: '5px',
                                  height: '5px',
                                  borderRight: '2px solid currentcolor',
                                  borderBottom: '2px solid currentcolor',
                                  transform: isSubMenuOpen ? 'rotate(45deg)' : 'rotate(-45deg)',
                                  transition: 'transform 0.3s',
                                  marginLeft: 'auto',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </>
                        )}
                      </button>
                      {hasSubMenus && (
                        <div 
                          ref={(el) => {
                            subMenuRefs.current[tab.id] = el;
                          }}
                          className="sub-menu-list"
                          style={{
                            display: isSubMenuOpen ? 'block' : 'none',
                            paddingLeft: '20px',
                            backgroundColor: TEMPLATE_COLORS.secondaryBgColor,
                          }}
                        >
                          <ul className="list-none p-0 m-0">
                            {tab.subMenus!.map((subMenu) => {
                              const subMenuActiveTab = `${tab.id}-${subMenu.id}`;
                              const isSubActive = activeTab === subMenuActiveTab || activeTab.startsWith(subMenuActiveTab + '-');
                              const hasLevel3Menus = subMenu.subMenus && subMenu.subMenus.length > 0;
                              const subMenuKey = `${tab.id}-${subMenu.id}`;
                              const isLevel3Open = openSubMenusLevel3.has(subMenuKey);
                              
                              return (
                                <li 
                                  key={subMenu.id}
                                  className={`menu-item ${isSubActive ? 'active' : ''} ${isExpanded && hasLevel3Menus ? 'sub-menu' : ''} ${isLevel3Open ? 'open' : ''}`}
                                >
                                  <button
                                    onClick={() => handleLevel2MenuClick(tab.id, subMenu.id, hasLevel3Menus || false)}
                                    className="flex items-center h-12 px-5 cursor-pointer transition-all duration-300 w-full text-left border-0 bg-transparent"
                                    style={{ color: isSubActive ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = TEMPLATE_COLORS.secondaryTextColor;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = isSubActive ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor;
                                    }}
                                  >
                                    <span 
                                      className="menu-icon flex-shrink-0 flex items-center justify-center"
                                      style={{
                                        fontSize: '1rem',
                                        width: '30px',
                                        minWidth: '30px',
                                        height: '30px',
                                        marginRight: '10px',
                                        borderRadius: '2px',
                                        transition: 'color 0.3s',
                                      }}
                                    >
                                      {subMenu.icon}
                                    </span>
                                    {isExpanded && (
                                      <>
                                        <span 
                                          className="menu-title flex-grow overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-300"
                                          style={{ fontSize: '0.85rem' }}
                                        >
                                          {subMenu.label.toUpperCase()}
                                        </span>
                                        {hasLevel3Menus && (
                                          <span 
                                            className="sub-menu-indicator"
                                            style={{
                                              width: '5px',
                                              height: '5px',
                                              borderRight: '2px solid currentcolor',
                                              borderBottom: '2px solid currentcolor',
                                              transform: isLevel3Open ? 'rotate(45deg)' : 'rotate(-45deg)',
                                              transition: 'transform 0.3s',
                                              marginLeft: 'auto',
                                              flexShrink: 0,
                                            }}
                                          />
                                        )}
                                      </>
                                    )}
                                  </button>
                                  {hasLevel3Menus && (
                                    <div 
                                      ref={(el) => {
                                        subMenuRefsLevel3.current[subMenuKey] = el;
                                      }}
                                      className="sub-menu-list"
                                      style={{
                                        display: isLevel3Open ? 'block' : 'none',
                                        paddingLeft: '20px',
                                        backgroundColor: TEMPLATE_COLORS.secondaryBgColor,
                                      }}
                                    >
                                      <ul className="list-none p-0 m-0">
                                        {(subMenu.subMenus as SubMenuLevel3[])!.map((level3Menu: SubMenuLevel3) => {
                                          const level3ActiveTab = `${tab.id}-${subMenu.id}-${level3Menu.id}`;
                                          const isLevel3Active = activeTab === level3ActiveTab || activeTab.startsWith(level3ActiveTab + '-');
                                          const hasLevel4Menus = level3Menu.subMenus && level3Menu.subMenus.length > 0;
                                          const level3MenuKey = `${tab.id}-${subMenu.id}-${level3Menu.id}`;
                                          const isLevel4Open = openSubMenusLevel3.has(level3MenuKey);
                                          
                                          return (
                                            <li 
                                              key={level3Menu.id}
                                              className={`menu-item ${isLevel3Active ? 'active' : ''} ${isExpanded && hasLevel4Menus ? 'sub-menu' : ''} ${isLevel4Open ? 'open' : ''}`}
                                            >
                                              <button
                                                onClick={() => {
                                                  if (hasLevel4Menus) {
                                                    handleSubMenuLevel3Click(tab.id, subMenu.id, level3Menu.id, true);
                                                  } else {
                                                    handleSubMenuLevel3Click(tab.id, subMenu.id, level3Menu.id, false);
                                                  }
                                                }}
                                                className="flex items-center h-10 px-5 cursor-pointer transition-all duration-300 w-full text-left border-0 bg-transparent"
                                                style={{ color: isLevel3Active ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor }}
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.color = TEMPLATE_COLORS.secondaryTextColor;
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.color = isLevel3Active ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor;
                                                }}
                                              >
                                                <span 
                                                  className="menu-icon flex-shrink-0 flex items-center justify-center"
                                                  style={{
                                                    fontSize: '0.9rem',
                                                    width: '25px',
                                                    minWidth: '25px',
                                                    height: '25px',
                                                    marginRight: '10px',
                                                    borderRadius: '2px',
                                                    transition: 'color 0.3s',
                                                  }}
                                                >
                                                  {level3Menu.icon}
                                                </span>
                                                {isExpanded && (
                                                  <>
                                                    <span 
                                                      className="menu-title flex-grow overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-300"
                                                      style={{ fontSize: '0.8rem' }}
                                                    >
                                                      {level3Menu.label.toUpperCase()}
                                                    </span>
                                                    {hasLevel4Menus && (
                                                      <span 
                                                        className="sub-menu-indicator"
                                                        style={{
                                                          width: '5px',
                                                          height: '5px',
                                                          borderRight: '2px solid currentcolor',
                                                          borderBottom: '2px solid currentcolor',
                                                          transform: isLevel4Open ? 'rotate(45deg)' : 'rotate(-45deg)',
                                                          transition: 'transform 0.3s',
                                                          marginLeft: 'auto',
                                                          flexShrink: 0,
                                                        }}
                                                      />
                                                    )}
                                                  </>
                                                )}
                                              </button>
                                              {hasLevel4Menus && (
                                                <div 
                                                  ref={(el) => {
                                                    subMenuRefsLevel3.current[level3MenuKey] = el;
                                                  }}
                                                  className="sub-menu-list"
                                                  style={{
                                                    display: isLevel4Open ? 'block' : 'none',
                                                    paddingLeft: '20px',
                                                    backgroundColor: TEMPLATE_COLORS.secondaryBgColor,
                                                  }}
                                                >
                                                  <ul className="list-none p-0 m-0">
                                                    {level3Menu.subMenus!.map((level4Menu: SubMenuLevel4) => {
                                                      const level4ActiveTab = `${tab.id}-${subMenu.id}-${level3Menu.id}-${level4Menu.id}`;
                                                      const isLevel4Active = activeTab === level4ActiveTab || activeTab.startsWith(level4ActiveTab + '-');
                                                      const hasLevel5Menus = level4Menu.subMenus && level4Menu.subMenus.length > 0;
                                                      const level4MenuKey = `${tab.id}-${subMenu.id}-${level3Menu.id}-${level4Menu.id}`;
                                                      const isLevel5Open = openSubMenusLevel3.has(level4MenuKey);
                                                      
                                                      return (
                                                        <li 
                                                          key={level4Menu.id}
                                                          className={`menu-item ${isLevel4Active ? 'active' : ''} ${isExpanded && hasLevel5Menus ? 'sub-menu' : ''} ${isLevel5Open ? 'open' : ''}`}
                                                        >
                                                          <button
                                                            onClick={() => {
                                                              if (hasLevel5Menus) {
                                                                handleSubMenuLevel3Click(tab.id, subMenu.id, level3Menu.id + '-' + level4Menu.id, true);
                                                              } else {
                                                                handleSubMenuLevel4Click(tab.id, subMenu.id, level3Menu.id, level4Menu.id);
                                                              }
                                                            }}
                                                            className="flex items-center h-10 px-5 cursor-pointer transition-all duration-300 w-full text-left border-0 bg-transparent"
                                                            style={{ color: isLevel4Active ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor }}
                                                            onMouseEnter={(e) => {
                                                              e.currentTarget.style.color = TEMPLATE_COLORS.secondaryTextColor;
                                                            }}
                                                            onMouseLeave={(e) => {
                                                              e.currentTarget.style.color = isLevel4Active ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor;
                                                            }}
                                                          >
                                                            <span 
                                                              className="menu-icon flex-shrink-0 flex items-center justify-center"
                                                              style={{
                                                                fontSize: '0.85rem',
                                                                width: '20px',
                                                                minWidth: '20px',
                                                                height: '20px',
                                                                marginRight: '10px',
                                                                borderRadius: '2px',
                                                                transition: 'color 0.3s',
                                                              }}
                                                            >
                                                              {level4Menu.icon}
                                                            </span>
                                                            {isExpanded && (
                                                              <>
                                                                <span 
                                                                  className="menu-title flex-grow overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-300"
                                                                  style={{ fontSize: '0.75rem' }}
                                                                >
                                                                  {level4Menu.label.toUpperCase()}
                                                                </span>
                                                                {hasLevel5Menus && (
                                                                  <span 
                                                                    className="sub-menu-indicator"
                                                                    style={{
                                                                      width: '5px',
                                                                      height: '5px',
                                                                      borderRight: '2px solid currentcolor',
                                                                      borderBottom: '2px solid currentcolor',
                                                                      transform: isLevel5Open ? 'rotate(45deg)' : 'rotate(-45deg)',
                                                                      transition: 'transform 0.3s',
                                                                      marginLeft: 'auto',
                                                                      flexShrink: 0,
                                                                    }}
                                                                  />
                                                                )}
                                                              </>
                                                            )}
                                                          </button>
                                                          {hasLevel5Menus && (
                                                            <div 
                                                              ref={(el) => {
                                                                subMenuRefsLevel3.current[level4MenuKey] = el;
                                                              }}
                                                              className="sub-menu-list"
                                                              style={{
                                                                display: isLevel5Open ? 'block' : 'none',
                                                                paddingLeft: '20px',
                                                                backgroundColor: TEMPLATE_COLORS.secondaryBgColor,
                                                              }}
                                                            >
                                                              <ul className="list-none p-0 m-0">
                                                                {level4Menu.subMenus!.map((level5Menu: SubMenuLevel4) => {
                                                                  const level5ActiveTab = `${tab.id}-${subMenu.id}-${level3Menu.id}-${level4Menu.id}-${level5Menu.id}`;
                                                                  const isLevel5Active = activeTab === level5ActiveTab || activeTab.startsWith(level5ActiveTab + '-');
                                                                  
                                                                  return (
                                                                    <li 
                                                                      key={level5Menu.id}
                                                                      className={`menu-item ${isLevel5Active ? 'active' : ''}`}
                                                                    >
                                                                      <button
                                                                        onClick={() => {
                                                                          onTabChange(`${tab.id}-${subMenu.id}-${level3Menu.id}-${level4Menu.id}-${level5Menu.id}`);
                                                                        }}
                                                                        className="flex items-center h-10 px-5 cursor-pointer transition-all duration-300 w-full text-left border-0 bg-transparent"
                                                                        style={{ color: isLevel5Active ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor }}
                                                                        onMouseEnter={(e) => {
                                                                          e.currentTarget.style.color = TEMPLATE_COLORS.secondaryTextColor;
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                          e.currentTarget.style.color = isLevel5Active ? TEMPLATE_COLORS.secondaryTextColor : TEMPLATE_COLORS.textColor;
                                                                        }}
                                                                      >
                                                                        <span 
                                                                          className="menu-icon flex-shrink-0 flex items-center justify-center"
                                                                          style={{
                                                                            fontSize: '0.8rem',
                                                                            width: '18px',
                                                                            minWidth: '18px',
                                                                            height: '18px',
                                                                            marginRight: '10px',
                                                                            borderRadius: '2px',
                                                                            transition: 'color 0.3s',
                                                                          }}
                                                                        >
                                                                          {level5Menu.icon}
                                                                        </span>
                                                                        {isExpanded && (
                                                                          <span 
                                                                            className="menu-title flex-grow overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-300"
                                                                            style={{ fontSize: '0.7rem' }}
                                                                          >
                                                                            {level5Menu.label.toUpperCase()}
                                                                          </span>
                                                                        )}
                                                                      </button>
                                                                    </li>
                                                                  );
                                                                })}
                                                              </ul>
                                                            </div>
                                                          )}
                                                        </li>
                                                      );
                                                    })}
                                                  </ul>
                                                </div>
                                              )}
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
        </div>

      </div>
    </aside>
  );
};

export default MainSidebar;
