import React from 'react';
import BaseAuxiliarySidebar from './BaseAuxiliarySidebar';
import { useLanguage } from '../../contexts/LanguageContext';

interface ReglaOperationsSidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  activeSubTab: 'status' | 'insert' | 'update';
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update') => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  selectedTable?: string;
}

const ReglaOperationsSidebar: React.FC<ReglaOperationsSidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  activeSubTab,
  onSubTabChange,
  activeTab,
  onTabChange,
  selectedTable
}) => {
  const { t } = useLanguage();
  
  // Operaciones disponibles: ESTADO, CREAR, ACTUALIZAR
  const operations = [
    {
      id: 'status' as const,
      label: t('parameters.operations.status'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'insert' as const,
      label: t('parameters.operations.create'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      id: 'update' as const,
      label: t('parameters.operations.update'),
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

  // Determinar qué tabla está activa basándome en selectedTable o activeTab
  const getCurrentTablePrefix = (): string => {
    // PRIORIDAD 1: Usar selectedTable si está disponible (es la fuente más confiable)
    if (selectedTable && (selectedTable === 'regla' || selectedTable === 'regla_perfil' || selectedTable === 'regla_umbral' || selectedTable === 'regla_objeto')) {
      return `configuracion-notificaciones-regla-${selectedTable}`;
    }
    
    // PRIORIDAD 2: Intentar extraer de activeTab usando el mismo método que App.tsx
    if (activeTab && activeTab.startsWith('configuracion-notificaciones-regla-')) {
      const reglaTable = activeTab.replace('configuracion-notificaciones-regla-', '').split('-')[0];
      if (reglaTable && (reglaTable === 'regla' || reglaTable === 'regla_perfil' || reglaTable === 'regla_umbral' || reglaTable === 'regla_objeto')) {
        return `configuracion-notificaciones-regla-${reglaTable}`;
      }
    }
    
    // Fallback para compatibilidad con sistema antiguo
    if (activeTab?.startsWith('alertas-regla_objeto')) {
      return 'alertas-regla_objeto';
    }
    if (activeTab?.startsWith('alertas-regla_umbral')) {
      return 'alertas-regla_umbral';
    }
    if (activeTab?.startsWith('alertas-regla_perfil')) {
      return 'alertas-regla_perfil';
    }
    
    // Por defecto
    return 'configuracion-notificaciones-regla-regla';
  };

  // Obtener el título dinámico según la tabla activa
  const getTitle = (): string => {
    // Incluir regla_objeto en el regex
    // Extraer tabla usando el mismo método que App.tsx
    let tableName = selectedTable;
    if (!tableName && activeTab && activeTab.startsWith('configuracion-notificaciones-regla-')) {
      tableName = activeTab.replace('configuracion-notificaciones-regla-', '').split('-')[0];
    }
    
    if (tableName === 'regla_perfil') {
      return 'REGLA DE PERFIL';
    }
    if (tableName === 'regla_umbral') {
      return 'REGLA DE UMBRAL';
    }
    if (tableName === 'regla_objeto') {
      return 'REGLA DE OBJETO';
    }
    if (tableName === 'regla') {
      return 'REGLAS';
    }
    
    // Fallback para compatibilidad
    if (activeTab?.startsWith('alertas-regla_objeto')) {
      return t('alerts.rule_object');
    }
    if (activeTab?.startsWith('alertas-regla_umbral')) {
      return t('alerts.rule_threshold');
    }
    if (activeTab?.startsWith('alertas-regla_perfil')) {
      return t('alerts.rule_profile');
    }
    
    return 'REGLAS';
  };

  const currentTablePrefix = getCurrentTablePrefix();

  return (
    <BaseAuxiliarySidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={getTitle()}
      icon={operationsIcon}
      color="orange"
      collapsedText="App"
    >
      <div className={`h-full overflow-y-auto ${isExpanded ? 'custom-scrollbar' : 'scrollbar-hide'}`}>
        <div className="py-4">
          <nav className="space-y-2">
            {operations.map((operation) => {
              const isActive = activeSubTab === operation.id;
              return (
                <button
                  key={operation.id}
                  onClick={() => {
                    // PRIORIDAD: Usar selectedTable si está disponible, ya que es la fuente más confiable
                    let tableToUse = selectedTable;
                    
                    // Si no hay selectedTable, intentar extraer de activeTab usando el mismo método que App.tsx
                    if (!tableToUse && activeTab && activeTab.startsWith('configuracion-notificaciones-regla-')) {
                      const reglaTable = activeTab.replace('configuracion-notificaciones-regla-', '').split('-')[0];
                      if (reglaTable && (reglaTable === 'regla' || reglaTable === 'regla_perfil' || reglaTable === 'regla_umbral' || reglaTable === 'regla_objeto')) {
                        tableToUse = reglaTable;
                      }
                    }
                    
                    // Fallback a 'regla' si no se puede determinar
                    if (!tableToUse || (tableToUse !== 'regla' && tableToUse !== 'regla_perfil' && tableToUse !== 'regla_umbral' && tableToUse !== 'regla_objeto')) {
                      tableToUse = 'regla';
                    }
                    
                    const currentTablePrefix = `configuracion-notificaciones-regla-${tableToUse}`;
                    const newTab = `${currentTablePrefix}-${operation.id}`;
                    
                    onSubTabChange?.(operation.id);
                    // Construir la ruta correcta según la tabla activa
                    onTabChange?.(newTab);
                  }}
                  className={`w-full flex items-center p-3 rounded transition-colors ${
                    isExpanded ? 'gap-3' : 'justify-center'
                  } ${
                    isActive
                      ? "bg-orange-500 text-white"
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

export default ReglaOperationsSidebar;

