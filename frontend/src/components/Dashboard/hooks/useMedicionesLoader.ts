/**
 * Hook personalizado para cargar mediciones
 * Encapsula toda la lógica de carga, caché y manejo de errores
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { JoySenseService } from '../../../services/backend-api';
import SupabaseRPCService from '../../../services/supabase-rpc';
import { MedicionData } from '../types';

const DATA_LIMITS = {
  RANGE_SELECTED: 20000,
  HOURS_24: 1000,
  DAYS_7: 5000,
  DAYS_14: 10000,
  DAYS_30: 20000,
  LAST_HOURS: 5000
} as const;

interface UseMedicionesLoaderParams {
  selectedNode: any;
  filters: {
    entidadId: number | null;
    ubicacionId: number | null;
    startDate: string;
    endDate: string;
  };
}

interface UseMedicionesLoaderReturn {
  mediciones: MedicionData[];
  loading: boolean;
  error: string | null;
  loadMediciones: (requestKey?: string, expectedNodeId?: number | null) => Promise<void>;
}

export function useMedicionesLoader({
  selectedNode,
  filters
}: UseMedicionesLoaderParams): UseMedicionesLoaderReturn {
  const [mediciones, setMediciones] = useState<MedicionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMedicionesAbortControllerRef = useRef<AbortController | null>(null);
  const loadMedicionesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestNodeIdRef = useRef<number | null>(null);
  const currentRequestKeyRef = useRef<string | null>(null);

  const loadMediciones = useCallback(
    async (requestKey?: string, expectedNodeId?: number | null) => {
      const requiresUbicacionId = !selectedNode;
      const hasRequiredFilters = selectedNode
        ? true
        : filters.entidadId && (requiresUbicacionId ? filters.ubicacionId : true);

      if (!hasRequiredFilters) {
        setMediciones([]);
        setLoading(false);
        return;
      }

      const thisRequestKey =
        requestKey || `${filters.entidadId}-${filters.ubicacionId}-${selectedNode?.nodoid || 'none'}-${Date.now()}`;
      const thisNodeId = expectedNodeId !== undefined ? expectedNodeId : selectedNode?.nodoid || null;

      if (currentRequestKeyRef.current !== null && currentRequestKeyRef.current !== thisRequestKey) {
        return;
      }

      if (thisNodeId !== null && Number(selectedNode?.nodoid) !== Number(thisNodeId)) {
        return;
      }

      setLoading(true);
      setError(null);

      currentRequestKeyRef.current = thisRequestKey;
      currentRequestNodeIdRef.current = thisNodeId;

      try {
        let allData: any[] = [];

        if (selectedNode) {
          const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
          };

          // Intentar con filtros globales si existen
          if (filters.startDate && filters.endDate) {
            const startDateFormatted = `${filters.startDate} 00:00:00`;
            const endDateFormatted = `${filters.endDate} 23:59:59`;

            try {
              const data = await JoySenseService.getMediciones({
                nodoid: selectedNode.nodoid,
                startDate: startDateFormatted,
                endDate: endDateFormatted,
                limit: DATA_LIMITS.RANGE_SELECTED
              });

              const dataArray = Array.isArray(data) ? data : data ? [data] : [];
              if (dataArray.length > 0) {
                allData = dataArray;
              }
            } catch (error: any) {
              // Fallback a estrategia progresiva
            }
          }

          // Estrategia progresiva: rangos crecientes
          if (allData.length === 0) {
            const now = new Date();
            const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

            const ranges = [
              { days: 1, limit: DATA_LIMITS.HOURS_24, label: '24 horas' },
              { days: 7, limit: DATA_LIMITS.DAYS_7, label: '7 días' },
              { days: 14, limit: DATA_LIMITS.DAYS_14, label: '14 días' },
              { days: 30, limit: DATA_LIMITS.DAYS_30, label: '30 días' }
            ];

            for (const range of ranges) {
              const startDate = new Date(endDate.getTime() - range.days * 24 * 60 * 60 * 1000);
              const startDateStr = formatDate(startDate);
              const endDateStr = formatDate(endDate);

              try {
                const data = await JoySenseService.getMediciones({
                  nodoid: selectedNode.nodoid,
                  startDate: startDateStr,
                  endDate: endDateStr,
                  limit: range.limit
                });

                const dataArray = Array.isArray(data) ? data : data ? [data] : [];

                if (dataArray.length > 0) {
                  allData = dataArray;
                  break;
                }
              } catch (error: any) {
                continue;
              }
            }
          }
        } else {
          // Sin nodo seleccionado - no cargar datos (caso no común)
          // El usuario debe seleccionar un nodo específico para ver mediciones
          console.log('[useMedicionesLoader] No node selected, skipping data load');
        }

        if (currentRequestKeyRef.current === thisRequestKey) {
          setMediciones(allData);
        }
      } catch (err: any) {
        if (currentRequestKeyRef.current === thisRequestKey) {
          const errorMsg = err?.message || 'Error al cargar mediciones';
          setError(errorMsg);
          setMediciones([]);
        }
      } finally {
        if (currentRequestKeyRef.current === thisRequestKey) {
          setLoading(false);
        }
      }
    },
    [selectedNode, filters]
  );

  useEffect(() => {
    return () => {
      if (loadMedicionesAbortControllerRef.current) {
        loadMedicionesAbortControllerRef.current.abort();
      }
      if (loadMedicionesTimeoutRef.current) {
        clearTimeout(loadMedicionesTimeoutRef.current);
      }
    };
  }, []);

  return { mediciones, loading, error, loadMediciones };
}
