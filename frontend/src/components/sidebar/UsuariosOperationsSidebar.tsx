import React from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import ProtectedSubTabButton from '../ProtectedSubTabButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTableConfig } from '../../config/tables.config';

interface UsuariosOperationsSidebarProps {
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

const UsuariosOperationsSidebar: React.FC<UsuariosOperationsSidebarProps> = ({
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

  const usuariosIcon = (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  return (
    <BaseAuxiliarySidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={config?.displayName?.toUpperCase() || selectedTable.toUpperCase()}
      icon={usuariosIcon}
      color="purple"
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
                      ? "bg-purple-500 text-white"
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

export default UsuariosOperationsSidebar;

