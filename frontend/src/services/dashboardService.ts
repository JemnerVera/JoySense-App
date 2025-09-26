// Servicio modular para el Dashboard
import { JoySenseService } from './backend-api';

export interface DashboardFilters {
  ubicacionId?: number;
  entidadId?: number;
  startDate?: string;
  endDate?: string;
  metricaId?: number;
  nodoIds?: number[];
  tipoIds?: number[];
}

export interface DashboardData {
  mediciones: any[];
  metricas: any[];
  nodos: any[];
  tipos: any[];
  entidades: any[];
}

export interface FilteredData {
  mediciones: any[];
  metricasDisponibles: any[];
  nodosDisponibles: any[];
  tiposDisponibles: any[];
}

export class DashboardService {
  // Cache para evitar llamadas innecesarias al backend
  private static cache = new Map<string, any>();
  private static cacheTimeout = 5 * 60 * 1000; // 5 minutos

  // Limpiar cache expirado
  private static cleanCache() {
    const now = Date.now();
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    });
  }

  // Obtener datos del cache o del backend
  private static async getCachedData(key: string, fetchFunction: () => Promise<any>) {
    this.cleanCache();
    
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await fetchFunction();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  // Obtener mediciones con filtros
  static async getMediciones(filters: DashboardFilters): Promise<any[]> {
    const cacheKey = `mediciones_${JSON.stringify(filters)}`;
    
    return this.getCachedData(cacheKey, async () => {
      const params: any = {
        getAll: true
      };

      if (filters.ubicacionId) params.ubicacionId = filters.ubicacionId;
      if (filters.entidadId) params.entidadId = filters.entidadId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const mediciones = await JoySenseService.getMediciones(params);
      
      if (!Array.isArray(mediciones)) {
        console.warn('⚠️ DashboardService: Mediciones no es un array:', mediciones);
        return [];
      }

      return mediciones;
    });
  }

  // Obtener métricas disponibles basándose en mediciones reales
  static async getMetricasDisponibles(mediciones: any[]): Promise<any[]> {
    if (mediciones.length === 0) {
      return await JoySenseService.getMetricas();
    }

    // Extraer métricas únicas de las mediciones
    const metricaIds = Array.from(new Set(mediciones.map(m => m.metricaid)));

    // Obtener todas las métricas y filtrar
    const todasMetricas = await JoySenseService.getMetricas();
    const metricasDisponibles = todasMetricas.filter(metrica => 
      metricaIds.includes(metrica.metricaid)
    );

    
    // Verificar métricas que no están en las mediciones
    const metricasNoDisponibles = todasMetricas.filter(metrica => 
      !metricaIds.includes(metrica.metricaid)
    );
    
    if (metricasNoDisponibles.length > 0) {
      console.log('⚠️ DashboardService: Métricas NO disponibles en mediciones:', 
        metricasNoDisponibles.map(m => m.metrica));
    }

    return metricasDisponibles;
  }

  // Obtener nodos disponibles basándose en mediciones reales
  static async getNodosDisponibles(mediciones: any[], ubicacionId?: number): Promise<any[]> {
    if (mediciones.length === 0) {
      return [];
    }

    // Extraer nodos únicos de las mediciones
    const nodoIds = Array.from(new Set(mediciones.map(m => m.nodoid)));

    // Crear objetos de nodos con información básica
    const nodosDisponibles = nodoIds.map(nodoid => ({
      nodoid: nodoid,
      nodo: `rs485-ls-${nodoid}`,
      deveui: `rs485-ls-${nodoid}`,
      statusid: 1,
      entidad: 'Arándano' // Esto debería venir de la relación con entidad
    }));

    return nodosDisponibles;
  }

  // Obtener tipos disponibles basándose en mediciones reales
  static async getTiposDisponibles(mediciones: any[]): Promise<any[]> {
    if (mediciones.length === 0) {
      return await JoySenseService.getTipos();
    }

    // Extraer tipos únicos de las mediciones
    const tipoIds = Array.from(new Set(mediciones.map(m => m.tipoid)));

    // Obtener todos los tipos y filtrar
    const todosTipos = await JoySenseService.getTipos();
    const tiposDisponibles = todosTipos.filter(tipo => 
      tipoIds.includes(tipo.tipoid)
    );

    return tiposDisponibles;
  }

  // Filtrar mediciones por múltiples criterios
  static filterMediciones(mediciones: any[], filters: DashboardFilters): any[] {
    let filtered = [...mediciones];

    // Filtrar por métrica
    if (filters.metricaId) {
      filtered = filtered.filter(m => m.metricaid === filters.metricaId);
    }

    // Filtrar por nodos
    if (filters.nodoIds && filters.nodoIds.length > 0) {
      filtered = filtered.filter(m => filters.nodoIds!.includes(m.nodoid));
    }

    // Filtrar por tipos
    if (filters.tipoIds && filters.tipoIds.length > 0) {
      filtered = filtered.filter(m => filters.tipoIds!.includes(m.tipoid));
    }

    return filtered;
  }

  // Obtener datos completos del dashboard
  static async getDashboardData(filters: DashboardFilters): Promise<DashboardData> {
    
    // Obtener mediciones base
    const mediciones = await this.getMediciones(filters);
    
    // Obtener datos relacionados basándose en las mediciones
    const [metricas, nodos, tipos, entidades] = await Promise.all([
      this.getMetricasDisponibles(mediciones),
      this.getNodosDisponibles(mediciones, filters.ubicacionId),
      this.getTiposDisponibles(mediciones),
      JoySenseService.getEntidades(filters.ubicacionId)
    ]);

    return {
      mediciones,
      metricas,
      nodos,
      tipos,
      entidades
    };
  }

  // Limpiar cache
  static clearCache() {
    this.cache.clear();
  }

  // Obtener estadísticas de datos
  static getDataStats(mediciones: any[]): {
    totalMediciones: number;
    metricasUnicas: number;
    nodosUnicos: number;
    tiposUnicos: number;
    rangoFechas: { inicio: string; fin: string } | null;
  } {
    if (mediciones.length === 0) {
      return {
        totalMediciones: 0,
        metricasUnicas: 0,
        nodosUnicos: 0,
        tiposUnicos: 0,
        rangoFechas: null
      };
    }

    const metricasUnicas = new Set(mediciones.map(m => m.metricaid)).size;
    const nodosUnicos = new Set(mediciones.map(m => m.nodoid)).size;
    const tiposUnicos = new Set(mediciones.map(m => m.tipoid)).size;

    const fechas = mediciones.map(m => new Date(m.fecha)).sort((a, b) => a.getTime() - b.getTime());
    const rangoFechas = fechas.length > 0 ? {
      inicio: fechas[0].toISOString().split('T')[0],
      fin: fechas[fechas.length - 1].toISOString().split('T')[0]
    } : null;

    return {
      totalMediciones: mediciones.length,
      metricasUnicas,
      nodosUnicos,
      tiposUnicos,
      rangoFechas
    };
  }
}
