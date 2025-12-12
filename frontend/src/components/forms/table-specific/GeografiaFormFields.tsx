// ============================================================================
// GEOGRAFIA FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos de geografía (país, empresa, fundo, ubicación)

import React from 'react';
import SelectWithPlaceholder from '../../SelectWithPlaceholder';
import { useLanguage } from '../../../contexts/LanguageContext';

interface GeografiaFormFieldsProps {
  selectedTable: string;
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateField: (field: string, value: any) => void;
  renderField: (col: any) => React.ReactNode;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  paisOptions: Array<{value: any, label: string}>;
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  getPaisName: (paisId: string) => string;
  getEmpresaName: (empresaId: string) => string;
  getFundoName: (fundoId: string) => string;
  renderContextualRow: (fields: string[]) => React.ReactNode | null;
}

export const GeografiaFormFields: React.FC<GeografiaFormFieldsProps> = ({
  selectedTable,
  visibleColumns,
  formData,
  setFormData,
  updateField,
  renderField,
  getThemeColor,
  getUniqueOptionsForField,
  paisOptions,
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  getPaisName,
  getEmpresaName,
  getFundoName,
  renderContextualRow
}) => {
  const { t } = useLanguage();

  // Función para renderizar campos de País
  const renderPaisFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    const paisField = visibleColumns.find(c => c.columnName === 'pais');
    if (paisField) {
      result.push(
        <div key="pais-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {renderField(paisField)}
          <div></div>
          <div></div>
        </div>
      );
    }
    
    const abreviaturaField = visibleColumns.find(c => c.columnName === 'paisabrev');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    if (abreviaturaField || statusField) {
      result.push(
        <div key="abrev-status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {abreviaturaField && renderField(abreviaturaField)}
          {statusField && renderField(statusField)}
          <div></div>
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Empresa
  const renderEmpresaFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    const paisField = visibleColumns.find(c => c.columnName === 'paisid');
    if (paisField) {
      if (paisOptions.length === 1) {
        result.push(
          <div key="pais-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                {t('create.country')}
              </label>
              <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75">
                {paisOptions[0].label}
              </div>
            </div>
            <div></div>
            <div></div>
          </div>
        );
      } else {
        result.push(
          <div key="pais-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {renderField(paisField)}
            <div></div>
            <div></div>
          </div>
        );
      }
    }
    
    const empresaField = visibleColumns.find(c => c.columnName === 'empresa');
    const abreviaturaField = visibleColumns.find(c => c.columnName === 'empresabrev');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    if (empresaField || abreviaturaField || statusField) {
      result.push(
        <div key="empresa-abrev-status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {empresaField && renderField(empresaField)}
          {abreviaturaField && renderField(abreviaturaField)}
          {statusField && renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Fundo
  const renderFundoFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    const paisField = visibleColumns.find(c => c.columnName === 'paisid');
    const empresaField = visibleColumns.find(c => c.columnName === 'empresaid');
    
    const renderPaisField = () => {
      if (paisSeleccionado && paisOptions.length > 0) {
        const selectedPais = paisOptions.find(p => p.value === paisSeleccionado);
        return (
          <div>
            <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
              {t('create.country')}*
            </label>
            <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75">
              {selectedPais ? selectedPais.label : getPaisName(paisSeleccionado)}
            </div>
          </div>
        );
      } else if (paisField) {
        return renderField(paisField);
      } else {
        const paisOptionsManual = getUniqueOptionsForField('paisid');
        const paisValue = formData.paisid || '';
        return (
          <div>
            <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
              {t('create.country')}*
            </label>
            <SelectWithPlaceholder
              value={paisValue}
              onChange={(newValue) => updateField('paisid', newValue ? parseInt(newValue.toString()) : null)}
              options={paisOptionsManual}
              placeholder={`${t('buttons.select')} ${t('fields.country')}`}
            />
          </div>
        );
      }
    };
    
    // Renderizar campo de empresa con sincronización de filtros globales
    const renderEmpresaField = () => {
      if (empresaSeleccionada && empresaField) {
        // Si hay empresa seleccionada en filtros globales, mostrar como disabled
        const empresaOptions = getUniqueOptionsForField('empresaid');
        const selectedEmpresa = empresaOptions.find(e => e.value.toString() === empresaSeleccionada.toString());
        return (
          <div>
            <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
              {t('create.company')}*
            </label>
            <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75">
              {selectedEmpresa ? selectedEmpresa.label : getEmpresaName(empresaSeleccionada)}
            </div>
          </div>
        );
      } else if (empresaField) {
        return renderField(empresaField);
      }
      return null;
    };
    
    result.push(
      <div key="pais-empresa-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {renderPaisField()}
        {renderEmpresaField()}
        <div></div>
      </div>
    );
    
    const fundoField = visibleColumns.find(c => c.columnName === 'fundo');
    const abreviaturaField = visibleColumns.find(c => c.columnName === 'fundoabrev');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    if (fundoField || abreviaturaField || statusField) {
      result.push(
        <div key="fundo-abrev-status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {fundoField && renderField(fundoField)}
          {abreviaturaField && renderField(abreviaturaField)}
          {statusField && renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Ubicación
  const renderUbicacionFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    const contextualRow = renderContextualRow(['pais', 'empresa', 'fundo']);
    if (contextualRow) {
      result.push(
        <React.Fragment key="contextual-row">{contextualRow}</React.Fragment>
      );
    }
    
    const fundoField = visibleColumns.find(c => c.columnName === 'fundoid');
    const ubicacionField = visibleColumns.find(c => c.columnName === 'ubicacion');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    const shouldShowFundoField = fundoField && !fundoSeleccionado;
    
    if (shouldShowFundoField || ubicacionField || statusField) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {shouldShowFundoField && renderField(fundoField)}
          {ubicacionField && renderField(ubicacionField)}
          {statusField && renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Router para seleccionar el renderizado correcto según la tabla
  switch (selectedTable) {
    case 'pais':
      return <>{renderPaisFields()}</>;
    case 'empresa':
      return <>{renderEmpresaFields()}</>;
    case 'fundo':
      return <>{renderFundoFields()}</>;
    case 'ubicacion':
      return <>{renderUbicacionFields()}</>;
    default:
      return null;
  }
};
