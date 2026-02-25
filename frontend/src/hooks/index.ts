/**
 * Índice de Hooks - JoySense
 * 
 * Hooks consolidados y esenciales para la aplicación.
 * 
 * NOTA: La migración completa a useTableCRUD está en progreso.
 * Estos hooks legacy SON NECESARIOS actualmente y funcionan correctamente.
 * Solo se eliminarán después de que los componentes sean migrados.
 */

// ============================================================================
// HOOKS PRINCIPALES (Usar estos)
// ============================================================================

// CRUD de tablas - Hook unificado
export { useTableCRUD } from './useTableCRUD';
export type { 
  UseTableCRUDOptions, 
  UseTableCRUDReturn, 
  TableState, 
  FormState, 
  RelatedData 
} from './useTableCRUD';

// Paginación
export { usePagination } from './usePagination';

// Modales
export { useSimpleModal } from './useSimpleModal';
export { useDataLossModal } from './useDataLossModal';

// Selección múltiple
export { useMultipleSelection } from './useMultipleSelection';

// Mensajes de inserción
export { useInsertionMessages } from './useInsertionMessages';

// Replicación de datos
export { useReplicate } from './useReplicate';

// ============================================================================
// FILTROS Y DATOS
// ============================================================================

// Efecto de filtros globales
export { useGlobalFilterEffect } from './useGlobalFilterEffect';

// Filtros en cascada
export { useCascadingFilters } from './useCascadingFilters';

// Datos de filtros
export { useFilterData } from './useFilterData';
export { useCompleteFilterData } from './useCompleteFilterData';

// Datos de referencia
export { useReferenceData } from './useReferenceData';

// Umbrales
export { useUmbrales } from './useUmbrales';

// ============================================================================
// DASHBOARD
// ============================================================================

export { useDashboard } from './useDashboard';
export { useDashboardCharts } from './useDashboardCharts';
export { useDashboardControls } from './useDashboardControls';
export { useDashboardData } from './useDashboardData';

// ============================================================================
// LAYOUT Y SIDEBAR
// ============================================================================

export { useSidebar } from './useSidebar';
export { useAppSidebar } from './useAppSidebar';
export { useMainContentLayout } from './useMainContentLayout';

// ============================================================================
// LAZY LOADING
// ============================================================================

export { useChartJSLazy } from './useChartJSLazy';
export { useRechartsLazy } from './useRechartsLazy';

// ============================================================================
// PROTECCIÓN DE DATOS
// ============================================================================

export { useDataLossProtection } from './useDataLossProtection';
export { useUnsavedChanges } from './useUnsavedChanges';

// ============================================================================
// HOOKS LEGACY (Necesarios actualmente - Migración pendiente)
// ============================================================================

/**
 * Hook para gestión de datos de tablas y datos relacionados.
 * Necesario para SystemParameters y otros componentes que requieren 
 * acceso a múltiples tablas relacionadas (userData, paisesData, etc.)
 * 
 * @pending Migration to useTableCRUD - requiere ampliar para cargar todas las tablas relacionadas
 */
export { useTableDataManagement } from './useTableDataManagement';

/**
 * Hook para carga de datos de una tabla específica.
 * Usado por: tests, y algunos componentes legacy.
 * @pending Migration to useTableCRUD
 */
export { useTableData } from './useTableData';

/**
 * Hook para datos de tabla con optimizaciones.
 * @pending Migration to useTableCRUD
 */
export { useOptimizedTableData } from './useOptimizedTableData';

/**
 * Hook para operaciones de inserción.
 * Usado por: MassiveOperations, useFormRendering
 * @pending Migration to useTableCRUD.insertRow
 */
export { useInsertOperations } from './useInsertOperations';

/**
 * Hook para operaciones de actualización.
 * Usado por: MassiveOperations
 * @pending Migration to useTableCRUD.updateRow
 */
export { useUpdateOperations } from './useUpdateOperations';

/**
 * Hook para estado del formulario.
 * @pending Migration to useTableCRUD.formState
 */
export { useFormState } from './useFormState';

/**
 * Hook para validación de formularios.
 * Usado por: useFormRendering
 * @pending Migration to useTableCRUD.validateForm
 */
export { useFormValidation } from './useFormValidation';

/**
 * Hook para detección de cambios en formulario.
 * @pending Migration to useTableCRUD.formState.isDirty
 */
export { default as useFormChangeDetection } from './useFormChangeDetection';

/**
 * Hook para búsqueda y filtrado.
 * Usado por: useUpdateTable, useStatusTable
 * @pending Migration a useTableCRUD
 */
export { useSearchAndFilter } from './useSearchAndFilter';

/**
 * Hook para operaciones de búsqueda.
 * Usado por: useTableRendering
 * @pending Migration a useTableCRUD
 */
export { useSearchOperations } from './useSearchOperations';

/**
 * Hook para renderizado de formularios.
 * Usado por: ParameterForm
 * @pending Migration a useTableCRUD o componente de formulario genérico
 */
export { useFormRendering } from './useFormRendering';

/**
 * Hook para renderizado de tablas.
 * @pending Migration a useTableCRUD
 */
export { useTableRendering } from './useTableRendering';

/**
 * Hook para interceptar cambios.
 * @pending Migration a useTableCRUD.formState.isDirty
 */
export { useChangeInterceptor } from './useChangeInterceptor';

/**
 * Hook para detección simple de cambios.
 * Usado por: ProtectedTableSelector, ProtectedParameterButton
 * @pending Migration a useUnsavedChanges
 */
export { useSimpleChangeDetection } from './useSimpleChangeDetection';

/**
 * Hook para validación de cambios de tabla.
 * @pending Migration a useTableCRUD
 */
export { useTableChangeValidation } from './useTableChangeValidation';

/**
 * Hook para habilitación progresiva de campos.
 * Usado por: NormalInsertForm, useFormRendering
 * @pending Migration a useTableCRUD
 */
export { useProgressiveEnablement } from './useProgressiveEnablement';

/**
 * Hook para estado de SystemParameters.
 * @pending Migration a useTableCRUD
 */
export { useSystemParametersState } from './useSystemParametersState';

