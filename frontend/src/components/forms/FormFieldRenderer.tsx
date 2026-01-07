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
            className={`w-5 h-5 ${getThemeColor('text')} bg-neutral-800 border-neutral-600 rounded focus:ring-2 ${getThemeColor('focus')}`}
          />
          <span className="text-white font-mono tracking-wider">
            {value === 1 ? t('create.active') : t('create.inactive')}
          </span>
        </div>
      </div>
    );
  }

  // Helper para renderizar un campo de selección
  const renderSelectField = (placeholder: string, useUpdateField: boolean = false, allowExternalChange: boolean = false) => {
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
          allowExternalChange={allowExternalChange}
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

  // Combobox para umbral - localizacionid
  if (col.columnName === 'localizacionid' && selectedTable === 'umbral') {
    return renderSelectField(t('create.select_location') || `${t('buttons.select')} ${displayName.toUpperCase()}`);
  }

  // perfilumbral ya no existe - reemplazado por regla_perfil y regla_umbral

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

  // Combobox para perfil - is_admin_global (TRUE/FALSE)
  if (col.columnName === 'is_admin_global' && selectedTable === 'perfil') {
    const adminGlobalOptions = [
      { value: 'true', label: 'TRUE' },
      { value: 'false', label: 'FALSE' }
    ];
    
    // Convertir valor booleano a string para el componente
    // Por defecto debe ser 'false' si no hay valor
    let currentValue: string | null = null;
    if (value === true || value === 'true' || value === 1 || value === '1') {
      currentValue = 'true';
    } else if (value === false || value === 'false' || value === 0 || value === '0') {
      currentValue = 'false';
    } else {
      // Si no hay valor, usar 'false' por defecto
      currentValue = 'false';
      // Asegurar que el valor inicial sea false si no está definido
      if (formData[col.columnName] === undefined || formData[col.columnName] === null || formData[col.columnName] === '') {
        setFormData({
          ...formData,
          [col.columnName]: false
        });
      }
    }
    
    return (
      <div key={col.columnName} className="mb-4">
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
          {displayName.toUpperCase()}{isRequired ? '*' : ''}
        </label>
        <SelectWithPlaceholder
          value={currentValue}
          onChange={(newValue) => {
            // Convertir string de vuelta a booleano
            const boolValue = newValue === 'true' || newValue === 1 || newValue === '1';
            setFormData({
              ...formData,
              [col.columnName]: boolValue
            });
          }}
          options={adminGlobalOptions}
          placeholder="SELECCIONAR"
        />
      </div>
    );
  }

  // Combobox para contacto - usuarioid, codigotelefonoid
  if (col.columnName === 'usuarioid' && selectedTable === 'contacto') {
    return renderSelectField(t('create.user'));
  }

  if (col.columnName === 'codigotelefonoid' && selectedTable === 'contacto') {
    return renderSelectField(t('create.country_code') || 'Código de País');
  }

  // Combobox para permiso - perfilid, origenid, fuenteid
  if (col.columnName === 'perfilid' && selectedTable === 'permiso') {
    return renderSelectField(t('create.select_profile') || `${t('buttons.select')} ${displayName.toUpperCase()}`);
  }

  if (col.columnName === 'origenid' && selectedTable === 'permiso') {
    // Permitir cambios externos para origenid en permiso (preselección automática)
    return renderSelectField(t('create.select_origin') || `${t('buttons.select')} ${displayName.toUpperCase()}`, false, true);
  }

  if (col.columnName === 'fuenteid' && selectedTable === 'permiso') {
    return renderSelectField(t('create.select_source') || `${t('buttons.select')} ${displayName.toUpperCase()}`);
  }

  // Combobox para regla - criticidadid
  if (col.columnName === 'criticidadid' && selectedTable === 'regla') {
    return renderSelectField(t('create.select_criticality') || `${t('buttons.select')} ${displayName.toUpperCase()}`, true);
  }

  // Combobox para regla_objeto - reglaid, origenid, fuenteid
  if (col.columnName === 'reglaid' && selectedTable === 'regla_objeto') {
    return renderSelectField(`${t('buttons.select')} REGLA`);
  }

  if (col.columnName === 'origenid' && selectedTable === 'regla_objeto') {
    return renderSelectField(t('create.select_origin') || `${t('buttons.select')} ORIGEN`);
  }

  if (col.columnName === 'fuenteid' && selectedTable === 'regla_objeto') {
    return renderSelectField(t('create.select_source') || `${t('buttons.select')} FUENTE`);
  }

  // Combobox para regla_umbral - reglaid, umbralid
  if (col.columnName === 'reglaid' && selectedTable === 'regla_umbral') {
    return renderSelectField(`${t('buttons.select')} REGLA`);
  }

  if (col.columnName === 'umbralid' && selectedTable === 'regla_umbral') {
    return renderSelectField(t('create.select_threshold') || `${t('buttons.select')} UMBRAL`);
  }

  // Combobox para regla_perfil - reglaid, perfilid
  if (col.columnName === 'reglaid' && selectedTable === 'regla_perfil') {
    return renderSelectField(`${t('buttons.select')} REGLA`);
  }

  if (col.columnName === 'perfilid' && selectedTable === 'regla_perfil') {
    return renderSelectField(t('create.select_profile') || `${t('buttons.select')} PERFIL`);
  }

  // Select para operador_logico en regla_umbral
  if (col.columnName === 'operador_logico' && selectedTable === 'regla_umbral') {
    const operadorLogicoOptions = [
      { value: 'AND', label: 'AND' },
      { value: 'OR', label: 'OR' }
    ];
    
    return (
      <div key={col.columnName} className="mb-4">
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
          {displayName.toUpperCase()}{isRequired ? '*' : ''}
        </label>
        <SelectWithPlaceholder
          value={value || 'AND'}
          onChange={(newValue) => {
            setFormData({
              ...formData,
              [col.columnName]: newValue || 'AND'
            });
          }}
          options={operadorLogicoOptions}
          placeholder={`${t('buttons.select')} ${displayName.toUpperCase()}`}
        />
      </div>
    );
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

  // Combobox para usuario_canal - usuarioid, canalid
  if (col.columnName === 'usuarioid' && selectedTable === 'usuario_canal') {
    return renderSelectField(t('create.select_user') || `${t('buttons.select')} ${displayName.toUpperCase()}`);
  }

  if (col.columnName === 'canalid' && selectedTable === 'usuario_canal') {
    return renderSelectField(t('create.select_channel') || `${t('buttons.select')} ${displayName.toUpperCase()}`);
  }

  // Select para umbral - operador (con opciones válidas según constraint)
  if (col.columnName === 'operador' && selectedTable === 'umbral') {
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
      <div key={col.columnName} className="mb-4">
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
          {displayName.toUpperCase()}{isRequired ? '*' : ''}
        </label>
        <SelectWithPlaceholder
          value={value}
          onChange={(newValue) => {
            setFormData({
              ...formData,
              [col.columnName]: newValue || ''
            });
          }}
          options={operadorOptions}
          placeholder={`${t('buttons.select')} ${displayName.toUpperCase()}`}
        />
      </div>
    );
  }

  // Campos booleanos (puede_ver, puede_insertar, puede_actualizar)
  if (['puede_ver', 'puede_insertar', 'puede_actualizar'].includes(col.columnName)) {
    return (
      <div key={col.columnName} className="mb-4">
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
          {displayName.toUpperCase()}{isRequired ? '*' : ''}
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={value === true || value === 1}
            onChange={(e) => updateField(col.columnName, e.target.checked)}
            className={`w-5 h-5 ${getThemeColor('text')} bg-neutral-800 border-neutral-600 rounded focus:ring-2 ${getThemeColor('focus')}`}
          />
          <span className="text-white font-mono tracking-wider">
            {value === true || value === 1 ? t('create.active') : t('create.inactive')}
          </span>
        </div>
      </div>
    );
  }

  // Campos booleanos para regla_umbral (agrupador_inicio, agrupador_fin)
  if ((col.columnName === 'agrupador_inicio' || col.columnName === 'agrupador_fin') && selectedTable === 'regla_umbral') {
    return (
      <div key={col.columnName} className="mb-4">
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
          {displayName.toUpperCase()}{isRequired ? '*' : ''}
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={value === true || value === 1}
            onChange={(e) => updateField(col.columnName, e.target.checked)}
            className={`w-5 h-5 ${getThemeColor('text')} bg-neutral-800 border-neutral-600 rounded focus:ring-2 ${getThemeColor('focus')}`}
          />
          <span className="text-white font-mono tracking-wider">
            {value === true || value === 1 ? 'Sí' : 'No'}
          </span>
        </div>
      </div>
    );
  }

  // Campo de texto normal
  const isEnabled = isFieldEnabled(col.columnName);
  
  // Placeholders específicos para ventana y cooldown en regla
  let placeholder = `${displayName.toUpperCase()}`;
  if (col.columnName === 'ventana' && selectedTable === 'regla') {
    placeholder = 'Ej: 00:10:00 (HH:MM:SS) o 10 minutes';
  } else if (col.columnName === 'cooldown' && selectedTable === 'regla') {
    placeholder = 'Ej: 1 day, 2 hours, 30 minutes';
  } else if (col.columnName === 'paisabrev') {
    placeholder = `${displayName.toUpperCase()} (${t('create.abbreviation_2_chars').split('(')[1]}`;
  } else if (col.columnName === 'empresabrev') {
    placeholder = `${displayName.toUpperCase()} (${t('create.abbreviation_10_chars').split('(')[1]}`;
  } else if (col.columnName === 'fundoabrev') {
    placeholder = `${displayName.toUpperCase()} (${t('create.abbreviation_10_chars').split('(')[1]}`;
  }
  
  return (
    <div key={col.columnName} className="mb-4">
      <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
        isEnabled ? getThemeColor('text') : 'text-gray-500'
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
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${getThemeColor('focus')} ${getThemeColor('border')} text-gray-800 dark:text-white text-base placeholder-gray-500 dark:placeholder-neutral-400 font-mono ${
          isEnabled 
            ? 'bg-gray-200 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600' 
            : 'bg-gray-100 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 opacity-50 cursor-not-allowed'
        }`}
        placeholder={placeholder}
      />
      {/* Ayuda adicional para ventana y cooldown */}
      {(col.columnName === 'ventana' || col.columnName === 'cooldown') && selectedTable === 'regla' && (
        <p className="text-xs text-neutral-400 mt-1 font-mono">
          {col.columnName === 'ventana' 
            ? 'Formato: HH:MM:SS (ej: 00:10:00) o cantidad + unidad (ej: 10 minutes)' 
            : 'Formato: cantidad + unidad (ej: 1 day, 2 hours, 30 minutes)'}
        </p>
      )}
    </div>
  );
};
