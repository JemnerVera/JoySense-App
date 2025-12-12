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
      console.log('🔍 NormalInsertForm - Columnas recibidas:', visibleColumns.map(c => c.columnName));
      console.log('🔍 NormalInsertForm - Total de columnas:', visibleColumns.length);
      const perfilColumns = visibleColumns.filter(c => c.columnName === 'perfil');
      if (perfilColumns.length > 1) {
        console.error('❌ ERROR: Se encontraron múltiples columnas "perfil":', perfilColumns.length);
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

  // Función para determinar si un campo debe estar habilitado (habilitación progresiva)
  const isFieldEnabled = (columnName: string): boolean => {
    // Para País: solo habilitar paisabrev si pais tiene valor
    if (selectedTable === 'pais') {
      if (columnName === 'paisabrev') {
        return !!(formData.pais && formData.pais.trim() !== '');
      }
      if (columnName === 'pais') {
        return true; // Siempre habilitado
      }
    }
    
    // Para Empresa: solo habilitar empresabrev si empresa tiene valor
    if (selectedTable === 'empresa') {
      if (columnName === 'empresabrev') {
        return !!(formData.empresa && formData.empresa.trim() !== '');
      }
      if (columnName === 'empresa') {
        return true; // Siempre habilitado
      }
    }
    
  // Para Fundo: solo habilitar fundoabrev si fundo tiene valor
  if (selectedTable === 'fundo') {
    if (columnName === 'fundoabrev') {
      return !!(formData.fundo && formData.fundo.trim() !== '');
    }
    if (columnName === 'fundo') {
      return true; // Siempre habilitado
    }
  }
  
  // Para Tipo: solo habilitar tipo si entidadid tiene valor
  if (selectedTable === 'tipo') {
    if (columnName === 'tipo') {
      return !!(formData.entidadid);
    }
    if (columnName === 'entidadid') {
      return true; // Siempre habilitado
    }
  }
  
  // Para Nodo: habilitación progresiva nodo -> deveui -> resto
  if (selectedTable === 'nodo') {
    if (columnName === 'nodo') {
      return true; // Siempre habilitado
    }
    if (columnName === 'deveui') {
      return !!(formData.nodo && formData.nodo.trim() !== '');
    }
    // Para el resto de campos (appeui, appkey, atpin, statusid)
    if (['appeui', 'appkey', 'atpin', 'statusid'].includes(columnName)) {
      return !!(formData.nodo && formData.nodo.trim() !== '' && formData.deveui && formData.deveui.trim() !== '');
    }
  }
  
  // Para Métrica: habilitación progresiva metrica -> unidad -> resto
  if (selectedTable === 'metrica') {
    if (columnName === 'metrica') {
      return true; // Siempre habilitado
    }
    if (columnName === 'unidad') {
      return !!(formData.metrica && formData.metrica.trim() !== '');
    }
    // Para el resto de campos (statusid)
    if (['statusid'].includes(columnName)) {
      return !!(formData.metrica && formData.metrica.trim() !== '' && formData.unidad && formData.unidad.trim() !== '');
    }
  }
  
  // Para Perfil Umbral: habilitación progresiva perfilid -> umbralid -> resto
  if (selectedTable === 'perfilumbral') {
    if (columnName === 'perfilid') {
      return true; // Siempre habilitado
    }
    if (columnName === 'umbralid') {
      return !!(formData.perfilid && formData.perfilid !== 0);
    }
    // Para el resto de campos (statusid)
    if (['statusid'].includes(columnName)) {
      return !!(formData.perfilid && formData.perfilid !== 0 && formData.umbralid && formData.umbralid !== 0);
    }
  }
  
  // Para Criticidad: habilitación progresiva criticidad -> criticidadbrev -> resto
  if (selectedTable === 'criticidad') {
    if (columnName === 'criticidad') {
      return true; // Siempre habilitado
    }
    if (columnName === 'criticidadbrev') {
      return !!(formData.criticidad && formData.criticidad.trim() !== '');
    }
    // Para el resto de campos (statusid)
    if (['statusid'].includes(columnName)) {
      return !!(formData.criticidad && formData.criticidad.trim() !== '' && formData.criticidadbrev && formData.criticidadbrev.trim() !== '');
    }
  }
  
  // Para Contacto: habilitación progresiva usuarioid -> resto
  if (selectedTable === 'contacto') {
    if (columnName === 'usuarioid') {
      return true; // Siempre habilitado
    }
    // Para el resto de campos (codigotelefonoid, celular, correo, statusid)
    if (['codigotelefonoid', 'celular', 'correo', 'statusid'].includes(columnName)) {
      return !!(formData.usuarioid && formData.usuarioid !== 0);
    }
  }
  
  // Para Perfil: habilitación progresiva perfil -> nivel -> resto
  if (selectedTable === 'perfil') {
    if (columnName === 'perfil') {
      return true; // Siempre habilitado
    }
    if (columnName === 'nivel') {
      return !!(formData.perfil && formData.perfil.trim() !== '');
    }
    // Para el resto de campos (statusid)
    if (['statusid'].includes(columnName)) {
      return !!(formData.perfil && formData.perfil.trim() !== '' && formData.nivel && formData.nivel.trim() !== '');
    }
  }
  
  // Para otros campos, usar lógica normal
  return true;
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  // Función para renderizar fila contextual con filtros globales
  const renderContextualRow = (fields: string[]) => {
    
    const contextualFields = fields.map(field => {
      // Para País: mostrar solo si hay filtro global
      if (field === 'pais' && paisSeleccionado) {
        return (
          <div key="pais-contextual">
            <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
              {t('create.country')}
            </label>
            <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75">
              {getPaisName(paisSeleccionado)}
            </div>
          </div>
        );
      } 
      // Para Empresa: mostrar solo si hay filtro global
      else if (field === 'empresa' && empresaSeleccionada) {
        return (
          <div key="empresa-contextual">
            <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
              {t('create.company')}
            </label>
            <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75">
              {getEmpresaName(empresaSeleccionada)}
            </div>
          </div>
        );
      } 
      // Para Fundo: mostrar solo si hay filtro global
      else if (field === 'fundo' && fundoSeleccionado) {
        return (
          <div key="fundo-contextual">
            <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
              {t('table_headers.fund')}
            </label>
            <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75">
              {getFundoName(fundoSeleccionado)}
            </div>
          </div>
        );
      }
      return null;
    }).filter(Boolean);

    if (contextualFields.length > 0) {
  return (
        <div key="contextual-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {contextualFields}
        </div>
      );
    }
    return null;
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

  // Auto-seleccionar País si solo hay una opción (solo una vez)
  useEffect(() => {
    if (paisOptions.length === 1 && !formData.paisid && !autoSelectedPaisRef.current) {
      const newPaisId = paisOptions[0].value;
      autoSelectedPaisRef.current = true;
      updateField('paisid', newPaisId);
    }
    // Resetear la referencia si cambia la tabla o se resetea el formulario
    if (formData.paisid === null || formData.paisid === undefined) {
      autoSelectedPaisRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paisOptions.length, selectedTable]);

  // Función para renderizar campos de País con layout específico
  const renderPaisFields = (): React.ReactNode => {
    return (
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
    );
  };

  // Función para renderizar campos de Empresa con layout específico
  const renderEmpresaFields = (): React.ReactNode => {
    return (
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
    );
  };

  // Auto-seleccionar Empresa si hay filtro global y no está seleccionada
  useEffect(() => {
    if (empresaSeleccionada && !formData.empresaid) {
      setFormData((prev: any) => ({ ...prev, empresaid: empresaSeleccionada }));
    }
  }, [empresaSeleccionada, formData.empresaid, setFormData]);

  // Auto-seleccionar Fundo si hay filtro global y no está seleccionado
  useEffect(() => {
    if (fundoSeleccionado && !formData.fundoid) {
      setFormData((prev: any) => ({ ...prev, fundoid: fundoSeleccionado }));
    }
  }, [fundoSeleccionado, formData.fundoid, setFormData]);

  // Función para renderizar campos de Fundo con layout específico
  const renderFundoFields = (): React.ReactNode => {
    return (
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
    );
  };

  // Función para renderizar campos de Ubicación con layout específico
  const renderUbicacionFields = (): React.ReactNode => {
    return (
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
    );
  };

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

          // Campos de relación para empresa
          if (col.columnName === 'paisid' && selectedTable === 'empresa') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => updateField(
                    col.columnName,
                    newValue ? parseInt(newValue.toString()) : null
                  )}
                  options={options}
                  placeholder={`${t('buttons.select')} ${t('fields.country')}`}
                />
              </div>
            );
          }

          // Campos de relación para fundo
          if (col.columnName === 'empresaid' && selectedTable === 'fundo') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`${t('buttons.select')} ${t('fields.company')}`}
                />
              </div>
            );
          }

          // Campos de relación para ubicacion
          if (col.columnName === 'fundoid' && selectedTable === 'ubicacion') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`${t('buttons.select')} ${t('fields.fund')}`}
                />
              </div>
            );
          }

          // Campos de relación para localizacion
          if (col.columnName === 'ubicacionid' && selectedTable === 'localizacion') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.select_location')}
                />
              </div>
            );
          }

          if (col.columnName === 'nodoid' && selectedTable === 'localizacion') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.select_node')}
                />
              </div>
            );
          }

          if (col.columnName === 'entidadid' && (selectedTable === 'localizacion' || selectedTable === 'tipo')) {
            const options = getUniqueOptionsForField(col.columnName);
            const displayName = getColumnDisplayNameTranslated(col.columnName, t);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`${displayName.toUpperCase()}`}
                />
              </div>
            );
          }

          // Campos de relación para sensor
          if (col.columnName === 'nodoid' && selectedTable === 'sensor') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.select_node')}
                />
              </div>
            );
          }

          if (col.columnName === 'tipoid' && selectedTable === 'sensor') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`${displayName.toUpperCase()}`}
                />
              </div>
            );
          }

          // Campos de relación para metricasensor
          if (col.columnName === 'nodoid' && selectedTable === 'metricasensor') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.select_node')}
                />
              </div>
            );
          }

          if (col.columnName === 'metricaid' && selectedTable === 'metricasensor') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.select_metric')}
                />
              </div>
            );
          }

          if (col.columnName === 'tipoid' && selectedTable === 'metricasensor') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`${displayName.toUpperCase()}`}
                />
              </div>
            );
          }

          // Combobox para umbral - ubicacionid, criticidadid, nodoid, metricaid, tipoid
          if (col.columnName === 'ubicacionid' && selectedTable === 'umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.select_location')}
                />
              </div>
            );
          }

          if (col.columnName === 'criticidadid' && selectedTable === 'umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.select_criticality')}
                />
              </div>
            );
          }

          if (col.columnName === 'nodoid' && selectedTable === 'umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.select_node')}
                />
              </div>
            );
          }

          if (col.columnName === 'metricaid' && selectedTable === 'umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.select_metric')}
                />
              </div>
            );
          }

          if (col.columnName === 'tipoid' && selectedTable === 'umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`${displayName.toUpperCase()}`}
                />
              </div>
            );
          }

          // Combobox para perfilumbral - perfilid, umbralid
          if (col.columnName === 'perfilid' && selectedTable === 'perfilumbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.profile')}
                />
              </div>
            );
          }

          if (col.columnName === 'umbralid' && selectedTable === 'perfilumbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.threshold')}
                />
              </div>
            );
          }

          // Combobox para audit_log_umbral - umbralid, modified_by
          if (col.columnName === 'umbralid' && selectedTable === 'audit_log_umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.select_threshold')}
                />
              </div>
            );
          }

          if (col.columnName === 'modified_by' && selectedTable === 'audit_log_umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.select_user')}
                />
              </div>
            );
          }

          // Combobox para usuarioperfil - usuarioid, perfilid
          if (col.columnName === 'usuarioid' && selectedTable === 'usuarioperfil') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.select_user')}
                />
              </div>
            );
          }

          if (col.columnName === 'perfilid' && selectedTable === 'usuarioperfil') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.select_profile')}
                />
              </div>
            );
          }

          // Combobox para perfil - jefeid (mostrar nivel - perfil)
          if (col.columnName === 'jefeid' && selectedTable === 'perfil') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.select_boss')}
                />
              </div>
            );
          }

          // Combobox para contacto - usuarioid, medioid
          if (col.columnName === 'usuarioid' && selectedTable === 'contacto') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.user')}
                />
              </div>
            );
          }

          if (col.columnName === 'medioid' && selectedTable === 'contacto') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}{isRequired ? '*' : ''}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={t('create.medium')}
                />
              </div>
            );
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

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderContactFields = () => {
    return (
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
    );
  };

  // Función para renderizar formulario de usuario con campo password
  const renderUsuarioForm = (): React.ReactNode => {
    return (
      <UsuarioFormFields
        visibleColumns={visibleColumns}
        formData={formData}
        setFormData={setFormData}
        renderField={renderField}
        getThemeColor={getThemeColor}
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
          renderUsuarioForm()
        ) : selectedTable === 'pais' ? (
          renderPaisFields()
        ) : selectedTable === 'empresa' ? (
          renderEmpresaFields()
        ) : selectedTable === 'fundo' ? (
          renderFundoFields()
        ) : selectedTable === 'ubicacion' ? (
          renderUbicacionFields()
        ) : ['localizacion', 'entidad', 'tipo', 'nodo', 'sensor', 'metricasensor', 'metrica', 'umbral', 'contacto'].includes(selectedTable) ? (
          <div>
            {selectedTable === 'contacto' ? renderContactFields() : renderSpecialLayoutFields()}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibleColumns.map(col => renderField(col))}
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
