/**
 * ReglaObjetoUpdateForm - Componente para actualizar alcances de regla
 * Permite seleccionar un alcance de regla y editar los objetos asignados
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { JoySenseService } from '../../services/backend-api';
import { ReglaObjetoFormFields } from '../../components/shared/forms';
import { SelectWithPlaceholder } from '../../components/selectors';
import { MessageDisplay } from '../system-parameters/MessageDisplay';
import { LoadingSpinner } from '../system-parameters/LoadingSpinner';
import { getColumnDisplayNameTranslated } from '../../utils/systemParametersUtils';

interface ReglaObjetoUpdateFormProps {
  reglaObjetoData: any[];
  relatedData: any;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onUpdate: (reglaid: number, data: Record<string, any>) => Promise<{success: boolean, error?: string}>;
  onCancel: () => void;
  setMessage?: (message: { type: 'success' | 'error' | 'warning' | 'info'; text: string } | null) => void;
  themeColor?: 'orange' | 'red' | 'blue' | 'green' | 'purple' | 'cyan';
  onFormDataChange?: (formData: Record<string, any>) => void;
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
  ubicacionesData?: any[];
  fuentesData?: any[];
  reglasData?: any[];
}

export const ReglaObjetoUpdateForm: React.FC<ReglaObjetoUpdateFormProps> = ({
  reglaObjetoData,
  relatedData,
  getUniqueOptionsForField,
  onUpdate,
  onCancel,
  setMessage,
  themeColor = 'orange',
  onFormDataChange,
  paisesData = [],
  empresasData = [],
  fundosData = [],
  ubicacionesData = [],
  fuentesData = [],
  reglasData = []
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [selectedReglaObjetoid, setSelectedReglaObjetoid] = useState<number | null>(null);
  const [reglaObjetoItem, setReglaObjetoItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loadingReglaObjeto, setLoadingReglaObjeto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = useCallback(() => {
    setSelectedReglaObjetoid(null);
    setReglaObjetoItem(null);
    setFormData({
      reglaid: null,
      _objetosSeleccionados: [],
      fuenteid: null,
      origenid: null
    });
  }, []);

  // Obtener opciones de regla_objeto
  const reglaObjetoOptions = useMemo(() => {
    if (!reglaObjetoData || reglaObjetoData.length === 0) {
      return [];
    }
    return reglaObjetoData
      .filter(ro => ro.statusid === 1)
      .map(reglaObjeto => {
        // Intentar obtener el nombre de la regla
        const regla = reglasData?.find(r => r.reglaid === reglaObjeto.reglaid);
        const reglaName = regla?.nombre || `Regla ${reglaObjeto.reglaid}`;
        
        return {
          value: reglaObjeto.regla_objetoid,
          label: `${reglaName} - Obj.${reglaObjeto.regla_objetoid}`
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [reglaObjetoData, reglasData]);

  // Inicializar formData vacío al montar
  useEffect(() => {
    if (Object.keys(formData).length === 0 && !selectedReglaObjetoid) {
      setFormData({
        reglaid: null,
        _objetosSeleccionados: [],
        fuenteid: null,
        origenid: null
      });
    }
  }, []);

  // Cargar datos de regla_objeto cuando se selecciona uno
  useEffect(() => {
    if (selectedReglaObjetoid) {
      loadReglaObjetoData(selectedReglaObjetoid);
    } else {
      setReglaObjetoItem(null);
      // Limpiar formData cuando no hay regla_objeto seleccionado
      const emptyFormData = {
        reglaid: null,
        _objetosSeleccionados: [],
        fuenteid: null,
        origenid: null
      };
      setFormData(emptyFormData);
    }
  }, [selectedReglaObjetoid]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const loadReglaObjetoData = useCallback(async (reglaObjetoid: number) => {
    setLoadingReglaObjeto(true);
    try {
      // Buscar el regla_objeto en los datos
      const item = reglaObjetoData.find(ro => ro.regla_objetoid === reglaObjetoid);
      if (!item) {
        setMessage?.({ type: 'error', text: 'Alcance de regla no encontrado' });
        setLoadingReglaObjeto(false);
        return;
      }

      // El objetoid está directamente en el regla_objeto
      // Si es null, es un alcance sin objeto específico aún
      const objetosSeleccionados = item.objetoid ? [item.objetoid] : [];

      // Preparar formData con los datos del regla_objeto
      const initialFormData: Record<string, any> = {
        regla_objetoid: item.regla_objetoid,
        reglaid: item.reglaid,
        _objetosSeleccionados: objetosSeleccionados,
        fuenteid: item.fuenteid,
        origenid: item.origenid
      };

      console.log('[loadReglaObjetoData]:', {
        reglaObjetoid,
        item,
        initialFormData
      });

      setReglaObjetoItem(item);
      setFormData(initialFormData);
      // La notificación se hará a través del useEffect que monitorea formData
    } catch (error: any) {
      console.error('Error cargando datos de regla_objeto:', error);
      setMessage?.({ type: 'error', text: error.message || 'Error al cargar datos del alcance de regla' });
    } finally {
      setLoadingReglaObjeto(false);
    }
  }, [reglaObjetoData, setMessage]);

  // Wrapper para setFormData sin llamar a onFormDataChange (se hará en useEffect)
  const handleSetFormData = useCallback((data: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => {
    setFormData(prev => {
      const newData = typeof data === 'function' ? data(prev) : data;
      return newData;
    });
  }, []);

  // Función para actualizar un campo del formulario
  const updateFormField = useCallback((field: string, value: any) => {
    handleSetFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, [handleSetFormData]);

  // Notificar cambios al padre DESPUÉS del render (en un effect)
  // Usar useRef para rastrear la última notificación y evitar loops innecesarios
  const lastNotifiedDataRef = useRef<Record<string, any>>({});

  useEffect(() => {
    // Solo notificar si realmente hay cambios significativos
    const formDataStr = JSON.stringify(formData);
    const lastStr = JSON.stringify(lastNotifiedDataRef.current);
    
    if (formDataStr !== lastStr) {
      lastNotifiedDataRef.current = formData;
      onFormDataChange?.(formData);
    }
  }, [formData]);

  // Función para validar el formulario
  const validateForm = useCallback((): boolean => {
    if (!formData.reglaid) {
      setMessage?.({ type: 'warning', text: 'La regla es requerida' });
      return false;
    }

    if (!formData._objetosSeleccionados || formData._objetosSeleccionados.length === 0) {
      setMessage?.({ type: 'warning', text: 'Debe seleccionar al menos un objeto' });
      return false;
    }

    return true;
  }, [formData, setMessage]);

  // Función para manejar la actualización
  const handleUpdate = useCallback(async () => {
    if (!selectedReglaObjetoid) {
      setMessage?.({ type: 'error', text: 'Debe seleccionar un alcance de regla' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onUpdate(selectedReglaObjetoid, formData);
      
      if (result.success) {
        setMessage?.({ type: 'success', text: 'Alcance de regla actualizado correctamente' });
        // Recargar datos del regla_objeto
        await loadReglaObjetoData(selectedReglaObjetoid);
      } else {
        setMessage?.({ type: 'error', text: result.error || 'Error al actualizar el alcance de regla' });
      }
    } catch (error: any) {
      setMessage?.({ type: 'error', text: error.message || 'Error al actualizar el alcance de regla' });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedReglaObjetoid, formData, validateForm, onUpdate, loadReglaObjetoData, setMessage]);

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

  // Obtener columnas visibles
  const visibleColumns = useMemo(() => {
    return [
      { columnName: 'reglaid', required: true }
    ];
  }, []);

  // Función para verificar si un campo es requerido
  const isFieldRequired = useCallback((columnName: string): boolean => {
    return columnName === 'reglaid';
  }, []);

  return (
    <div className="relative">
      {/* Selector de REGLA_OBJETO */}
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 mb-6">
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
          SELECCIONAR ALCANCE DE REGLA *
        </label>
        <SelectWithPlaceholder
          value={selectedReglaObjetoid || null}
          onChange={(value) => {
            setSelectedReglaObjetoid(value ? Number(value) : null);
          }}
          options={reglaObjetoOptions}
          placeholder="SELECCIONAR ALCANCE DE REGLA"
          themeColor="orange"
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono"
        />
      </div>

      {/* Formulario de edición */}
      {loadingReglaObjeto ? (
        <LoadingSpinner message="Cargando datos del alcance de regla..." />
      ) : selectedReglaObjetoid ? (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 space-y-6">
          {/* OBJETOS ASIGNADOS: ReglaObjetoFormFields en mode=update muestra DETALLES + cascada */}
          <div className="bg-neutral-800/30 rounded-lg p-4 border border-neutral-700/50">
            <label className={`block text-lg font-bold mb-4 font-mono tracking-wider ${getThemeColor('text')}`}>
              OBJETOS ASIGNADOS *
            </label>
            <ReglaObjetoFormFields
              visibleColumns={visibleColumns}
              formData={formData}
              setFormData={handleSetFormData}
              updateField={updateFormField}
              getThemeColor={getThemeColor}
              getUniqueOptionsForField={getUniqueOptionsForField}
              isFieldRequired={isFieldRequired}
              disabled={false}
              mode="update"
              paisesData={paisesData}
              empresasData={empresasData}
              fundosData={fundosData}
              ubicacionesData={ubicacionesData}
              fuentesData={fuentesData}
              reglasData={reglasData}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={handleUpdate}
              disabled={isSubmitting}
              className={`px-6 py-2 ${getThemeColor('bg')} text-white rounded-lg ${getThemeColor('hover')} transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium font-mono tracking-wider`}
            >
              {isSubmitting ? 'GUARDANDO...' : 'GUARDAR'}
            </button>
            <button
              onClick={() => {
                handleCancel();
                onCancel();
              }}
              className={`px-6 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors font-medium font-mono tracking-wider ${getThemeColor('text')}`}
            >
              CANCELAR
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 flex items-center justify-center min-h-[300px]">
          <p className="text-neutral-400 font-mono italic">Selecciona un alcance de regla para editar</p>
        </div>
      )}
    </div>
  );
};
