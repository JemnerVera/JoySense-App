import React from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import ProtectedSubTabButton from '../ProtectedSubTabButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTableConfig } from '../../config/tables.config';

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

  // Operaciones disponibles según la tabla
  const getAvailableOperations = (): Array<{ id: 'status' | 'insert' | 'update' | 'massive'; label: string; icon: string }> => {
    const baseOperations: Array<{ id: 'status' | 'insert' | 'update' | 'massive'; label: string; icon: string }> = [
      { id: 'status', label: t('subtabs.status'), icon: '📊' }
    ];

    if (config?.allowInsert) {
      baseOperations.push({ id: 'insert', label: t('subtabs.insert'), icon: '➕' });
    }

    if (config?.allowUpdate) {
      baseOperations.push({ id: 'update', label: t('subtabs.update'), icon: '✏️' });
    }

    if (config?.allowMassive) {
      baseOperations.push({ id: 'massive', label: t('subtabs.massive'), icon: '📦' });
    }

    return baseOperations;
  };

  const operations = getAvailableOperations();

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
      title={config?.displayName?.toUpperCase() || selectedTable.toUpperCase()}
      icon={parametrosGeoIcon}
      color="blue"
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
                      ? "bg-blue-500 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  <div className="flex-shrink-0">
                    <span className="text-lg">{operation.icon}</span>
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

export default ParametrosGeoOperationsSidebar;

