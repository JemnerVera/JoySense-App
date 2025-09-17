import { useState, useEffect, useRef } from 'react';

interface FormChangeDetectionOptions {
  formData: any;
  excludeFields?: string[];
  excludeReferentialFields?: boolean;
}

function useFormChangeDetection({ 
  formData, 
  excludeFields = [], 
  excludeReferentialFields = true 
}: FormChangeDetectionOptions) {
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const isInitialMount = useRef(true);

  // Campos referenciales que no deben considerarse para detección de cambios
  const referentialFields = [
    'paisid', 'pais', 'empresaid', 'empresa', 'fundoid', 'fundo',
    'entidadid', 'entidad', 'localizacionid', 'localizacion',
    'ubicacionid', 'ubicacion', 'sensorid', 'sensor', 'metricaid', 'metrica'
  ];

  // Campos a excluir de la detección
  const fieldsToExclude = excludeReferentialFields 
    ? [...excludeFields, ...referentialFields]
    : excludeFields;

  // Función para verificar si hay cambios significativos
  const checkForChanges = (currentData: any, initialData: any) => {
    if (!initialData) return false;

    // Verificar campos de texto (no vacíos)
    for (const key in currentData) {
      if (fieldsToExclude.includes(key)) continue;
      
      const currentValue = currentData[key];
      const initialValue = initialData[key];

      // Si es un string y no está vacío
      if (typeof currentValue === 'string' && currentValue.trim() !== '') {
        return true;
      }

      // Si es un número y no es null/undefined
      if (typeof currentValue === 'number' && currentValue !== null && currentValue !== undefined) {
        return true;
      }

      // Si es un array y tiene elementos
      if (Array.isArray(currentValue) && currentValue.length > 0) {
        return true;
      }

      // Si es un objeto y tiene propiedades
      if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
        const hasObjectChanges = Object.keys(currentValue).some(objKey => {
          const objValue = currentValue[objKey];
          return objValue !== null && objValue !== undefined && objValue !== '';
        });
        if (hasObjectChanges) return true;
      }

      // Si es un boolean y está marcado
      if (typeof currentValue === 'boolean' && currentValue === true) {
        return true;
      }
    }

    return false;
  };

  // Establecer datos iniciales en el primer render
  useEffect(() => {
    if (isInitialMount.current && formData) {
      setInitialData(JSON.parse(JSON.stringify(formData)));
      isInitialMount.current = false;
    }
  }, [formData]);

  // Verificar cambios cuando cambian los datos del formulario
  useEffect(() => {
    if (initialData && formData) {
      const hasFormChanges = checkForChanges(formData, initialData);
      setHasChanges(hasFormChanges);
    }
  }, [formData, initialData]);

  // Función para resetear la detección de cambios
  const resetChanges = () => {
    setHasChanges(false);
    setInitialData(JSON.parse(JSON.stringify(formData)));
  };

  // Función para marcar como sin cambios
  const markAsSaved = () => {
    setHasChanges(false);
    setInitialData(JSON.parse(JSON.stringify(formData)));
  };

  return {
    hasChanges,
    resetChanges,
    markAsSaved
  };
}

export default useFormChangeDetection;
