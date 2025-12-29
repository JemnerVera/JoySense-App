/**
 * PermisosOperationsSidebar - Tercer sidebar para la pestaña Permisos
 * Muestra ESTADO, CREAR, ACTUALIZAR
 */

import React from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModal } from '../../contexts/ModalContext';
import { useSimpleChangeDetection } from '../../hooks/useSimpleChangeDetection';

interface PermisosOperationsSidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  activeSubTab: 'status' | 'insert' | 'update';
  onSubTabChange: (subTab: 'status' | 'insert' | 'update') => void;
  formData?: Record<string, any>;
  activeTab?: string;
}

const PermisosOperationsSidebar: React.FC<PermisosOperationsSidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  activeSubTab,
  onSubTabChange,
  formData = {},
  activeTab = ''
}) => {
  const { t } = useLanguage();
  const { showModal } = useModal();
  const { hasSignificantChanges } = useSimpleChangeDetection();

  // Determinar qué tabla está seleccionada basándose en activeTab
  const getSelectedTable = () => {
    if (activeTab.startsWith('permisos-permiso')) return 'permiso';
    if (activeTab.startsWith('permisos-origen')) return 'origen';
    if (activeTab.startsWith('permisos-fuente')) return 'fuente';
    return 'permiso'; // Default
  };

  const selectedTable = getSelectedTable();

  // Determinar el título según la tabla seleccionada
  const getTitle = () => {
    switch (selectedTable) {
      case 'permiso':
        return t('parameters.tables.geography_permission');
      case 'origen':
        return t('parameters.tables.origin');
      case 'fuente':
        return t('parameters.tables.source');
      default:
        return t('parameters.tables.geography_permission');
    }
  };

  // Handler para cambio de subTab con protección de cambios
  const handleSubTabChange = (targetTab: 'status' | 'insert' | 'update') => {
    if (targetTab === activeSubTab) return;

    // Verificar cambios sin guardar
    const hasChanges = hasSignificantChanges(
      formData,
      selectedTable,
      activeSubTab,
      []
    );

    if (hasChanges) {
      const getSubTabName = (subTab: string) => {
        const names: { [key: string]: string } = {
          'status': t('subtabs.status'),
          'insert': t('subtabs.insert'),
          'update': t('subtabs.update')
        };
        return names[subTab] || subTab;
      };

      showModal(
        'subtab',
        getSubTabName(activeSubTab),
        getSubTabName(targetTab),
        () => {
          onSubTabChange(targetTab);
        },
        () => {
          // Cancelar: no hacer nada
        }
      );
    } else {
      onSubTabChange(targetTab);
    }
  };
  
  // Operaciones disponibles para permisos
  const operations = [
    {
      id: 'status' as const,
      label: t('subtabs.status'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'insert' as const,
      label: t('subtabs.insert'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      id: 'update' as const,
      label: t('subtabs.update'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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

  return (
    <BaseAuxiliarySidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={getTitle()}
      icon={operationsIcon}
      color="purple"
      collapsedText="..."
    >
      {/* Operaciones disponibles */}
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
          <nav className="space-y-2">
            {operations.map((operation) => {
              const isActive = activeSubTab === operation.id;
              return (
                <button
                  key={operation.id}
                  onClick={() => handleSubTabChange(operation.id)}
                  className={`w-full flex items-center p-3 rounded transition-colors ${
                    isExpanded ? 'gap-3' : 'justify-center'
                  } ${
                    isActive
                      ? "bg-purple-600 text-white"
                      : "text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-800"
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
        </div>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default PermisosOperationsSidebar;

