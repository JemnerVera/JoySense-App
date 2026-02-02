// Utilidades específicas para el componente ReglasMain

/**
 * Obtiene el nombre traducido de una sub-tab
 */
export function getSubTabName(subTab: string): string {
  const names: { [key: string]: string } = {
    'status': 'Estado',
    'insert': 'Crear',
    'update': 'Actualizar'
  };
  return names[subTab] || subTab;
}

/**
 * Campos que deben excluirse de los formularios
 */
export const EXCLUDED_FORM_FIELDS = [
  'usercreatedid',
  'usermodifiedid',
  'datecreated',
  'datemodified',
  'reglaid'
];

/**
 * Verifica si un campo debe ser visible en el formulario
 */
export function isFieldVisibleInForm(columnName: string): boolean {
  return !EXCLUDED_FORM_FIELDS.includes(columnName);
}