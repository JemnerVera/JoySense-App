/**
 * Utilidades para limpieza de selección de copia
 */

/**
 * Limpia la selección de copia cuando se cambia de tabla
 */
export function clearCopySelectionOnTableChange(
  setCopyMessage: (message: any) => void,
  setCopyTotalPages: (pages: number) => void
): void {
  setCopyMessage(null);
  setCopyTotalPages(0);
}

/**
 * Limpia la selección de copia cuando se cambia de pestaña
 */
export function clearCopySelectionOnTabChange(
  setCopyMessage: (message: any) => void,
  setCopyTotalPages: (pages: number) => void
): void {
  setCopyMessage(null);
  setCopyTotalPages(0);
}
