// ============================================================================
// FORM FIELD RENDERER
// ============================================================================
// Componente genérico para renderizar campos de formulario con lógica específica por tabla

import React from 'react';
import SelectWithPlaceholder from '../SelectWithPlaceholder';
import { useLanguage } from '../../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../../utils/systemParametersUtils';

interface FormFieldRendererProps {
  col: any;
  selectedTable: string;
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateField: (field: string, value: any) => void;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  isFieldRequired: (columnName: string) => boolean;
  isFieldEnabled: (columnName: string) => boolean;
}

export const FormFieldRenderer: React.FC<FormFieldRendererProps> = ({
  col,
  selectedTable,
  formData,
  setFormData,
  updateField,
  getThemeColor,
  getUniqueOptionsForField,
  isFieldRequired,
  isFieldEnabled
}) => {
  const { t } = useLanguage();

  const displayName = getColumnDisplayNameTranslated(col.columnName, t);
  if (!displayName) return null;
  
  const value = formData[col.columnName] || '';
  const isRequired = isFieldRequired(col.columnName);
  
  // Campos automáticos - NO mostrar en formulario
  if (['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified'].includes(col.columnName)) {
    return null;
  }

  // Campo statusid como checkbox
  if (col.columnName === 'statusid') {
    return (
      <div key={col.columnName} className="mb-4">
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
          {displayName.toUpperCase()}{isRequired ? '*' : ''}
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={value === 1}
            onChange={(e) => updateField(col.columnName, e.target.checked ? 1 : 0)}
            className="w-5 h-5 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2"
          />
          <span className="text-white font-mono tracking-wider">
            {value === 1 ? t('create.active') : t('create.inactive')}
          </span>
        </div>
      </div>
    );
  }

  // Helper para renderizar un campo de selección
  const renderSelectField = (placeholder: string, useUpdateField: boolean = false) => {
    const options = getUniqueOptionsForField(col.columnName);
    return (
      <div key={col.columnName} className="mb-4">
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
          {displayName.toUpperCase()}{isRequired ? '*' : ''}
        </label>
        <SelectWithPlaceholder
          value={value}
          onChange={(newValue) => {
            const parsedValue = newValue ? parseInt(newValue.toString()) : null;
            if (useUpdateField) {
              updateField(col.columnName, parsedValue);
            } else {
              setFormData({
                ...formData,
                [col.columnName]: parsedValue
              });
            }
          }}
          options={options}
          placeholder={placeholder}
        />
      </div>
    );
  };

  // Campos de relación para empresa
  if (col.columnName === 'paisid' && selectedTable === 'empresa') {
    return renderSelectField(`${t('buttons.select')} ${t('fields.country')}`, true);
  }

  // Campos de relación para fundo
  if (col.columnName === 'empresaid' && selectedTable === 'fundo') {
    return renderSelectField(`${t('buttons.select')} ${t('fields.company')}`);
  }

  // Campos de relación para ubicacion
  if (col.columnName === 'fundoid' && selectedTable === 'ubicacion') {
    return renderSelectField(`${t('buttons.select')} ${t('fields.fund')}`);
  }

  // Campos de relación para nodo
  if (col.columnName === 'ubicacionid' && selectedTable === 'nodo') {
    return renderSelectField(t('create.select_location'));
  }

  // Campos de relación para localizacion (según schema actual: nodoid, sensorid, metricaid)
  if (col.columnName === 'nodoid' && selectedTable === 'localizacion') {
    return renderSelectField(t('create.select_node'));
  }

  // NOTA: La tabla 'tipo' NO tiene campo 'entidadid' según el schema actual
  // Esta condición se eliminó porque entidadid no existe en la tabla tipo

  // Campos de relación para sensor
  if (col.columnName === 'nodoid' && selectedTable === 'sensor') {
    return renderSelectField(t('create.select_node'));
  }

  if (col.columnName === 'tipoid' && selectedTable === 'sensor') {
    return renderSelectField(`${displayName.toUpperCase()}`);
  }

  // Campos de relación para metricasensor
  if (col.columnName === 'nodoid' && selectedTable === 'metricasensor') {
    return renderSelectField(t('create.select_node'));
  }

  if (col.columnName === 'metricaid' && selectedTable === 'metricasensor') {
    return renderSelectField(t('create.select_metric'));
  }

  if (col.columnName === 'tipoid' && selectedTable === 'metricasensor') {
    return renderSelectField(`${displayName.toUpperCase()}`);
  }

  // Combobox para umbral - ubicacionid, criticidadid, nodoid, metricaid, tipoid
  if (col.columnName === 'ubicacionid' && selectedTable === 'umbral') {
    return renderSelectField(t('create.select_location'));
  }

  if (col.columnName === 'criticidadid' && selectedTable === 'umbral') {
    return renderSelectField(t('create.select_criticality'));
  }

  if (col.columnName === 'nodoid' && selectedTable === 'umbral') {
    return renderSelectField(t('create.select_node'));
  }

  if (col.columnName === 'metricaid' && selectedTable === 'umbral') {
    return renderSelectField(t('create.select_metric'));
  }

  if (col.columnName === 'tipoid' && selectedTable === 'umbral') {
    return renderSelectField(`${displayName.toUpperCase()}`);
  }

  // Combobox para perfilumbral - perfilid, umbralid
  if (col.columnName === 'perfilid' && selectedTable === 'perfilumbral') {
    return renderSelectField(t('create.profile'));
  }

  if (col.columnName === 'umbralid' && selectedTable === 'perfilumbral') {
    return renderSelectField(t('create.threshold'));
  }

  // Combobox para audit_log_umbral - umbralid, modified_by
  if (col.columnName === 'umbralid' && selectedTable === 'audit_log_umbral') {
    return renderSelectField(t('create.select_threshold'));
  }

  if (col.columnName === 'modified_by' && selectedTable === 'audit_log_umbral') {
    return renderSelectField(t('create.select_user'));
  }

  // Combobox para usuarioperfil - usuarioid, perfilid
  if (col.columnName === 'usuarioid' && selectedTable === 'usuarioperfil') {
    return renderSelectField(t('create.select_user'));
  }

  if (col.columnName === 'perfilid' && selectedTable === 'usuarioperfil') {
    return renderSelectField(t('create.select_profile'));
  }

  // Combobox para perfil - jefeid (mostrar nivel - perfil)
  if (col.columnName === 'jefeid' && selectedTable === 'perfil') {
    return renderSelectField(t('create.select_boss'));
  }

  // Combobox para contacto - usuarioid, medioid
  if (col.columnName === 'usuarioid' && selectedTable === 'contacto') {
    return renderSelectField(t('create.user'));
  }

  if (col.columnName === 'medioid' && selectedTable === 'contacto') {
    return renderSelectField(t('create.medium'));
  }

  // Combobox para entidad_localizacion - entidadid, localizacionid
  if (col.columnName === 'entidadid' && selectedTable === 'entidad_localizacion') {
    return renderSelectField(t('create.select_entity') || `${t('buttons.select')} ${displayName.toUpperCase()}`);
  }

  if (col.columnName === 'localizacionid' && selectedTable === 'entidad_localizacion') {
    return renderSelectField(t('create.select_location') || `${t('buttons.select')} ${displayName.toUpperCase()}`);
  }

  // Combobox para asociacion - localizacionid
  if (col.columnName === 'localizacionid' && selectedTable === 'asociacion') {
    return renderSelectField(t('create.select_location') || `${t('buttons.select')} ${displayName.toUpperCase()}`);
  }

  // Campo de texto normal
  const isEnabled = isFieldEnabled(col.columnName);
  return (
    <div key={col.columnName} className="mb-4">
      <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
        isEnabled ? 'text-orange-500' : 'text-gray-500'
      }`}>
        {displayName.toUpperCase()}{isRequired ? '*' : ''}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          if (isEnabled) {
            setFormData({
              ...formData,
              [col.columnName]: e.target.value
            });
          }
        }}
        disabled={!isEnabled}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800 dark:text-white text-base placeholder-gray-500 dark:placeholder-neutral-400 font-mono ${
          isEnabled 
            ? 'bg-gray-200 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600' 
            : 'bg-gray-100 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 opacity-50 cursor-not-allowed'
        }`}
        placeholder={`${displayName.toUpperCase()}${col.columnName === 'paisabrev' ? ` (${t('create.abbreviation_2_chars').split('(')[1]}` : ''}${col.columnName === 'empresabrev' ? ` (${t('create.abbreviation_10_chars').split('(')[1]}` : ''}${col.columnName === 'fundoabrev' ? ` (${t('create.abbreviation_10_chars').split('(')[1]}` : ''}`}
      />
    </div>
  );
};
