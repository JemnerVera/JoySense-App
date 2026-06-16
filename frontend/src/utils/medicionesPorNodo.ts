import SupabaseRPCService from '../services/supabase-rpc';
import { transformRpcMedicionesDetallado } from './medicionTransform';

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Formato YYYY-MM-DD para p_end_date de la RPC (suma 1 día internamente). */
export function formatEndDateForRpc(endDateStr: string): string {
  const [eY, eM, eD] = endDateStr.split('-').map(Number);
  const effective = new Date(Date.UTC(eY, eM - 1, eD, 0, 0, 0, 0));
  const y = effective.getUTCFullYear();
  const m = String(effective.getUTCMonth() + 1).padStart(2, '0');
  const d = String(effective.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface LoadMedicionesPorNodoParams {
  nodoid: number;
  startDate?: string;
  endDate?: string;
  metricaid?: number;
}

/**
 * Carga mediciones de un nodo vía fn_get_mediciones_nodo_detallado (SECURITY DEFINER).
 * Por defecto usa el último día si no se pasan fechas.
 */
export async function loadMedicionesPorNodo(
  params: LoadMedicionesPorNodoParams
): Promise<any[]> {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const endDate = params.endDate?.trim() || toLocalDateString(today);
  const startDate = params.startDate?.trim() || toLocalDateString(yesterday);

  const raw = await SupabaseRPCService.getMedicionesNodoDetallado({
    nodoid: params.nodoid,
    startDate,
    endDate: formatEndDateForRpc(endDate),
    metricaid: params.metricaid,
  });

  if (!Array.isArray(raw) || raw.length === 0) {
    return [];
  }

  return transformRpcMedicionesDetallado(raw, params.nodoid);
}
