/**
 * Utilidades para formateo de celdas en tablas
 * Funciones puras sin estado ni efectos secundarios
 */

import { formatDate, getUserName, getDisplayValue } from './systemParametersUtils';
import type { RelatedData } from './systemParametersUtils';

/**
 * Formatea el valor de statusid para mostrar en la tabla
 */
export const formatStatusCell = (
  value: any,
  row?: any,
  t?: (key: string) => string
): { text: string; className: string } => {
  // Para filas agrupadas, verificar si al menos una fila original está activa
  if (row?.originalRows && row.originalRows.length > 0) {
    const hasActiveRow = row.originalRows.some((originalRow: any) => originalRow.statusid === 1);
    return {
      text: hasActiveRow 
        ? (t ? t('status.active') : 'ACTIVO') 
        : (t ? t('status.inactive') : 'INACTIVO'),
      className: hasActiveRow ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'
    };
  }
  
  // Para filas normales, usar el statusid directamente
  const isActive = value === 1 || value === true;
  return {
    text: isActive 
      ? (t ? t('status.active') : 'ACTIVO') 
      : (t ? t('status.inactive') : 'INACTIVO'),
    className: isActive ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'
  };
};

/**
 * Formatea el valor de usercreatedid o usermodifiedid
 */
export const formatUserCell = (
  userId: number,
  userData: any[] = []
): string => {
  return getUserName(userId, userData);
};

/**
 * Formatea el valor de datecreated o datemodified
 */
export const formatDateCell = (dateString: string): string => {
  return formatDate(dateString);
};

/**
 * Formatea el valor de password_hash con toggle de visibilidad
 */
export const formatPasswordCell = (
  passwordHash: string,
  isVisible: boolean
): string => {
  return isVisible ? passwordHash : '••••••••';
};

/**
 * Obtiene el valor de display para una celda según su tipo
 * Retorna un objeto con la información necesaria para renderizar
 */
export const getCellDisplayValue = (
  row: any,
  columnName: string,
  relatedData: RelatedData = {},
  options?: {
    showPassword?: boolean;
    passwordVisibilityMap?: Record<string, boolean>;
    t?: (key: string) => string;
  }
): { 
  value: string | number | null; 
  type: 'status' | 'user' | 'date' | 'password' | 'normal';
  className?: string;
  isPassword?: boolean;
  passwordHash?: string;
} => {
  const { passwordVisibilityMap = {}, t } = options || {};
  
  // Statusid - Formateo especial con colores
  if (columnName === 'statusid') {
    const formatted = formatStatusCell(row[columnName], row, t);
    return {
      value: formatted.text,
      type: 'status',
      className: formatted.className
    };
  }
  
  // Usercreatedid / Usermodifiedid - Nombre de usuario
  if (columnName === 'usercreatedid' || columnName === 'usermodifiedid') {
    return {
      value: formatUserCell(row[columnName], relatedData.userData || []),
      type: 'user'
    };
  }
  
  // Datecreated / Datemodified - Fecha formateada
  if (columnName === 'datecreated' || columnName === 'datemodified') {
    return {
      value: formatDateCell(row[columnName]),
      type: 'date'
    };
  }
  
  // Password_hash - Mostrar/ocultar con toggle
  if (columnName === 'password_hash') {
    const rowKey = row.usuarioid || row.login || 'default';
    const isVisible = passwordVisibilityMap[rowKey] || false;
    return {
      value: formatPasswordCell(row[columnName], isVisible),
      type: 'password',
      isPassword: true,
      passwordHash: row[columnName]
    };
  }
  
  // Para otros campos, usar getDisplayValue
  const displayValue = getDisplayValue(row, columnName, relatedData);
  return {
    value: displayValue || '',
    type: 'normal'
  };
};

