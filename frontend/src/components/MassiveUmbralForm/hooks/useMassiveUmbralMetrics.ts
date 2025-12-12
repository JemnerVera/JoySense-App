// ============================================================================
// HOOK: useMassiveUmbralMetrics - Lógica de métricas y umbrales
// ============================================================================

import { FormData, MetricaData } from '../types';

interface UseMassiveUmbralMetricsProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export const useMassiveUmbralMetrics = ({
  formData,
  setFormData
}: UseMassiveUmbralMetricsProps) => {
  // Manejar toggle de métrica (expandir/contraer)
  const handleMetricaToggle = (metricaid: number) => {
    setFormData(prev => ({
      ...prev,
      metricasData: prev.metricasData.map(metrica =>
        metrica.metricaid === metricaid
          ? { ...metrica, expanded: !metrica.expanded }
          : metrica
      )
    }));
  };

  // Manejar selección de métrica
  const handleMetricaSelection = (metricaid: number, selected: boolean) => {
    setFormData(prev => ({
      ...prev,
      metricasData: prev.metricasData.map(metrica =>
        metrica.metricaid === metricaid
          ? { ...metrica, selected }
          : metrica
      )
    }));
  };

  // Manejar cambio de umbral por tipo (un solo umbral por tipo)
  const handleUmbralChange = (metricaid: number, tipoid: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metricasData: prev.metricasData.map(metrica => {
        if (metrica.metricaid === metricaid) {
          const updatedUmbralesPorTipo = { ...metrica.umbralesPorTipo };
          // Obtener el umbral actual o crear uno nuevo
          const umbralActual = updatedUmbralesPorTipo[tipoid] || {
            minimo: '',
            maximo: '',
            criticidadid: null,
            umbral: ''
          };
          
          // Actualizar el campo específico
          updatedUmbralesPorTipo[tipoid] = {
            ...umbralActual,
            [field]: field === 'criticidadid' ? (value ? parseInt(value) : null) : value
          };
          
          return { ...metrica, umbralesPorTipo: updatedUmbralesPorTipo };
        }
        return metrica;
      })
    }));
  };

  return {
    handleMetricaToggle,
    handleMetricaSelection,
    handleUmbralChange
  };
};

