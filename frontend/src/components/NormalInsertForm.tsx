// ============================================================================
// IMPORTS
// ============================================================================

import React, { memo, useEffect, useMemo, useRef } from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';
import { tableValidationSchemas } from '../utils/validations';
import { useLanguage } from '../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../utils/systemParametersUtils';
import { UsuarioFormFields } from './forms/table-specific/UsuarioFormFields';
import { GeografiaFormFields } from './forms/table-specific/GeografiaFormFields';
import { ContactoFormFields } from './forms/table-specific/ContactoFormFields';
import { DispositivosFormFields } from './forms/table-specific/DispositivosFormFields';
import { AlertasFormFields } from './forms/table-specific/AlertasFormFields';
import { LocalizacionFormFields } from './forms/table-specific/LocalizacionFormFields';
import { FormFieldRenderer } from './forms/FormFieldRenderer';
import { ContextualRow } from './forms/ContextualRow';
import { useProgressiveEnablement } from '../hooks/useProgressiveEnablement';
import { logger } from '../utils/logger';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface NormalInsertFormProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateFormField?: (field: string, value: any) => void;
  selectedTable: string;
  loading: boolean;
  onInsert: () => void;
  onCancel: () => void;
  getColumnDisplayName: (columnName: string) => string;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onPasteFromClipboard?: () => void;
  onReplicateClick?: () => void;
  // Filtros globales para contextualizar
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  // Datos para mostrar nombres en lugar de IDs
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
  // Props específicas para contacto
  selectedContactType?: 'phone' | 'email' | null;
  countryCodes?: any[];
  resetContactType?: () => void;
  // Tema de color
  themeColor?: 'orange' | 'red' | 'blue' | 'green';
}

// ============================================================================
// COMPONENT DECLARATION
// ============================================================================

const NormalInsertForm: React.FC<NormalInsertFormProps> = memo(({
  visibleColumns,
  formData,
  setFormData,
  updateFormField,
  selectedTable,
  loading,
  onInsert,
  onCancel,
  getColumnDisplayName,
  getUniqueOptionsForField,
  onPasteFromClipboard,
  onReplicateClick,
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  paisesData,
  empresasData,
  fundosData,
  selectedContactType,
  countryCodes,
  resetContactType,
  themeColor = 'orange'
}) => {
  const { t } = useLanguage();
  
  // Debug: verificar columnas recibidas para perfil
  useEffect(() => {
    if (selectedTable === 'perfil') {
      logger.debug('NormalInsertForm - Columnas recibidas:', visibleColumns.map(c => c.columnName));
      logger.debug('NormalInsertForm - Total de columnas:', visibleColumns.length);
      const perfilColumns = visibleColumns.filter(c => c.columnName === 'perfil');
      if (perfilColumns.length > 1) {
        logger.error('ERROR: Se encontraron múltiples columnas "perfil":', perfilColumns.length);
      }
    }
  }, [visibleColumns, selectedTable]);
  
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

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  // Función para obtener el nombre de un país por ID
  const getPaisName = (paisId: string) => {
    const pais = paisesData?.find(p => p.paisid.toString() === paisId);
    return pais ? pais.pais : `País ${paisId}`;
  };

  // Función para obtener el nombre de una empresa por ID
  const getEmpresaName = (empresaId: string) => {
    const empresa = empresasData?.find(e => e.empresaid.toString() === empresaId);
    return empresa ? empresa.empresa : `Empresa ${empresaId}`;
  };

  // Función para obtener el nombre de un fundo por ID
  const getFundoName = (fundoId: string) => {
    const fundo = fundosData?.find(f => f.fundoid.toString() === fundoId);
    return fundo ? fundo.fundo : `Fundo ${fundoId}`;
  };

  // Función para determinar si un campo es obligatorio
  const isFieldRequired = (columnName: string): boolean => {
    const schema = tableValidationSchemas[selectedTable];
    if (!schema) return false;
    
    const rule = schema.find(rule => rule.field === columnName);
    return rule ? rule.required : false;
  };

  // Hook para habilitación progresiva
  const { isFieldEnabled } = useProgressiveEnablement(selectedTable, formData);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  // Función para renderizar fila contextual con filtros globales
  const renderContextualRow = (fields: string[]): React.ReactNode | null => {
    return (
      <ContextualRow
        fields={fields}
        paisSeleccionado={paisSeleccionado}
        empresaSeleccionada={empresaSeleccionada}
        fundoSeleccionado={fundoSeleccionado}
        getPaisName={getPaisName}
        getEmpresaName={getEmpresaName}
        getFundoName={getFundoName}
        getThemeColor={getThemeColor}
      />
    );
  };

  // Función para renderizar campos con layout específico
  const renderSpecialLayoutFields = (): React.ReactNode[] => {
    
    if (selectedTable === 'umbral') {
      return [<AlertasFormFields
        key="alertas"
        selectedTable={selectedTable}
        visibleColumns={visibleColumns}
        formData={formData}
        setFormData={setFormData}
        updateField={updateField}
        getThemeColor={getThemeColor}
        getUniqueOptionsForField={getUniqueOptionsForField}
        isFieldRequired={isFieldRequired}
        renderContextualRow={renderContextualRow}
      />];
    } else if (selectedTable === 'localizacion') {
      return [<LocalizacionFormFields
        key="localizacion"
        visibleColumns={visibleColumns}
        formData={formData}
        setFormData={setFormData}
        updateField={updateField}
        renderField={renderField}
        getThemeColor={getThemeColor}
        getUniqueOptionsForField={getUniqueOptionsForField}
        isFieldRequired={isFieldRequired}
        renderContextualRow={renderContextualRow}
      />];
    } else if (['entidad', 'tipo', 'nodo', 'sensor', 'metricasensor', 'metrica'].includes(selectedTable)) {
      return [<DispositivosFormFields
        key="dispositivos"
        selectedTable={selectedTable}
        visibleColumns={visibleColumns}
        formData={formData}
        setFormData={setFormData}
        updateField={updateField}
        renderField={renderField}
        getThemeColor={getThemeColor}
        getUniqueOptionsForField={getUniqueOptionsForField}
        isFieldRequired={isFieldRequired}
        renderContextualRow={renderContextualRow}
      />];
    } else {
      return visibleColumns.map(col => renderField(col));
    }
  };

  // Memoizar opciones de país para evitar re-renders
  const paisOptions = useMemo(() => {
    return getUniqueOptionsForField('paisid');
  }, [getUniqueOptionsForField]);

  // Referencia para evitar loops infinitos en el auto-selección de país
  const autoSelectedPaisRef = useRef(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Función helper para actualizar un campo del formulario
  const updateField = (field: string, value: any) => {
    if (updateFormField) {
      updateFormField(field, value);
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  // NO auto-seleccionar país automáticamente. Solo sincronizar con filtros globales.
  // El país solo se debe llenar si hay un filtro global seleccionado.
  useEffect(() => {
    // Resetear la referencia si cambia la tabla o se resetea el formulario
    if (formData.paisid === null || formData.paisid === undefined) {
      autoSelectedPaisRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paisOptions.length, selectedTable]);

  // Auto-seleccionar País si hay filtro global y no está seleccionado (solo para empresa y fundo)
  useEffect(() => {
    const hasGlobalFilter = paisSeleccionado && paisSeleccionado.trim() !== '';
    const shouldSync = hasGlobalFilter && (selectedTable === 'empresa' || selectedTable === 'fundo');
    
    logger.debug('[NormalInsertForm] Sincronización país:', {
      selectedTable,
      paisSeleccionado,
      hasGlobalFilter,
      formDataPaisid: formData.paisid,
      shouldSync,
      valuesMatch: formData.paisid && formData.paisid.toString() === paisSeleccionado?.toString()
    });
    
    if (shouldSync) {
      // Solo sincronizar si no hay valor o si el valor actual no coincide con el filtro
      if (!formData.paisid || formData.paisid.toString() !== paisSeleccionado.toString()) {
        logger.debug('[NormalInsertForm] Sincronizando paisid con filtro global:', paisSeleccionado);
        setFormData((prev: any) => ({ ...prev, paisid: paisSeleccionado }));
      } else {
        logger.debug('[NormalInsertForm] País ya está sincronizado, no actualizando');
      }
    } else if ((selectedTable === 'empresa' || selectedTable === 'fundo') && !hasGlobalFilter && formData.paisid) {
      // Si no hay filtro global y hay un valor en formData, limpiarlo (solo si fue auto-seleccionado previamente)
      logger.debug('[NormalInsertForm] Limpiando paisid porque no hay filtro global');
      setFormData((prev: any) => ({ ...prev, paisid: null }));
    }
  }, [paisSeleccionado, selectedTable, formData.paisid, setFormData]);

  // Auto-seleccionar Empresa si hay filtro global y no está seleccionada (solo para fundo)
  useEffect(() => {
    const hasGlobalFilter = empresaSeleccionada && empresaSeleccionada.trim() !== '';
    const shouldSync = hasGlobalFilter && selectedTable === 'fundo';
    
    if (shouldSync) {
      // Solo sincronizar si no hay valor o si el valor actual no coincide con el filtro
      if (!formData.empresaid || formData.empresaid.toString() !== empresaSeleccionada.toString()) {
        setFormData((prev: any) => ({ ...prev, empresaid: empresaSeleccionada }));
      }
    } else if (selectedTable === 'fundo' && !hasGlobalFilter && formData.empresaid) {
      // Si no hay filtro global y hay un valor en formData, limpiarlo
      setFormData((prev: any) => ({ ...prev, empresaid: null }));
    }
  }, [empresaSeleccionada, selectedTable, formData.empresaid, setFormData]);

  // Auto-seleccionar Fundo si hay filtro global y no está seleccionado (solo para ubicacion)
  useEffect(() => {
    const hasGlobalFilter = fundoSeleccionado && fundoSeleccionado.trim() !== '';
    const shouldSync = hasGlobalFilter && selectedTable === 'ubicacion';
    
    if (shouldSync) {
      // Solo sincronizar si no hay valor o si el valor actual no coincide con el filtro
      if (!formData.fundoid || formData.fundoid.toString() !== fundoSeleccionado.toString()) {
        setFormData((prev: any) => ({ ...prev, fundoid: fundoSeleccionado }));
      }
    } else if (selectedTable === 'ubicacion' && !hasGlobalFilter && formData.fundoid) {
      // Si no hay filtro global y hay un valor en formData, limpiarlo
      setFormData((prev: any) => ({ ...prev, fundoid: null }));
    }
  }, [fundoSeleccionado, selectedTable, formData.fundoid, setFormData]);

  // Función para renderizar campos con Status al extremo derecho (Usuario)
  const renderStatusRightFields = (): React.ReactNode[] => {
    const statusField = visibleColumns.find(col => col.columnName === 'statusid');
    const otherFields = visibleColumns.filter(col => col.columnName !== 'statusid');
    
    const result: React.ReactNode[] = [];
    
    // Primera fila: todos los campos excepto status
    const firstRow = otherFields.map(col => renderField(col)).filter(Boolean);
    
    if (firstRow.length > 0) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {firstRow}
        </div>
      );
    }
    
    // Segunda fila: Status al extremo derecho
    if (statusField) {
      result.push(
        <div key="second-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div></div> {/* Espacio vacío */}
          <div></div> {/* Espacio vacío */}
          {renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar un campo individual
  const renderField = (col: any): React.ReactNode => {
    return (
      <FormFieldRenderer
        key={col.columnName}
        col={col}
        selectedTable={selectedTable}
        formData={formData}
        setFormData={setFormData}
        updateField={updateField}
        getThemeColor={getThemeColor}
        getUniqueOptionsForField={getUniqueOptionsForField}
        isFieldRequired={isFieldRequired}
        isFieldEnabled={isFieldEnabled}
      />
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div>
      {/* Contenido del formulario */}
      <div>
        {selectedTable === 'usuario' ? (
          <UsuarioFormFields
            visibleColumns={visibleColumns}
            formData={formData}
            setFormData={setFormData}
            renderField={renderField}
            getThemeColor={getThemeColor}
          />
        ) : selectedTable === 'pais' ? (
          <GeografiaFormFields
            selectedTable="pais"
            visibleColumns={visibleColumns}
            formData={formData}
            setFormData={setFormData}
            updateField={updateField}
            renderField={renderField}
            getThemeColor={getThemeColor}
            getUniqueOptionsForField={getUniqueOptionsForField}
            paisOptions={paisOptions}
            paisSeleccionado={paisSeleccionado}
            empresaSeleccionada={empresaSeleccionada}
            fundoSeleccionado={fundoSeleccionado}
            getPaisName={getPaisName}
            getEmpresaName={getEmpresaName}
            getFundoName={getFundoName}
            renderContextualRow={renderContextualRow}
          />
        ) : selectedTable === 'empresa' ? (
          <GeografiaFormFields
            selectedTable="empresa"
            visibleColumns={visibleColumns}
            formData={formData}
            setFormData={setFormData}
            updateField={updateField}
            renderField={renderField}
            getThemeColor={getThemeColor}
            getUniqueOptionsForField={getUniqueOptionsForField}
            paisOptions={paisOptions}
            paisSeleccionado={paisSeleccionado}
            empresaSeleccionada={empresaSeleccionada}
            fundoSeleccionado={fundoSeleccionado}
            getPaisName={getPaisName}
            getEmpresaName={getEmpresaName}
            getFundoName={getFundoName}
            renderContextualRow={renderContextualRow}
          />
        ) : selectedTable === 'fundo' ? (
          <GeografiaFormFields
            selectedTable="fundo"
            visibleColumns={visibleColumns}
            formData={formData}
            setFormData={setFormData}
            updateField={updateField}
            renderField={renderField}
            getThemeColor={getThemeColor}
            getUniqueOptionsForField={getUniqueOptionsForField}
            paisOptions={paisOptions}
            paisSeleccionado={paisSeleccionado}
            empresaSeleccionada={empresaSeleccionada}
            fundoSeleccionado={fundoSeleccionado}
            getPaisName={getPaisName}
            getEmpresaName={getEmpresaName}
            getFundoName={getFundoName}
            renderContextualRow={renderContextualRow}
          />
        ) : selectedTable === 'ubicacion' ? (
          <GeografiaFormFields
            selectedTable="ubicacion"
            visibleColumns={visibleColumns}
            formData={formData}
            setFormData={setFormData}
            updateField={updateField}
            renderField={renderField}
            getThemeColor={getThemeColor}
            getUniqueOptionsForField={getUniqueOptionsForField}
            paisOptions={paisOptions}
            paisSeleccionado={paisSeleccionado}
            empresaSeleccionada={empresaSeleccionada}
            fundoSeleccionado={fundoSeleccionado}
            getPaisName={getPaisName}
            getEmpresaName={getEmpresaName}
            getFundoName={getFundoName}
            renderContextualRow={renderContextualRow}
          />
        ) : ['localizacion', 'entidad', 'tipo', 'nodo', 'sensor', 'metricasensor', 'metrica', 'umbral', 'contacto'].includes(selectedTable) ? (
          <div>
            {selectedTable === 'contacto' ? (
              <ContactoFormFields
                visibleColumns={visibleColumns}
                formData={formData}
                setFormData={setFormData}
                updateField={updateField}
                getThemeColor={getThemeColor}
                getUniqueOptionsForField={getUniqueOptionsForField}
                selectedContactType={selectedContactType}
                countryCodes={countryCodes}
              />
            ) : (
              renderSpecialLayoutFields()
            )}
          </div>
        ) : (
          <div>
            {(() => {
              const statusField = visibleColumns.find(col => col.columnName === 'statusid');
              const otherFields = visibleColumns.filter(col => col.columnName !== 'statusid');
              
              const result: React.ReactNode[] = [];
              
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
                  // Renderizar campos principales en filas de 3
                  const rows: React.ReactNode[][] = [];
                  for (let i = 0; i < otherFields.length; i += 3) {
                    rows.push(otherFields.slice(i, i + 3));
                  }
                  
                  rows.forEach((row, rowIndex) => {
                    // Si es la última fila y tiene 2 campos y hay status, agregar status
                    if (rowIndex === rows.length - 1 && row.length === 2 && statusField) {
                      result.push(
                        <div key={`row-${rowIndex}`} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          {row.map(col => renderField(col))}
                          {renderField(statusField)}
                        </div>
                      );
                    } else {
                      result.push(
                        <div key={`row-${rowIndex}`} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          {row.map(col => renderField(col))}
                        </div>
                      );
                    }
                  });
                  
                  // Si status no se agregó en la última fila, agregarlo en una fila separada
                  if (statusField && (rows.length === 0 || rows[rows.length - 1].length !== 2)) {
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
            })()}
          </div>
        )}
      </div>

      {/* Leyenda de campos obligatorios en esquina inferior izquierda */}
      <div className="absolute bottom-0 left-0 text-sm text-neutral-400 font-mono">
        {t('create.required_field')}
      </div>

      {/* Botones de acción centrados */}
      <div className="flex justify-center items-center mt-8 space-x-4">
        <button
          onClick={onInsert}
          disabled={loading}
          className={`px-6 py-2 ${getThemeColor('bg')} text-white rounded-lg ${getThemeColor('hover')} transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider`}
        >
          <span>➕</span>
          <span>{loading ? 'GUARDANDO...' : 'GUARDAR'}</span>
        </button>
        
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>❌</span>
          <span>CANCELAR</span>
        </button>

        {/* Botón para volver a selección de tipo de contacto */}
        {selectedTable === 'contacto' && selectedContactType && resetContactType && (
          <button
            onClick={resetContactType}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider"
          >
            <span>↩️</span>
            <span>VOLVER</span>
          </button>
        )}
        
        {selectedTable === 'sensor' && onPasteFromClipboard && (
          <button
            onClick={onPasteFromClipboard}
            className="px-6 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium font-mono tracking-wider"
          >
            PEGAR DESDE PORTAPAPELES
          </button>
        )}
      </div>
    </div>
  );
});

NormalInsertForm.displayName = 'NormalInsertForm';

export default NormalInsertForm;
