/**
 * Logger Utility - Gestión centralizada de logs
 * 
 * Proporciona:
 * - Niveles de log configurables (ERROR, WARN, INFO, DEBUG)
 * - Control por variable de entorno
 * - Formato consistente con emojis para fácil identificación
 * - Performance mejorado en DevTools
 */

export const LOG_LEVELS = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4
};

/**
 * Obtiene el nivel de log basado en la variable de entorno
 * Por defecto: ERROR en producción, WARN en desarrollo
 */
function getLogLevel(): number {
  if (process.env.NODE_ENV === 'production') {
    // En producción: solo ERROR y WARN
    return LOG_LEVELS.WARN;
  }
  
  // En desarrollo: basarse en variable de entorno
  const envLevel = process.env.REACT_APP_LOG_LEVEL || 'info';
  
  switch (envLevel.toLowerCase()) {
    case 'none':
      return LOG_LEVELS.NONE;
    case 'error':
      return LOG_LEVELS.ERROR;
    case 'warn':
      return LOG_LEVELS.WARN;
    case 'info':
      return LOG_LEVELS.INFO;
    case 'debug':
      return LOG_LEVELS.DEBUG;
    default:
      return LOG_LEVELS.INFO;
  }
}

const CURRENT_LEVEL = getLogLevel();

/**
 * Función auxiliar para formatear datos de log
 */
function formatLogData(data: any): any {
  if (data === undefined || data === null) {
    return undefined;
  }
  
  // Si es un objeto con keys, devolverlo tal cual
  if (typeof data === 'object' && !Array.isArray(data)) {
    return Object.keys(data).length > 0 ? data : undefined;
  }
  
  // Si es un array, devolverlo
  if (Array.isArray(data)) {
    return data.length > 0 ? data : undefined;
  }
  
  // Para otros tipos (string, number, etc), envolver en objeto
  return { value: data };
}

/**
 * Logger centralizado para toda la aplicación - Versión flexible
 * 
 * Soporta múltiples formas de llamada:
 * ```
 * // Forma 1: context, message, data
 * logger.error('Component', 'Error message', errorData);
 * 
 * // Forma 2: message, data
 * logger.error('Error message', errorData);
 * 
 * // Forma 3: message únicamente
 * logger.error('Error message');
 * ```
 */
export const logger = {
  /**
   * Logs de error - SIEMPRE se muestran (excepto con LOG_LEVEL=none)
   */
  error: (contextOrMessage: string, messageOrData?: any, data?: any) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.ERROR) {
      // Detectar forma de llamada
      let context = '';
      let message = '';
      let logData: any = undefined;

      if (data !== undefined) {
        // Forma: context, message, data
        context = contextOrMessage;
        message = messageOrData;
        logData = data;
      } else if (messageOrData !== undefined && typeof messageOrData === 'string') {
        // Forma: context, message (sin data)
        context = contextOrMessage;
        message = messageOrData;
      } else if (messageOrData !== undefined) {
        // Forma: message, data
        message = contextOrMessage;
        logData = messageOrData;
      } else {
        // Forma: message únicamente
        message = contextOrMessage;
      }

      const formattedData = formatLogData(logData);
      const prefix = context ? `❌ [${context}] ` : '❌ ';
      if (formattedData) {
        console.error(`${prefix}${message}`, formattedData);
      } else {
        console.error(`${prefix}${message}`);
      }
    }
  },

  /**
   * Logs de advertencia - se muestran desde WARN en adelante
   */
  warn: (contextOrMessage: string, messageOrData?: any, data?: any) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.WARN) {
      let context = '';
      let message = '';
      let logData: any = undefined;

      if (data !== undefined) {
        context = contextOrMessage;
        message = messageOrData;
        logData = data;
      } else if (messageOrData !== undefined && typeof messageOrData === 'string') {
        context = contextOrMessage;
        message = messageOrData;
      } else if (messageOrData !== undefined) {
        message = contextOrMessage;
        logData = messageOrData;
      } else {
        message = contextOrMessage;
      }

      const formattedData = formatLogData(logData);
      const prefix = context ? `⚠️ [${context}] ` : '⚠️ ';
      if (formattedData) {
        console.warn(`${prefix}${message}`, formattedData);
      } else {
        console.warn(`${prefix}${message}`);
      }
    }
  },

  /**
   * Logs informativos - se muestran desde INFO en adelante
   */
  info: (contextOrMessage: string, messageOrData?: any, data?: any) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.INFO) {
      let context = '';
      let message = '';
      let logData: any = undefined;

      if (data !== undefined) {
        context = contextOrMessage;
        message = messageOrData;
        logData = data;
      } else if (messageOrData !== undefined && typeof messageOrData === 'string') {
        context = contextOrMessage;
        message = messageOrData;
      } else if (messageOrData !== undefined) {
        message = contextOrMessage;
        logData = messageOrData;
      } else {
        message = contextOrMessage;
      }

      const formattedData = formatLogData(logData);
      const prefix = context ? `ℹ️ [${context}] ` : 'ℹ️ ';
      if (formattedData) {
        console.log(`${prefix}${message}`, formattedData);
      } else {
        console.log(`${prefix}${message}`);
      }
    }
  },

  /**
   * Logs de debug - solo se muestran con LOG_LEVEL=debug
   */
  debug: (contextOrMessage: string, messageOrData?: any, data?: any) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.DEBUG) {
      let context = '';
      let message = '';
      let logData: any = undefined;

      if (data !== undefined) {
        context = contextOrMessage;
        message = messageOrData;
        logData = data;
      } else if (messageOrData !== undefined && typeof messageOrData === 'string') {
        context = contextOrMessage;
        message = messageOrData;
      } else if (messageOrData !== undefined) {
        message = contextOrMessage;
        logData = messageOrData;
      } else {
        message = contextOrMessage;
      }

      const formattedData = formatLogData(logData);
      const prefix = context ? `🔍 [${context}] ` : '🔍 ';
      if (formattedData) {
        console.debug(`${prefix}${message}`, formattedData);
      } else {
        console.debug(`${prefix}${message}`);
      }
    }
  },

  /**
   * Logs de suceso/confirmación - se muestran desde INFO en adelante
   */
  success: (contextOrMessage: string, messageOrData?: any, data?: any) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.INFO) {
      let context = '';
      let message = '';
      let logData: any = undefined;

      if (data !== undefined) {
        context = contextOrMessage;
        message = messageOrData;
        logData = data;
      } else if (messageOrData !== undefined && typeof messageOrData === 'string') {
        context = contextOrMessage;
        message = messageOrData;
      } else if (messageOrData !== undefined) {
        message = contextOrMessage;
        logData = messageOrData;
      } else {
        message = contextOrMessage;
      }

      const formattedData = formatLogData(logData);
      const prefix = context ? `✅ [${context}] ` : '✅ ';
      if (formattedData) {
        console.log(`${prefix}${message}`, formattedData);
      } else {
        console.log(`${prefix}${message}`);
      }
    }
  },

  /**
   * Logs de API/Red - se muestran desde INFO en adelante
   */
  api: (contextOrMessage: string, messageOrData?: any, data?: any) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.INFO) {
      let context = '';
      let message = '';
      let logData: any = undefined;

      if (data !== undefined) {
        context = contextOrMessage;
        message = messageOrData;
        logData = data;
      } else if (messageOrData !== undefined && typeof messageOrData === 'string') {
        context = contextOrMessage;
        message = messageOrData;
      } else if (messageOrData !== undefined) {
        message = contextOrMessage;
        logData = messageOrData;
      } else {
        message = contextOrMessage;
      }

      const formattedData = formatLogData(logData);
      const prefix = context ? `📡 [${context}] ` : '📡 ';
      if (formattedData) {
        console.log(`${prefix}${message}`, formattedData);
      } else {
        console.log(`${prefix}${message}`);
      }
    }
  },

  /**
   * Logs de rendimiento - solo con LOG_LEVEL=debug
   */
  perf: (contextOrMessage: string, messageOrDuration?: any, duration?: number) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.DEBUG) {
      let context = '';
      let message = '';
      let ms: number | undefined = undefined;

      if (typeof messageOrDuration === 'number') {
        // Forma: message, duration
        message = contextOrMessage;
        ms = messageOrDuration;
      } else if (messageOrDuration !== undefined && typeof messageOrDuration === 'string') {
        // Forma: context, message, duration
        context = contextOrMessage;
        message = messageOrDuration;
        ms = duration;
      } else {
        // Forma: message únicamente
        message = contextOrMessage;
      }

      const prefix = context ? `⏱️ [${context}] ` : '⏱️ ';
      if (ms !== undefined) {
        console.debug(`${prefix}${message} (${ms}ms)`);
      } else {
        console.debug(`${prefix}${message}`);
      }
    }
  }
};

export default logger;
