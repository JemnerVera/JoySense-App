// ============================================================================
// REGLA FORM FIELDS
// ============================================================================
// Componente específico para renderizar formulario combinado REGLA + REGLA_UMBRAL

import React, { useState, useEffect, useLayoutEffect } from 'react';
import SelectWithPlaceholder from '../../SelectWithPlaceholder';
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
}

export const ReglaFormFields: React.FC<ReglaFormFieldsProps> = ({
  selectedTable,
  visibleColumns,
  formData,
  setFormData,
  updateField,
  getThemeColor,
  getUniqueOptionsForField,
  isFieldRequired
}) => {
  const { t } = useLanguage();
  const [reglaUmbralRows, setReglaUmbralRows] = useState<ReglaUmbralRow[]>([
    {
      umbralid: null,
      operador_logico: 'AND',
      agrupador_inicio: false,
      agrupador_fin: false,
      orden: 1,
      tempId: `temp-${Date.now()}`
    }
  ]);

  // Inicializar reglaUmbralRows desde formData si existe (solo una vez)
  const isInitialized = React.useRef(false);
  useEffect(() => {
    if (!isInitialized.current && formData._reglaUmbralRows && Array.isArray(formData._reglaUmbralRows)) {
      setReglaUmbralRows(formData._reglaUmbralRows);
      isInitialized.current = true;
    } else if (!isInitialized.current) {
      // Si no hay datos iniciales, inicializar con una fila por defecto
      isInitialized.current = true;
    }
  }, []);

  // Sincronizar reglaUmbralRows con formData cuando cambia
  // Usamos useLayoutEffect para sincronizar ANTES del render, asegurando que formData esté actualizado
  // cuando se ejecute la validación
  useLayoutEffect(() => {
    if (isInitialized.current) {
      // Usar función de actualización para asegurar que tenemos el formData más reciente
      setFormData((prevFormData: Record<string, any>) => {
        // Solo actualizar si realmente cambió para evitar loops infinitos
        const currentRows = prevFormData._reglaUmbralRows;
        const currentRowsStr = JSON.stringify(currentRows);
        const newRowsStr = JSON.stringify(reglaUmbralRows);
        
        if (currentRowsStr !== newRowsStr) {
          return {
            ...prevFormData,
            _reglaUmbralRows: reglaUmbralRows
          };
        }
        return prevFormData;
      });
    }
  }, [reglaUmbralRows, setFormData]);
  
  // También sincronizar con useEffect como fallback (por si useLayoutEffect no es suficiente)
  useEffect(() => {
    if (isInitialized.current) {
      setFormData((prevFormData: Record<string, any>) => {
        const currentRows = prevFormData._reglaUmbralRows;
        const currentRowsStr = JSON.stringify(currentRows);
        const newRowsStr = JSON.stringify(reglaUmbralRows);
        
        if (currentRowsStr !== newRowsStr) {
          return {
            ...prevFormData,
            _reglaUmbralRows: reglaUmbralRows
          };
        }
        return prevFormData;
      });
    }
  }, [reglaUmbralRows, setFormData]);

  // Función para agregar una nueva fila de umbral
  const handleAddUmbralRow = () => {
    const newOrden = Math.max(...reglaUmbralRows.map(r => r.orden), 0) + 1;
    const newRow: ReglaUmbralRow = {
      umbralid: null,
      operador_logico: 'AND' as 'AND' | 'OR',
      agrupador_inicio: false,
      agrupador_fin: false,
      orden: newOrden,
      tempId: `temp-${Date.now()}-${Math.random()}`
    };
    const newRows: ReglaUmbralRow[] = [...reglaUmbralRows, newRow];
    setReglaUmbralRows(newRows);
    // Sincronizar inmediatamente con formData
    setFormData((prevFormData: Record<string, any>) => ({
      ...prevFormData,
      _reglaUmbralRows: newRows
    }));
  };

  // Función para eliminar una fila de umbral (solo si hay más de 1)
  const handleRemoveUmbralRow = (tempId: string) => {
    if (reglaUmbralRows.length > 1) {
      const newRows = reglaUmbralRows.filter(r => r.tempId !== tempId);
      setReglaUmbralRows(newRows);
      // Sincronizar inmediatamente con formData
      setFormData((prevFormData: Record<string, any>) => ({
        ...prevFormData,
        _reglaUmbralRows: newRows
      }));
    }
  };

  // Función para actualizar una fila de umbral
  const handleUpdateUmbralRow = (tempId: string, field: keyof ReglaUmbralRow, value: any) => {
    setReglaUmbralRows(prevRows => {
      const updatedRows = prevRows.map(row => {
        if (row.tempId === tempId) {
          return { ...row, [field]: value };
        }
        return row;
      });
      // Sincronizar inmediatamente con formData
      setFormData((prevFormData: Record<string, any>) => ({
        ...prevFormData,
        _reglaUmbralRows: updatedRows
      }));
      return updatedRows;
    });
  };

  // Función para actualizar múltiples campos de una fila de umbral
  const handleUpdateUmbralRowMultiple = (tempId: string, updates: Partial<ReglaUmbralRow>) => {
    setReglaUmbralRows(prevRows => {
      const updatedRows = prevRows.map(row => {
        if (row.tempId === tempId) {
          return { ...row, ...updates };
        }
        return row;
      });
      // Sincronizar inmediatamente con formData
      setFormData((prevFormData: Record<string, any>) => ({
        ...prevFormData,
        _reglaUmbralRows: updatedRows
      }));
      return updatedRows;
    });
  };

  // Obtener opciones de umbrales - usar useMemo para actualizar cuando cambien los datos
  const umbralOptions = React.useMemo(() => {
    try {
      const options = getUniqueOptionsForField('umbralid');
      return options;
    } catch (error) {
      console.error('[ReglaFormFields] Error al obtener opciones de umbrales:', error);
      return [];
    }
  }, [getUniqueOptionsForField]);

  // Renderizar campo de REGLA
  const renderReglaField = (col: any): React.ReactNode => {
    const displayName = getColumnDisplayNameTranslated(col.columnName, t);
    if (!displayName) return null;
    
    const value = formData[col.columnName] || '';
    const isRequired = isFieldRequired(col.columnName);

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
              onClick={() => updateField(col.columnName, !isChecked)}
              className={`relative inline-flex h-10 w-20 cursor-pointer items-center rounded-full transition-colors duration-300 ease-in-out ${
                isChecked
                  ? 'bg-orange-500'
                  : 'bg-gray-300 dark:bg-neutral-700'
              }`}
              role="switch"
              aria-checked={isChecked}
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
              const newValueParsed = newValue ? parseInt(newValue.toString()) : null;
              updateField(col.columnName, newValueParsed);
            }}
            options={options}
            placeholder={`${t('buttons.select')} ${displayName.toUpperCase()}`}
            themeColor="orange"
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
            onChange={(e) => updateField(col.columnName, e.target.value)}
            placeholder={displayName.toUpperCase()}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${getThemeColor('focus')} ${getThemeColor('border')} text-white text-base placeholder-neutral-400 font-mono bg-neutral-800 border-neutral-600`}
          />
        </div>
      );
    }

    // Campos con valores por defecto y tooltips (ventana, cooldown, prioridad)
    if (['ventana', 'cooldown', 'prioridad'].includes(col.columnName)) {
      // Tooltips explicativos
      const tooltips: Record<string, string> = {
        prioridad: 'Nivel de importancia. Mayor número = mayor prioridad en la evaluación.',
        ventana: 'Período de tiempo para evaluar las condiciones. Formato: "00:10:00" (10 minutos) o "1 hour".',
        cooldown: 'Tiempo de espera antes de generar otra alerta. Formato: "1 day" o "00:30:00" (30 minutos).'
      };
      
      const tooltipText = tooltips[col.columnName];
      
      // Valores por defecto
      const defaultValue = col.columnName === 'prioridad' ? 1 : col.columnName === 'ventana' ? '00:10:00' : '1 day';
      const defaultValueString = String(defaultValue);
      const displayValue = value !== null && value !== undefined && value !== '' ? value : defaultValue;
      
      return (
        <div key={col.columnName} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <label className={`block text-lg font-bold font-mono tracking-wider ${getThemeColor('text')}`}>
              {displayName.toUpperCase()}{isRequired ? '*' : ''}
            </label>
            {tooltipText && (
              <div className="group relative">
                <svg
                  className="w-5 h-5 text-orange-500 cursor-help hover:text-orange-400 transition-colors"
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
                  <div className="text-gray-300">{tooltipText}</div>
                </div>
              </div>
            )}
          </div>
          <input
            type={col.columnName === 'prioridad' ? 'number' : 'text'}
            value={displayValue}
            onChange={(e) => {
              const newValue = col.columnName === 'prioridad' 
                ? (e.target.value ? parseInt(e.target.value) : null)
                : e.target.value;
              updateField(col.columnName, newValue);
            }}
            placeholder={defaultValueString}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${getThemeColor('focus')} ${getThemeColor('border')} text-white text-base placeholder-neutral-400 font-mono bg-neutral-800 border-neutral-600`}
          />
        </div>
      );
    }

    return null;
  };

  // Obtener campos de REGLA
  const nombreField = visibleColumns.find(c => c.columnName === 'nombre');
  const prioridadField = visibleColumns.find(c => c.columnName === 'prioridad');
  const ventanaField = visibleColumns.find(c => c.columnName === 'ventana');
  const cooldownField = visibleColumns.find(c => c.columnName === 'cooldown');
  const criticidadField = visibleColumns.find(c => c.columnName === 'criticidadid');
  const requiereEscalamientoField = visibleColumns.find(c => c.columnName === 'requiere_escalamiento');
  const statusField = visibleColumns.find(c => c.columnName === 'statusid');

  return (
    <div className="space-y-6">
      {/* Formulario compacto de REGLA (cabecera) */}
      <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-4">
        <h3 className="text-xl font-bold font-mono tracking-wider text-orange-500 mb-4">REGLA</h3>
        
        {/* Fila 1: Nombre, Prioridad, Ventana */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {nombreField && renderReglaField(nombreField)}
          {prioridadField && renderReglaField(prioridadField)}
          {ventanaField && renderReglaField(ventanaField)}
        </div>

        {/* Fila 2: Cooldown, Criticidad, ESCALA? */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cooldownField && renderReglaField(cooldownField)}
          {criticidadField && renderReglaField(criticidadField)}
          {requiereEscalamientoField && renderReglaField(requiereEscalamientoField)}
        </div>
      </div>

      {/* Grid de REGLA_UMBRAL */}
      <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold font-mono tracking-wider text-orange-500">UMBRALES</h3>
          <button
            type="button"
            onClick={handleAddUmbralRow}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-mono rounded-lg transition-colors"
          >
            + AGREGAR UMBRAL
          </button>
        </div>

        {/* Tabla de umbrales */}
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
              {reglaUmbralRows.map((row, index) => (
                <tr key={row.tempId} className="border-b border-gray-300 dark:border-neutral-600">
                  {/* Umbral - Combobox */}
                  <td className="px-3 py-2">
                    <SelectWithPlaceholder
                      value={row.umbralid || ''}
                      onChange={(newValue) => {
                        const newValueParsed = newValue ? parseInt(newValue.toString()) : null;
                        handleUpdateUmbralRow(row.tempId!, 'umbralid', newValueParsed);
                      }}
                      options={umbralOptions}
                      placeholder="SELECCIONAR UMBRAL"
                      themeColor="orange"
                      menuPlacement="auto"
                      dropdownWidth="w-full min-w-[300px]"
                    />
                  </td>

                  {/* Operador - Botones AND/OR */}
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateUmbralRow(row.tempId!, 'operador_logico', 'AND')}
                        className={`px-3 py-1 font-mono text-sm rounded transition-colors ${
                          row.operador_logico === 'AND'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-300 dark:hover:bg-neutral-600'
                        }`}
                      >
                        AND
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateUmbralRow(row.tempId!, 'operador_logico', 'OR')}
                        className={`px-3 py-1 font-mono text-sm rounded transition-colors ${
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
                          const newInicioValue = !row.agrupador_inicio;
                          // Si se selecciona Inicio, deseleccionar Fin en la misma actualización
                          handleUpdateUmbralRowMultiple(row.tempId!, {
                            agrupador_inicio: newInicioValue,
                            agrupador_fin: newInicioValue ? false : row.agrupador_fin
                          });
                        }}
                        className={`px-3 py-1 font-mono text-sm rounded transition-colors ${
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
                          const newFinValue = !row.agrupador_fin;
                          // Si se selecciona Fin, deseleccionar Inicio en la misma actualización
                          handleUpdateUmbralRowMultiple(row.tempId!, {
                            agrupador_fin: newFinValue,
                            agrupador_inicio: newFinValue ? false : row.agrupador_inicio
                          });
                        }}
                        className={`px-3 py-1 font-mono text-sm rounded transition-colors ${
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
                      onChange={(e) => {
                        const newOrden = e.target.value ? parseInt(e.target.value) : 1;
                        handleUpdateUmbralRow(row.tempId!, 'orden', newOrden);
                      }}
                      className="w-20 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-orange-500 border-gray-300 dark:border-neutral-600 text-white text-sm font-mono bg-neutral-800"
                      min="1"
                    />
                  </td>

                  {/* Acción - Botón eliminar (solo si hay más de 1 fila) */}
                  <td className="px-3 py-2">
                    {reglaUmbralRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveUmbralRow(row.tempId!)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white font-mono text-sm rounded transition-colors"
                      >
                        ELIMINAR
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

