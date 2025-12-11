/**
 * Sistema de Logging Configurable
 */

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const isDebugMode = LOG_LEVEL === 'debug' || LOG_LEVEL === 'info'; // Activar info también para debugging
const isInfoMode = ['debug', 'info'].includes(LOG_LEVEL);

const logger = {
  debug: (message, ...args) => isDebugMode && console.log(`🔍 ${message}`, ...args),
  info: (message, ...args) => isInfoMode && console.log(`✅ ${message}`, ...args),
  warn: (message, ...args) => console.log(`⚠️ ${message}`, ...args),
  error: (message, ...args) => console.error(`❌ ${message}`, ...args)
};

module.exports = logger;

