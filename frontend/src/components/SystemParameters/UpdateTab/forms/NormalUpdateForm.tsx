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

// Campos foreign key que tienen constraints y no se pueden cambiar en UPDATE
const CONSTRAINED_FOREIGN_KEYS: Record<string, string[]> = {
  empresa: ['paisid'], // No se puede cambiar el país de una empresa
  fundo: ['empresaid'], // No se puede cambiar la empresa de un fundo
  ubicacion: ['fundoid'], // No se puede cambiar el fundo de una ubicación
  nodo: ['entidadid'], // No se puede cambiar la entidad de un nodo
  sensor: ['nodoid', 'tipoid'], // No se puede cambiar el nodo o tipo de un sensor
  metricasensor: ['nodoid', 'metricaid', 'tipoid'], // No se puede cambiar nodo, métrica o tipo
  localizacion: ['entidadid', 'nodoid'], // No se puede cambiar entidad o nodo
  // Agregar más según sea necesario
};

// Mapeo de nombres de tabla a claves en relatedData
const tableToRelatedDataKey: Record<string, string> = {
  pais: 'paisesData',
  empresa: 'empresasData',
  fundo: 'fundosData',
  ubicacion: 'ubicacionesData',
  localizacion: 'localizacionesData',
  entidad: 'entidadesData',
  nodo: 'nodosData',
  tipo: 'tiposData',
  metrica: 'metricasData',
  criticidad: 'criticidadesData',
  perfil: 'perfilesData',
  usuario: 'userData',
  umbral: 'umbralesData'
};

interface NormalUpdateFormProps {
  config: TableConfig | null;
  formData: Record<string, any>;
  formErrors: Record<string, string>;
  updateFormField: (field: string, value: any) => void;
  relatedData: RelatedData;
  visibleColumns?: any[];
  getColumnDisplayName?: (columnName: string) => string;
  getUniqueOptionsForField?: (columnName: string) => Array<{value: any, label: string}>;
  tableName?: string;
  themeColor?: 'orange' | 'red' | 'blue' | 'green';
}

export const NormalUpdateForm: React.FC<NormalUpdateFormProps> = ({
  config,
  formData,
  formErrors,
  updateFormField,
  relatedData,
  visibleColumns = [],
  getColumnDisplayName,
  getUniqueOptionsForField,
  tableName,
  themeColor = 'orange'
}) => {
  const { t } = useLanguage();
  
  // Helper para obtener clases de color según el tema
  const getThemeColor = (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => {
    const colors = {
      red: {
        text: 'text-red-500',
        bg: 'bg-red-500',
        hover: 'hover:bg-red-600',
        focus: 'focus:ring-red-500',
        border: 'border-red-500'
      },
      blue: {
        text: 'text-blue-500',
        bg: 'bg-blue-500',
        hover: 'hover:bg-blue-600',
        focus: 'focus:ring-blue-500',
        border: 'border-blue-500'
      },
      green: {
        text: 'text-green-500',
        bg: 'bg-green-500',
        hover: 'hover:bg-green-600',
        focus: 'focus:ring-green-500',
        border: 'border-green-500'
      },
      orange: {
        text: 'text-orange-500',
        bg: 'bg-orange-500',
        hover: 'hover:bg-orange-600',
        focus: 'focus:ring-orange-500',
        border: 'border-orange-500'
      }
    };
    return colors[themeColor]?.[type] || colors.orange[type];
  };

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

  // Función helper para determinar si un campo foreign key tiene constraint
  const isConstrainedField = (fieldName: string): boolean => {
    const constrainedFields = CONSTRAINED_FOREIGN_KEYS[tableName || ''];
    return constrainedFields ? constrainedFields.includes(fieldName) : false;
  };

  // Función helper para obtener datos de una tabla relacionada desde relatedData
  const getRelatedTableData = (tableName: string): any[] => {
    const dataKey = tableToRelatedDataKey[tableName];
    if (!dataKey) {
      return [];
    }
    const data = (relatedData as any)[dataKey];
    return data || [];
  };

  // Función helper para obtener el label de un foreign key desde relatedData
  const getForeignKeyLabel = (field: any, value: any): string => {
    if (!value || !field.foreignKey) return '';
    const relatedTableData = getRelatedTableData(field.foreignKey.table);
    const item = relatedTableData.find((item: any) => 
      String(item[field.foreignKey.valueField]) === String(value)
    );
    if (!item) return '';
    const labelFields = Array.isArray(field.foreignKey.labelField) 
      ? field.foreignKey.labelField 
      : [field.foreignKey.labelField];
    return labelFields.map((lf: string) => item[lf]).filter(Boolean).join(' ');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {editableFields.map(field => {
          const isPrimaryKey = primaryKeyFields.includes(field.name);
          const isStatusId = field.name === 'statusid';
          const displayName = getColumnDisplayNameHelper(field.name);

          const isConstrained = isConstrainedField(field.name);
          const fieldValue = formData[field.name];
          const isRequired = field.required && !isPrimaryKey;
          
          // Debug para campos específicos
          if (field.name === 'empresaid' || field.name === 'fundo' || field.name === 'fundoabrev' || field.name === 'paisid') {
            console.log(`🔍 [NormalUpdateForm] Campo ${field.name}:`, {
              fieldValue,
              formDataValue: formData[field.name],
              isConstrained,
              hasForeignKey: !!field.foreignKey,
              foreignKeyTable: field.foreignKey?.table,
              relatedDataExists: field.foreignKey ? !!(relatedData as any)[field.foreignKey.table] : false,
              relatedDataLength: field.foreignKey ? ((relatedData as any)[field.foreignKey.table] || []).length : 0
            });
          }

          return (
            <div key={field.name} className="mb-4">
              {!isStatusId && (
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {isPrimaryKey && <span className="mr-1">🔒</span>}
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
              )}

              {isPrimaryKey ? (
                // Campo de clave primaria: solo lectura
                <input
                  type="text"
                  value={formData[field.name] ?? ''}
                  readOnly
                  className="w-full px-3 py-2 border border-neutral-600 rounded-lg bg-neutral-700 text-neutral-400 cursor-not-allowed font-mono"
                />
              ) : field.name === 'jefeid' && tableName === 'perfil' && getUniqueOptionsForField ? (
                // Caso especial para jefeid en perfil: usar getUniqueOptionsForField para formato "nivel - perfil"
                <SelectWithPlaceholder
                  value={formData[field.name] != null ? String(formData[field.name]) : ''}
                  onChange={(newValue) => updateFormField(field.name, newValue ? Number(newValue) : null)}
                  options={getUniqueOptionsForField(field.name)}
                  placeholder="SELECCIONAR JEFE (NIVEL - PERFIL)"
                />
              ) : field.foreignKey && isConstrained ? (
                // Campo foreign key con constraint: mostrar como SelectWithPlaceholder disabled con valor actual
                (() => {
                  const fieldValue = formData[field.name];
                  const relatedTableData = getRelatedTableData(field.foreignKey!.table);
                  const options = relatedTableData.map((item: any) => {
                    const labelFields = Array.isArray(field.foreignKey!.labelField) 
                      ? field.foreignKey!.labelField 
                      : [field.foreignKey!.labelField];
                    const label = labelFields.map((lf: string) => item[lf]).filter(Boolean).join(' ');
                    const itemValue = item[field.foreignKey!.valueField];
                    return {
                      value: itemValue, // Mantener el tipo original (número o string)
                      label: label || `ID: ${itemValue}`
                    };
                  });
                  
                  return (
                    <SelectWithPlaceholder
                      value={fieldValue != null && fieldValue !== '' ? fieldValue : null}
                      onChange={() => {}} // No permitir cambios
                      options={options}
                      placeholder={`${displayName.toUpperCase()}`}
                      disabled={true}
                    />
                  );
                })()
              ) : field.foreignKey ? (
                // Select para foreign keys sin constraint: usar SelectWithPlaceholder
                <SelectWithPlaceholder
                  value={formData[field.name] != null ? formData[field.name] : null}
                  onChange={(newValue) => updateFormField(field.name, newValue ? Number(newValue) : null)}
                  options={(() => {
                    const relatedTableData = getRelatedTableData(field.foreignKey!.table);
                    return relatedTableData.map((item: any) => {
                      const labelFields = Array.isArray(field.foreignKey!.labelField) 
                        ? field.foreignKey!.labelField 
                        : [field.foreignKey!.labelField];
                      const label = labelFields.map((lf: string) => item[lf]).filter(Boolean).join(' ');
                      return {
                        value: item[field.foreignKey!.valueField],
                        label: label || `ID: ${item[field.foreignKey!.valueField]}`
                      };
                    });
                  })()}
                  placeholder={`${t('buttons.select')} ${displayName.toUpperCase()}`}
                />
              ) : isStatusId ? (
                // Statusid como checkbox - estilo similar a CREAR
                <div>
                  <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                    {displayName.toUpperCase()}{field.required ? '*' : ''}
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData[field.name] === 1 || formData[field.name] === true}
                      onChange={(e) => updateFormField(field.name, e.target.checked ? 1 : 0)}
                      className={`w-5 h-5 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2`}
                    />
                    <span className="text-white font-mono tracking-wider">
                      {formData[field.name] === 1 || formData[field.name] === true ? t('create.active') : t('create.inactive')}
                    </span>
                  </div>
                </div>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => updateFormField(field.name, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${getThemeColor('focus')} ${getThemeColor('border')} text-white text-base placeholder-neutral-400 font-mono bg-neutral-800 border-neutral-600`}
                  rows={3}
                />
              ) : field.type === 'boolean' ? (
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData[field.name] || false}
                    onChange={(e) => updateFormField(field.name, e.target.checked)}
                    className={`w-5 h-5 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2`}
                  />
                  <span className="text-white font-mono tracking-wider">
                    {formData[field.name] ? t('create.active') : t('create.inactive')}
                  </span>
                </div>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                  value={formData[field.name] ?? ''}
                  onChange={(e) => updateFormField(
                    field.name, 
                    field.type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value
                  )}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${getThemeColor('focus')} ${getThemeColor('border')} text-white text-base placeholder-neutral-400 font-mono bg-neutral-800 border-neutral-600 ${
                    formErrors[field.name] ? 'border-red-500' : ''
                  }`}
                  placeholder={`${displayName.toUpperCase()}`}
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
