// ============================================================================
// IMPORTS
// ============================================================================

import React, { memo, useEffect, useMemo, useRef } from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';
import { tableValidationSchemas } from '../utils/formValidation';
import { useLanguage } from '../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../utils/systemParametersUtils';

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
      return renderUmbralFields();
    } else if (selectedTable === 'fundo') {
      return renderFundoFields();
    } else if (selectedTable === 'ubicacion') {
      return renderUbicacionFields();
    } else if (selectedTable === 'localizacion') {
      return renderLocalizacionFields();
    } else if (selectedTable === 'entidad') {
      return renderEntidadFields();
    } else if (selectedTable === 'tipo') {
      return renderTipoFields();
    } else if (selectedTable === 'nodo') {
      return renderNodoFields();
    } else if (selectedTable === 'sensor') {
      return renderSensorFields();
    } else if (selectedTable === 'metricasensor') {
      return renderSensorMetricaFields();
    } else if (selectedTable === 'metrica') {
      return renderMetricaFields();
    } else {
      return visibleColumns.map(col => renderField(col));
    }
  };

  // Función para renderizar campos de umbral con layout específico y cascada
  const renderUmbralFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Fila contextual: País, Empresa, Fundo (si hay filtros globales)
    const contextualRow = renderContextualRow(['pais', 'empresa', 'fundo']);
    if (contextualRow) {
      result.push(contextualRow);
    }
    
    // Primera fila: Ubicación, Nodo, Tipo
    const ubicacionField = visibleColumns.find(c => c.columnName === 'ubicacionid');
    const nodoField = visibleColumns.find(c => c.columnName === 'nodoid');
    const tipoField = visibleColumns.find(c => c.columnName === 'tipoid');
    
    if (ubicacionField || nodoField || tipoField) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Ubicación - siempre habilitada */}
          {ubicacionField && renderUmbralField(ubicacionField, true)}
          
          {/* Nodo - habilitado solo si hay ubicación seleccionada */}
          {nodoField && renderUmbralField(nodoField, !!formData.ubicacionid)}
          
          {/* Tipo - habilitado solo si hay nodo seleccionado */}
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
          {/* Métrica - habilitada solo si hay tipo seleccionado */}
          {metricaField && renderUmbralField(metricaField, !!formData.tipoid)}
          
          {/* Valores - habilitados solo si hay métrica seleccionada */}
          <div className="bg-gray-600 bg-opacity-40 p-3 rounded-lg border border-gray-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {minimoField && renderUmbralField(minimoField, !!formData.metricaid)}
              {maximoField && renderUmbralField(maximoField, !!formData.metricaid)}
            </div>
          </div>
          
          {/* Criticidad - habilitada solo si hay métrica seleccionada */}
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
          {/* Nombre Umbral - habilitado solo si hay métrica seleccionada */}
          {umbralField && renderUmbralField(umbralField, !!formData.metricaid)}
          
          <div></div> {/* Espacio vacío */}
          
          {/* Status - habilitado solo si hay métrica seleccionada */}
          {statusField && renderUmbralField(statusField, !!formData.metricaid)}
        </div>
      );
    }

    return result;
  };

  // Función para renderizar un campo de umbral con lógica de cascada
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
                updateField('statusid', 1); // Mantener status por defecto
              } else if (col.columnName === 'nodoid') {
                updateField('tipoid', null);
                updateField('metricaid', null);
                updateField('criticidadid', null);
                updateField('minimo', '');
                updateField('maximo', '');
                updateField('umbral', '');
                updateField('statusid', 1); // Mantener status por defecto
              } else if (col.columnName === 'tipoid') {
                updateField('metricaid', null);
                updateField('criticidadid', null);
                updateField('minimo', '');
                updateField('maximo', '');
                updateField('umbral', '');
                updateField('statusid', 1); // Mantener status por defecto
              } else if (col.columnName === 'metricaid') {
                updateField('criticidadid', null);
                updateField('minimo', '');
                updateField('maximo', '');
                updateField('umbral', '');
                updateField('statusid', 1); // Mantener status por defecto
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
  const renderPaisFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Primera fila: País
    const paisField = visibleColumns.find(c => c.columnName === 'pais');
    if (paisField) {
      result.push(
        <div key="pais-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {renderField(paisField)}
          <div></div> {/* Espacio vacío */}
          <div></div> {/* Espacio vacío */}
        </div>
      );
    }
    
    // Segunda fila: Abreviatura y Status en la misma fila
    const abreviaturaField = visibleColumns.find(c => c.columnName === 'paisabrev');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    if (abreviaturaField || statusField) {
      result.push(
        <div key="abrev-status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {abreviaturaField && renderField(abreviaturaField)}
          {statusField && renderField(statusField)}
          <div></div> {/* Espacio vacío */}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Empresa con layout específico
  const renderEmpresaFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Primera fila: País (si hay múltiples opciones, mostrar dropdown; si solo una, mostrar como texto)
    const paisField = visibleColumns.find(c => c.columnName === 'paisid');
    if (paisField) {
      if (paisOptions.length === 1) {
        // Mostrar como texto cuando solo hay una opción
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
            <div></div> {/* Espacio vacío */}
            <div></div> {/* Espacio vacío */}
          </div>
        );
      } else {
        // Mostrar dropdown cuando hay múltiples opciones
        result.push(
          <div key="pais-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {renderField(paisField)}
            <div></div> {/* Espacio vacío */}
            <div></div> {/* Espacio vacío */}
          </div>
        );
      }
    }
    
    // Segunda fila: Empresa, Abreviatura y Status en la misma fila
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
  const renderFundoFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Fila 1: País y Empresa (siempre mostrar País)
    const paisField = visibleColumns.find(c => c.columnName === 'paisid');
    const empresaField = visibleColumns.find(c => c.columnName === 'empresaid');
    
    // Renderizar campo País (siempre visible)
    const renderPaisField = () => {
      if (paisSeleccionado && paisOptions.length > 0) {
        // Mostrar como texto cuando hay filtro global
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
        // Mostrar dropdown cuando NO hay filtro global y el campo existe
        return renderField(paisField);
      } else {
        // Si no existe el campo en visibleColumns, crearlo manualmente
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
    
    result.push(
      <div key="pais-empresa-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {renderPaisField()}
        {empresaField && renderField(empresaField)}
        <div></div> {/* Espacio vacío */}
      </div>
    );
    
    // Fila 2: Fundo, Abreviatura y Status en la misma fila
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

  // Función para renderizar campos de Ubicación con layout específico
  const renderUbicacionFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Fila contextual: País, Empresa, Fundo (si hay filtros globales)
    const contextualRow = renderContextualRow(['pais', 'empresa', 'fundo']);
    if (contextualRow) {
      result.push(contextualRow);
    }
    
    // Primera fila: Fundo (si NO hay filtro global), Ubicación, Status (máximo 3 campos)
    const fundoField = visibleColumns.find(c => c.columnName === 'fundoid');
    const ubicacionField = visibleColumns.find(c => c.columnName === 'ubicacion');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    // Solo mostrar campo Fundo si NO hay filtro global de fundo
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

  // Función para renderizar campos de Tipo con layout específico
  const renderTipoFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Primera fila: Entidad, Tipo, Status
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

  // Función para renderizar campos de Entidad con layout específico
  const renderEntidadFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Fila contextual: País, Empresa, Fundo (si hay filtros globales)
    const contextualRow = renderContextualRow(['pais', 'empresa', 'fundo']);
    if (contextualRow) {
      result.push(contextualRow);
    }
    
    // Primera fila: Entidad, Status
    const entidadField = visibleColumns.find(c => c.columnName === 'entidad');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    if (entidadField || statusField) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {entidadField && renderField(entidadField)}
          <div></div> {/* Espacio vacío */}
          {statusField && renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Nodo con layout específico
  const renderNodoFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Renderizar el resto de campos normalmente
    const otherFields = visibleColumns.filter(col => !['paisid', 'empresaid', 'fundoid'].includes(col.columnName));
    if (otherFields.length > 0) {
      result.push(
        <div key="fields-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {otherFields.map(col => renderField(col))}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Sensor con layout específico
  const renderSensorFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Renderizar el resto de campos normalmente
    const otherFields = visibleColumns.filter(col => !['paisid', 'empresaid', 'fundoid'].includes(col.columnName));
    if (otherFields.length > 0) {
      result.push(
        <div key="fields-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {otherFields.map(col => renderField(col))}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Sensor Metrica con layout específico
  const renderSensorMetricaFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Renderizar el resto de campos normalmente
    const otherFields = visibleColumns.filter(col => !['paisid', 'empresaid', 'fundoid'].includes(col.columnName));
    if (otherFields.length > 0) {
      result.push(
        <div key="fields-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {otherFields.map(col => renderField(col))}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Metrica con layout específico
  const renderMetricaFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Renderizar el resto de campos normalmente
    const otherFields = visibleColumns.filter(col => !['paisid', 'empresaid', 'fundoid'].includes(col.columnName));
    if (otherFields.length > 0) {
      result.push(
        <div key="fields-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {otherFields.map(col => renderField(col))}
        </div>
      );
    }
    
    return result;
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

  // Función para renderizar campos de Localización con layout específico
  const renderLocalizacionFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Fila contextual: País, Empresa, Fundo (si hay filtros globales)
    const contextualRow = renderContextualRow(['pais', 'empresa', 'fundo']);
    if (contextualRow) {
      result.push(contextualRow);
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
    
    return result;
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campo Usuario */}
        <div className="space-y-3">
          <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider">
            {getColumnDisplayNameTranslated('usuarioid', t)?.toUpperCase()} *
          </label>
          <SelectWithPlaceholder
            value={formData.usuarioid || ''}
            onChange={(value) => updateField('usuarioid', value)}
            options={getUniqueOptionsForField('usuarioid')}
            placeholder={`${t('create.select_user')}...`}
          />
        </div>


        {/* Campo dinámico según tipo de contacto */}
        {selectedContactType === 'phone' && (
          <>
            {/* Campo País */}
            <div className="space-y-3">
              <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider">
                {t('create.country')} *
              </label>
              <SelectWithPlaceholder
                value={formData.codigotelefonoid || ''}
                onChange={(value) => {
                  if (!value) return;
                  
                  const selectedCountry = countryCodes?.find(c => c.codigotelefonoid.toString() === value.toString());
                  console.log('🌍 País seleccionado:', {
                    value,
                    selectedCountry,
                    codigotelefono: selectedCountry?.codigotelefono,
                    paistelefono: selectedCountry?.paistelefono
                  });
                  
                  // Si ya hay un número escrito, concatenarlo con el nuevo código
                  const existingPhoneNumber = formData.phoneNumber || '';
                  const newCountryCode = selectedCountry?.codigotelefono || '';
                  const newFullPhoneNumber = newCountryCode && existingPhoneNumber ? `${newCountryCode}${existingPhoneNumber}` : '';
                  
                  setFormData({ 
                    ...formData, 
                    codigotelefonoid: value,
                    phoneNumber: existingPhoneNumber, // Mantener el número existente
                    celular: newFullPhoneNumber // Actualizar con el nuevo código
                  });
                }}
                options={(() => {
                  return countryCodes?.map(country => ({
                    value: country.codigotelefonoid,
                    label: country.paistelefono
                  })) || [];
                })()}
                placeholder={formData.usuarioid ? `${t('buttons.select')} ${t('fields.country')}...` : `${t('buttons.previous')} ${t('buttons.select')} ${t('fields.user')}`}
                disabled={!formData.usuarioid}
              />
            </div>

            {/* Campo Número de Teléfono */}
            <div className="space-y-3">
              <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider">
                {t('contact.phone_number')} *
              </label>
              <div className="flex">
                <span className={`px-4 py-3 border rounded-l-lg text-white text-sm font-medium min-w-[80px] text-center ${
                  formData.codigotelefonoid 
                    ? 'bg-orange-600 border-orange-500' 
                    : 'bg-neutral-800 border-neutral-700'
                }`}>
                  {(() => {
                    const selectedCountry = countryCodes?.find(c => c.codigotelefonoid.toString() === formData.codigotelefonoid?.toString());
                    return selectedCountry?.codigotelefono || '+';
                  })()}
                </span>
                <input
                  type="tel"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => {
                    const selectedCountry = countryCodes?.find(c => c.codigotelefonoid.toString() === formData.codigotelefonoid?.toString());
                    const countryCode = selectedCountry?.codigotelefono || '';
                    const phoneNumber = e.target.value;
                    const fullPhoneNumber = countryCode && phoneNumber ? `${countryCode}${phoneNumber}` : phoneNumber;
                    
                    console.log('📱 Actualizando teléfono:', {
                      countryCode,
                      phoneNumber,
                      fullPhoneNumber,
                      selectedCountry
                    });
                    
                    setFormData({ 
                      ...formData, 
                      phoneNumber: phoneNumber,
                      celular: fullPhoneNumber
                    });
                  }}
                  placeholder={formData.codigotelefonoid ? "EJ: 987654321" : `${t('buttons.previous')} ${t('buttons.select')} ${t('fields.country')}`}
                  disabled={!formData.codigotelefonoid}
                  className={`flex-1 px-4 py-3 border border-l-0 rounded-r-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono ${
                    formData.codigotelefonoid 
                      ? 'bg-neutral-700 border-neutral-600' 
                      : 'bg-neutral-800 border-neutral-700 cursor-not-allowed opacity-50'
                  }`}
                />
              </div>
            </div>
          </>
        )}

        {selectedContactType === 'email' && (
          <div className="space-y-3">
            <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider">
              {t('contact.email_address')} *
            </label>
            <input
              type="email"
              value={formData.correo || ''}
              onChange={(e) => {
                const email = e.target.value;
                // Permitir cualquier texto, solo validar formato al final
                updateField('correo', email);
              }}
              placeholder={formData.usuarioid ? "USUARIO@DOMINIO.COM" : t('contact.select_user_first')}
              disabled={!formData.usuarioid}
              className={`w-full px-4 py-3 border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono ${
                formData.usuarioid 
                  ? 'bg-neutral-700 border-neutral-600' 
                  : 'bg-neutral-800 border-neutral-700 cursor-not-allowed opacity-50'
              }`}
            />
            {formData.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo) && (
              <p className="text-red-400 text-sm font-mono">
                Formato de correo inválido. Use: usuario@dominio.com
              </p>
            )}
          </div>
        )}

        {/* Campo Status (siempre visible en contacto) */}
        <div className="mb-4">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {t('create.status')}*
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.statusid === 1}
              onChange={(e) => setFormData({
                ...formData,
                statusid: e.target.checked ? 1 : 0
              })}
              className="w-5 h-5 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2"
            />
            <span className="text-white font-mono tracking-wider">
              {formData.statusid === 1 ? t('create.active') : t('create.inactive')}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Función para renderizar formulario de usuario con campo password
  const renderUsuarioForm = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];

    // Primera fila: Login, Contraseña
    const loginField = visibleColumns.find(c => c.columnName === 'login');
    result.push(
      <div key="login-password-row" className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {loginField && renderField(loginField)}
        <div className="mb-4">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            CONTRASEÑA*
          </label>
          <input
            type="password"
            value={formData.password || ''}
            onChange={(e) => setFormData({
              ...formData,
              password: e.target.value
            })}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="••••••••"
          />
        </div>
      </div>
    );

    // Segunda fila: Nombre, Apellido, Status
    const firstnameField = visibleColumns.find(c => c.columnName === 'firstname');
    const lastnameField = visibleColumns.find(c => c.columnName === 'lastname');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');

    result.push(
      <div key="name-status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {firstnameField && renderField(firstnameField)}
        {lastnameField && renderField(lastnameField)}
        {statusField && renderField(statusField)}
      </div>
    );

    return result;
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
        ) : ['fundo', 'ubicacion', 'localizacion', 'entidad', 'tipo', 'nodo', 'sensor', 'metricasensor', 'metrica', 'umbral', 'contacto'].includes(selectedTable) ? (
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
