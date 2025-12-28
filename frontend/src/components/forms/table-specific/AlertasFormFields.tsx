// ============================================================================
// ALERTAS FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos de alertas (umbral, perfilumbral, criticidad)

import React from 'react';
import SelectWithPlaceholder from '../../SelectWithPlaceholder';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../../../utils/systemParametersUtils';

interface AlertasFormFieldsProps {
  selectedTable: string;
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateField: (field: string, value: any) => void;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  isFieldRequired: (columnName: string) => boolean;
  renderContextualRow: (fields: string[]) => React.ReactNode | null;
}

export const AlertasFormFields: React.FC<AlertasFormFieldsProps> = ({
  selectedTable,
  visibleColumns,
  formData,
  setFormData,
  updateField,
  getThemeColor,
  getUniqueOptionsForField,
  isFieldRequired,
  renderContextualRow
}) => {
  const { t } = useLanguage();

  // Función helper para renderizar un campo de umbral con lógica de cascada
  const renderUmbralField = (col: any, isEnabled: boolean): React.ReactNode => {
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
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
            isEnabled ? 'text-orange-500' : 'text-gray-500'
          }`}>
            {displayName.toUpperCase()}{isRequired ? '*' : ''}
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={value === 1}
              disabled={!isEnabled}
              onChange={(e) => {
                if (isEnabled) {
                  updateField(col.columnName, e.target.checked ? 1 : 0);
                }
              }}
              className={`w-5 h-5 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 ${
                !isEnabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <span className={`font-mono tracking-wider ${
              isEnabled ? 'text-white' : 'text-gray-500'
            }`}>
              {value === 1 ? t('create.active') : t('create.inactive')}
            </span>
          </div>
        </div>
      );
    }

    // Campo operador - select con opciones válidas según constraint
    if (col.columnName === 'operador') {
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
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
            isEnabled ? 'text-orange-500' : 'text-gray-500'
          }`}>
            {displayName.toUpperCase()}{isRequired ? '*' : ''}
          </label>
          <SelectWithPlaceholder
            value={value || ''}
            onChange={(newValue) => {
              if (isEnabled) {
                updateField(col.columnName, newValue || '');
              }
            }}
            options={operadorOptions}
            placeholder={`${t('buttons.select')} ${displayName.toUpperCase()}`}
            disabled={!isEnabled}
          />
        </div>
      );
    }

    // Campo inversion - checkbox
    if (col.columnName === 'inversion') {
      return (
        <div key={col.columnName} className="mb-4">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
            isEnabled ? 'text-orange-500' : 'text-gray-500'
          }`}>
            {displayName.toUpperCase()}{isRequired ? '*' : ''}
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={value === true || value === 1}
              disabled={!isEnabled}
              onChange={(e) => {
                if (isEnabled) {
                  updateField(col.columnName, e.target.checked);
                }
              }}
              className={`w-5 h-5 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 ${
                !isEnabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <span className={`font-mono tracking-wider ${
              isEnabled ? 'text-white' : 'text-gray-500'
            }`}>
              {value === true || value === 1 ? 'Sí' : 'No'}
            </span>
          </div>
        </div>
      );
    }

    // Campos de texto (umbral, minimo, maximo, estandar)
    if (['umbral', 'minimo', 'maximo', 'estandar'].includes(col.columnName)) {
      return (
        <div key={col.columnName} className="mb-4">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
            isEnabled ? 'text-orange-500' : 'text-gray-500'
          }`}>
            {displayName.toUpperCase()}{isRequired ? '*' : ''}
          </label>
          <input
            type={col.columnName === 'umbral' ? 'text' : 'number'}
            value={value}
            disabled={!isEnabled}
            onChange={(e) => {
              if (isEnabled) {
                const newValue = col.columnName === 'umbral' 
                  ? e.target.value 
                  : (e.target.value ? parseFloat(e.target.value) : null);
                updateField(col.columnName, newValue);
              }
            }}
            placeholder={`${displayName.toUpperCase()}`}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${getThemeColor('focus')} ${getThemeColor('border')} text-white text-base placeholder-neutral-400 font-mono ${
              isEnabled 
                ? 'bg-neutral-800 border-neutral-600' 
                : 'bg-neutral-700 border-neutral-600 opacity-50 cursor-not-allowed'
            }`}
          />
        </div>
      );
    }

    // Campo localizacionid - select
    if (col.columnName === 'localizacionid') {
      const options = getUniqueOptionsForField(col.columnName);
      return (
        <div key={col.columnName} className="mb-4">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
            isEnabled ? 'text-orange-500' : 'text-gray-500'
          }`}>
            {displayName.toUpperCase()}{isRequired ? '*' : ''}
          </label>
          <SelectWithPlaceholder
            value={value}
            onChange={(newValue) => {
              if (isEnabled) {
                const newValueParsed = newValue ? parseInt(newValue.toString()) : null;
                updateField(col.columnName, newValueParsed);
              }
            }}
            options={options}
            placeholder={`${t('buttons.select')} ${displayName.toUpperCase()}`}
            disabled={!isEnabled}
          />
        </div>
      );
    }

    // Campo desconocido - no renderizar
    return null;
  };

  // Función para renderizar campos de umbral según schema actual
  // Schema: umbralid, localizacionid, umbral, minimo, maximo, estandar, operador, inversion, statusid
  const renderUmbralFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Fila 1: Localización, Nombre Umbral, Operador
    const localizacionField = visibleColumns.find(c => c.columnName === 'localizacionid');
    const umbralField = visibleColumns.find(c => c.columnName === 'umbral');
    const operadorField = visibleColumns.find(c => c.columnName === 'operador');
    
    if (localizacionField || umbralField || operadorField) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {localizacionField && renderUmbralField(localizacionField, true)}
          {umbralField && renderUmbralField(umbralField, !!formData.localizacionid)}
          {operadorField && renderUmbralField(operadorField, !!formData.localizacionid)}
        </div>
      );
    }

    // Fila 2: Mínimo, Máximo, Estándar
    const minimoField = visibleColumns.find(c => c.columnName === 'minimo');
    const maximoField = visibleColumns.find(c => c.columnName === 'maximo');
    const estandarField = visibleColumns.find(c => c.columnName === 'estandar');
    
    if (minimoField || maximoField || estandarField) {
      result.push(
        <div key="second-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {minimoField && renderUmbralField(minimoField, !!formData.localizacionid)}
          {maximoField && renderUmbralField(maximoField, !!formData.localizacionid)}
          {estandarField && renderUmbralField(estandarField, !!formData.localizacionid)}
        </div>
      );
    }

    // Fila 3: (vacío), Inversión, Status
    const inversionField = visibleColumns.find(c => c.columnName === 'inversion');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    if (inversionField || statusField) {
      result.push(
        <div key="third-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div></div> {/* Espacio vacío */}
          {inversionField && renderUmbralField(inversionField, !!formData.localizacionid)}
          {statusField && renderUmbralField(statusField, !!formData.localizacionid)}
        </div>
      );
    }

    return result;
  };

  // Router para seleccionar el renderizado correcto según la tabla
  switch (selectedTable) {
    case 'umbral':
      return <>{renderUmbralFields()}</>;
    // TODO: Agregar perfilumbral y criticidad cuando se necesiten
    default:
      return null;
  }
};
