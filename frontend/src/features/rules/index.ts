// Main component
export { default } from './ReglasMain';

// Hooks
export { useReglasData } from './hooks/useReglasData';
export { useReglasOperations } from './hooks/useReglasOperations';
export { useReglasValidation } from './hooks/useReglasValidation';

// Components
export { ReglasStatusTab } from './components/ReglasStatusTab';
export { ReglasInsertTab } from './components/ReglasInsertTab';
export { ReglasUpdateTab } from './components/ReglasUpdateTab';

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
} from './types';

// Utils
export { getSubTabName, isFieldVisibleInForm, EXCLUDED_FORM_FIELDS } from './utils';

// Additional components
export { ReglaUpdateForm } from './ReglaUpdateForm';
export { ReglasSankeyDiagram } from './ReglasSankeyDiagram';