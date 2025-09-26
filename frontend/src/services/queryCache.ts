// Sistema de caché para consultas de base de datos
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live en milisegundos
}

interface QueryCacheConfig {
  defaultTTL: number; // TTL por defecto en milisegundos
  maxSize: number; // Tamaño máximo del caché
}

class QueryCache {
  private cache = new Map<string, CacheEntry>();
  private config: QueryCacheConfig;

  constructor(config: QueryCacheConfig = { defaultTTL: 5 * 60 * 1000, maxSize: 100 }) {
    this.config = config;
  }

  /**
   * Generar clave de caché para una consulta
   */
  private generateKey(table: string, limit?: number, filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `${table}_${limit || 'all'}_${filterStr}`;
  }

  /**
   * Verificar si una entrada del caché es válida
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Limpiar entradas expiradas del caché
   */
  private cleanExpired(): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (!this.isValid(entry)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Limitar tamaño del caché
   */
  private limitSize(): void {
    if (this.cache.size > this.config.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, entries.length - this.config.maxSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Obtener datos del caché
   */
  get(table: string, limit?: number, filters?: any): any | null {
    this.cleanExpired();
    
    const key = this.generateKey(table, limit, filters);
    const entry = this.cache.get(key);
    
    if (entry && this.isValid(entry)) {
      console.log(`🎯 Cache HIT para ${table}`);
      return entry.data;
    }
    
    if (entry) {
      this.cache.delete(key);
    }
    
    console.log(`❌ Cache MISS para ${table}`);
    return null;
  }

  /**
   * Guardar datos en el caché
   */
  set(table: string, data: any, ttl?: number, limit?: number, filters?: any): void {
    this.cleanExpired();
    this.limitSize();
    
    const key = this.generateKey(table, limit, filters);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    };
    
    this.cache.set(key, entry);
    console.log(`💾 Cache SET para ${table} (TTL: ${entry.ttl}ms)`);
  }

  /**
   * Invalidar caché para una tabla específica
   */
  invalidate(table: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(`${table}_`)
    );
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ Cache INVALIDATED para ${table} (${keysToDelete.length} entradas)`);
  }

  /**
   * Limpiar todo el caché
   */
  clear(): void {
    this.cache.clear();
    console.log('🧹 Cache CLEARED');
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats(): { size: number; entries: string[] } {
    this.cleanExpired();
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Instancia global del caché
export const queryCache = new QueryCache({
  defaultTTL: 5 * 60 * 1000, // 5 minutos por defecto
  maxSize: 50 // Máximo 50 entradas
});

// TTL específicos para diferentes tipos de datos
export const CACHE_TTL = {
  REFERENCE_DATA: 10 * 60 * 1000, // 10 minutos para datos de referencia
  USER_DATA: 2 * 60 * 1000, // 2 minutos para datos de usuario
  DASHBOARD_DATA: 1 * 60 * 1000, // 1 minuto para datos de dashboard
  REAL_TIME_DATA: 30 * 1000, // 30 segundos para datos en tiempo real
} as const;

export default queryCache;
