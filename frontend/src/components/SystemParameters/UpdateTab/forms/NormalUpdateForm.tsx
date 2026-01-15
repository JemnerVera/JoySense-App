/**
 * Componente para renderizar formulario de actualización normal
 * Similar a NormalInsertForm pero con campos clave como solo lectura
 */

import React, { useMemo } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../../../../utils/systemParametersUtils';
import { getPrimaryKey } from '../../../../config/tables.config';
import SelectWithPlaceholder from '../../../SelectWithPlaceholder';
import { ContactoFormFields } from '../../../forms/table-specific/ContactoFormFields';
import { UsuarioCanalFormFields } from '../../../forms/table-specific/UsuarioCanalFormFields';
import { UsuarioFormFields } from '../../../forms/table-specific/UsuarioFormFields';
import { UsuarioPerfilFormFields } from '../../../forms/table-specific/UsuarioPerfilFormFields';
import type { TableConfig } from '../../../../config/tables.config';
import type { RelatedData } from '../../../../utils/systemParametersUtils';
import { logger } from '../../../../utils/logger';

// Campos foreign key que tienen constraints y no se pueden cambiar en UPDATE
const CONSTRAINED_FOREIGN_KEYS: Record<string, string[]> = {
  empresa: ['paisid'], // No se puede cambiar el país de una empresa
  fundo: ['empresaid'], // No se puede cambiar la empresa de un fundo
  ubicacion: ['fundoid'], // No se puede cambiar el fundo de una ubicación
  nodo: ['entidadid'], // No se puede cambiar la entidad de un nodo
  sensor: ['nodoid', 'tipoid'], // No se puede cambiar el nodo o tipo de un sensor
  metricasensor: ['nodoid', 'metricaid', 'tipoid'], // No se puede cambiar nodo, métrica o tipo
  localizacion: ['nodoid', 'sensorid', 'metricaid'], // No se puede cambiar nodo, sensor o métrica
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
  sensor: 'sensorsData',
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
  themeColor?: 'orange' | 'red' | 'blue' | 'green' | 'purple' | 'cyan';
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
      },
      purple: {
        text: 'text-purple-500',
        bg: 'bg-purple-500',
        hover: 'hover:bg-purple-600',
        focus: 'focus:ring-purple-500',
        border: 'border-purple-500'
      },
      cyan: {
        text: 'text-cyan-500',
        bg: 'bg-cyan-500',
        hover: 'hover:bg-cyan-600',
        focus: 'focus:ring-cyan-500',
        border: 'border-cyan-500'
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

  // Separar código de país del número de celular si viene concatenado (solo para contacto)
  // Este hook debe estar antes de cualquier early return
  const processedFormData = useMemo(() => {
    if (tableName !== 'contacto') return formData;
    
    if (!formData.celular) return formData;
    
    const celular = formData.celular;
    // Si el celular ya tiene codigotelefonoid, no hacer nada
    if (formData.codigotelefonoid) {
      return formData;
    }
    
    // Intentar extraer el código de país del número
    // Formato esperado: +51960596666 o 51960596666
    const codigoMatch = celular.match(/^(\+?\d{1,3})(\d+)$/);
    if (codigoMatch) {
      const codigoCompleto = codigoMatch[1].startsWith('+') ? codigoMatch[1] : `+${codigoMatch[1]}`;
      const numeroCelular = codigoMatch[2];
      
      // Buscar el codigotelefonoid que coincida con el código
      const codigotelefonosData = (relatedData as any)?.codigotelefonosData || [];
      const codigoEncontrado = codigotelefonosData.find((c: any) => 
        c.codigotelefono === codigoCompleto
      );
      
      if (codigoEncontrado) {
        return {
          ...formData,
          codigotelefonoid: codigoEncontrado.codigotelefonoid,
          celular: numeroCelular
        };
      }
    }
    
    return formData;
  }, [formData, relatedData, tableName]);

  if (!config) return null;

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

  // Layout específico para localizacion
  const currentTableName = tableName || config?.name || '';
  if (currentTableName === 'localizacion') {
    // Layout específico para localizacion:
    // Fila 1: NODO, ID DEL SENSOR, METRICA
    // Fila 2: LOCALIZACION, LATITUD, LONGITUD
    // Fila 3: (VACIO), REFERENCIA, STATUS
    const nodoField = config.fields.find(f => f.name === 'nodoid');
    const sensorField = config.fields.find(f => f.name === 'sensorid');
    const metricaField = config.fields.find(f => f.name === 'metricaid');
    const localizacionField = config.fields.find(f => f.name === 'localizacion');
    const latitudField = config.fields.find(f => f.name === 'latitud');
    const longitudField = config.fields.find(f => f.name === 'longitud');
    const referenciaField = config.fields.find(f => f.name === 'referencia');
    const statusField = config.fields.find(f => f.name === 'statusid');
    
    const renderField = (field: any) => {
      const isPrimaryKey = primaryKeyFields.includes(field.name);
      const isStatusId = field.name === 'statusid';
      const displayName = getColumnDisplayNameHelper(field.name);
      const isConstrained = isConstrainedField(field.name);
      const fieldValue = formData[field.name];
      const isRequired = field.required && !isPrimaryKey;
      
      return (
        <div key={field.name} className="mb-4">
          {!isStatusId && (
            <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
              {isPrimaryKey && <span className="mr-1">🔒</span>}
              {displayName.toUpperCase()}{isRequired ? '*' : ''}
            </label>
          )}

          {isPrimaryKey ? (
            // Si es clave primaria compuesta (múltiples campos) Y tiene foreignKey, permitir selección
            // Si es clave primaria simple, mostrar como readonly
            (primaryKeyFields.length > 1 && field.foreignKey) ? (
              // Clave primaria compuesta con foreignKey: renderizar como combobox editable
              <SelectWithPlaceholder
                value={formData[field.name] || ''}
                onChange={(newValue) => updateFormField(field.name, newValue ? Number(newValue) : null)}
                options={(() => {
                  const relatedTableData = getRelatedTableData(field.foreignKey!.table);
                  // Caso especial para sensorid en metricasensor: mostrar "sensor - tipo"
                  if (field.name === 'sensorid' && (config?.name === 'metricasensor' || tableName === 'metricasensor')) {
                    const tiposData = (relatedData as any)?.tiposData || [];
                    const tiposMap = new Map(tiposData.map((t: any) => [t.tipoid, t.tipo]));
                    return relatedTableData.map((item: any) => {
                      const sensorName = item.sensor || '';
                      const tipoName = tiposMap.get(item.tipoid) || '';
                      const label = tipoName ? `${sensorName} - ${tipoName}` : sensorName || String(item[field.foreignKey!.valueField]);
                      return {
                        value: String(item[field.foreignKey!.valueField]),
                        label: label
                      };
                    });
                  }
                  // Caso general: usar labelField
                  return relatedTableData.map((item: any) => {
                    const labelFields = Array.isArray(field.foreignKey!.labelField) 
                      ? field.foreignKey!.labelField 
                      : [field.foreignKey!.labelField];
                    const label = labelFields.map((lf: string) => item[lf]).filter(Boolean).join(' ');
                    return {
                      value: String(item[field.foreignKey!.valueField]),
                      label: label || String(item[field.foreignKey!.valueField])
                    };
                  });
                })()}
                placeholder={`${t('buttons.select')} ${displayName.toUpperCase()}`}
              />
            ) : field.foreignKey ? (
              // Clave primaria simple con foreignKey: mostrar nombre como readonly
              (() => {
                const relatedTableData = getRelatedTableData(field.foreignKey!.table);
                const fieldValue = formData[field.name];
                const item = relatedTableData.find((item: any) => 
                  String(item[field.foreignKey!.valueField]) === String(fieldValue)
                );
                const labelFields = Array.isArray(field.foreignKey!.labelField) 
                  ? field.foreignKey!.labelField 
                  : [field.foreignKey!.labelField];
                const displayValue = item 
                  ? labelFields.map((lf: string) => item[lf]).filter(Boolean).join(' ')
                  : fieldValue ?? '';
                
                return (
                  <input
                    type="text"
                    value={displayValue}
                    readOnly
                    className="w-full px-3 py-2 border border-neutral-600 rounded-lg bg-neutral-700 text-neutral-400 cursor-not-allowed font-mono"
                  />
                );
              })()
            ) : (
              // Clave primaria simple sin foreignKey: mostrar ID como readonly
              <input
                type="text"
                value={formData[field.name] ?? ''}
                readOnly
                className="w-full px-3 py-2 border border-neutral-600 rounded-lg bg-neutral-700 text-neutral-400 cursor-not-allowed font-mono"
              />
            )
          ) : field.foreignKey && isConstrained ? (
            (() => {
              const relatedTableData = getRelatedTableData(field.foreignKey!.table);
              const options = relatedTableData.map((item: any) => {
                const labelFields = Array.isArray(field.foreignKey!.labelField) 
                  ? field.foreignKey!.labelField 
                  : [field.foreignKey!.labelField];
                const label = labelFields.map((lf: string) => item[lf]).filter(Boolean).join(' ');
                const itemValue = item[field.foreignKey!.valueField];
                return {
                  value: itemValue,
                  label: label || `ID: ${itemValue}`
                };
              });
              
              return (
                <SelectWithPlaceholder
                  value={fieldValue != null && fieldValue !== '' ? fieldValue : null}
                  onChange={() => {}}
                  options={options}
                  placeholder={`${displayName.toUpperCase()}`}
                  disabled={true}
                />
              );
            })()
          ) : field.foreignKey ? (
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
            <div>
              <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                {displayName.toUpperCase()}{field.required ? '*' : ''}
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData[field.name] === 1 || formData[field.name] === true}
                  onChange={(e) => updateFormField(field.name, e.target.checked ? 1 : 0)}
                  className={`w-5 h-5 ${getThemeColor('text')} bg-neutral-800 border-neutral-600 rounded ${getThemeColor('focus')} focus:ring-2`}
                />
                <span className="text-white font-mono tracking-wider">
                  {formData[field.name] === 1 || formData[field.name] === true ? t('create.active') : t('create.inactive')}
                </span>
              </div>
            </div>
          ) : (
            <input
              type={field.type === 'number' ? 'number' : 'text'}
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
    };
    
    return (
      <div className="space-y-4">
        {/* Fila 1: NODO, ID DEL SENSOR, METRICA */}
        {(nodoField || sensorField || metricaField) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {nodoField && !nodoField.hidden && renderField(nodoField)}
            {sensorField && !sensorField.hidden && renderField(sensorField)}
            {metricaField && !metricaField.hidden && renderField(metricaField)}
          </div>
        )}
        
        {/* Fila 2: LOCALIZACION, LATITUD, LONGITUD */}
        {(localizacionField || latitudField || longitudField) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {localizacionField && !localizacionField.hidden && renderField(localizacionField)}
            {latitudField && !latitudField.hidden && renderField(latitudField)}
            {longitudField && !longitudField.hidden && renderField(longitudField)}
          </div>
        )}
        
        {/* Fila 3: (VACIO), REFERENCIA, STATUS */}
        {(referenciaField || statusField) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div></div> {/* Espacio vacío */}
            {referenciaField && !referenciaField.hidden && renderField(referenciaField)}
            {statusField && !statusField.hidden && renderField(statusField)}
          </div>
        )}
      </div>
    );
  }

  // Filtrar campos editables (excluir hidden)
  const editableFields = config.fields.filter(f => !f.hidden);

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

  // Caso especial para contacto: usar ContactoFormFields
  if (tableName === 'contacto') {
    return (
      <ContactoFormFields
        visibleColumns={visibleColumns}
        formData={processedFormData}
        setFormData={(data) => {
          // Actualizar cada campo individualmente
          Object.keys(data).forEach(key => {
            updateFormField(key, data[key]);
          });
        }}
        updateField={updateFormField}
        getThemeColor={getThemeColor}
        getUniqueOptionsForField={getUniqueOptionsForField || (() => [])}
        codigotelefonosData={(relatedData as any)?.codigotelefonosData || []}
      />
    );
  }

  // Caso especial para usuario: usar UsuarioFormFields
  if (tableName === 'usuario') {
    // Función helper para renderizar campos (similar a renderField pero adaptada para UPDATE)
    const renderFieldForUpdate = (col: any) => {
      const field = config?.fields.find(f => f.name === col.columnName);
      if (!field) return null;
      
      const fieldValue = formData[col.columnName];
      const displayName = getColumnDisplayNameHelper(col.columnName);
      const isPrimaryKey = primaryKeyFields.includes(col.columnName);
      const isReadonly = field.readonly || isPrimaryKey || isConstrainedField(col.columnName);
      
      if (isReadonly) {
        return (
          <div key={col.columnName} className="mb-4">
            <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
              {isPrimaryKey && <span className="mr-1">🔒</span>}
              {displayName.toUpperCase()}
            </label>
            <input
              type="text"
              value={fieldValue != null ? String(fieldValue) : ''}
              readOnly
              className="w-full px-3 py-2 border border-neutral-600 rounded-lg bg-neutral-700 text-neutral-400 cursor-not-allowed font-mono"
            />
          </div>
        );
      }
      
      // Campo editable normal
      return (
        <div key={col.columnName} className="mb-4">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {displayName.toUpperCase()}{field.required ? '*' : ''}
          </label>
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            value={fieldValue != null ? String(fieldValue) : ''}
            onChange={(e) => updateFormField(col.columnName, field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
            className={`w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white font-mono focus:outline-none focus:ring-2 ${getThemeColor('focus')}`}
          />
        </div>
      );
    };
    
    return (
      <UsuarioFormFields
        visibleColumns={visibleColumns}
        formData={formData}
        setFormData={(data) => {
          // Actualizar cada campo individualmente
          Object.keys(data).forEach(key => {
            updateFormField(key, data[key]);
          });
        }}
        renderField={renderFieldForUpdate}
        getThemeColor={getThemeColor}
        empresasData={(relatedData as any)?.empresasData || []}
        getUniqueOptionsForField={getUniqueOptionsForField || (() => [])}
      />
    );
  }

  // Caso especial para usuarioperfil: usar UsuarioPerfilFormFields
  if (tableName === 'usuarioperfil') {
    // Obtener perfiles existentes del formData (vienen de selectedRow._allRows)
    const existingPerfiles = (formData as any)?._allRows || [];
    
    return (
      <UsuarioPerfilFormFields
        visibleColumns={visibleColumns}
        formData={formData}
        setFormData={(data: Record<string, any>) => {
          // Actualizar cada campo individualmente
          Object.keys(data).forEach(key => {
            updateFormField(key, data[key]);
          });
        }}
        renderField={() => null} // No renderizar campos adicionales
        getThemeColor={getThemeColor}
        getUniqueOptionsForField={getUniqueOptionsForField || (() => [])}
        perfilesData={(relatedData as any)?.perfilesData || []}
        existingPerfiles={existingPerfiles}
        isUpdateMode={true}
      />
    );
  }

  // Caso especial para usuario_canal: usar UsuarioCanalFormFields
  if (tableName === 'usuario_canal') {
    return (
      <UsuarioCanalFormFields
        visibleColumns={visibleColumns}
        formData={formData}
        setFormData={(data) => {
          // Actualizar cada campo individualmente
          Object.keys(data).forEach(key => {
            updateFormField(key, data[key]);
          });
        }}
        updateField={updateFormField}
        getThemeColor={getThemeColor}
        getUniqueOptionsForField={getUniqueOptionsForField || (() => [])}
        contactosData={(relatedData as any)?.contactosData || []}
        correosData={(relatedData as any)?.correosData || []}
        canalesData={(relatedData as any)?.canalesData || []}
        codigotelefonosData={(relatedData as any)?.codigotelefonosData || []}
      />
    );
  }

  // Layout específico para umbral
  if (tableName === 'umbral') {
    // Layout específico para umbral:
    // Fila 1: Nombre Umbral, Métrica, Operador
    // Fila 2: Mínimo, Máximo, Estándar
    // Fila 3: (vacío), Inversión, Status
    const umbralidField = config?.fields.find(f => f.name === 'umbralid');
    const umbralField = config?.fields.find(f => f.name === 'umbral');
    const metricaField = config?.fields.find(f => f.name === 'metricaid');
    const operadorField = config?.fields.find(f => f.name === 'operador');
    const minimoField = config?.fields.find(f => f.name === 'minimo');
    const maximoField = config?.fields.find(f => f.name === 'maximo');
    const estandarField = config?.fields.find(f => f.name === 'estandar');
    const inversionField = config?.fields.find(f => f.name === 'inversion');
    const statusField = config?.fields.find(f => f.name === 'statusid');
    
    const renderField = (field: any) => {
      const isPrimaryKey = primaryKeyFields.includes(field.name);
      const isStatusId = field.name === 'statusid';
      const displayName = getColumnDisplayNameHelper(field.name);
      const isConstrained = isConstrainedField(field.name);
      const fieldValue = formData[field.name];
      const isRequired = field.required && !isPrimaryKey;
      
      return (
        <div key={field.name} className="mb-4">
          {!isStatusId && (
            <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
              {isPrimaryKey && <span className="mr-1">🔒</span>}
              {displayName.toUpperCase()}{isRequired ? '*' : ''}
            </label>
          )}

          {isPrimaryKey ? (
            <input
              type="text"
              value={formData[field.name] ?? ''}
              readOnly
              className="w-full px-3 py-2 border border-neutral-600 rounded-lg bg-neutral-700 text-neutral-400 cursor-not-allowed font-mono"
            />
          ) : field.name === 'operador' ? (
            // Campo operador - select con opciones válidas
            (() => {
              const operadorOptions = [
                { value: '', label: '' },
                { value: 'FUERA', label: 'FUERA' },
                { value: 'OUTSIDE', label: 'OUTSIDE' },
                { value: 'OUT_OF_RANGE', label: 'OUT_OF_RANGE' },
                { value: 'RANGO', label: 'RANGO' },
                { value: 'DENTRO', label: 'DENTRO' },
                { value: 'INSIDE', label: 'INSIDE' },
                { value: 'IN_RANGE', label: 'IN_RANGE' },
                { value: 'BETWEEN', label: 'BETWEEN' },
                { value: '>', label: '>' },
                { value: '>=', label: '>=' },
                { value: '<', label: '<' },
                { value: '<=', label: '<=' }
              ];
              
              return (
                <SelectWithPlaceholder
                  value={formData[field.name] || ''}
                  onChange={(newValue) => updateFormField(field.name, newValue || '')}
                  options={operadorOptions}
                  placeholder={`${t('buttons.select')} ${displayName.toUpperCase()}`}
                />
              );
            })()
          ) : field.name === 'inversion' ? (
            // Campo inversion - checkbox (sin label adicional, ya se muestra arriba)
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={fieldValue === true || fieldValue === 1}
                onChange={(e) => updateFormField(field.name, e.target.checked)}
                className={`w-5 h-5 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2`}
              />
              <span className="text-white font-mono tracking-wider">
                {fieldValue === true || fieldValue === 1 ? 'Sí' : 'No'}
              </span>
            </div>
          ) : field.foreignKey ? (
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
            <div>
              <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                {displayName.toUpperCase()}{field.required ? '*' : ''}
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData[field.name] === 1 || formData[field.name] === true}
                  onChange={(e) => updateFormField(field.name, e.target.checked ? 1 : 0)}
                  className={`w-5 h-5 ${getThemeColor('text')} bg-neutral-800 border-neutral-600 rounded ${getThemeColor('focus')} focus:ring-2`}
                />
                <span className="text-white font-mono tracking-wider">
                  {formData[field.name] === 1 || formData[field.name] === true ? t('create.active') : t('create.inactive')}
                </span>
              </div>
            </div>
          ) : (
            <input
              type={field.type === 'number' ? 'number' : 'text'}
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
    };
    
    return (
      <div className="space-y-4">
        {/* Fila 1: Nombre Umbral, Métrica, Operador */}
        {(umbralField || metricaField || operadorField) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {umbralField && renderField(umbralField)}
            {metricaField && renderField(metricaField)}
            {operadorField && renderField(operadorField)}
          </div>
        )}

        {/* Fila 2: Mínimo, Máximo, Estándar */}
        {(minimoField || maximoField || estandarField) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {minimoField && renderField(minimoField)}
            {maximoField && renderField(maximoField)}
            {estandarField && renderField(estandarField)}
          </div>
        )}

        {/* Fila 3: (vacío), Inversión, Status */}
        {(inversionField || statusField) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div></div> {/* Espacio vacío */}
            {inversionField && renderField(inversionField)}
            {statusField && renderField(statusField)}
          </div>
        )}
      </div>
    );
  }

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

          return (
            <div key={field.name} className="mb-4">
              {!isStatusId && (
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {isPrimaryKey && <span className="mr-1">🔒</span>}
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
              )}

              {isPrimaryKey ? (
                // Si es clave primaria compuesta (múltiples campos) Y tiene foreignKey, permitir selección
                // Si es clave primaria simple, mostrar como readonly
                (primaryKeyFields.length > 1 && field.foreignKey) ? (
                  // Clave primaria compuesta con foreignKey: renderizar como combobox editable
                  <SelectWithPlaceholder
                    value={formData[field.name] || ''}
                    onChange={(newValue) => updateFormField(field.name, newValue ? Number(newValue) : null)}
                    options={(() => {
                      const relatedTableData = getRelatedTableData(field.foreignKey!.table);
                      // Caso especial para sensorid en metricasensor: mostrar "sensor - tipo"
                      if (field.name === 'sensorid' && (config?.name === 'metricasensor' || tableName === 'metricasensor')) {
                        const tiposData = (relatedData as any)?.tiposData || [];
                        const tiposMap = new Map(tiposData.map((t: any) => [t.tipoid, t.tipo]));
                        return relatedTableData.map((item: any) => {
                          const sensorName = item.sensor || '';
                          const tipoName = tiposMap.get(item.tipoid) || '';
                          const label = tipoName ? `${sensorName} - ${tipoName}` : sensorName || String(item[field.foreignKey!.valueField]);
                          return {
                            value: String(item[field.foreignKey!.valueField]),
                            label: label
                          };
                        });
                      }
                      // Caso general: usar labelField
                      return relatedTableData.map((item: any) => {
                        const labelFields = Array.isArray(field.foreignKey!.labelField) 
                          ? field.foreignKey!.labelField 
                          : [field.foreignKey!.labelField];
                        const label = labelFields.map((lf: string) => item[lf]).filter(Boolean).join(' ');
                        return {
                          value: String(item[field.foreignKey!.valueField]),
                          label: label || String(item[field.foreignKey!.valueField])
                        };
                      });
                    })()}
                    placeholder={`${t('buttons.select')} ${displayName.toUpperCase()}`}
                  />
                ) : field.foreignKey ? (
                  // Clave primaria simple con foreignKey: mostrar nombre como readonly
                  (() => {
                    const relatedTableData = getRelatedTableData(field.foreignKey!.table);
                    const fieldValue = formData[field.name];
                    const item = relatedTableData.find((item: any) => 
                      String(item[field.foreignKey!.valueField]) === String(fieldValue)
                    );
                    const labelFields = Array.isArray(field.foreignKey!.labelField) 
                      ? field.foreignKey!.labelField 
                      : [field.foreignKey!.labelField];
                    const displayValue = item 
                      ? labelFields.map((lf: string) => item[lf]).filter(Boolean).join(' ')
                      : fieldValue ?? '';
                    
                    return (
                      <input
                        type="text"
                        value={displayValue}
                        readOnly
                        className="w-full px-3 py-2 border border-neutral-600 rounded-lg bg-neutral-700 text-neutral-400 cursor-not-allowed font-mono"
                      />
                    );
                  })()
                ) : (
                  // Clave primaria simple sin foreignKey: mostrar ID como readonly
                  <input
                    type="text"
                    value={formData[field.name] ?? ''}
                    readOnly
                    className="w-full px-3 py-2 border border-neutral-600 rounded-lg bg-neutral-700 text-neutral-400 cursor-not-allowed font-mono"
                  />
                )
              ) : field.name === 'jefeid' && tableName === 'perfil' && getUniqueOptionsForField ? (
                // Caso especial para jefeid en perfil: usar getUniqueOptionsForField para formato "nivel - perfil"
                <SelectWithPlaceholder
                  value={formData[field.name] != null ? String(formData[field.name]) : ''}
                  onChange={(newValue) => updateFormField(field.name, newValue ? Number(newValue) : null)}
                  options={getUniqueOptionsForField(field.name)}
                  placeholder="SELECCIONAR JEFE (NIVEL - PERFIL)"
                  themeColor="orange"
                />
              ) : field.name === 'nivel' && tableName === 'perfil' ? (
                // Caso especial para nivel en perfil: mostrar "nivel - PERFIL"
                (() => {
                  const nivelOptions = Array.from({ length: 10 }, (_, i) => {
                    const nivel = i + 1; // 1 al 10
                    const perfilNombre = formData.perfil || 'PERFIL';
                    return {
                      value: nivel,
                      label: `${nivel} - ${perfilNombre}`
                    };
                  });
                  
                  const selectedNivel = formData.nivel !== null && formData.nivel !== undefined ? Number(formData.nivel) : null;
                  const perfilNombre = formData.perfil || 'PERFIL';
                  const placeholderText = selectedNivel ? `${selectedNivel} - ${perfilNombre}` : 'SELECCIONAR NIVEL';
                  
                  return (
                    <SelectWithPlaceholder
                      value={selectedNivel}
                      onChange={(newValue) => {
                        const parsedValue = newValue !== null && newValue !== undefined ? parseInt(newValue.toString()) : null;
                        updateFormField('nivel', parsedValue);
                      }}
                      options={nivelOptions}
                      placeholder={placeholderText}
                      themeColor="orange"
                    />
                  );
                })()
              ) : field.name === 'is_admin_global' && tableName === 'perfil' ? (
                // Caso especial para is_admin_global en perfil: toggle switch
                (() => {
                  const fieldValue = formData[field.name];
                  const isChecked = fieldValue === true || fieldValue === 'true' || fieldValue === 1;
                  const currentValue = isChecked ? true : false;
                  const themeBgColor = 'bg-orange-500';
                  const themeTextColor = 'text-orange-500';
                  
                  return (
                    <div className="flex items-center space-x-4">
                      {/* Toggle Switch con animación */}
                      <div
                        onClick={() => {
                          updateFormField(field.name, !currentValue);
                        }}
                        className={`relative inline-flex h-10 w-20 cursor-pointer items-center rounded-full transition-colors duration-300 ease-in-out ${
                          currentValue
                            ? themeBgColor
                            : 'bg-gray-300 dark:bg-neutral-700'
                        }`}
                        role="switch"
                        aria-checked={currentValue}
                      >
                        {/* Slider (círculo que se desliza) */}
                        <span
                          className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                            currentValue ? 'translate-x-11' : 'translate-x-1'
                          }`}
                        />
                      </div>
                      
                      {/* Etiqueta de texto (solo una a la vez) */}
                      <div className="relative h-6 w-8 overflow-hidden">
                        <span
                          className={`absolute font-mono text-sm font-bold transition-all duration-300 ease-in-out ${
                            currentValue
                              ? `${themeTextColor} translate-x-0 opacity-100`
                              : 'text-gray-500 dark:text-neutral-400 -translate-x-full opacity-0'
                          }`}
                        >
                          SÍ
                        </span>
                        <span
                          className={`absolute font-mono text-sm font-bold transition-all duration-300 ease-in-out ${
                            !currentValue
                              ? `${themeTextColor} translate-x-0 opacity-100`
                              : 'text-gray-500 dark:text-neutral-400 translate-x-full opacity-0'
                          }`}
                        >
                          NO
                        </span>
                      </div>
                    </div>
                  );
                })()
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
                      className={`w-5 h-5 ${getThemeColor('text')} bg-neutral-800 border-neutral-600 rounded focus:ring-2 ${getThemeColor('focus')}`}
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
                <div>
                  <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                    {displayName.toUpperCase()}{field.required ? '*' : ''}
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData[field.name] || false}
                      onChange={(e) => updateFormField(field.name, e.target.checked)}
                      className={`w-5 h-5 ${getThemeColor('text')} bg-neutral-800 border-neutral-600 rounded focus:ring-2 ${getThemeColor('focus')}`}
                    />
                    <span className="text-white font-mono tracking-wider">
                      {formData[field.name] ? t('create.active') : t('create.inactive')}
                    </span>
                  </div>
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
