// ============================================================================
// VALIDATIONS INDEX
// ============================================================================

// Export types
export * from './types';

// Export schemas
export * from './schemas';

// Export common functions
export { 
  validateFormData, 
  getValidationMessages,
  generateUserFriendlyMessage,
  generateUpdateUserFriendlyMessage
} from './common';

// Export geografía validations (refactored)
export * from './geografia';

// Export dispositivos validations (refactored)
export * from './dispositivos';

// Export alertas validations (refactored)
export * from './alertas';

// Export usuarios validations (refactored)
export * from './usuarios';

// Export router functions (using new modules)
export { 
  validateTableUpdate,
  validateTableData
} from './routers';
