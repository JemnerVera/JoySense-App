// =============================================================================
// FEATURES - Re-exports centralizados
// =============================================================================
// Este archivo centraliza todos los exports de las features principales
// para simplificar los imports en App.tsx y otros consumidores

// Reporting: Alertas, Mensajes, Umbrales, Notificaciones
export * from './reporting';

// Rules: Gestión de reglas
// Note: Re-exporting named exports separately to avoid default export conflicts
export {
  default as ReglasMain,
  useReglasData,
  useReglasOperations,
  useReglasValidation,
  ReglasStatusTab,
  ReglasInsertTab,
  ReglasUpdateTab,
  ReglaUpdateForm,
  ReglasSankeyDiagram,
  getSubTabName,
  isFieldVisibleInForm,
  EXCLUDED_FORM_FIELDS,
  type ReglasMainProps,
  type ReglasMainRef,
  type Message,
  type ReglaUmbralRow,
  type ReglaUpdateData,
  type RelatedData,
  type OperationResult,
  type UmbralData
} from './rules';

// Permissions: Gestión de permisos
export * from './permissions';

// System Parameters: Configuración del sistema
export * from './system-parameters';
