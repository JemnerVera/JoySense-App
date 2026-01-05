/**
 * PermisosTipoOperationsSidebar - Sidebar Auxiliar 3 para PERMISOS
 * Muestra ESTADO, CREAR, ASIGNAR (por ORIGEN)
 */

import React from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import ProtectedSubTabButton from '../ProtectedSubTabButton';
import { useLanguage } from '../../contexts/LanguageContext';

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
  massiveFormData = {}
}) => {
  const { t } = useLanguage();

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
  const operations = [
    {
      id: 'status' as const,
      label: t('subtabs.status') || 'ESTADO',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'insert' as const,
      label: t('subtabs.insert') || 'CREAR',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      id: 'asignar' as const,
      label: 'ASIGNAR',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    }
  ];

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
      collapsedText="..."
    >
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
          <nav className="space-y-1">
            {operations.map((operation) => {
              const isActive = activeSubTab === operation.id;
              return (
                <ProtectedSubTabButton
                  key={operation.id}
                  targetTab={operation.id}
                  currentTab={activeSubTab}
                  selectedTable={selectedTipo}
                  formData={formData}
                  multipleData={multipleData}
                  massiveFormData={massiveFormData}
                  onTabChange={(tab: 'status' | 'insert' | 'update' | 'asignar' | 'massive') => {
                    // Solo procesar los tabs que son válidos para permisos
                    if (tab === 'status' || tab === 'insert' || tab === 'asignar') {
                      onSubTabChange(tab as 'status' | 'insert' | 'asignar');
                    }
                    // Ignorar 'update' y 'massive' ya que no son válidos para permisos en este contexto
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
        </div>
      </div>
    </BaseAuxiliarySidebar>
  );
};

export default PermisosTipoOperationsSidebar;

