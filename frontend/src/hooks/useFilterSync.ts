import { useCallback } from 'react';
import { useFilters, FiltersBatch } from '../contexts/FilterContext';
import {
  deriveHierarchyFromLocalizacion,
  deriveHierarchyFromUbicacion,
} from '../utils/filterSync';

/**
 * Hook para sincronizar selecciones de dashboards con los filtros globales.
 * Cuando el usuario selecciona una localización o ubicación en un dashboard,
 * actualiza los filtros globales (país, empresa, fundo, ubicación) de forma atómica.
 */
export function useFilterSync(fundosInfo?: Map<number, any>) {
  const { setFiltersBatch } = useFilters();

  const syncDashboardSelectionToGlobal = useCallback(
    (selection: any, type: 'localizacion' | 'ubicacion') => {
      console.log('[useFilterSync] syncDashboardSelectionToGlobal called:', { type, selection, fundosInfoSize: fundosInfo?.size });
      
      let derived;

      if (type === 'localizacion') {
        derived = deriveHierarchyFromLocalizacion(selection, fundosInfo);
      } else {
        derived = deriveHierarchyFromUbicacion(selection, fundosInfo);
      }

      if (!derived) {
        console.log('[useFilterSync] No derived hierarchy');
        return;
      }

      console.log('[useFilterSync] Setting filters batch:', derived);
      // Only update fields that have values (non-empty strings)
      const batch: FiltersBatch = {};
      if (derived.paisId) batch.paisId = derived.paisId;
      if (derived.empresaId) batch.empresaId = derived.empresaId;
      if (derived.fundoId) batch.fundoId = derived.fundoId;
      if (derived.ubicacion) batch.ubicacion = derived.ubicacion;
      
      console.log('[useFilterSync] Final batch to set:', batch);
      setFiltersBatch(batch);
    },
    [setFiltersBatch, fundosInfo]
  );

  return { syncDashboardSelectionToGlobal };
}
