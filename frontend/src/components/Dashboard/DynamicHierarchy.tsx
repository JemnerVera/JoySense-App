import React, { useState, useEffect } from 'react';
import { JoySenseService } from '../../services/backend-api';
import SeparateCharts from './SeparateCharts';
import { ModernDashboard } from './ModernDashboard';

interface DynamicHierarchyProps {
  selectedPais?: any;
  selectedEmpresa?: any;
  selectedFundo?: any;
  selectedEntidad?: any;
  selectedUbicacion?: any;
  startDate?: string;
  endDate?: string;
  onFundoChange?: (fundo: any) => void;
  onEntidadChange?: (entidad: any) => void;
  onUbicacionChange?: (ubicacion: any) => void;
  onDateFilter?: (start: string, end: string) => void;
  onResetFilters?: () => void;
}

const DynamicHierarchy: React.FC<DynamicHierarchyProps> = ({ 
  selectedPais,
  selectedEmpresa,
  selectedFundo,
  selectedEntidad,
  selectedUbicacion,
  startDate,
  endDate,
  onFundoChange,
  onEntidadChange,
  onUbicacionChange,
  onDateFilter,
  onResetFilters
}) => {
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [selectedMetrica, setSelectedMetrica] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales (métricas y tipos)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [metricasData, tiposData] = await Promise.all([
          JoySenseService.getMetricas(),
          JoySenseService.getTipos()
        ]);

        setMetricas(Array.isArray(metricasData) ? metricasData : []);
        setTipos(Array.isArray(tiposData) ? tiposData : []);
        
        // Seleccionar la primera métrica por defecto
        if (Array.isArray(metricasData) && metricasData.length > 0) {
          setSelectedMetrica(metricasData[0].metricaid);
        }
      } catch (err) {
        console.error('❌ Error cargando datos iniciales:', err);
      }
    };

    loadInitialData();
  }, []);

  // Cargar mediciones cuando cambien los filtros
  useEffect(() => {
    const loadMediciones = async () => {
      if (!selectedEntidad?.entidadid || !selectedUbicacion?.ubicacionid || !startDate || !endDate) {
        setMediciones([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('🔍 DynamicHierarchy: Cargando mediciones con filtros:', {
          entidadId: selectedEntidad.entidadid,
          ubicacionId: selectedUbicacion.ubicacionid,
          startDate,
          endDate
        });

        const data = await JoySenseService.getMediciones({
          entidadId: selectedEntidad.entidadid,
          ubicacionId: selectedUbicacion.ubicacionid,
          startDate,
          endDate
        });

        console.log('🔍 DynamicHierarchy: Mediciones obtenidas:', Array.isArray(data) ? data.length : 0);
        setMediciones(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('❌ Error cargando mediciones:', err);
        setError('Error al cargar las mediciones');
    } finally {
      setLoading(false);
    }
  };

    loadMediciones();
  }, [selectedEntidad, selectedUbicacion, startDate, endDate]);

  // Preparar filtros para el ModernDashboard
  const filters = {
    entidadId: selectedEntidad?.entidadid || null,
    ubicacionId: selectedUbicacion?.ubicacionid || null,
    startDate: startDate || '',
    endDate: endDate || ''
  };

  // Función para manejar cambios en los filtros
  const handleFiltersChange = (newFilters: any) => {
    if (onEntidadChange && newFilters.entidadId !== filters.entidadId) {
      const entidad = { entidadid: newFilters.entidadId };
      onEntidadChange(entidad);
    }
    if (onUbicacionChange && newFilters.ubicacionId !== filters.ubicacionId) {
      const ubicacion = { ubicacionid: newFilters.ubicacionId };
      onUbicacionChange(ubicacion);
    }
    if (onDateFilter && (newFilters.startDate !== filters.startDate || newFilters.endDate !== filters.endDate)) {
      onDateFilter(newFilters.startDate, newFilters.endDate);
    }
  };

  // Usar el ModernDashboard con el diseño mejorado
  return (
    <ModernDashboard 
      filters={filters}
      onFiltersChange={handleFiltersChange}
    />
  );
  };

export default DynamicHierarchy;