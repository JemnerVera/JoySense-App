// ============================================================================
// INTERFACES & TYPES
// ============================================================================

// Sistema de validación modular para formularios de parámetros
export interface ValidationRule {
  field: string;
  required: boolean;
  type?: 'string' | 'number' | 'email' | 'phone';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customMessage?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Interfaz para errores de validación específicos
export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'duplicate' | 'format' | 'length' | 'constraint';
}

// Interfaz para resultado de validación mejorado
export interface EnhancedValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  userFriendlyMessage: string;
}
