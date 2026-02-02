/**
 * ReglaUpdateForm - Componente para actualizar reglas
 * Permite seleccionar una regla y editar su cabecera y umbrales relacionados
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { JoySenseService } from '../../services/backend-api';
import { ReglaFormFields } from '../shared/forms';
import { SelectWithPlaceholder } from '../selectors';
import { MessageDisplay } from '../SystemParameters/MessageDisplay';
import { LoadingSpinner } from '../SystemParameters/LoadingSpinner';
import { getColumnDisplayNameTranslated } from '../../utils/systemParametersUtils';

interface ReglaUpdateFormProps {
  reglasData: any[];
  relatedData: any;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onUpdate: (reglaid: number, data: Record<string, any>) => Promise<{success: boolean, error?: string}>;
  onCancel: () => void;
  setMessage?: (message: { type: 'success' | 'error' | 'warning' | 'info'; text: string } | null) => void;
  themeColor?: 'orange' | 'red' | 'blue' | 'green' | 'purple' | 'cyan';
  onFormDataChange?: (formData: Record<string, any>) => void;
}

export const ReglaUpdateForm: React.FC<ReglaUpdateFormProps> = ({
  reglasData,
  relatedData,
  getUniqueOptionsForField,
  onUpdate,
  onCancel,
  setMessage,
  themeColor = 'orange',
  onFormDataChange
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [selectedReglaid, setSelectedReglaid] = useState<number | null>(null);
  const [reglaData, setReglaData] = useState<any>(null);
  const [reglaUmbralData, setReglaUmbralData] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [loadingRegla, setLoadingRegla] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obtener opciones de reglas
  const reglaOptions = useMemo(() => {
    if (!reglasData || reglasData.length === 0) {
      return [];
    }
    return reglasData
      .filter(r => r.statusid === 1)
      .map(regla => ({
        value: regla.reglaid,
        label: regla.nombre || `Regla ${regla.reglaid}`
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [reglasData]);

  // Inicializar formData vacío al montar (sin datos hasta que se seleccione una regla)
  useEffect(() => {
    if (Object.keys(formData).length === 0 && !selectedReglaid) {
      // Inicializar con estructura vacía para que el formulario se muestre pero deshabilitado
      // No crear fila vacía en _reglaUmbralRows para evitar mostrar entradas vacías
      setFormData({
        nombre: '',
        criticidadid: null,
        ventana: null,
        cooldown: null,
        prioridad: null,
        requiere_escalamiento: false,
        _reglaUmbralRows: []
      });
    }
  }, []);

  // Cargar datos de regla y regla_umbral cuando se selecciona una regla
  useEffect(() => {
    if (selectedReglaid) {
      loadReglaData(selectedReglaid);
    } else {
      setReglaData(null);
      setReglaUmbralData([]);
      // Limpiar formData cuando no hay regla seleccionada
      // No crear una fila vacía inicialmente para evitar mostrar filas vacías antes de cargar datos
      const emptyFormData = {
        nombre: '',
        criticidadid: null,
        ventana: null,
        cooldown: null,
        prioridad: null,
        requiere_escalamiento: false,
        _reglaUmbralRows: []
      };
      setFormData(emptyFormData);
      // Notificar al padre que no hay datos (limpiar detección de cambios)
      onFormDataChange?.({});
    }
  }, [selectedReglaid]);

  const loadReglaData = useCallback(async (reglaid: number) => {
    setLoadingRegla(true);
    try {
      // Cargar datos de la regla
      const regla = reglasData.find(r => r.reglaid === reglaid);
      if (!regla) {
        setMessage?.({ type: 'error', text: 'Regla no encontrada' });
        setLoadingRegla(false);
        return;
      }

      // Cargar umbrales relacionados (regla_umbral) - solo activos (statusid: 1)
      const reglaUmbrales = await JoySenseService.getTableData('regla_umbral', 1000);
      const umbralesFiltrados = (reglaUmbrales || []).filter((ru: any) => 
        ru.reglaid === reglaid && ru.statusid === 1
      );

      // Ordenar por orden
      umbralesFiltrados.sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0));

      // Preparar datos para ReglaFormFields
      // Incluir regla_umbralid en el tempId para poder identificar umbrales existentes en la actualización
      const reglaUmbralRows = umbralesFiltrados.map((ru: any, index: number) => ({
        umbralid: ru.umbralid,
        operador_logico: ru.operador_logico || 'AND',
        agrupador_inicio: ru.agrupador_inicio || false,
        agrupador_fin: ru.agrupador_fin || false,
        orden: ru.orden || index + 1,
        tempId: ru.regla_umbralid ? `temp-regla_umbralid-${ru.regla_umbralid}-${index}` : `temp-${Date.now()}-${index}`
      }));

      // No crear fila vacía automáticamente - solo si realmente no hay umbrales
      // La fila vacía se creará cuando el usuario haga clic en "AGREGAR UMBRAL"

      // Preparar formData con los datos de la regla y los umbrales
      const initialFormData: Record<string, any> = {
        ...regla,
        _reglaUmbralRows: reglaUmbralRows
      };

      setReglaData(regla);
      setReglaUmbralData(umbralesFiltrados);
      
      // Actualizar formData directamente - React debería detectar el cambio
      setFormData(initialFormData);
      // Notificar cambios al padre para detección de cambios sin guardar
      // Solo notificar si hay una regla seleccionada (datos reales)
      if (reglaid) {
        onFormDataChange?.(initialFormData);
      }
    } catch (error: any) {
      console.error('Error cargando datos de regla:', error);
      setMessage?.({ type: 'error', text: error.message || 'Error al cargar datos de la regla' });
    } finally {
      setLoadingRegla(false);
    }
  }, [reglasData, setMessage]);

  // Wrapper para setFormData que notifica cambios al padre
  const handleSetFormData = useCallback((data: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => {
    setFormData(prev => {
      const newData = typeof data === 'function' ? data(prev) : data;
      // Notificar cambios al padre para detección de cambios sin guardar
      onFormDataChange?.(newData);
      return newData;
    });
  }, [onFormDataChange]);

  // Función para actualizar un campo del formulario
  const updateFormField = useCallback((field: string, value: any) => {
    handleSetFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, [handleSetFormData]);

  // Función para validar el formulario
  const validateForm = useCallback((): boolean => {
    if (!formData.nombre || formData.nombre.trim() === '') {
      setMessage?.({ type: 'warning', text: 'El nombre de la regla es requerido' });
      return false;
    }

    if (!formData._reglaUmbralRows || formData._reglaUmbralRows.length === 0) {
      setMessage?.({ type: 'warning', text: 'Debe agregar al menos un umbral' });
      return false;
    }

    // Validar que todos los umbrales tengan umbralid
    const invalidRows = formData._reglaUmbralRows.filter((row: any) => !row.umbralid);
    if (invalidRows.length > 0) {
      setMessage?.({ type: 'warning', text: 'Todos los umbrales deben tener un umbral seleccionado' });
      return false;
    }

    return true;
  }, [formData, setMessage]);

  // Función para manejar la actualización
  const handleUpdate = useCallback(async () => {
    if (!selectedReglaid) {
      setMessage?.({ type: 'error', text: 'Debe seleccionar una regla' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onUpdate(selectedReglaid, formData);
      
      if (result.success) {
        setMessage?.({ type: 'success', text: 'Regla actualizada correctamente' });
        // Recargar datos de la regla
        await loadReglaData(selectedReglaid);
      } else {
        setMessage?.({ type: 'error', text: result.error || 'Error al actualizar la regla' });
      }
    } catch (error: any) {
      setMessage?.({ type: 'error', text: error.message || 'Error al actualizar la regla' });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedReglaid, formData, validateForm, onUpdate, loadReglaData, setMessage]);

  // Helper para obtener clases de color según el tema
  const getThemeColor = (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => {
    const colors: Record<string, Record<string, string>> = {
      red: {
        text: 'text-red-500',
        bg: 'bg-red-500',
        hover: 'hover:bg-red-600',
        focus: 'focus:ring-red-500',
        border: 'border-red-500'
      },
      orange: {
        text: 'text-orange-500',
        bg: 'bg-orange-500',
        hover: 'hover:bg-orange-600',
        focus: 'focus:ring-orange-500',
        border: 'border-orange-500'
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

  // Obtener columnas visibles (simuladas para ReglaFormFields)
  const visibleColumns = useMemo(() => {
    return [
      { columnName: 'nombre', required: true },
      { columnName: 'criticidadid', required: true },
      { columnName: 'ventana', required: false },
      { columnName: 'cooldown', required: false },
      { columnName: 'prioridad', required: false },
      { columnName: 'requiere_escalamiento', required: false }
    ];
  }, []);

  // Función para verificar si un campo es requerido
  const isFieldRequired = useCallback((columnName: string): boolean => {
    return columnName === 'nombre' || columnName === 'criticidadid';
  }, []);


  return (
    <div className="relative">
      {/* Selector de REGLA */}
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 mb-6">
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
          SELECCIONAR REGLA *
        </label>
        <SelectWithPlaceholder
          value={selectedReglaid || null}
          onChange={(value) => {
            setSelectedReglaid(value ? Number(value) : null);
          }}
          options={reglaOptions}
          placeholder="SELECCIONAR REGLA"
          themeColor="orange"
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono"
        />
      </div>

      {/* Formulario de edición - siempre visible, similar a CREAR */}
      {loadingRegla ? (
        <LoadingSpinner message="Cargando datos de la regla..." />
      ) : (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
          <ReglaFormFields
            selectedTable="regla"
            visibleColumns={visibleColumns}
            formData={formData}
            setFormData={handleSetFormData}
            updateField={updateFormField}
            getThemeColor={getThemeColor}
            getUniqueOptionsForField={getUniqueOptionsForField}
            isFieldRequired={isFieldRequired}
            disabled={!selectedReglaid}
          />

          {/* Botones de acción */}
          <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-neutral-700">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors font-medium font-mono tracking-wider"
            >
              CANCELAR
            </button>
            <button
              onClick={handleUpdate}
              disabled={isSubmitting || !selectedReglaid}
              className={`px-6 py-2 ${getThemeColor('bg')} text-white rounded-lg ${getThemeColor('hover')} transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium font-mono tracking-wider`}
            >
              {isSubmitting ? 'GUARDANDO...' : 'GUARDAR'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

