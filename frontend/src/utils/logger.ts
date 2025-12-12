// ============================================================================
// FRONTEND LOGGER - Sistema de Logging Configurable
// ============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL: LogLevel = (process.env.REACT_APP_LOG_LEVEL as LogLevel) || 'info';
const isDebugMode = LOG_LEVEL === 'debug' || LOG_LEVEL === 'info';
const isInfoMode = ['debug', 'info'].includes(LOG_LEVEL);

export const logger = {
  debug: (message: string, ...args: any[]): void => {
    if (isDebugMode) {
      console.log(`🔍 ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]): void => {
    if (isInfoMode) {
      console.log(`✅ ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]): void => {
    console.warn(`⚠️ ${message}`, ...args);
  },
  
  error: (message: string, ...args: any[]): void => {
    console.error(`❌ ${message}`, ...args);
  }
};

export default logger;

