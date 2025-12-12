// ============================================================================
// LOCALIZACION FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos de localización con dependencias en cascada

import React from 'react';
import SelectWithPlaceholder from '../../SelectWithPlaceholder';
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

  // Función para obtener opciones de nodos filtradas para localización
  const getFilteredNodoOptions = () => {
    // Obtener todos los nodos disponibles
    const allNodos = getUniqueOptionsForField('nodoid');
    
    if (!formData.entidadid || !formData.ubicacionid) {
      return allNodos;
    }

    // Obtener datos de localizaciones existentes para filtrar nodos ya asignados
    // Esto se hace a través de getUniqueOptionsForField que internamente usa los datos cargados
    const localizacionesData = getUniqueOptionsForField('localizacionid');
    
    // Filtrar nodos que no estén ya asignados a una localización con la misma entidad y ubicación
    const filteredNodos = allNodos.filter(nodo => {
      // Verificar si el nodo ya está asignado a una localización con la misma entidad y ubicación
      // Como no tenemos acceso directo a los datos de localizaciones aquí, 
      // por ahora devolvemos todos los nodos disponibles
      // En una implementación más robusta, se podría hacer una consulta específica
      return true;
    });

    return filteredNodos;
  };

  // Función para renderizar campos de localización con dependencias en cascada
  const renderLocalizacionField = (col: any, fieldType: 'entidad' | 'ubicacion' | 'nodo' | 'coordenadas'): React.ReactNode => {
    const displayName = getColumnDisplayNameTranslated(col.columnName, t);
    if (!displayName) return null;
    
    const value = formData[col.columnName] || '';
    const isRequired = isFieldRequired(col.columnName);
    
    // Determinar si el campo debe estar deshabilitado
    const isDisabled = (() => {
      switch (fieldType) {
        case 'entidad':
          return false; // Entidad siempre habilitada
        case 'ubicacion':
          return !formData.entidadid; // Ubicación solo habilitada si hay entidad
        case 'nodo':
          return !formData.ubicacionid; // Nodo solo habilitado si hay ubicación
        case 'coordenadas':
          return !formData.nodoid; // Coordenadas solo habilitadas si hay nodo
        default:
          return false;
      }
    })();

    // Renderizar campo de entidad
    if (fieldType === 'entidad') {
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
              // Limpiar campos dependientes cuando cambia la entidad
              if (!newValue) {
                newFormData.ubicacionid = null;
                newFormData.nodoid = null;
                newFormData.latitud = '';
                newFormData.longitud = '';
                newFormData.referencia = '';
              }
              setFormData(newFormData);
            }}
            options={options}
            placeholder={`${displayName.toUpperCase()}`}
            disabled={isDisabled}
          />
        </div>
      );
    }

    // Renderizar campo de ubicación
    if (fieldType === 'ubicacion') {
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
              // Limpiar campos dependientes cuando cambia la ubicación
              if (!newValue) {
                newFormData.nodoid = null;
                newFormData.latitud = '';
                newFormData.longitud = '';
                newFormData.referencia = '';
              }
              setFormData(newFormData);
            }}
            options={options}
            placeholder={`${displayName.toUpperCase()}`}
            disabled={isDisabled}
          />
        </div>
      );
    }

    // Renderizar campo de nodo
    if (fieldType === 'nodo') {
      // Filtrar nodos basado en los filtros contextuales y la entidad seleccionada
      const options = getFilteredNodoOptions();
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
              // Limpiar campos dependientes cuando cambia el nodo
              if (!newValue) {
                newFormData.latitud = '';
                newFormData.longitud = '';
                newFormData.referencia = '';
              }
              setFormData(newFormData);
            }}
            options={options}
            placeholder={`${displayName.toUpperCase()}`}
            disabled={isDisabled}
          />
        </div>
      );
    }

    // Renderizar campos de coordenadas (latitud, longitud, referencia)
    if (fieldType === 'coordenadas') {
      return (
        <div key={col.columnName} className="mb-4">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {displayName.toUpperCase()}{isRequired ? '*' : ''}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => updateField(
              col.columnName,
              col.columnName === 'latitud' || col.columnName === 'longitud' 
                ? parseFloat(e.target.value) || '' 
                : e.target.value
            )}
            placeholder={`${displayName.toUpperCase()}`}
            disabled={isDisabled}
            className={`w-full px-3 py-2 bg-neutral-800 border rounded-lg text-white text-base font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
              isDisabled 
                ? 'border-neutral-600 bg-neutral-700 cursor-not-allowed opacity-75' 
                : 'border-neutral-600'
            }`}
          />
        </div>
      );
    }

    return null;
  };

  // Función principal para renderizar campos de localización
  const result: React.ReactNode[] = [];
  
  // Fila contextual: País, Empresa, Fundo (si hay filtros globales)
  const contextualRow = renderContextualRow(['pais', 'empresa', 'fundo']);
  if (contextualRow) {
    result.push(
      <React.Fragment key="contextual-row">{contextualRow}</React.Fragment>
    );
  }
  
  // Segunda fila: Entidad, Ubicación, Nodo
  const entidadField = visibleColumns.find(c => c.columnName === 'entidadid');
  const ubicacionField = visibleColumns.find(c => c.columnName === 'ubicacionid');
  const nodoField = visibleColumns.find(c => c.columnName === 'nodoid');

  if (entidadField || ubicacionField || nodoField) {
    result.push(
      <div key="second-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {entidadField && renderLocalizacionField(entidadField, 'entidad')}
        {ubicacionField && renderLocalizacionField(ubicacionField, 'ubicacion')}
        {nodoField && renderLocalizacionField(nodoField, 'nodo')}
      </div>
    );
  }
  
  // Tercera fila: Latitud, Longitud, Referencia
  const latitudField = visibleColumns.find(c => c.columnName === 'latitud');
  const longitudField = visibleColumns.find(c => c.columnName === 'longitud');
  const referenciaField = visibleColumns.find(c => c.columnName === 'referencia');
  
  if (latitudField || longitudField || referenciaField) {
    result.push(
      <div key="third-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {latitudField && renderLocalizacionField(latitudField, 'coordenadas')}
        {longitudField && renderLocalizacionField(longitudField, 'coordenadas')}
        {referenciaField && renderLocalizacionField(referenciaField, 'coordenadas')}
      </div>
    );
  }
  
  // Cuarta fila: Status al extremo derecho
  const statusField = visibleColumns.find(c => c.columnName === 'statusid');
  if (statusField) {
    result.push(
      <div key="fourth-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div></div> {/* Espacio vacío */}
        <div></div> {/* Espacio vacío */}
        {renderField(statusField)}
      </div>
    );
  }
  
  return <>{result}</>;
};
