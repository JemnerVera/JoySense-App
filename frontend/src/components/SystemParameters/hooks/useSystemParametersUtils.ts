// ============================================================================
// HOOK: useSystemParametersUtils - Funciones de utilidad para SystemParameters
// ============================================================================

import { useCallback } from 'react';

interface RelatedData {
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
  ubicacionesData?: any[];
  localizacionesData?: any[];
  entidadesData?: any[];
  nodosData?: any[];
  tiposData?: any[];
  metricasData?: any[];
  criticidadesData?: any[];
  [key: string]: any[] | undefined;
}

interface UseSystemParametersUtilsProps {
  relatedDataForStatus: RelatedData;
}

export const useSystemParametersUtils = ({ 
  relatedDataForStatus 
}: UseSystemParametersUtilsProps) => {
  
  // Función para obtener opciones únicas de campos (para formularios masivos)
  const getUniqueOptionsForFieldMassive = useCallback((field: string, filters?: any) => {
    const fieldToTableMap: Record<string, { table: string; key: string; label: string | string[] }> = {
      'fundoid': { table: 'fundosData', key: 'fundoid', label: 'fundo' },
      'entidadid': { table: 'entidadesData', key: 'entidadid', label: 'entidad' },
      'nodoid': { table: 'nodosData', key: 'nodoid', label: 'nodo' },
      'tipoid': { table: 'tiposData', key: 'tipoid', label: 'tipo' },
      'metricaid': { table: 'metricasData', key: 'metricaid', label: 'metrica' },
      'criticidadid': { table: 'criticidadesData', key: 'criticidadid', label: 'criticidad' }
    };

    const mapping = fieldToTableMap[field];
    if (!mapping) return [];

    const data = relatedDataForStatus[mapping.table as keyof typeof relatedDataForStatus] as any[];
    if (!data) return [];

    let filteredData = data;

    // Aplicar filtros si existen
    if (filters) {
      if (field === 'nodoid' && filters.fundoid && filters.entidadid) {
        // Filtrar nodos por fundo y entidad a través de localizaciones
        const ubicacionesDelFundo = (relatedDataForStatus.ubicacionesData || []).filter((u: any) => 
          u.fundoid === parseInt(filters.fundoid)
        );
        const ubicacionIds = new Set(ubicacionesDelFundo.map((u: any) => u.ubicacionid));
        const localizaciones = (relatedDataForStatus.localizacionesData || []).filter((l: any) =>
          ubicacionIds.has(l.ubicacionid)
        );
        const nodoIds = new Set(localizaciones.map((l: any) => l.nodoid));
        filteredData = filteredData.filter((n: any) => nodoIds.has(n.nodoid));
      }

      if (field === 'tipoid' && filters.entidadid) {
        filteredData = filteredData.filter((t: any) => t.entidadid === parseInt(filters.entidadid));
        
        if (filters.nodoids) {
          // Filtrar por nodos específicos a través de sensores
          const nodoIdsArray = filters.nodoids.split(',').map((id: string) => parseInt(id.trim()));
          const sensores = (relatedDataForStatus.nodosData || []).filter((n: any) => 
            nodoIdsArray.includes(n.nodoid)
          );
          // En un caso real, necesitarías consultar la tabla sensor para obtener los tipoid
          // Por ahora, asumimos que todos los tipos de la entidad son válidos
        }
      }

      if (field === 'metricaid' && filters.nodoids) {
        // Filtrar métricas por nodos específicos a través de metricasensor
        const nodoIdsArray = filters.nodoids.split(',').map((id: string) => parseInt(id.trim()));
        // En un caso real, necesitarías consultar metricasensor
        // Por ahora, retornamos todas las métricas
      }
    }

    return filteredData.map((item: any) => {
      let label = '';
      if (Array.isArray(mapping.label)) {
        label = mapping.label.map(l => item[l]).filter(Boolean).join(' ');
      } else {
        label = item[mapping.label] || '';
        // Casos especiales
        if (field === 'metricaid' && item.unidad) {
          label = label ? `${label} (${item.unidad})` : item.unidad;
        }
      }
      
      const option: any = {
        value: item[mapping.key],
        label: label || `ID: ${item[mapping.key]}`
      };
      
      // Campos adicionales para métricas
      if (field === 'metricaid' && item.unidad) {
        option.unidad = item.unidad;
      }
      
      // Campos adicionales para nodos
      if (field === 'nodoid') {
        if (item.datecreated) option.datecreated = item.datecreated;
        // Obtener ubicacionid desde localizaciones
        const localizacion = (relatedDataForStatus.localizacionesData || []).find((l: any) => 
          l.nodoid === item.nodoid
        );
        if (localizacion?.ubicacionid) {
          option.ubicacionid = localizacion.ubicacionid;
        }
      }
      
      return option;
    });
  }, [relatedDataForStatus]);

  // Función para obtener nombre de país
  const getPaisName = useCallback((paisId: string) => {
    const pais = (relatedDataForStatus.paisesData || []).find((p: any) => p.paisid === parseInt(paisId));
    return pais?.pais || `País ${paisId}`;
  }, [relatedDataForStatus]);

  // Función para obtener nombre de empresa
  const getEmpresaName = useCallback((empresaId: string) => {
    const empresa = (relatedDataForStatus.empresasData || []).find((e: any) => e.empresaid === parseInt(empresaId));
    return empresa?.empresa || `Empresa ${empresaId}`;
  }, [relatedDataForStatus]);

  // Función para obtener nombre de fundo
  const getFundoName = useCallback((fundoId: string) => {
    const fundo = (relatedDataForStatus.fundosData || []).find((f: any) => f.fundoid === parseInt(fundoId));
    return fundo?.fundo || `Fundo ${fundoId}`;
  }, [relatedDataForStatus]);

  return {
    getUniqueOptionsForFieldMassive,
    getPaisName,
    getEmpresaName,
    getFundoName
  };
};

