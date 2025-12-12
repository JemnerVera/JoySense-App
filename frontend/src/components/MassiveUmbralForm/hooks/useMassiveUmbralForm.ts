// ============================================================================
// HOOK: useMassiveUmbralForm - Estado principal del formulario
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { FormData, MetricaData } from '../types';

interface UseMassiveUmbralFormProps {
  getUniqueOptionsForField: (field: string, filters?: any) => any[];
  selectedNodes: Array<{ nodoid: number; selected: boolean }>;
  onFormDataChange?: (formData: any) => void;
}

export const useMassiveUmbralForm = ({
  getUniqueOptionsForField,
  selectedNodes,
  onFormDataChange
}: UseMassiveUmbralFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    fundoid: null,
    entidadid: null,
    metricasData: []
  });

  // Obtener opciones para los dropdowns
  const fundosOptions = useMemo(() => 
    getUniqueOptionsForField('fundoid'), [getUniqueOptionsForField]
  );

  const entidadesOptions = useMemo(() => 
    getUniqueOptionsForField('entidadid'), [getUniqueOptionsForField]
  );

  // Métricas filtradas por nodos seleccionados (solo las que existen en metricasensor)
  const metricasOptions = useMemo(() => {
    const selectedNodesFiltered = selectedNodes.filter((node) => node.selected);
    if (selectedNodesFiltered.length === 0) {
      return [];
    }
    
    // Obtener métricas que existen en metricasensor para los nodos seleccionados
    const nodoids = selectedNodesFiltered.map((node) => node.nodoid);
    return getUniqueOptionsForField('metricaid', { nodoids: nodoids.join(',') });
  }, [getUniqueOptionsForField, selectedNodes]);

  const criticidadesOptions = useMemo(() => 
    getUniqueOptionsForField('criticidadid'), [getUniqueOptionsForField]
  );

  // Inicializar métricas cuando se cargan las opciones o cambian los nodos seleccionados
  useEffect(() => {
    if (metricasOptions.length > 0) {
      setFormData(prev => {
        // Si ya hay métricas en el estado, preservar los datos existentes
        if (prev.metricasData.length > 0) {
          // Crear un mapa de métricas existentes por metricaid para preservar los umbrales
          const existingMetricasMap = new Map(
            prev.metricasData.map(m => [m.metricaid, m])
          );
          
          // Crear nuevas métricas solo para las que no existen
          const newMetricasData: MetricaData[] = metricasOptions.map(option => {
            const metricaid = parseInt(option.value.toString());
            const existing = existingMetricasMap.get(metricaid);
            
            // Si existe, preservar todos sus datos (umbrales, selección, expansión)
            if (existing) {
              return existing;
            }
            
            // Si no existe, crear nueva métrica
            return {
              metricaid,
              metrica: option.label,
              unidad: option.unidad || '',
              selected: true, // ✅ Seleccionadas por defecto
              expanded: false,
              umbralesPorTipo: {}
            };
          });
          
          return { ...prev, metricasData: newMetricasData };
        } else {
          // Si no hay métricas existentes, inicializar todas
          const initialMetricasData: MetricaData[] = metricasOptions.map(option => ({
            metricaid: parseInt(option.value.toString()),
            metrica: option.label,
            unidad: option.unidad || '',
            selected: true, // ✅ Seleccionadas por defecto
            expanded: false,
            umbralesPorTipo: {}
          }));
          return { ...prev, metricasData: initialMetricasData };
        }
      });
    } else {
      // Solo limpiar si realmente no hay métricas disponibles Y no hay datos importantes
      setFormData(prev => {
        // Solo limpiar si no hay umbrales configurados
        const hasUmbrales = prev.metricasData.some(m => 
          Object.values(m.umbralesPorTipo).some(umbral => 
            umbral && (umbral.minimo || umbral.maximo || umbral.criticidadid || umbral.umbral)
          )
        );
        
        // Si hay umbrales configurados, no limpiar (preservar el trabajo del usuario)
        if (hasUmbrales) {
          return prev;
        }
        
        return { ...prev, metricasData: [] };
      });
    }
  }, [metricasOptions]);

  // Auto-seleccionar fundo si solo hay una opción
  useEffect(() => {
    if (fundosOptions.length === 1 && !formData.fundoid) {
      setFormData(prev => ({
        ...prev,
        fundoid: fundosOptions[0].value ? parseInt(fundosOptions[0].value.toString()) : null,
        entidadid: null
      }));
    }
  }, [fundosOptions, formData.fundoid]);

  // Auto-seleccionar entidad si solo hay una opción
  useEffect(() => {
    if (entidadesOptions.length === 1 && !formData.entidadid) {
      setFormData(prev => ({
        ...prev,
        entidadid: entidadesOptions[0].value ? parseInt(entidadesOptions[0].value.toString()) : null
      }));
    }
  }, [entidadesOptions, formData.entidadid]);

  // Reportar cambios al sistema de detección (solo cambios significativos)
  useEffect(() => {
    if (onFormDataChange) {
      const massiveFormData = {
        fundoid: formData.fundoid,
        entidadid: formData.entidadid,
        selectedMetricas: formData.metricasData.filter(m => m.selected),
        selectedNodes: selectedNodes.filter(node => node.selected),
        hasData: formData.fundoid !== null || 
                 formData.entidadid !== null || 
                 formData.metricasData.some(m => m.selected) || 
                 selectedNodes.some(node => node.selected) ||
                 formData.metricasData.some(m => 
                   m.selected && Object.values(m.umbralesPorTipo).some(umbral => 
                     umbral && umbral.minimo && umbral.maximo && umbral.criticidadid && umbral.umbral
                   )
                 )
      };
      onFormDataChange(massiveFormData);
    }
  }, [formData.fundoid, formData.entidadid, formData.metricasData.map(m => m.selected).join(','), selectedNodes.map(n => n.selected).join(','), onFormDataChange]);

  return {
    formData,
    setFormData,
    fundosOptions,
    entidadesOptions,
    metricasOptions,
    criticidadesOptions
  };
};

