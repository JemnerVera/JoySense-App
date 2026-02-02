/**
 * ReglasMain - Legacy compatibility re-exports
 * All components and exports from features/rules/
 */

// Main component
export { default } from '../../features/rules';

// Hooks
export { useReglasData } from '../../features/rules';
export { useReglasOperations } from '../../features/rules';
export { useReglasValidation } from '../../features/rules';

// Components
export { ReglasStatusTab } from '../../features/rules';
export { ReglasInsertTab } from '../../features/rules';
export { ReglasUpdateTab } from '../../features/rules';

// Types
export type {
  ReglasMainProps,
  ReglasMainRef,
  Message,
  ReglaUmbralRow,
  ReglaUpdateData,
  RelatedData,
  OperationResult,
  UmbralData
} from '../../features/rules';

// Utils
export { getSubTabName, isFieldVisibleInForm, EXCLUDED_FORM_FIELDS } from '../../features/rules';
