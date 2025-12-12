// ============================================================================
// DISPOSITIVOS FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos de dispositivos (entidad, tipo, nodo, métrica, sensor, métricasensor)

import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../../../utils/systemParametersUtils';

interface DispositivosFormFieldsProps {
  selectedTable: string;
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateField: (field: string, value: any) => void;
  renderField: (col: any) => React.ReactNode;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  isFieldRequired: (columnName: string) => boolean;
  renderContextualRow: (fields: string[]) => React.ReactNode | null;
  renderLocalizacionField?: (col: any, fieldType: 'entidad' | 'ubicacion' | 'nodo' | 'coordenadas') => React.ReactNode;
}

export const DispositivosFormFields: React.FC<DispositivosFormFieldsProps> = ({
  selectedTable,
  visibleColumns,
  formData,
  setFormData,
  updateField,
  renderField,
  getThemeColor,
  getUniqueOptionsForField,
  isFieldRequired,
  renderContextualRow,
  renderLocalizacionField
}) => {
  const { t } = useLanguage();

  // Función para renderizar campos de Tipo
  const renderTipoFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    const entidadField = visibleColumns.find(c => c.columnName === 'entidadid');
    const tipoField = visibleColumns.find(c => c.columnName === 'tipo');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    if (entidadField || tipoField || statusField) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {entidadField && renderField(entidadField)}
          {tipoField && renderField(tipoField)}
          {statusField && renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Entidad
  const renderEntidadFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    const contextualRow = renderContextualRow(['pais', 'empresa', 'fundo']);
    if (contextualRow) {
      result.push(
        <React.Fragment key="contextual-row">{contextualRow}</React.Fragment>
      );
    }
    
    const entidadField = visibleColumns.find(c => c.columnName === 'entidad');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    if (entidadField || statusField) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {entidadField && renderField(entidadField)}
          <div></div>
          {statusField && renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Nodo
  const renderNodoFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    const otherFields = visibleColumns.filter(col => !['paisid', 'empresaid', 'fundoid', 'statusid'].includes(col.columnName));
    
    // Renderizar campos principales
    if (otherFields.length > 0) {
      // Si hay 2 campos y status, ponerlos en la misma fila
      if (otherFields.length === 2 && statusField) {
        result.push(
          <div key="fields-status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {otherFields.map(col => renderField(col))}
            {statusField && renderField(statusField)}
          </div>
        );
      } else {
        // Renderizar campos principales
        result.push(
          <div key="fields-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {otherFields.map(col => renderField(col))}
          </div>
        );
        // Renderizar status en fila separada si existe
        if (statusField) {
          result.push(
            <div key="status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div></div>
              <div></div>
              {renderField(statusField)}
            </div>
          );
        }
      }
    } else if (statusField) {
      // Solo status
      result.push(
        <div key="status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div></div>
          <div></div>
          {renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Sensor
  const renderSensorFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    const otherFields = visibleColumns.filter(col => !['paisid', 'empresaid', 'fundoid', 'statusid'].includes(col.columnName));
    
    // Renderizar campos principales
    if (otherFields.length > 0) {
      // Si hay 2 campos y status, ponerlos en la misma fila
      if (otherFields.length === 2 && statusField) {
        result.push(
          <div key="fields-status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {otherFields.map(col => renderField(col))}
            {statusField && renderField(statusField)}
          </div>
        );
      } else {
        // Renderizar campos principales
        result.push(
          <div key="fields-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {otherFields.map(col => renderField(col))}
          </div>
        );
        // Renderizar status en fila separada si existe
        if (statusField) {
          result.push(
            <div key="status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div></div>
              <div></div>
              {renderField(statusField)}
            </div>
          );
        }
      }
    } else if (statusField) {
      // Solo status
      result.push(
        <div key="status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div></div>
          <div></div>
          {renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Sensor Metrica
  const renderSensorMetricaFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    const otherFields = visibleColumns.filter(col => !['paisid', 'empresaid', 'fundoid', 'statusid'].includes(col.columnName));
    
    // Renderizar campos principales
    if (otherFields.length > 0) {
      // Si hay 2 campos y status, ponerlos en la misma fila
      if (otherFields.length === 2 && statusField) {
        result.push(
          <div key="fields-status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {otherFields.map(col => renderField(col))}
            {statusField && renderField(statusField)}
          </div>
        );
      } else {
        // Renderizar campos principales
        result.push(
          <div key="fields-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {otherFields.map(col => renderField(col))}
          </div>
        );
        // Renderizar status en fila separada si existe
        if (statusField) {
          result.push(
            <div key="status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div></div>
              <div></div>
              {renderField(statusField)}
            </div>
          );
        }
      }
    } else if (statusField) {
      // Solo status
      result.push(
        <div key="status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div></div>
          <div></div>
          {renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Metrica
  const renderMetricaFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    const otherFields = visibleColumns.filter(col => !['paisid', 'empresaid', 'fundoid', 'statusid'].includes(col.columnName));
    
    // Renderizar campos principales
    if (otherFields.length > 0) {
      // Si hay 2 campos y status, ponerlos en la misma fila
      if (otherFields.length === 2 && statusField) {
        result.push(
          <div key="fields-status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {otherFields.map(col => renderField(col))}
            {statusField && renderField(statusField)}
          </div>
        );
      } else {
        // Renderizar campos principales
        result.push(
          <div key="fields-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {otherFields.map(col => renderField(col))}
          </div>
        );
        // Renderizar status en fila separada si existe
        if (statusField) {
          result.push(
            <div key="status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div></div>
              <div></div>
              {renderField(statusField)}
            </div>
          );
        }
      }
    } else if (statusField) {
      // Solo status
      result.push(
        <div key="status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div></div>
          <div></div>
          {renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Router para seleccionar el renderizado correcto según la tabla
  switch (selectedTable) {
    case 'tipo':
      return <>{renderTipoFields()}</>;
    case 'entidad':
      return <>{renderEntidadFields()}</>;
    case 'nodo':
      return <>{renderNodoFields()}</>;
    case 'sensor':
      return <>{renderSensorFields()}</>;
    case 'metricasensor':
      return <>{renderSensorMetricaFields()}</>;
    case 'metrica':
      return <>{renderMetricaFields()}</>;
    default:
      return null;
  }
};
