/**
 * Índice de Hooks - JoySense
 * 
 * Hooks consolidados y esenciales para la aplicación.
 * Los hooks marcados como @deprecated serán eliminados en futuras versiones.
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
export { useSidebarLayout } from './useSidebarLayout';
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
// HOOKS LEGACY (Deprecated - Usar useTableCRUD en su lugar)
// ============================================================================

/**
 * @deprecated Use useTableCRUD instead
 */
export { useTableDataManagement } from './useTableDataManagement';

/**
 * @deprecated Use useTableCRUD instead
 */
export { useTableData } from './useTableData';

/**
 * @deprecated Use useTableCRUD instead
 */
export { useOptimizedTableData } from './useOptimizedTableData';

/**
 * @deprecated Use useTableCRUD instead
 */
export { useSystemParametersCRUD } from './useSystemParametersCRUD';

/**
 * @deprecated Use useTableCRUD instead
 */
export { useInsertOperations } from './useInsertOperations';

/**
 * @deprecated Use useTableCRUD instead
 */
export { useUpdateOperations } from './useUpdateOperations';

/**
 * @deprecated Use useTableCRUD instead
 */
export { useFormState } from './useFormState';

/**
 * @deprecated Use useTableCRUD instead
 */
export { useFormValidation } from './useFormValidation';

/**
 * @deprecated Use useTableCRUD.formState instead
 */
export { default as useFormChangeDetection } from './useFormChangeDetection';

/**
 * @deprecated Use useTableCRUD instead
 */
export { useSearchAndFilter } from './useSearchAndFilter';

/**
 * @deprecated Use useTableCRUD instead
 */
export { useSearchOperations } from './useSearchOperations';

/**
 * @deprecated Integrated in useTableCRUD
 */
export { useFormRendering } from './useFormRendering';

/**
 * @deprecated Integrated in useTableCRUD
 */
export { useTableRendering } from './useTableRendering';

/**
 * @deprecated Use useTableCRUD or useUnsavedChanges instead
 */
export { useChangeInterceptor } from './useChangeInterceptor';

/**
 * @deprecated Use useUnsavedChanges instead
 */
export { useSimpleChangeDetection } from './useSimpleChangeDetection';

/**
 * @deprecated Use useTableCRUD instead
 */
export { useTableChangeValidation } from './useTableChangeValidation';

/**
 * @deprecated Use useTableCRUD with config instead
 */
export { useProgressiveEnablement } from './useProgressiveEnablement';

/**
 * @deprecated Use useTableCRUD instead
 */
export { useSystemParametersState } from './useSystemParametersState';

