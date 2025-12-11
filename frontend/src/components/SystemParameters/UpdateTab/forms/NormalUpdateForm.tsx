/**
 * Componente para renderizar formulario de actualización normal
 * Similar a NormalInsertForm pero con campos clave como solo lectura
 */

import React, { useMemo } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../../../../utils/systemParametersUtils';
import { getPrimaryKey } from '../../../../config/tables.config';
import SelectWithPlaceholder from '../../../SelectWithPlaceholder';
import type { TableConfig } from '../../../../config/tables.config';
import type { RelatedData } from '../../../../utils/systemParametersUtils';

interface NormalUpdateFormProps {
  config: TableConfig | null;
  formData: Record<string, any>;
  formErrors: Record<string, string>;
  updateFormField: (field: string, value: any) => void;
  relatedData: RelatedData;
  visibleColumns?: any[];
  getColumnDisplayName?: (columnName: string) => string;
}

export const NormalUpdateForm: React.FC<NormalUpdateFormProps> = ({
  config,
  formData,
  formErrors,
  updateFormField,
  relatedData,
  visibleColumns = [],
  getColumnDisplayName
}) => {
  const { t } = useLanguage();

  // Obtener campos de clave primaria
  const primaryKeyFields = useMemo(() => {
    if (!config) return [];
    const pk = getPrimaryKey(config.name);
    return Array.isArray(pk) ? pk : [pk];
  }, [config]);

  // Función helper para obtener nombre de columna
  const getColumnDisplayNameHelper = useMemo(() => {
    return getColumnDisplayName || ((columnName: string) => 
      getColumnDisplayNameTranslated(columnName, t)
    );
  }, [getColumnDisplayName, t]);

  if (!config) return null;

  // Filtrar campos editables (excluir hidden)
  const editableFields = config.fields.filter(f => !f.hidden);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {editableFields.map(field => {
          const isPrimaryKey = primaryKeyFields.includes(field.name);
          const isStatusId = field.name === 'statusid';
          const displayName = getColumnDisplayNameHelper(field.name);

          return (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isPrimaryKey && <span className="mr-1">🔒</span>}
                {displayName} {field.required && !isPrimaryKey && <span className="text-red-500">*</span>}
              </label>

              {isPrimaryKey ? (
                // Campo de clave primaria: solo lectura
                <input
                  type="text"
                  value={formData[field.name] ?? ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 cursor-not-allowed"
                />
              ) : field.foreignKey ? (
                // Select para foreign keys
                <select
                  value={formData[field.name] != null ? String(formData[field.name]) : ''}
                  onChange={(e) => updateFormField(field.name, e.target.value ? Number(e.target.value) : null)}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-neutral-800 dark:border-neutral-700 ${
                    formErrors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar...</option>
                  {((relatedData as any)[field.foreignKey.table] || []).map((item: any) => {
                    const labelFields = Array.isArray(field.foreignKey!.labelField) 
                      ? field.foreignKey!.labelField 
                      : [field.foreignKey!.labelField];
                    const label = labelFields.map(lf => item[lf]).filter(Boolean).join(' ');
                    const itemValue = String(item[field.foreignKey!.valueField]);
                    return (
                      <option key={itemValue} value={itemValue}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              ) : isStatusId ? (
                // Statusid como checkbox
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData[field.name] === 1 || formData[field.name] === true}
                    onChange={(e) => updateFormField(field.name, e.target.checked ? 1 : 0)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formData[field.name] === 1 || formData[field.name] === true ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => updateFormField(field.name, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-neutral-800 dark:border-neutral-700 ${
                    formErrors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                />
              ) : field.type === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={formData[field.name] || false}
                  onChange={(e) => updateFormField(field.name, e.target.checked)}
                  className="w-5 h-5"
                />
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                  value={formData[field.name] ?? ''}
                  onChange={(e) => updateFormField(
                    field.name, 
                    field.type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value
                  )}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-neutral-800 dark:border-neutral-700 ${
                    formErrors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}

              {formErrors[field.name] && (
                <p className="text-red-500 text-xs mt-1">{formErrors[field.name]}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
