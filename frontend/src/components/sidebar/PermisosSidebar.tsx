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
}

const PermisosSidebar: React.FC<PermisosSidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  activeSubTab,
  onSubTabChange
}) => {
  const { t } = useLanguage();

  // Opciones de gestión de permisos (por ahora solo una, pero se puede expandir)
  const permisosOptions = [
    {
      id: 'gestion_permisos',
      label: t('parameters.tables.geography_permission'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    }
    // Aquí se pueden agregar más opciones en el futuro
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
      color="red"
      collapsedText="PERM"
    >
      {/* Opciones de gestión de permisos */}
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
          <nav className="space-y-2">
            {permisosOptions.map((option) => {
              const isActive = true; // Por ahora solo hay una opción, siempre activa
              return (
                <button
                  key={option.id}
                  className={`w-full flex items-center p-3 rounded transition-colors ${
                    isExpanded ? 'gap-3' : 'justify-center'
                  } ${
                    isActive
                      ? "bg-red-500 text-white"
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
            })}
          </nav>
        </div>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default PermisosSidebar;

