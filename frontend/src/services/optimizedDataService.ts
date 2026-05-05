import { JoySenseService } from './backend-api';
import { queryCache, CACHE_TTL } from './queryCache';

// Tipos para datos de referencia
export interface ReferenceData {
  paises: any[];
  empresas: any[];
  fundos: any[];
  ubicaciones: any[];
  localizaciones: any[];
  entidades: any[];
  nodos: any[];
  tipos: any[];
  metricas: any[];
  criticidades: any[];
  perfiles: any[];
  umbrales: any[];
  medios: any[];
  usuarios: any[];
  sensores: any[];
  metricasensor: any[];
  perfilumbral: any[];
  contactos: any[];
}

// Configuración de carga optimizada
interface LoadConfig {
  useCache: boolean;
  batchSize: number;
  priority: 'high' | 'medium' | 'low';
}

class OptimizedDataService {
  private loadingPromises = new Map<string, Promise<any>>();
  private loadingStates = new Map<string, boolean>();

  /**
   * Cargar datos de una tabla con caché
   */
  async loadTableData(
    table: string, 
    limit: number = 500, 
    useCache: boolean = true,
    ttl?: number
  ): Promise<any[]> {
    const cacheKey = `${table}_${limit}`;
    
    // Verificar si ya está cargando
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    // Verificar caché
    if (useCache) {
      const cachedData = queryCache.get(table, limit);
      if (cachedData) {
        return cachedData;
      }
    }

    // Marcar como cargando
    this.loadingStates.set(cacheKey, true);
    
    // Crear promesa de carga
    const loadPromise = this.performLoad(table, limit, ttl);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const data = await loadPromise;
      return data;
    } finally {
      // Limpiar estado de carga
      this.loadingPromises.delete(cacheKey);
      this.loadingStates.delete(cacheKey);
    }
  }

  /**
   * Realizar la carga real de datos
   */
  private async performLoad(table: string, limit: number, ttl?: number): Promise<any[]> {
    try {
      const startTime = performance.now();
      
      const response = await JoySenseService.getTableData(table, limit);
      const data = Array.isArray(response) ? response : ((response as any)?.data || []);
      
      // Guardar en caché
      queryCache.set(table, data, ttl, limit);
      
      return data;
    } catch (error) {
      console.error(`Error cargando ${table}:`, error);
      throw error;
    }
  }

  /**
   * Cargar datos de referencia de forma optimizada
   */
  async loadReferenceData(): Promise<ReferenceData> {
    const startTime = performance.now();
 
    // Cargar datos críticos primero (alta prioridad)
    const criticalData = await this.loadCriticalData();
    
    // Cargar datos secundarios en paralelo (prioridad media)
    const secondaryData = await this.loadSecondaryData();
    
    // Cargar datos opcionales en paralelo (prioridad baja)
    const optionalData = await this.loadOptionalData();

    return {
      paises: criticalData.paises || [],
      empresas: criticalData.empresas || [],
      fundos: criticalData.fundos || [],
      ubicaciones: criticalData.ubicaciones || [],
      localizaciones: optionalData.localizaciones || [],
      entidades: secondaryData.entidades || [],
      nodos: secondaryData.nodos || [],
      tipos: secondaryData.tipos || [],
      metricas: secondaryData.metricas || [],
      criticidades: secondaryData.criticidades || [],
      perfiles: optionalData.perfiles || [],
      umbrales: optionalData.umbrales || [],
      medios: optionalData.medios || [],
      usuarios: optionalData.usuarios || [],
      sensores: optionalData.sensores || [],
      metricasensor: optionalData.metricasensor || [],
      perfilumbral: optionalData.perfilumbral || [],
      contactos: optionalData.contactos || []
    };
  }

  /**
   * Cargar datos críticos (necesarios para la UI)
   */
  private async loadCriticalData(): Promise<Partial<ReferenceData>> {
    const [paises, empresas, fundos, ubicaciones] = await Promise.all([
      this.loadTableData('pais', 500, true, CACHE_TTL.REFERENCE_DATA),
      this.loadTableData('empresa', 500, true, CACHE_TTL.REFERENCE_DATA),
      this.loadTableData('fundo', 500, true, CACHE_TTL.REFERENCE_DATA),
      this.loadTableData('ubicacion', 500, true, CACHE_TTL.REFERENCE_DATA)
    ]);

    return { paises, empresas, fundos, ubicaciones };
  }

  /**
   * Cargar datos secundarios
   */
  private async loadSecondaryData(): Promise<Partial<ReferenceData>> {
    const [entidades, nodos, tipos, metricas, criticidades] = await Promise.all([
      this.loadTableData('entidad', 500, true, CACHE_TTL.REFERENCE_DATA),
      this.loadTableData('nodo', 500, true, CACHE_TTL.REFERENCE_DATA),
      this.loadTableData('tipo', 500, true, CACHE_TTL.REFERENCE_DATA),
      this.loadTableData('metrica', 500, true, CACHE_TTL.REFERENCE_DATA),
      this.loadTableData('criticidad', 500, true, CACHE_TTL.REFERENCE_DATA)
    ]);

    return { entidades, nodos, tipos, metricas, criticidades };
  }

  /**
   * Cargar datos opcionales
   */
  private async loadOptionalData(): Promise<Partial<ReferenceData>> {
    const [perfiles, umbrales, medios, usuarios, sensores, metricasensor, perfilumbral, contactos, localizaciones] = await Promise.all([
      this.loadTableData('perfil', 500, true, CACHE_TTL.REFERENCE_DATA),
      this.loadTableData('umbral', 500, true, CACHE_TTL.REFERENCE_DATA),
      this.loadTableData('medio', 500, true, CACHE_TTL.REFERENCE_DATA),
      this.loadTableData('usuario', 500, true, CACHE_TTL.USER_DATA),
      this.loadTableData('sensor', 500, true, CACHE_TTL.REFERENCE_DATA),
      this.loadTableData('metricasensor', 500, true, CACHE_TTL.REFERENCE_DATA),
      this.loadTableData('perfilumbral', 500, true, CACHE_TTL.REFERENCE_DATA),
      this.loadTableData('contacto', 500, true, CACHE_TTL.REFERENCE_DATA),
      this.loadTableData('localizacion', 500, true, CACHE_TTL.REFERENCE_DATA)
    ]);

    return { perfiles, umbrales, medios, usuarios, sensores, metricasensor, perfilumbral, contactos, localizaciones };
  }

  /**
   * Cargar datos para dashboard de forma optimizada
   */
  async loadDashboardData(): Promise<{
    alertas: any[];
    umbrales: any[];
    mediciones: any[];
    nodos: any[];
    metricas: any[];
    tipos: any[];
    ubicaciones: any[];
    criticidades: any[];
  }> {
    const startTime = performance.now();
 
    const [alertas, umbrales, mediciones, nodos, metricas, tipos, ubicaciones, criticidades] = await Promise.all([
      this.loadTableData('alerta', 1000, true, CACHE_TTL.DASHBOARD_DATA),
      this.loadTableData('umbral', 1000, true, CACHE_TTL.DASHBOARD_DATA),
      this.loadTableData('medicion', 1000, true, CACHE_TTL.DASHBOARD_DATA),
      this.loadTableData('nodo', 1000, true, CACHE_TTL.DASHBOARD_DATA),
      this.loadTableData('metrica', 1000, true, CACHE_TTL.DASHBOARD_DATA),
      this.loadTableData('tipo', 1000, true, CACHE_TTL.DASHBOARD_DATA),
      this.loadTableData('ubicacion', 1000, true, CACHE_TTL.DASHBOARD_DATA),
      this.loadTableData('criticidad', 1000, true, CACHE_TTL.DASHBOARD_DATA)
    ]);
 
    return { alertas, umbrales, mediciones, nodos, metricas, tipos, ubicaciones, criticidades };
  }

  /**
   * Cargar datos para mensajes de forma optimizada
   */
  async loadMessagesData(): Promise<{
    mensajes: any[];
    contactos: any[];
    medios: any[];
    usuarios: any[];
    alertas: any[];
    umbrales: any[];
    criticidades: any[];
    mediciones: any[];
  }> {
    const startTime = performance.now();
 
    const [mensajes, contactos, medios, usuarios, alertas, umbrales, criticidades, mediciones] = await Promise.all([
      this.loadTableData('mensaje', 1000, true, CACHE_TTL.DASHBOARD_DATA),
      this.loadTableData('contacto', 1000, true, CACHE_TTL.DASHBOARD_DATA),
      this.loadTableData('medio', 1000, true, CACHE_TTL.DASHBOARD_DATA),
      this.loadTableData('usuario', 1000, true, CACHE_TTL.USER_DATA),
      this.loadTableData('alerta', 1000, true, CACHE_TTL.DASHBOARD_DATA),
      this.loadTableData('umbral', 1000, true, CACHE_TTL.DASHBOARD_DATA),
      this.loadTableData('criticidad', 1000, true, CACHE_TTL.DASHBOARD_DATA),
      this.loadTableData('medicion', 1000, true, CACHE_TTL.DASHBOARD_DATA)
    ]);
 
    return { mensajes, contactos, medios, usuarios, alertas, umbrales, criticidades, mediciones };
  }

  /**
   * Verificar si una tabla está siendo cargada
   */
  isLoading(table: string, limit?: number): boolean {
    const cacheKey = `${table}_${limit || 'all'}`;
    return this.loadingStates.get(cacheKey) || false;
  }

  /**
   * Invalidar caché para una tabla específica
   */
  invalidateTable(table: string): void {
    queryCache.invalidate(table);
  }

  /**
   * Limpiar todo el caché
   */
  clearCache(): void {
    queryCache.clear();
  }

  /**
   * Obtener estadísticas del caché
   */
  getCacheStats(): { size: number; entries: string[] } {
    return queryCache.getStats();
  }
}

// Instancia global del servicio optimizado
export const optimizedDataService = new OptimizedDataService();

export default optimizedDataService;
