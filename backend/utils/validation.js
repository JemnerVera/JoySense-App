/**
 * Utilidades de Validación
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{7,12}$/;

/**
 * Valida formato de email
 */
function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

/**
 * Valida formato de teléfono
 */
function isValidPhone(phone) {
  return PHONE_REGEX.test(phone);
}

/**
 * Valida que un valor no sea nulo o vacío
 */
function isNotEmpty(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

/**
 * Valida que un valor sea un número
 */
function isValidNumber(value) {
  return !isNaN(Number(value));
}

/**
 * Sanitiza un string para prevenir SQL injection
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>'"]/g, '');
}

/**
 * Valida campos requeridos en un objeto
 */
function validateRequiredFields(data, requiredFields) {
  const missing = [];
  for (const field of requiredFields) {
    if (!isNotEmpty(data[field])) {
      missing.push(field);
    }
  }
  return {
    isValid: missing.length === 0,
    missingFields: missing
  };
}

module.exports = {
  EMAIL_REGEX,
  PHONE_REGEX,
  isValidEmail,
  isValidPhone,
  isNotEmpty,
  isValidNumber,
  sanitizeString,
  validateRequiredFields
};

