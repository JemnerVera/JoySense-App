/**
 * Supabase RPC Service
 * Servicio centralizado para llamar funciones RPC de Supabase desde el frontend
 * Proporciona tipado TypeScript, validación y manejo centralizado de errores
 */

import { supabaseAuth } from './supabase-auth';
import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TIPOS PARA RESPUESTAS RPC
// ============================================================================

/**
 * Extensión de SupabaseClient para tipado correcto del método RPC
 */
declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    rpc<T = any>(
      fn: string,
      args?: any,
      options?: any
    ): Promise<{ data: T | null; error: any | null }>;
  }
}

/**
 * Mediciones agregadas por intervalo de tiempo
 */
export interface MedicionAgregada {
  fecha_agregada: string;
  metricaid: number;
  valor_promedio: number;
  valor_min: number;
  valor_max: number;
  cantidad: number;
}

/**
 * Estadísticas de mediciones para KPIs
 */
export interface EstadisticaMedicion {
  metricaid: number;
  nombre_metrica: string;
  unidad: string;
  promedio: number;
  minimo: number;
  maximo: number;
  desviacion: number;
  cantidad_total: number;
  ultima_fecha: string;
  ultima_valor: number;
}

/**
 * Alertas filtradas por nodo
 */
export interface AlertaPorNodo {
  alertaid: string;
  fecha: string;
  valor: number;
  regla_nombre: string;
  criticidad: string;
  metricaid: number;
  metrica_nombre: string;
  localizacionid: number;
}

/**
 * Umbrales con información de métrica y criticidad
 */
export interface UmbralPorNodo {
  umbralid: number;
  minimo: number;
  maximo: number;
  estandar?: number;
  metricaid: number;
  metrica_nombre: string;
  unidad: string;
  criticidad: string;
}

/**
 * KPIs consolidados para un nodo
 */
export interface KPINodo {
  metricaid: number;
  metrica_nombre: string;
  unidad: string;
  total_mediciones: number;
  promedio: number;
  minimo: number;
  maximo: number;
  desviacion: number;
  ultima_fecha: string;
  ultima_valor: number;
  alertas_activas: number;
}

/**
 * Métricas agregadas por localización
 */
export interface MetricaPorLocalizacion {
  localizacionid: number;
  localizacion_nombre: string;
  tipoid: number;
  sensorid: number;
  ultimo_valor: number;
  ultima_fecha: string;
  total_mediciones: number;
}

/**
 * Umbrales con estadísticas históricas
 */
export interface UmbralConEstadisticas {
  umbralid: number;
  nodoid: number;
  metricaid: number;
  minimo: number;
  maximo: number;
  criticidad: string;
  total_alertas: number;
  tiempo_promedio_alerta: number;
}

/**
 * Nodos con alertas activas
 */
export interface NodoConAlertas {
  nodoid: number;
  nodo: string;
  total_alertas: number;
  criticidad_maxima: string;
}

/**
 * Resumen ligero de nodos para visualización del mapa
 */
export interface ResumenMapaNodo {
  nodoid: number;
  nodo: string;
  ubicacionid: number;
  latitud: number;
  longitud: number;
  ultima_medicion_fecha: string;
  total_mediciones_7d: number;
  alertas_activas: number;
  metricas_disponibles: number[];
}

// ============================================================================
// SERVICIO RPC
// ============================================================================

export class SupabaseRPCService {
  private static readonly DEBUG = process.env.NODE_ENV === 'development';

  /**
   * Calcula el intervalo de agregación en minutos basado en el rango de fechas
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @returns Intervalo en minutos (60, 360, 1440 o 4320)
   */
  static calculateInterval(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);

    if (daysDiff <= 7) return 60; // 1 hora para <7 días
    if (daysDiff <= 30) return 360; // 6 horas para 7-30 días
    if (daysDiff <= 90) return 1440; // 1 día para 30-90 días
    return 4320; // 3 días para >90 días
  }

  /**
   * Obtiene mediciones agregadas por intervalo de tiempo
   * Reduce datos transferidos hasta 95%
   * @param params Parámetros de la consulta
   * @returns Array de mediciones agregadas
   */
  static async getMedicionesAgregadas(params: {
    nodoid: number;
    metricaid?: number;
    startDate?: string;
    endDate?: string;
    intervalMinutes?: number;
  }): Promise<MedicionAgregada[]> {
    try {
      // Validación de parámetros
      if (!params.nodoid || params.nodoid <= 0) {
        throw new Error('nodoid inválido');
      }

      // Calcular intervalo si no se proporciona
      let interval = params.intervalMinutes;
      if (!interval && params.startDate && params.endDate) {
        interval = this.calculateInterval(params.startDate, params.endDate);
      }

      if (this.DEBUG) {
        console.log('[SupabaseRPCService] getMedicionesAgregadas:', {
          nodoid: params.nodoid,
          metricaid: params.metricaid,
          startDate: params.startDate,
          endDate: params.endDate,
          intervalMinutes: interval
        });
      }

      const { data, error } = await supabaseAuth
        .schema('joysense')
        .rpc('fn_get_mediciones_agregadas', {
          p_nodoid: params.nodoid,
          p_metricaid: params.metricaid || null,
          p_start_date: params.startDate ? `${params.startDate} 00:00:00` : null,
          p_end_date: params.endDate ? `${params.endDate} 23:59:59` : null,
          p_interval_minutes: interval || 360
        });

      if (error) {
        throw new Error(`RPC error: ${error.message}`);
      }

      if (!Array.isArray(data)) {
        return [];
      }

      return data;
    } catch (err: any) {
      console.error('[SupabaseRPCService] Error en getMedicionesAgregadas:', err);
      throw err;
    }
  }

  /**
   * Obtiene estadísticas de mediciones para KPIs
   * Calcula estadísticas en base de datos, no en frontend
   * @param params Parámetros de la consulta
   * @returns Array de estadísticas por métrica
   */
  static async getEstadisticasMediciones(params: {
    nodoid: number;
    metricaid?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<EstadisticaMedicion[]> {
    try {
      // Validación
      if (!params.nodoid || params.nodoid <= 0) {
        throw new Error('nodoid inválido');
      }

      if (this.DEBUG) {
        console.log('[SupabaseRPCService] getEstadisticasMediciones:', params);
      }

      const { data, error } = await supabaseAuth
        .schema('joysense')
        .rpc('fn_get_mediciones_estadisticas', {
          p_nodoid: params.nodoid,
          p_metricaid: params.metricaid || null,
          p_start_date: params.startDate ? `${params.startDate} 00:00:00` : null,
          p_end_date: params.endDate ? `${params.endDate} 23:59:59` : null
        });

      if (error) {
        throw new Error(`RPC error: ${error.message}`);
      }

      if (!Array.isArray(data)) {
        return [];
      }

      return data;
    } catch (err: any) {
      console.error(
        '[SupabaseRPCService] Error en getEstadisticasMediciones:',
        err
      );
      throw err;
    }
  }

  /**
   * Obtiene alertas filtradas por nodo
   * Evita cargar todas las alertas y luego filtrar en frontend
   * @param params Parámetros de la consulta
   * @returns Array de alertas para el nodo
   */
  static async getAlertasPorNodo(params: {
    nodoid: number;
    startDate?: string;
    endDate?: string;
  }): Promise<AlertaPorNodo[]> {
    try {
      if (!params.nodoid || params.nodoid <= 0) {
        throw new Error('nodoid inválido');
      }

      if (this.DEBUG) {
        console.log('[SupabaseRPCService] getAlertasPorNodo:', params);
      }

      const { data, error } = await supabaseAuth
        .schema('joysense')
        .rpc('fn_get_alertas_por_nodo', {
          p_nodoid: params.nodoid,
          p_start_date: params.startDate ? `${params.startDate} 00:00:00` : null,
          p_end_date: params.endDate ? `${params.endDate} 23:59:59` : null
        });

      if (error) {
        throw new Error(`RPC error: ${error.message}`);
      }

      if (!Array.isArray(data)) {
        return [];
      }

      return data;
    } catch (err: any) {
      console.error('[SupabaseRPCService] Error en getAlertasPorNodo:', err);
      throw err;
    }
  }

  /**
   * Obtiene umbrales con información de métrica y criticidad por nodo
   * @param params Parámetros de la consulta
   * @returns Array de umbrales para el nodo
   */
  static async getUmbralesPorNodo(params: {
    nodoid: number;
  }): Promise<UmbralPorNodo[]> {
    try {
      if (!params.nodoid || params.nodoid <= 0) {
        throw new Error('nodoid inválido');
      }

      if (this.DEBUG) {
        console.log('[SupabaseRPCService] getUmbralesPorNodo:', params);
      }

      const { data, error } = await supabaseAuth.rpc(
        'joysense.fn_get_umbrales_por_nodo',
        {
          p_nodoid: params.nodoid
        }
      );

      if (error) {
        throw new Error(`RPC error: ${error.message}`);
      }

      if (!Array.isArray(data)) {
        return [];
      }

      return data;
    } catch (err: any) {
      console.error('[SupabaseRPCService] Error en getUmbralesPorNodo:', err);
      throw err;
    }
  }

  /**
   * Obtiene KPIs consolidados para un nodo (combinación de estadísticas)
   * Reemplaza múltiples consultas por una sola
   * @param params Parámetros de la consulta
   * @returns Array de KPIs por métrica
   */
  static async getKPIsNodo(params: {
    nodoid: number;
    startDate?: string;
    endDate?: string;
  }): Promise<KPINodo[]> {
    try {
      if (!params.nodoid || params.nodoid <= 0) {
        throw new Error('nodoid inválido');
      }

      if (this.DEBUG) {
        console.log('[SupabaseRPCService] getKPIsNodo:', params);
      }

      const { data, error } = await supabaseAuth
        .schema('joysense')
        .rpc('fn_get_kpis_nodo', {
          p_nodoid: params.nodoid,
          p_start_date: params.startDate ? `${params.startDate} 00:00:00` : null,
          p_end_date: params.endDate ? `${params.endDate} 23:59:59` : null
        });

      if (error) {
        throw new Error(`RPC error: ${error.message}`);
      }

      if (!Array.isArray(data)) {
        return [];
      }

      return data;
    } catch (err: any) {
      console.error('[SupabaseRPCService] Error en getKPIsNodo:', err);
      throw err;
    }
  }

  /**
   * Obtiene métricas agregadas por localización (para MÉTRICA POR LOCALIZACIÓN)
   * Agrupa datos al nivel de lote/localización
   * @param params Parámetros de la consulta
   * @returns Array de métricas por localización
   */
  static async getMetricasPorLocalizacion(params: {
    fundoIds: number[];
    metricaId: number;
    startDate?: string;
    endDate?: string;
  }): Promise<MetricaPorLocalizacion[]> {
    try {
      if (
        !params.fundoIds ||
        params.fundoIds.length === 0 ||
        !params.metricaId
      ) {
        throw new Error('fundoIds y metricaId son requeridos');
      }

      if (this.DEBUG) {
        console.log('[SupabaseRPCService] getMetricasPorLocalizacion:', params);
      }

      const { data, error } = await supabaseAuth.rpc(
        'joysense.fn_get_metricas_por_localizacion',
        {
          p_fundoid: params.fundoIds,
          p_metricaid: params.metricaId,
          p_start_date: params.startDate ? `${params.startDate} 00:00:00` : null,
          p_end_date: params.endDate ? `${params.endDate} 23:59:59` : null
        }
      );

      if (error) {
        throw new Error(`RPC error: ${error.message}`);
      }

      if (!Array.isArray(data)) {
        return [];
      }

      return data;
    } catch (err: any) {
      console.error(
        '[SupabaseRPCService] Error en getMetricasPorLocalizacion:',
        err
      );
      throw err;
    }
  }

  /**
   * Obtiene umbrales con estadísticas históricas (para UMBRALES POR LOCALIZACIÓN)
   * Consolida datos de alertas y umbrales
   * @param params Parámetros de la consulta
   * @returns Array de umbrales con estadísticas
   */
  static async getUmbralesConEstadisticas(params: {
    fundoIds: number[];
    startDate?: string;
    endDate?: string;
  }): Promise<UmbralConEstadisticas[]> {
    try {
      if (!params.fundoIds || params.fundoIds.length === 0) {
        throw new Error('fundoIds es requerido');
      }

      if (this.DEBUG) {
        console.log('[SupabaseRPCService] getUmbralesConEstadisticas:', params);
      }

      const { data, error } = await supabaseAuth
        .schema('joysense')
        .rpc('fn_get_umbrales_con_estadisticas', {
          p_fundoid: params.fundoIds,
          p_start_date: params.startDate ? `${params.startDate} 00:00:00` : null,
          p_end_date: params.endDate ? `${params.endDate} 23:59:59` : null
        });

      if (error) {
        throw new Error(`RPC error: ${error.message}`);
      }

      if (!Array.isArray(data)) {
        return [];
      }

      return data;
    } catch (err: any) {
      console.error(
        '[SupabaseRPCService] Error en getUmbralesConEstadisticas:',
        err
      );
      throw err;
    }
  }

  /**
   * Obtiene nodos con alertas activas
   * Evita cargar todos los nodos y filtrar después
   * @returns Array de nodos que tienen alertas
   */
  static async getNodosConAlertas(): Promise<NodoConAlertas[]> {
    try {
      if (this.DEBUG) {
        console.log('[SupabaseRPCService] getNodosConAlertas');
      }

      const { data, error } = await supabaseAuth
        .schema('joysense')
        .rpc('fn_get_nodos_con_alertas', {});

      if (error) {
        // Si la función aún no existe, retornar array vacío
        if (error.message.includes('does not exist')) {
          console.warn('[SupabaseRPCService] fn_get_nodos_con_alertas no existe aún');
          return [];
        }
        throw new Error(`RPC error: ${error.message}`);
      }

      if (!Array.isArray(data)) {
        return [];
      }

      return data;
    } catch (err: any) {
      console.error('[SupabaseRPCService] Error en getNodosConAlertas:', err);
      throw err;
    }
  }

  /**
   * Obtiene resumen ligero de nodos para visualización del mapa
   * Reduce datos transferidos al mínimo para carga inicial rápida
   * Incluye última medición, conteo reciente, alertas y métricas disponibles
   * @param params Parámetros opcionales de filtro
   * @returns Array de resumen de nodos para el mapa
   */
  static async getResumenMapaNodos(params?: {
    ubicacionId?: number;
  }): Promise<ResumenMapaNodo[]> {
    try {
      if (this.DEBUG) {
        console.log('[SupabaseRPCService] getResumenMapaNodos:', params);
      }

      const { data, error } = await supabaseAuth
        .schema('joysense')
        .rpc('fn_get_resumen_mapa_nodos', {
          p_ubicacionid: params?.ubicacionId || null
        });

      if (error) {
        // Si la función aún no existe, retornar array vacío
        if (error.message.includes('does not exist')) {
          console.warn('[SupabaseRPCService] fn_get_resumen_mapa_nodos no existe aún');
          return [];
        }
        throw new Error(`RPC error: ${error.message}`);
      }

      if (!Array.isArray(data)) {
        return [];
      }

      return data;
    } catch (err: any) {
      console.error('[SupabaseRPCService] Error en getResumenMapaNodos:', err);
      throw err;
    }
  }
}

export default SupabaseRPCService;
