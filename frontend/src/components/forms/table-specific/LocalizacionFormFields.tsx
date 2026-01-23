// ============================================================================
// LOCALIZACION FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos de localización con dependencias en cascada

import React from 'react';
import SelectWithPlaceholder from '../../selectors/SelectWithPlaceholder';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../../../utils/systemParametersUtils';

interface LocalizacionFormFieldsProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateField: (field: string, value: any) => void;
  renderField: (col: any) => React.ReactNode;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  isFieldRequired: (columnName: string) => boolean;
  renderContextualRow: (fields: string[]) => React.ReactNode | null;
}

export const LocalizacionFormFields: React.FC<LocalizacionFormFieldsProps> = ({
  visibleColumns,
  formData,
  setFormData,
  updateField,
  renderField,
  getThemeColor,
  getUniqueOptionsForField,
  isFieldRequired,
  renderContextualRow
}) => {
  const { t } = useLanguage();

  // Función para renderizar campos de localización según el schema actual
  // Schema actual: nodoid, sensorid, metricaid, localizacion
  const renderLocalizacionField = (col: any, fieldType: 'select' | 'text'): React.ReactNode => {
    const displayName = getColumnDisplayNameTranslated(col.columnName, t);
    if (!displayName) return null;
    
    const value = formData[col.columnName] || '';
    const isRequired = isFieldRequired(col.columnName);
    
    // Renderizar campo de selección (nodoid, sensorid, metricaid)
    if (fieldType === 'select') {
      const options = getUniqueOptionsForField(col.columnName);
      return (
        <div key={col.columnName} className="mb-4">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {displayName.toUpperCase()}{isRequired ? '*' : ''}
          </label>
          <SelectWithPlaceholder
            value={value}
            onChange={(newValue) => {
              const newFormData: any = {
                ...formData,
                [col.columnName]: newValue ? parseInt(newValue.toString()) : null
              };
              setFormData(newFormData);
            }}
            options={options}
            placeholder={`${displayName.toUpperCase()}`}
          />
        </div>
      );
    }
    
    // Renderizar campo de texto (localizacion)
    if (fieldType === 'text') {
      return (
        <div key={col.columnName} className="mb-4">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {displayName.toUpperCase()}{isRequired ? '*' : ''}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => updateField(col.columnName, e.target.value)}
            placeholder={`${displayName.toUpperCase()}`}
            className={`w-full px-3 py-2 bg-neutral-800 border rounded-lg text-white text-base font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-500 border-neutral-600`}
          />
        </div>
      );
    }

    return null;
  };

  // Función principal para renderizar campos de localización según el schema actual
  // Schema: nodoid, sensorid, metricaid, localizacion, statusid
  const result: React.ReactNode[] = [];
  
  // Primera fila: Nodo, Sensor, Métrica
  const nodoField = visibleColumns.find(c => c.columnName === 'nodoid');
  const sensorField = visibleColumns.find(c => c.columnName === 'sensorid');
  const metricaField = visibleColumns.find(c => c.columnName === 'metricaid');

  if (nodoField || sensorField || metricaField) {
    result.push(
      <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {nodoField && renderLocalizacionField(nodoField, 'select')}
        {sensorField && renderLocalizacionField(sensorField, 'select')}
        {metricaField && renderLocalizacionField(metricaField, 'select')}
      </div>
    );
  }
  
  // Segunda fila: Nombre (localizacion) y Status al extremo derecho
  const localizacionField = visibleColumns.find(c => c.columnName === 'localizacion');
  const statusField = visibleColumns.find(c => c.columnName === 'statusid');

  if (localizacionField || statusField) {
    result.push(
      <div key="second-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {localizacionField && renderLocalizacionField(localizacionField, 'text')}
        <div></div> {/* Espacio vacío central */}
        <div className="flex flex-col justify-start">
          {statusField && renderField(statusField)}
        </div>
      </div>
    );
  }
  
  return <>{result}</>;
};
