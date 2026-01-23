// ============================================================================
// REGLA FORM FIELDS
// ============================================================================
// Componente específico para renderizar formulario combinado REGLA + REGLA_UMBRAL

import React, { useState, useEffect } from 'react';
import SelectWithPlaceholder from '../../selectors/SelectWithPlaceholder';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../../../utils/systemParametersUtils';

interface ReglaUmbralRow {
  umbralid: number | null;
  operador_logico: 'AND' | 'OR';
  agrupador_inicio: boolean;
  agrupador_fin: boolean;
  orden: number;
  tempId?: string; // ID temporal para identificar filas antes de guardar
}

interface ReglaFormFieldsProps {
  selectedTable: string;
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateField: (field: string, value: any) => void;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  isFieldRequired: (columnName: string) => boolean;
  disabled?: boolean; // Nueva prop para deshabilitar campos
}

export const ReglaFormFields: React.FC<ReglaFormFieldsProps> = ({
  selectedTable,
  visibleColumns,
  formData,
  setFormData,
  updateField,
  getThemeColor,
  getUniqueOptionsForField,
  isFieldRequired,
  disabled = false
}) => {
  const { t } = useLanguage();
  
  // Verificar si el nombre está lleno (para habilitar/deshabilitar campos)
  const isNombreFilled = React.useMemo(() => {
    return !!(formData.nombre && formData.nombre.trim() !== '');
  }, [formData.nombre]);
  
  // SOLUCIÓN SIMPLIFICADA: Usar directamente formData._reglaUmbralRows como fuente de verdad
  const reglaUmbralRows = React.useMemo(() => {
    return (formData._reglaUmbralRows && Array.isArray(formData._reglaUmbralRows)) 
      ? formData._reglaUmbralRows 
      : [];
  }, [formData._reglaUmbralRows]);

  // Ref para rastrear si ya se creó la fila inicial
  const hasCreatedInitialRowRef = React.useRef(false);
  const previousNombreRef = React.useRef<string>('');
  
  // Crear automáticamente una fila vacía cuando el nombre cambia de vacío a lleno
  useEffect(() => {
    const currentNombre = (formData.nombre || '').toString().trim();
    const previousNombre = previousNombreRef.current;
    const nombreChangedFromEmpty = !previousNombre && currentNombre;
    
    // Actualizar la referencia del nombre anterior solo si cambió
    if (currentNombre !== previousNombre) {
      previousNombreRef.current = currentNombre;
    }
    
    // Resetear el ref si el nombre se borra completamente
    if (!currentNombre) {
      hasCreatedInitialRowRef.current = false;
      return;
    }
    
    // Solo crear la fila si:
    // 1. El nombre cambió de vacío a lleno (primera vez que se llena)
    // 2. No hay umbrales
    // 3. No está deshabilitado
    // 4. Aún no se ha creado la fila inicial
    if (nombreChangedFromEmpty && 
        reglaUmbralRows.length === 0 && 
        !disabled && 
        !hasCreatedInitialRowRef.current) {
      // Crear una fila vacía automáticamente
      const newRow: ReglaUmbralRow = {
        umbralid: null,
        operador_logico: 'AND' as 'AND' | 'OR',
        agrupador_inicio: false,
        agrupador_fin: false,
        orden: 1,
        tempId: `temp-${Date.now()}`
      };
      hasCreatedInitialRowRef.current = true;
      
      // Usar updateField para actualizar _reglaUmbralRows en lugar de setFormData
      // Esto evita conflictos con el updateField del nombre
      updateField('_reglaUmbralRows', [newRow]);
    }
  }, [formData.nombre, reglaUmbralRows.length, disabled, updateField]);

  // Función para agregar una nueva fila de umbral
  const handleAddUmbralRow = () => {
    const newOrden = Math.max(...reglaUmbralRows.map(r => r.orden || 0), 0) + 1;
    const newRow: ReglaUmbralRow = {
      umbralid: null,
      operador_logico: 'AND' as 'AND' | 'OR',
      agrupador_inicio: false,
      agrupador_fin: false,
      orden: newOrden,
      tempId: `temp-${Date.now()}`
    };
    setFormData((prev: Record<string, any>) => ({
      ...prev,
      _reglaUmbralRows: [...reglaUmbralRows, newRow]
    }));
  };

  // Función para eliminar una fila de umbral
  const handleRemoveUmbralRow = (tempId: string) => {
    const newRows = reglaUmbralRows.filter(row => row.tempId !== tempId);
    setFormData((prev: Record<string, any>) => ({
      ...prev,
      _reglaUmbralRows: newRows
    }));
  };

  // Función para actualizar un campo de una fila de umbral
  const handleUpdateUmbralRow = (tempId: string, field: keyof ReglaUmbralRow, value: any) => {
    const newRows = reglaUmbralRows.map(row => 
      row.tempId === tempId ? { ...row, [field]: value } : row
    );
    setFormData((prev: Record<string, any>) => ({
      ...prev,
      _reglaUmbralRows: newRows
    }));
  };

  // Función para actualizar múltiples campos de una fila de umbral
  const handleUpdateUmbralRowMultiple = (tempId: string, updates: Partial<ReglaUmbralRow>) => {
    const newRows = reglaUmbralRows.map(row => 
      row.tempId === tempId ? { ...row, ...updates } : row
    );
    setFormData((prev: Record<string, any>) => ({
      ...prev,
      _reglaUmbralRows: newRows
    }));
  };

  // Obtener opciones de umbrales
  const umbralOptions = getUniqueOptionsForField('umbralid');

  // Determinar si los campos deben estar deshabilitados (excepto nombre)
  // En modo CREAR: deshabilitar hasta que se llene el nombre
  // En modo UPDATE: usar el prop disabled
  const isFieldsDisabled = disabled || !isNombreFilled;

  // Renderizar campo de REGLA
  const renderReglaField = (col: any): React.ReactNode => {
    const displayName = getColumnDisplayNameTranslated(col.columnName, t);
    if (!displayName) return null;
    
    const value = formData[col.columnName] || '';
    const isRequired = isFieldRequired(col.columnName);
    
    // El campo "nombre" siempre está habilitado, los demás se deshabilitan hasta que se llene el nombre
    const isFieldDisabled = disabled || (col.columnName !== 'nombre' && !isNombreFilled);

    // Campo requiere_escalamiento como toggle "ESCALA?"
    if (col.columnName === 'requiere_escalamiento') {
      const fieldValue = formData[col.columnName];
      const isChecked = fieldValue === true || fieldValue === 'true' || fieldValue === 1;
      
      return (
        <div key={col.columnName} className="mb-4">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            ESCALA?{isRequired ? '*' : ''}
          </label>
          <div className="flex items-center space-x-4">
            {/* Toggle Switch */}
            <div
              onClick={() => {
                if (!isFieldDisabled) {
                  updateField(col.columnName, !isChecked);
                }
              }}
              className={`relative inline-flex h-10 w-20 ${isFieldDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} items-center rounded-full transition-colors duration-300 ease-in-out ${
                isChecked
                  ? 'bg-orange-500'
                  : 'bg-gray-300 dark:bg-neutral-700'
              }`}
              role="switch"
              aria-checked={isChecked}
              aria-disabled={isFieldDisabled}
            >
              {/* Slider */}
              <span
                className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                  isChecked ? 'translate-x-11' : 'translate-x-1'
                }`}
              />
            </div>
            
            {/* Etiqueta de texto (solo una a la vez) */}
            <div className="relative h-6 w-8 overflow-hidden">
              <span
                className={`absolute font-mono text-sm font-bold transition-all duration-300 ease-in-out ${
                  isChecked
                    ? 'text-orange-500 translate-x-0 opacity-100'
                    : 'text-gray-500 dark:text-neutral-400 -translate-x-full opacity-0'
                }`}
              >
                SÍ
              </span>
              <span
                className={`absolute font-mono text-sm font-bold transition-all duration-300 ease-in-out ${
                  !isChecked
                    ? 'text-orange-500 translate-x-0 opacity-100'
                    : 'text-gray-500 dark:text-neutral-400 translate-x-full opacity-0'
                }`}
              >
                NO
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Campo statusid - no se muestra, siempre activo por defecto
    if (col.columnName === 'statusid') {
      return null;
    }

    // Campo criticidadid - select
    if (col.columnName === 'criticidadid') {
      const options = getUniqueOptionsForField(col.columnName);
      return (
        <div key={col.columnName} className="mb-4">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {displayName.toUpperCase()}{isRequired ? '*' : ''}
          </label>
          <SelectWithPlaceholder
            value={value || ''}
            onChange={(newValue) => {
              if (!isFieldDisabled) {
                const newValueParsed = newValue ? parseInt(newValue.toString()) : null;
                updateField(col.columnName, newValueParsed);
              }
            }}
            options={options}
            placeholder={`${t('buttons.select')} ${displayName.toUpperCase()}`}
            themeColor="orange"
            disabled={isFieldDisabled}
          />
        </div>
      );
    }

    // Campo nombre - solo placeholder, sin valor por defecto
    if (col.columnName === 'nombre') {
      return (
        <div key={col.columnName} className="mb-4">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {displayName.toUpperCase()}{isRequired ? '*' : ''}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => {
              if (!disabled) {
                const newValue = e.target.value;
                // Solo actualizar el campo nombre usando updateField
                updateField(col.columnName, newValue);
              }
            }}
            disabled={disabled}
            placeholder={displayName.toUpperCase()}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${getThemeColor('focus')} ${getThemeColor('border')} text-white text-base placeholder-neutral-400 font-mono ${
              disabled
                ? 'bg-neutral-700 border-neutral-600 opacity-50 cursor-not-allowed'
                : 'bg-neutral-800 border-neutral-600'
            }`}
          />
        </div>
      );
    }

    // Campos numéricos (ventana, cooldown, prioridad)
    if (['ventana', 'cooldown', 'prioridad'].includes(col.columnName)) {
      const displayValue = value !== null && value !== undefined ? String(value) : '';
      const defaultValueString = col.columnName === 'ventana' ? 'Ej: 300' : col.columnName === 'cooldown' ? 'Ej: 60' : 'Ej: 1';
      
      return (
        <div key={col.columnName} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <label className={`block text-lg font-bold font-mono tracking-wider ${getThemeColor('text')}`}>
              {displayName.toUpperCase()}{isRequired ? '*' : ''}
            </label>
            {col.columnName === 'ventana' && (
              <div className="group relative">
                <svg
                  className="w-5 h-5 text-orange-500 cursor-help"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-gray-800 dark:bg-neutral-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 font-mono border border-orange-500">
                  <div className="text-orange-400 font-bold mb-1">{displayName.toUpperCase()}</div>
                  <div className="text-gray-300">Tiempo de ventana para evaluar la regla. Formato: HH:MM:SS o descripción (ej: 00:10:00 o 10 minutes)</div>
                </div>
              </div>
            )}
          </div>
          <input
            type={col.columnName === 'prioridad' ? 'number' : 'text'}
            value={displayValue}
            onChange={(e) => {
              if (!isFieldDisabled) {
                const newValue = col.columnName === 'prioridad' 
                  ? (e.target.value ? parseInt(e.target.value) : null)
                  : e.target.value;
                updateField(col.columnName, newValue);
              }
            }}
            disabled={isFieldDisabled}
            placeholder={defaultValueString}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${getThemeColor('focus')} ${getThemeColor('border')} text-white text-base placeholder-neutral-400 font-mono ${
              disabled
                ? 'bg-neutral-700 border-neutral-600 opacity-50 cursor-not-allowed'
                : 'bg-neutral-800 border-neutral-600'
            }`}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Campos de la regla */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleColumns.map(col => renderReglaField(col))}
      </div>

      {/* Tabla de umbrales */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold font-mono tracking-wider text-orange-500">UMBRALES</h3>
          <button
            type="button"
            onClick={() => {
              if (!isFieldsDisabled) {
                handleAddUmbralRow();
              }
            }}
            disabled={isFieldsDisabled}
            className={`px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-mono rounded-lg transition-colors ${
              isFieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            + AGREGAR UMBRAL
          </button>
        </div>
        {/* Tabla de umbrales */}
        {reglaUmbralRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300 dark:border-neutral-600">
                  <th className="px-3 py-2 text-left font-mono font-bold text-orange-500">UMBRAL</th>
                  <th className="px-3 py-2 text-left font-mono font-bold text-orange-500">OPERADOR</th>
                  <th className="px-3 py-2 text-left font-mono font-bold text-orange-500">AGRUPADOR</th>
                  <th className="px-3 py-2 text-left font-mono font-bold text-orange-500">ORDEN</th>
                  <th className="px-3 py-2 text-left font-mono font-bold text-orange-500"></th>
                </tr>
              </thead>
              <tbody>
                {reglaUmbralRows.map((row, index) => {
                  const umbralValue = row.umbralid ? String(row.umbralid) : null;
                  return (
                    <tr key={row.tempId} className="border-b border-gray-300 dark:border-neutral-600">
                      {/* Umbral - Combobox */}
                      <td className="px-3 py-2">
                    <SelectWithPlaceholder
                      value={umbralValue}
                      onChange={(newValue) => {
                        if (!isFieldsDisabled) {
                          const newValueParsed = newValue ? parseInt(newValue.toString()) : null;
                          handleUpdateUmbralRow(row.tempId!, 'umbralid', newValueParsed);
                        }
                      }}
                      options={umbralOptions}
                      placeholder="SELECCIONAR UMBRAL"
                      themeColor="orange"
                      menuPlacement="auto"
                      dropdownWidth="w-full min-w-[300px]"
                      disabled={isFieldsDisabled}
                      allowExternalChange={true}
                    />
                      </td>

                      {/* Operador - Botones AND/OR */}
                      <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isFieldsDisabled) {
                            handleUpdateUmbralRow(row.tempId!, 'operador_logico', 'AND');
                          }
                        }}
                        disabled={isFieldsDisabled}
                        className={`px-3 py-1 font-mono text-sm rounded transition-colors ${
                          disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        } ${
                          row.operador_logico === 'AND'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-300 dark:hover:bg-neutral-600'
                        }`}
                      >
                        AND
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isFieldsDisabled) {
                            handleUpdateUmbralRow(row.tempId!, 'operador_logico', 'OR');
                          }
                        }}
                        disabled={isFieldsDisabled}
                        className={`px-3 py-1 font-mono text-sm rounded transition-colors ${
                          disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        } ${
                          row.operador_logico === 'OR'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-300 dark:hover:bg-neutral-600'
                        }`}
                      >
                        OR
                      </button>
                    </div>
                      </td>

                      {/* Agrupador - Botones Inicio/Fin */}
                      <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isFieldsDisabled) {
                            const newInicioValue = !row.agrupador_inicio;
                            // Si se selecciona Inicio, deseleccionar Fin en la misma actualización
                            handleUpdateUmbralRowMultiple(row.tempId!, {
                              agrupador_inicio: newInicioValue,
                              agrupador_fin: newInicioValue ? false : row.agrupador_fin
                            });
                          }
                        }}
                        disabled={isFieldsDisabled}
                        className={`px-3 py-1 font-mono text-sm rounded transition-colors ${
                          disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        } ${
                          row.agrupador_inicio
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-300 dark:hover:bg-neutral-600'
                        }`}
                      >
                        INICIO
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isFieldsDisabled) {
                            const newFinValue = !row.agrupador_fin;
                            // Si se selecciona Fin, deseleccionar Inicio en la misma actualización
                            handleUpdateUmbralRowMultiple(row.tempId!, {
                              agrupador_fin: newFinValue,
                              agrupador_inicio: newFinValue ? false : row.agrupador_inicio
                            });
                          }
                        }}
                        disabled={isFieldsDisabled}
                        className={`px-3 py-1 font-mono text-sm rounded transition-colors ${
                          disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        } ${
                          row.agrupador_fin
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-300 dark:hover:bg-neutral-600'
                        }`}
                      >
                        FIN
                      </button>
                    </div>
                      </td>

                      {/* Orden - Input */}
                      <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.orden || ''}
                      disabled={isFieldsDisabled}
                      onChange={(e) => {
                        if (isFieldsDisabled) return;
                        const newOrden = e.target.value ? parseInt(e.target.value) : 1;
                        handleUpdateUmbralRow(row.tempId!, 'orden', newOrden);
                      }}
                      className={`w-20 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-orange-500 border-gray-300 dark:border-neutral-600 text-white text-sm font-mono ${
                        disabled
                          ? 'bg-neutral-700 opacity-50 cursor-not-allowed'
                          : 'bg-neutral-800'
                      }`}
                      min="1"
                    />
                      </td>

                      {/* Acción - Botón eliminar (solo si hay más de 1 fila) */}
                      <td className="px-3 py-2">
                    {reglaUmbralRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isFieldsDisabled) {
                            handleRemoveUmbralRow(row.tempId!);
                          }
                        }}
                        disabled={isFieldsDisabled}
                        className={`px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white font-mono text-sm rounded transition-colors ${
                          isFieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        ELIMINAR
                      </button>
                    )}
                      </td>
                    </tr>
                );
              })}
              </tbody>
            </table>
            </div>
        ) : null}
      </div>
    </div>
  );
};
