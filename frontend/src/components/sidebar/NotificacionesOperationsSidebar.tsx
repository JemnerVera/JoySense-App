import React from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import ProtectedSubTabButton from '../ProtectedSubTabButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTableConfig } from '../../config/tables.config';

interface NotificacionesOperationsSidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  selectedTable: string;
  activeSubTab: 'status' | 'insert' | 'update' | 'massive';
  onSubTabChange: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  onSubTabChangeFromProtectedButton?: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  formData?: Record<string, any>;
  multipleData?: any[];
  massiveFormData?: Record<string, any>;
}

const NotificacionesOperationsSidebar: React.FC<NotificacionesOperationsSidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  selectedTable,
  activeSubTab,
  onSubTabChange,
  onSubTabChangeFromProtectedButton,
  formData = {},
  multipleData = [],
  massiveFormData = {}
}) => {
  const { t } = useLanguage();
  
  const getAllOperations = (): Array<{
    id: 'status' | 'insert' | 'update' | 'massive';
    label: string;
    icon: React.ReactNode;
  }> => [
    {
      id: 'status',
      label: t('parameters.operations.status'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'insert',
      label: t('parameters.operations.create'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      id: 'update',
      label: t('parameters.operations.update'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      id: 'massive',
      label: t('parameters.operations.massive'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    }
  ];

  const allOperations = getAllOperations();
  const config = getTableConfig(selectedTable);

  // Filtrar operaciones según permisos de la tabla
  const availableOperations = allOperations.filter(op => {
    if (op.id === 'insert' && !config?.allowInsert) return false;
    if (op.id === 'update' && !config?.allowUpdate) return false;
    if (op.id === 'massive' && !config?.allowMassive) return false;
    return true;
  });

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
      title="OPERACIONES"
      icon={operationsIcon}
      color="orange"
      collapsedText="App"
    >
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
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
                  onTabChangeFromProtectedButton={onSubTabChangeFromProtectedButton ? (tab: 'status' | 'insert' | 'update' | 'massive' | 'asignar') => {
                    if (tab !== 'asignar') {
                      onSubTabChangeFromProtectedButton(tab);
                    }
                  } : undefined}
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

export default NotificacionesOperationsSidebar;

