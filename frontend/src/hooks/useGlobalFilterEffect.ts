import { useMemo } from 'react';
import { useFilters } from '../contexts/FilterContext';

interface GlobalFilterEffectOptions {
  tableName: string;
  data: any[];
}

export const useGlobalFilterEffect = ({ tableName, data }: GlobalFilterEffectOptions) => {
  const { paisSeleccionado, empresaSeleccionada, fundoSeleccionado } = useFilters();

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return data;

    // Lógica específica para cada tabla según los requerimientos:
    // - País: Sin filtros (mostrar todos)
    // - Empresa: Filtrar por País seleccionado
    // - Fundo: Filtrar por Empresa seleccionada

    // Para la tabla 'pais', siempre mostrar todos los registros sin filtros
    if (tableName === 'pais') {
      console.log('🌍 Tabla País: Mostrando todos los registros sin filtros');
      return data;
    }

    // Para la tabla 'empresa', filtrar solo por país si está seleccionado
    if (tableName === 'empresa') {
      if (!paisSeleccionado) {
        console.log('🏢 Tabla Empresa: Sin país seleccionado, mostrando todas las empresas');
        return data;
      }
      
      const filtered = data.filter(row => {
        return row.paisid && row.paisid.toString() === paisSeleccionado;
      });
      
      console.log('🏢 Tabla Empresa: Filtradas por país', {
        paisSeleccionado,
        totalEmpresas: data.length,
        empresasFiltradas: filtered.length
      });
      
      return filtered;
    }

    // Para la tabla 'fundo', filtrar solo por empresa si está seleccionada
    if (tableName === 'fundo') {
      if (!empresaSeleccionada) {
        console.log('🏭 Tabla Fundo: Sin empresa seleccionada, mostrando todos los fundos');
        return data;
      }
      
      const filtered = data.filter(row => {
        return row.empresaid && row.empresaid.toString() === empresaSeleccionada;
      });
      
      console.log('🏭 Tabla Fundo: Filtrados por empresa', {
        empresaSeleccionada,
        totalFundos: data.length,
        fundosFiltrados: filtered.length
      });
      
      return filtered;
    }

    // Para otras tablas, aplicar la lógica original de filtros jerárquicos
    // Si no hay filtros activos, devolver todos los datos
    if (!paisSeleccionado && !empresaSeleccionada && !fundoSeleccionado) {
      return data;
    }

    console.log('🔍 Aplicando filtros globales para tabla:', {
      tableName,
      paisSeleccionado,
      empresaSeleccionada,
      fundoSeleccionado,
      totalData: data.length
    });

    return data.filter(row => {
      let matches = true;

      // Aplicar filtro por país si está seleccionado
      if (paisSeleccionado && row.paisid) {
        matches = matches && row.paisid.toString() === paisSeleccionado;
      }

      // Aplicar filtro por empresa si está seleccionado
      if (empresaSeleccionada && row.empresaid) {
        matches = matches && row.empresaid.toString() === empresaSeleccionada;
      }

      // Aplicar filtro por fundo si está seleccionado
      if (fundoSeleccionado && row.fundoid) {
        matches = matches && row.fundoid.toString() === fundoSeleccionado;
      }

      // Para tablas que no tienen estos campos directamente, buscar en relaciones
      if (tableName === 'nodo' && (empresaSeleccionada || fundoSeleccionado)) {
        // Los nodos están relacionados con ubicaciones a través de localizacion
        // Si hay filtros de empresa/fundo, necesitamos verificar las ubicaciones relacionadas
        // Por ahora, si no hay campos directos, no filtrar
        // TODO: Implementar lógica de relaciones si es necesario
      }

      if (tableName === 'sensor' && (empresaSeleccionada || fundoSeleccionado)) {
        // Los sensores están relacionados con nodos, que pueden estar relacionados con ubicaciones
        // Por ahora, si no hay campos directos, no filtrar
        // TODO: Implementar lógica de relaciones si es necesario
      }

      if (tableName === 'metricasensor' && (empresaSeleccionada || fundoSeleccionado)) {
        // Similar a sensor
        // TODO: Implementar lógica de relaciones si es necesario
      }

      // Para tablas que tienen relaciones directas con entidad
      if (tableName === 'tipo' && fundoSeleccionado) {
        // Los tipos están relacionados con entidades, que pueden estar relacionadas con fundos
        if (row.entidadid) {
          // Verificar si la entidad pertenece al fundo seleccionado
          // Esto requeriría datos adicionales de entidades
        }
      }

      // Para tablas que tienen relaciones directas con ubicación
      if (tableName === 'localizacion' && fundoSeleccionado) {
        // Las localizaciones están relacionadas con ubicaciones, que pertenecen a fundos
        if (row.ubicacionid) {
          // Verificar si la ubicación pertenece al fundo seleccionado
          // Esto requeriría datos adicionales de ubicaciones
        }
      }

      return matches;
    });
  }, [data, paisSeleccionado, empresaSeleccionada, fundoSeleccionado, tableName]);

  // Solo hacer log si hay cambios significativos
  if (filteredData.length !== data.length) {
    console.log('📊 Resultado del filtrado global:', {
      tableName,
      originalCount: data.length,
      filteredCount: filteredData.length,
      hasFilters: !!(paisSeleccionado || empresaSeleccionada || fundoSeleccionado)
    });
  }

  return filteredData;
};
