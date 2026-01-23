// ============================================================================
// IMPORTS
// ============================================================================

import React, { memo, useEffect, useMemo, useRef, useCallback } from 'react';
import SelectWithPlaceholder from './selectors/SelectWithPlaceholder';
import { tableValidationSchemas } from '../utils/validations';
import { useLanguage } from '../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../utils/systemParametersUtils';
import { UsuarioFormFields } from './forms/table-specific/UsuarioFormFields';
import { GeografiaFormFields } from './forms/table-specific/GeografiaFormFields';
import { ContactoFormFields } from './forms/table-specific/ContactoFormFields';
import { UsuarioCanalFormFields } from './forms/table-specific/UsuarioCanalFormFields';
import { PerfilFormFields } from './forms/table-specific/PerfilFormFields';
import { UsuarioPerfilFormFields } from './forms/table-specific/UsuarioPerfilFormFields';
import { DispositivosFormFields } from './forms/table-specific/DispositivosFormFields';
import { AlertasFormFields } from './forms/table-specific/AlertasFormFields';
import { LocalizacionFormFields } from './forms/table-specific/LocalizacionFormFields';
import { CriticidadFormFields } from './forms/table-specific/CriticidadFormFields';
import { ReglaFormFields } from './forms/table-specific/ReglaFormFields';
import { ReglaPerfilFormFields } from './forms/table-specific/ReglaPerfilFormFields';
import { ReglaObjetoFormFields } from './forms/table-specific/ReglaObjetoFormFields';
import PerfilGeografiaPermisoForm from './PerfilGeografiaPermisoForm';
import { FormFieldRenderer } from './forms/FormFieldRenderer';
import { ContextualRow } from './forms/ContextualRow';
import { useProgressiveEnablement } from '../hooks/useProgressiveEnablement';
import { LoadingSpinner } from './SystemParameters/LoadingSpinner';
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
  ubicacionesData?: any[];
  codigotelefonosData?: any[];
  // Props específicas para contacto
  selectedContactType?: 'phone' | 'email' | null;
  countryCodes?: any[];
  resetContactType?: () => void;
  // Datos para usuario_canal
  contactosData?: any[];
  correosData?: any[];
  canalesData?: any[];
  // Datos para usuarioperfil
  perfilesData?: any[];
  // Datos para regla_perfil
  reglasData?: any[];
  // Datos adicionales para geografía
  nodosData?: any[];
  localizacionesData?: any[];
  fuentesData?: any[];
  // Tema de color
  themeColor?: 'orange' | 'red' | 'blue' | 'green' | 'purple' | 'cyan';
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
  ubicacionesData,
  codigotelefonosData,
  selectedContactType,
  countryCodes,
  resetContactType,
    contactosData = [],
    correosData = [],
    canalesData = [],
    perfilesData = [],
    reglasData = [],
    nodosData = [],
    localizacionesData = [],
    fuentesData = [],
    themeColor = 'orange'
}) => {
  const { t } = useLanguage();
  
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
      },
      purple: {
        text: 'text-purple-500',
        bg: 'bg-purple-500',
        hover: 'hover:bg-purple-600',
        focus: 'focus:ring-purple-500',
        border: 'border-purple-500'
      },
      cyan: {
        text: 'text-cyan-500',
        bg: 'bg-cyan-500',
        hover: 'hover:bg-cyan-600',
        focus: 'focus:ring-cyan-500',
        border: 'border-cyan-500'
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
    
    if (selectedTable === 'regla') {
      return [<ReglaFormFields
        key="regla"
        selectedTable={selectedTable}
        visibleColumns={visibleColumns}
        formData={formData}
        setFormData={setFormData}
        updateField={updateField}
        getThemeColor={getThemeColor}
        getUniqueOptionsForField={getUniqueOptionsForField}
        isFieldRequired={isFieldRequired}
      />];
    } else if (selectedTable === 'umbral') {
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
    } else if (selectedTable === 'criticidad') {
      return [<CriticidadFormFields
        key="criticidad"
        visibleColumns={visibleColumns}
        formData={formData}
        renderField={renderField}
      />];
    } else if (selectedTable === 'origen') {
      // Layout específico para origen:
      // Fila 1: ORIGEN, STATUS (en la misma fila, juntos)
      const origenField = visibleColumns.find(col => col.columnName === 'origen');
      const statusField = visibleColumns.find(col => col.columnName === 'statusid');
      
      const result: React.ReactNode[] = [];
      
      // Fila 1: ORIGEN, STATUS (juntos en una fila de 2 columnas)
      if (origenField || statusField) {
        result.push(
          <div key="row-1" className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {origenField && renderField(origenField)}
            {statusField && renderField(statusField)}
          </div>
        );
      }
      
      return result;
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
  const previousFormDataRef = useRef<string>('');
  const isResettingRef = useRef(false);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Función helper para actualizar un campo del formulario
  const updateField = useCallback((field: string, value: any) => {
    // Para paisid, verificar que el valor realmente cambió
    if (field === 'paisid') {
      const currentValue = formData.paisid || null;
      const newValue = value || null;
      
      // Si los valores son iguales, no actualizar
      if (currentValue === newValue || 
          (currentValue !== null && currentValue !== undefined && currentValue !== '' && 
           String(currentValue) === String(newValue))) {
        return;
      }
    }

    if (updateFormField) {
      updateFormField(field, value);
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
  }, [updateFormField, setFormData, formData.paisid]); // Removido formData de dependencias (solo mantener paisid por protección específica)

  // Detectar cuando el formulario se resetea (formData pasa de tener valores a estar vacío)
  useEffect(() => {
    const currentFormDataString = JSON.stringify(formData);
    const previousHadPaisid = previousFormDataRef.current && 
                               JSON.parse(previousFormDataRef.current || '{}').paisid;
    const currentHasNoPaisid = !formData.paisid || formData.paisid === null || 
                                formData.paisid === undefined || formData.paisid === '';
    
    const wasReset = previousFormDataRef.current && 
                     previousFormDataRef.current !== currentFormDataString &&
                     previousHadPaisid && 
                     currentHasNoPaisid;
    
    if (wasReset) {
      autoSelectedPaisRef.current = false;
      
      // Bloquear actualizaciones por 100ms para evitar que se restauren valores durante el reset
      isResettingRef.current = true;
      
      // Limpiar timeout anterior si existe
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      
      // Permitir actualizaciones después de 500ms (suficiente tiempo para que React complete todos los re-renders)
      resetTimeoutRef.current = setTimeout(() => {
        isResettingRef.current = false;
      }, 500);
    }
    
    previousFormDataRef.current = currentFormDataString;
    
    // Cleanup
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, [formData]);

  // NO auto-seleccionar país automáticamente. Solo sincronizar con filtros globales.
  // El país solo se debe llenar si hay un filtro global seleccionado.
  useEffect(() => {
    // Resetear la referencia si cambia la tabla o se resetea el formulario
    if (formData.paisid === null || formData.paisid === undefined || formData.paisid === '') {
      autoSelectedPaisRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paisOptions.length, selectedTable]);

  // Auto-seleccionar País si hay filtro global y no está seleccionado (solo para empresa y fundo)
  // Usar useRef para rastrear el último valor procesado y evitar ejecuciones múltiples
  const lastProcessedPaisRef = useRef<string | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Limpiar timeout anterior si existe
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // CRÍTICO: Si estamos en medio de un reset, NO ejecutar este efecto
    if (isResettingRef.current) {
      return;
    }
    
      // Debounce: esperar un poco antes de sincronizar para evitar ejecuciones múltiples
      syncTimeoutRef.current = setTimeout(() => {
        // VERIFICAR NUEVAMENTE después del timeout si estamos en medio de un reset
        if (isResettingRef.current) {
          return;
        }
        
        const hasGlobalFilter = paisSeleccionado && paisSeleccionado.trim() !== '';
        const shouldSync = hasGlobalFilter && (selectedTable === 'empresa' || selectedTable === 'fundo');
        
        // Verificar si formData.paisid está vacío/null (formulario reseteado)
        const isPaisidEmpty = !formData.paisid || formData.paisid === '' || formData.paisid === null || formData.paisid === undefined;
        const currentPaisid = formData.paisid;
        
        // CRÍTICO: Si no hay filtro global Y el paisid está vacío, NO hacer nada
        // Esto previene restauraciones no deseadas después de un reset
        // IMPORTANTE: NO limpiar el paisid si el usuario ya lo seleccionó (no está vacío)
        if (!hasGlobalFilter) {
          // Si no hay filtro global, solo resetear el ref pero NO tocar el valor del formulario
          // El usuario puede haber seleccionado un país manualmente
          if (isPaisidEmpty) {
            lastProcessedPaisRef.current = null;
          }
          // NO hacer nada más - no limpiar el paisid si el usuario lo seleccionó
          return;
        }
        
        // Evitar ejecuciones múltiples del mismo valor
        const currentPaisValue = paisSeleccionado || '';
        if (lastProcessedPaisRef.current === currentPaisValue && !isPaisidEmpty) {
          return; // Ya procesamos este valor, no hacer nada
        }
        
        // Solo sincronizar cuando hay filtro global activo Y el formulario está vacío
        if (shouldSync && isPaisidEmpty) {
          if (updateFormField) {
            updateFormField('paisid', paisSeleccionado);
          } else {
            setFormData((prev: any) => ({ ...prev, paisid: paisSeleccionado }));
          }
          lastProcessedPaisRef.current = currentPaisValue;
        }
      }, 250); // Aumentar debounce a 250ms para dar más tiempo al reset
    
    // Cleanup
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
    // Removido formData.paisid de dependencias - solo reaccionar a cambios en filtros o tabla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paisSeleccionado, selectedTable]);

  // Auto-seleccionar Empresa si hay filtro global y no está seleccionada (solo para fundo)
  // IMPORTANTE: Solo sincronizar cuando el formulario está vacío, NO limpiar valores seleccionados por el usuario
  const lastProcessedEmpresaRef = useRef<string | null>(null);
  const empresaSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Limpiar timeout anterior si existe
    if (empresaSyncTimeoutRef.current) {
      clearTimeout(empresaSyncTimeoutRef.current);
    }
    
    // CRÍTICO: Si estamos en medio de un reset, NO ejecutar este efecto
    if (isResettingRef.current) {
      return;
    }
    
    // Debounce para evitar ejecuciones múltiples
    empresaSyncTimeoutRef.current = setTimeout(() => {
      if (isResettingRef.current) {
        return;
      }
      
      const hasGlobalFilter = empresaSeleccionada && empresaSeleccionada.trim() !== '';
      const shouldSync = hasGlobalFilter && selectedTable === 'fundo';
      
      // Verificar si empresaid está vacío/null (formulario reseteado)
      const isEmpresaidEmpty = !formData.empresaid || formData.empresaid === '' || formData.empresaid === null || formData.empresaid === undefined;
      const currentEmpresaValue = empresaSeleccionada || '';
      
      // Evitar ejecuciones múltiples del mismo valor
      if (lastProcessedEmpresaRef.current === currentEmpresaValue && !isEmpresaidEmpty) {
        return;
      }
      
      // Solo sincronizar cuando hay filtro global activo Y el formulario está vacío
      // NO limpiar si el usuario ya seleccionó una empresa manualmente
      if (shouldSync && isEmpresaidEmpty) {
        if (updateFormField) {
          updateFormField('empresaid', empresaSeleccionada);
        } else {
          setFormData((prev: any) => ({ ...prev, empresaid: empresaSeleccionada }));
        }
        lastProcessedEmpresaRef.current = currentEmpresaValue;
      } else if (!hasGlobalFilter) {
        // Si no hay filtro global, resetear el ref pero NO tocar el valor
        if (isEmpresaidEmpty) {
          lastProcessedEmpresaRef.current = null;
        }
      }
    }, 250);
    
    // Cleanup
    return () => {
      if (empresaSyncTimeoutRef.current) {
        clearTimeout(empresaSyncTimeoutRef.current);
      }
    };
    // Removido updateFormField y setFormData de dependencias para evitar loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaSeleccionada, selectedTable]);

  // Auto-seleccionar Fundo si hay filtro global y no está seleccionado (solo para ubicacion)
  // IMPORTANTE: Solo sincronizar cuando el formulario está vacío, NO limpiar valores seleccionados por el usuario
  const lastProcessedFundoRef = useRef<string | null>(null);
  const fundoSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Limpiar timeout anterior si existe
    if (fundoSyncTimeoutRef.current) {
      clearTimeout(fundoSyncTimeoutRef.current);
    }
    
    // CRÍTICO: Si estamos en medio de un reset, NO ejecutar este efecto
    if (isResettingRef.current) {
      return;
    }
    
    // Debounce para evitar ejecuciones múltiples
    fundoSyncTimeoutRef.current = setTimeout(() => {
      if (isResettingRef.current) {
        return;
      }
      
      const hasGlobalFilter = fundoSeleccionado && fundoSeleccionado.trim() !== '';
      const shouldSync = hasGlobalFilter && selectedTable === 'ubicacion';
      
      // Verificar si fundoid está vacío/null (formulario reseteado)
      const isFundoidEmpty = !formData.fundoid || formData.fundoid === '' || formData.fundoid === null || formData.fundoid === undefined;
      const currentFundoValue = fundoSeleccionado || '';
      
      // Evitar ejecuciones múltiples del mismo valor
      if (lastProcessedFundoRef.current === currentFundoValue && !isFundoidEmpty) {
        return;
      }
      
      // Solo sincronizar cuando hay filtro global activo Y el formulario está vacío
      // NO limpiar si el usuario ya seleccionó un fundo manualmente
      if (shouldSync && isFundoidEmpty) {
        if (updateFormField) {
          updateFormField('fundoid', fundoSeleccionado);
        } else {
          setFormData((prev: any) => ({ ...prev, fundoid: fundoSeleccionado }));
        }
        lastProcessedFundoRef.current = currentFundoValue;
      } else if (!hasGlobalFilter) {
        // Si no hay filtro global, resetear el ref pero NO tocar el valor
        if (isFundoidEmpty) {
          lastProcessedFundoRef.current = null;
        }
      }
    }, 250);
    
    // Cleanup
    return () => {
      if (fundoSyncTimeoutRef.current) {
        clearTimeout(fundoSyncTimeoutRef.current);
      }
    };
    // Removido updateFormField y setFormData de dependencias para evitar loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fundoSeleccionado, selectedTable]);

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
            empresasData={empresasData}
            getUniqueOptionsForField={getUniqueOptionsForField}
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
        ) : selectedTable === 'permiso' ? (
          <PerfilGeografiaPermisoForm
            formData={formData}
            setFormData={setFormData}
            updateFormField={updateField}
            loading={loading}
            onInsert={onInsert}
            onCancel={onCancel}
            perfilesData={perfilesData}
            paisesData={paisesData}
            empresasData={empresasData}
            fundosData={fundosData}
            ubicacionesData={ubicacionesData}
            nodosData={nodosData}
            localizacionesData={localizacionesData}
            getUniqueOptionsForField={getUniqueOptionsForField}
            themeColor="orange"
          />
        ) : ['entidad', 'tipo', 'nodo', 'sensor', 'metricasensor', 'metrica', 'umbral', 'regla', 'regla_objeto', 'contacto', 'localizacion', 'origen', 'fuente', 'usuario_canal', 'perfil', 'usuarioperfil', 'regla_perfil', 'criticidad'].includes(selectedTable) ? (
          <div>
            {visibleColumns.length === 0 && !loading ? (
              <LoadingSpinner message="Cargando columnas del formulario..." />
            ) : selectedTable === 'contacto' ? (
              <ContactoFormFields
                visibleColumns={visibleColumns}
                formData={formData}
                setFormData={setFormData}
                updateField={updateField}
                getThemeColor={getThemeColor}
                getUniqueOptionsForField={getUniqueOptionsForField}
                selectedContactType={selectedContactType}
                countryCodes={countryCodes}
                codigotelefonosData={codigotelefonosData}
              />
            ) : selectedTable === 'usuario_canal' ? (
              <UsuarioCanalFormFields
                visibleColumns={visibleColumns}
                formData={formData}
                setFormData={setFormData}
                updateField={updateField}
                getThemeColor={getThemeColor}
                getUniqueOptionsForField={getUniqueOptionsForField}
                contactosData={contactosData || []}
                correosData={correosData || []}
                canalesData={canalesData || []}
                codigotelefonosData={codigotelefonosData || []}
              />
            ) : selectedTable === 'perfil' ? (
              <PerfilFormFields
                visibleColumns={visibleColumns}
                formData={formData}
                setFormData={setFormData}
                renderField={renderField}
                getThemeColor={getThemeColor}
                getUniqueOptionsForField={getUniqueOptionsForField}
              />
            ) : selectedTable === 'usuarioperfil' ? (
              <UsuarioPerfilFormFields
                visibleColumns={visibleColumns}
                formData={formData}
                setFormData={setFormData}
                renderField={renderField}
                getThemeColor={getThemeColor}
                getUniqueOptionsForField={getUniqueOptionsForField}
                perfilesData={perfilesData}
              />
            ) : selectedTable === 'regla_perfil' ? (
              <ReglaPerfilFormFields
                visibleColumns={visibleColumns}
                formData={formData}
                setFormData={setFormData}
                renderField={renderField}
                getThemeColor={getThemeColor}
                getUniqueOptionsForField={getUniqueOptionsForField}
                reglasData={reglasData}
                perfilesData={perfilesData}
              />
            ) : selectedTable === 'regla_objeto' ? (
              <ReglaObjetoFormFields
                visibleColumns={visibleColumns}
                formData={formData}
                setFormData={setFormData}
                updateField={updateField}
                getThemeColor={getThemeColor}
                getUniqueOptionsForField={getUniqueOptionsForField}
                isFieldRequired={isFieldRequired}
                paisesData={paisesData}
                empresasData={empresasData}
                fundosData={fundosData}
                ubicacionesData={ubicacionesData}
                nodosData={nodosData}
                localizacionesData={localizacionesData}
                fuentesData={fuentesData}
                reglasData={reglasData}
                disabled={loading}
              />
            ) : (
              renderSpecialLayoutFields()
            )}
          </div>
        ) : (
          <div>
            {visibleColumns.length === 0 && !loading ? (
              <LoadingSpinner message="Cargando columnas del formulario..." />
            ) : (() => {
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
          onClick={() => {
            if (onInsert && !loading) {
              onInsert();
            }
          }}
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
