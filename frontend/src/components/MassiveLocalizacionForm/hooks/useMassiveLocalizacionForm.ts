// ============================================================================
// HOOK: useMassiveLocalizacionForm
// Maneja el estado del formulario masivo de localizaciones
// ============================================================================

import { useState, useCallback, useMemo } from 'react';
import { FormData, SensorMetricaData } from '../types';

interface UseMassiveLocalizacionFormProps {
  getUniqueOptionsForField: (field: string, filters?: any) => any[];
  selectedNodo: number | null;
}

export const useMassiveLocalizacionForm = ({
  getUniqueOptionsForField,
  selectedNodo
}: UseMassiveLocalizacionFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    nodoid: null,
    localizacionid: null,
    sensoresMetricasData: []
  });

  // Actualizar formData
  const updateFormData = useCallback((newData: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  }, []);

  // Obtener opciones de fondos disponibles
  const nodosOptions = useMemo(() => {
    return getUniqueOptionsForField('nodoid') || [];
  }, [getUniqueOptionsForField]);

  // Obtener opciones de localizaciones para el nodo seleccionado
  const localizacionesOptions = useMemo(() => {
    if (!selectedNodo) return [];
    return getUniqueOptionsForField('localizacionid', { nodoid: selectedNodo.toString() }) || [];
  }, [selectedNodo, getUniqueOptionsForField]);

  // Obtener sensores y métricas disponibles para el nodo seleccionado
  const sensoresMetricasOptions = useMemo(() => {
    if (!selectedNodo) return [];
    const options = getUniqueOptionsForField('sensorid', { nodoid: selectedNodo.toString() }) || [];
    return options;
  }, [selectedNodo, getUniqueOptionsForField]);

  return {
    formData,
    setFormData: updateFormData,
    nodosOptions,
    localizacionesOptions,
    sensoresMetricasOptions
  };
};
