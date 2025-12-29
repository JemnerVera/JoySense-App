/**
 * PermisosSidebar - Segundo sidebar para la pestaña Permisos
 * Muestra "GESTIÓN DE PERMISOS" y futuras opciones
 */

import React from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import { useLanguage } from '../../contexts/LanguageContext';

interface PermisosSidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  activeSubTab?: 'status' | 'insert' | 'update';
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update') => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const PermisosSidebar: React.FC<PermisosSidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  activeSubTab,
  onSubTabChange,
  activeTab,
  onTabChange
}) => {
  const { t } = useLanguage();

  // Logs para debugging
  console.log('[PermisosSidebar] Props recibidas:', {
    activeTab,
    isExpanded,
    activeSubTab
  });

  // Opciones de gestión de permisos
  const permisosOptions = [
    {
      id: 'permiso',
      label: t('parameters.tables.geography_permission') || 'PERMISO',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      id: 'origen',
      label: t('parameters.tables.origin') || 'ORIGEN',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'fuente',
      label: t('parameters.tables.source') || 'FUENTE',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  // Icono para el sidebar de permisos
  const permisosIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  return (
    <BaseAuxiliarySidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={t('tabs.permissions')}
      icon={permisosIcon}
      color="purple"
      collapsedText="PERM"
    >
      {/* Opciones de gestión de permisos */}
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
          <nav className="space-y-2">
            {(() => {
              console.log('[PermisosSidebar] Renderizando opciones:', {
                activeTab,
                isExpanded,
                activeSubTab,
                permisosOptionsCount: permisosOptions.length,
                permisosOptions: permisosOptions.map(o => ({ id: o.id, label: o.label }))
              });
              return permisosOptions.map((option) => {
                const isActive = activeTab === `permisos-${option.id}` || (activeTab === 'permisos' && option.id === 'permiso');
                console.log(`[PermisosSidebar] Opción ${option.id}:`, {
                  optionId: option.id,
                  optionLabel: option.label,
                  activeTab,
                  expectedTab: `permisos-${option.id}`,
                  isActive,
                  condition1: activeTab === `permisos-${option.id}`,
                  condition2: activeTab === 'permisos' && option.id === 'permiso'
                });
                return (
                  <button
                    key={option.id}
                    onClick={() => onTabChange?.(`permisos-${option.id}`)}
                    className={`w-full flex items-center p-3 rounded transition-colors ${
                      isExpanded ? 'gap-3' : 'justify-center'
                    } ${
                      isActive
                        ? "bg-purple-600 text-white"
                        : "text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {option.icon}
                    </div>
                    {isExpanded && (
                      <span className="text-sm font-medium tracking-wider">{option.label.toUpperCase()}</span>
                    )}
                </button>
                );
              });
            })()}
          </nav>
        </div>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default PermisosSidebar;

