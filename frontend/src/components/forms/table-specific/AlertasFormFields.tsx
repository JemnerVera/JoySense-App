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

    // Campos de texto (umbral, minimo, maximo)
    if (['umbral', 'minimo', 'maximo'].includes(col.columnName)) {
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
                updateField(col.columnName, e.target.value);
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

    // Campos de selección (ubicacionid, nodoid, tipoid, metricaid, criticidadid)
    const options = getUniqueOptionsForField(col.columnName);
    const placeholder = `${displayName.toUpperCase()}`;
    
    return (
      <div key={col.columnName} className="mb-4">
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
          isEnabled ? 'text-orange-500' : 'text-gray-500'
        }`}>
          {displayName.toUpperCase()}
        </label>
        <SelectWithPlaceholder
          value={value}
          onChange={(newValue) => {
            if (isEnabled) {
              const newValueParsed = newValue ? parseInt(newValue.toString()) : null;
              
              // Actualizar el campo principal
              updateField(col.columnName, newValueParsed);
              
              // Limpiar campos dependientes según la cascada
              if (col.columnName === 'ubicacionid') {
                updateField('nodoid', null);
                updateField('tipoid', null);
                updateField('metricaid', null);
                updateField('criticidadid', null);
                updateField('minimo', '');
                updateField('maximo', '');
                updateField('umbral', '');
                updateField('statusid', 1);
              } else if (col.columnName === 'nodoid') {
                updateField('tipoid', null);
                updateField('metricaid', null);
                updateField('criticidadid', null);
                updateField('minimo', '');
                updateField('maximo', '');
                updateField('umbral', '');
                updateField('statusid', 1);
              } else if (col.columnName === 'tipoid') {
                updateField('metricaid', null);
                updateField('criticidadid', null);
                updateField('minimo', '');
                updateField('maximo', '');
                updateField('umbral', '');
                updateField('statusid', 1);
              } else if (col.columnName === 'metricaid') {
                updateField('criticidadid', null);
                updateField('minimo', '');
                updateField('maximo', '');
                updateField('umbral', '');
                updateField('statusid', 1);
              }
            }
          }}
          options={options}
          placeholder={placeholder}
          disabled={!isEnabled}
        />
      </div>
    );
  };

  // Función para renderizar campos de umbral con layout específico y cascada
  const renderUmbralFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Fila contextual: País, Empresa, Fundo (si hay filtros globales)
    const contextualRow = renderContextualRow(['pais', 'empresa', 'fundo']);
    if (contextualRow) {
      result.push(
        <React.Fragment key="contextual-row">{contextualRow}</React.Fragment>
      );
    }
    
    // Primera fila: Ubicación, Nodo, Tipo
    const ubicacionField = visibleColumns.find(c => c.columnName === 'ubicacionid');
    const nodoField = visibleColumns.find(c => c.columnName === 'nodoid');
    const tipoField = visibleColumns.find(c => c.columnName === 'tipoid');
    
    if (ubicacionField || nodoField || tipoField) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {ubicacionField && renderUmbralField(ubicacionField, true)}
          {nodoField && renderUmbralField(nodoField, !!formData.ubicacionid)}
          {tipoField && renderUmbralField(tipoField, !!formData.nodoid)}
        </div>
      );
    }

    // Segunda fila: Métrica, (Valor Mínimo, Valor Máximo), Criticidad
    const metricaField = visibleColumns.find(c => c.columnName === 'metricaid');
    const minimoField = visibleColumns.find(c => c.columnName === 'minimo');
    const maximoField = visibleColumns.find(c => c.columnName === 'maximo');
    const criticidadField = visibleColumns.find(c => c.columnName === 'criticidadid');
    
    if (metricaField || minimoField || maximoField || criticidadField) {
      result.push(
        <div key="second-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {metricaField && renderUmbralField(metricaField, !!formData.tipoid)}
          
          <div className="bg-gray-600 bg-opacity-40 p-3 rounded-lg border border-gray-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {minimoField && renderUmbralField(minimoField, !!formData.metricaid)}
              {maximoField && renderUmbralField(maximoField, !!formData.metricaid)}
            </div>
          </div>
          
          {criticidadField && renderUmbralField(criticidadField, !!formData.metricaid)}
        </div>
      );
    }

    // Tercera fila: Nombre Umbral, (vacío), Status
    const umbralField = visibleColumns.find(c => c.columnName === 'umbral');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    if (umbralField || statusField) {
      result.push(
        <div key="third-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {umbralField && renderUmbralField(umbralField, !!formData.metricaid)}
          <div></div>
          {statusField && renderUmbralField(statusField, !!formData.metricaid)}
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
