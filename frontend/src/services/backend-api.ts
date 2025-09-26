import { 
  Pais, Empresa, Fundo, Ubicacion, Medicion, 
  MetricaSensor, Sensor, Tipo, Metrica, Entidad, Nodo 
} from '../types';

// Configuración del Backend API
const BACKEND_URL = (typeof window !== 'undefined' && (window as any).process?.env?.REACT_APP_BACKEND_URL) || 'http://localhost:3001/api';

// Cliente para llamadas al backend
export const backendAPI = {
  async get(endpoint: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      headers
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async post(endpoint: string, data: any, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      // Intentar obtener el cuerpo de la respuesta del error
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Si no se puede parsear como JSON, usar el texto de la respuesta
        try {
          const errorText = await response.text();
          errorData = { error: errorText };
        } catch (e2) {
          errorData = { error: `HTTP error! status: ${response.status}` };
        }
      }
      
      // Crear un error estructurado que incluya la información del servidor
      const error = new Error(`HTTP error! status: ${response.status}`) as any;
      error.response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }
    return response.json();
  },

  async put(endpoint: string, data: any, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      // Intentar obtener el cuerpo de la respuesta del error
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Si no se puede parsear como JSON, usar el texto de la respuesta
        try {
          const errorText = await response.text();
          errorData = { error: errorText };
        } catch (e2) {
          errorData = { error: `HTTP error! status: ${response.status}` };
        }
      }
      
      // Crear un error estructurado que incluya la información del servidor
      const error = new Error(`HTTP error! status: ${response.status}`) as any;
      error.response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }
    return response.json();
  },

  async delete(endpoint: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
};

// Variable global para el schema a usar
let currentSchema = 'public';
let schemaCache: string | null = null;
let schemaDetectionPromise: Promise<string> | null = null;

// Servicios para JoySense Dashboard usando Backend API
export class JoySenseService {
  
  // Detectar schema disponible (via Backend API)
  static async detectSchema(): Promise<string> {
    // Retornar schema en caché si ya fue detectado
    if (schemaCache) {
      return schemaCache;
    }

    // Si ya hay una detección en progreso, esperar a que termine
    if (schemaDetectionPromise) {
      return schemaDetectionPromise;
    }

    // Crear la promesa de detección
    schemaDetectionPromise = this.performSchemaDetection();
    
    try {
      const result = await schemaDetectionPromise;
      return result;
    } finally {
      schemaDetectionPromise = null;
    }
  }

  private static async performSchemaDetection(): Promise<string> {
    try {
      
      // Probar schema sense via Backend API
      const senseResult = await backendAPI.get('/sense/detect');


      if (senseResult.available) {
        currentSchema = 'sense';
        schemaCache = 'sense';
        return 'sense';
      }

      console.error('Sense error:', senseResult.error);
      
      currentSchema = 'public';
      schemaCache = 'public';
      return 'public'; // Fallback
    } catch (error) {
      console.error('❌ Error detecting schema:', error);
      currentSchema = 'public';
      schemaCache = 'public';
      return 'public'; // Fallback
    }
  }

  // Obtener el prefijo del schema actual
  static getSchemaPrefix(): string {
    return currentSchema === 'sense' ? 'sense.' : 'public.';
  }

  // Autenticación básica con sense.usuario
  static async authenticateUser(email: string, password: string): Promise<{ user: any | null; error: string | null }> {
    try {
      
      // Buscar usuario en sense.usuario
      const users = await this.getTableData('usuario');
      
      const user = users.find((u: any) => u.email === email);
      
      if (!user) {
        return { user: null, error: 'Usuario no encontrado' };
      }

      
      // Por el momento, aceptar cualquier contraseña
      
      return { 
        user: {
          id: user.usuarioid || user.id,
          email: user.email,
          user_metadata: {
            full_name: user.nombre || user.full_name || user.email,
            rol: user.rol || 'user',
            usuarioid: user.usuarioid || user.id
          }
        }, 
        error: null 
      };
    } catch (error) {
      console.error('❌ Error authenticating user:', error);
      return { user: null, error: 'Error de autenticación' };
    }
  }

  // Obtener países disponibles del schema sense
  static async getPaises(): Promise<Pais[]> {
    try {
      // Siempre detectar el schema primero
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        const data = await backendAPI.get('/sense/paises');
        return data || [];
      } else {
        // Fallback para schema public
        return [];
      }
    } catch (error) {
      console.error('Error in getPaises:', error);
      throw error;
    }
  }

  // Obtener empresas disponibles del schema sense
  static async getEmpresas(): Promise<Empresa[]> {
    try {
      // Siempre detectar el schema primero
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        const data = await backendAPI.get('/sense/empresas');
        return data || [];
      } else {
        // Fallback para schema public
        return [];
      }
    } catch (error) {
      console.error('Error in getEmpresas:', error);
      throw error;
    }
  }

  // Obtener empresas por país del schema sense
  static async getEmpresasByPais(paisId: number): Promise<Empresa[]> {
    try {
      // Siempre detectar el schema primero
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        const data = await backendAPI.get(`/sense/empresas?paisId=${paisId}`);
        return data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error in getEmpresasByPais:', error);
      throw error;
    }
  }

  // Obtener fundos del schema sense
  static async getFundos(): Promise<any[]> {
    try {
      // Siempre detectar el schema primero
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        const data = await backendAPI.get('/sense/fundos');
        return data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error in getFundos:', error);
      throw error;
    }
  }

  // Obtener fundos por empresa del schema sense
  static async getFundosByEmpresa(empresaId: number): Promise<Fundo[]> {
    try {
      // Siempre detectar el schema primero
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        const data = await backendAPI.get(`/sense/fundos?empresaId=${empresaId}`);
        return data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error in getFundosByEmpresa:', error);
      throw error;
    }
  }

  // Obtener ubicaciones del schema sense
  static async getUbicaciones(): Promise<Ubicacion[]> {
    try {
      // Siempre detectar el schema primero
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        const data = await backendAPI.get('/sense/ubicaciones');
        return data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error in getUbicaciones:', error);
      throw error;
    }
  }

  // Obtener ubicaciones por fundo del schema sense
  static async getUbicacionesByFundo(fundoId: number): Promise<Ubicacion[]> {
    try {
      // Siempre detectar el schema primero
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        const data = await backendAPI.get(`/sense/ubicaciones?fundoId=${fundoId}`);
        return data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error in getUbicacionesByFundo:', error);
      throw error;
    }
  }

  // Obtener datos de mediciones con filtros y nombres
  static async getMediciones(filters: {
    paisId?: number;
    empresaId?: number;
    fundoId?: number;
    ubicacionId?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
    entidadId?: number;
    getAll?: boolean;
    countOnly?: boolean;
  }): Promise<any[] | { count: number }> {
    try {
      // Siempre detectar el schema primero
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        // Construir query string para el backend
        const params = new URLSearchParams();
        if (filters.ubicacionId) params.append('ubicacionId', filters.ubicacionId.toString());
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.entidadId) params.append('entidadId', filters.entidadId.toString());
        
        // Si solo necesitamos el conteo
        if (filters.countOnly) {
          params.append('countOnly', 'true');
        }
        
        // Si getAll es true o limit es muy alto, usar paginación
        if (filters.getAll || (filters.limit && filters.limit >= 1000000)) {
          params.append('getAll', 'true');
        }

        // Si hay filtro de entidad, usar el endpoint específico
        let endpoint;
        if (filters.entidadId) {
          endpoint = `/sense/mediciones-con-entidad?${params.toString()}`;
        } else {
          endpoint = `/sense/mediciones?${params.toString()}`;
        }
        
        const data = await backendAPI.get(endpoint);
        return data || (filters.countOnly ? { count: 0 } : []);
      } else {
        return filters.countOnly ? { count: 0 } : [];
      }
    } catch (error) {
      console.error('Error in getMediciones:', error);
      throw error;
    }
  }

  // Obtener estadísticas del dashboard
  static async getDashboardStats(): Promise<{
    totalMediciones: number;
    promedioMedicion: number;
    ultimaMedicion: string;
    sensoresActivos: number;
  }> {
    try {
      // Siempre detectar el schema primero
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        // Obtener datos básicos - sin límite para estadísticas reales
        const mediciones = await this.getMediciones({ getAll: true });
        
        // Verificar que mediciones sea un array
        if (!Array.isArray(mediciones)) {
          return {
            totalMediciones: 0,
            promedioMedicion: 0,
            ultimaMedicion: 'N/A',
            sensoresActivos: 0
          };
        }
        
        const totalMediciones = mediciones.length;
        const promedioMedicion = mediciones.length > 0 
          ? mediciones.reduce((sum: number, item: any) => sum + (item.medicion || 0), 0) / mediciones.length 
          : 0;
        const ultimaMedicion = mediciones.length > 0 ? mediciones[0].fecha : 'N/A';
        
        // Contar sensores activos (últimas 24 horas)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const sensoresActivos = mediciones.filter((item: any) => 
          new Date(item.fecha) >= yesterday
        ).length;

        return {
          totalMediciones,
          promedioMedicion,
          ultimaMedicion,
          sensoresActivos
        };
      } else {
        return {
          totalMediciones: 0,
          promedioMedicion: 0,
          ultimaMedicion: 'N/A',
          sensoresActivos: 0
        };
      }
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      throw error;
    }
  }

  // Probar conexión
  static async testConnection(): Promise<boolean> {
    try {
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        const data = await backendAPI.get('/sense/detect');
        return data.available;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }

  // Obtener resumen de datos disponibles
  static async getDataSummary(): Promise<{
    medicion: number;
    pais: number;
    empresa: number;
    fundo: number;
    ubicacion: number;
    metrica: number;
    nodo: number;
    tipo: number;
  }> {
    try {
      // Siempre detectar el schema primero
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        // Obtener datos básicos para contar
        const [paises, empresas, fundos, ubicaciones, metricas, nodos, tipos, mediciones] = await Promise.all([
          this.getPaises(),
          this.getEmpresas(),
          this.getFundos(),
          this.getUbicaciones(),
          backendAPI.get('/sense/metricas'),
          backendAPI.get('/sense/nodos'),
          backendAPI.get('/sense/tipos'),
          this.getMediciones({ limit: 1 })
        ]);

        // Verificar que mediciones sea un array
        const medicionesCount = Array.isArray(mediciones) ? mediciones.length : 0;

        return {
          medicion: medicionesCount,
          pais: paises.length,
          empresa: empresas.length,
          fundo: fundos.length,
          ubicacion: ubicaciones.length,
          metrica: metricas.length,
          nodo: nodos.length,
          tipo: tipos.length
        };
      } else {
        return {
          medicion: 0,
          pais: 0,
          empresa: 0,
          fundo: 0,
          ubicacion: 0,
          metrica: 0,
          nodo: 0,
          tipo: 0
        };
      }
    } catch (error) {
      console.error('Error in getDataSummary:', error);
      throw error;
    }
  }

  // Obtener datos para gráficos con nombres
  static async getChartData(filters: {
    paisId?: number;
    empresaId?: number;
    fundoId?: number;
    ubicacionId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Array<{ name: string; value: number; timestamp: string; metrica: string; unidad: string }>> {
    try {
      const data = await this.getMediciones({
        ...filters,
        limit: 1000, // Obtener más datos para gráficos
      });

      // Verificar que data sea un array
      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((item: any) => ({
        name: new Date(item.fecha).toLocaleString(),
        value: item.medicion,
        timestamp: item.fecha,
        metrica: item.metrica || 'N/A',
        unidad: item.unidad || 'N/A',
      }));
    } catch (error) {
      console.error('Error in getChartData:', error);
      throw error;
    }
  }

  // Listar todos los schemas disponibles
  static async listSchemas(): Promise<string[]> {
    try {
      
      const availableSchemas: string[] = [];
      
      // Probar schema sense via Backend API
      try {
        const senseResult = await backendAPI.get('/sense/detect');
        
        if (senseResult.available) {
          availableSchemas.push('sense');
        } else {
        }
      } catch (error) {
      }
      
      // Siempre incluir public como fallback
      availableSchemas.push('public');
      
      return availableSchemas;
    } catch (error) {
      console.error('❌ Error listando schemas:', error);
      return ['public']; // Fallback
    }
  }

  // Listar tablas disponibles en un schema
  static async listTables(schema: string): Promise<string[]> {
    try {
      
      if (schema === 'public') {
        return ['sensor_value', 'fundo', 'device', 'tipo_sensor', 'unidad'];
      } else if (schema === 'sense') {
        return ['medicion', 'pais', 'empresa', 'fundo', 'ubicacion', 'localizacion', 'metrica', 'nodo', 'tipo', 'entidad'];
      }
      
      return [];
    } catch (error) {
      console.error(`❌ Error listando tablas en schema "${schema}":`, error);
      return [];
    }
  }

  // Obtener métricas
  static async getMetricas(): Promise<any[]> {
    try {
      // Siempre detectar el schema primero
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        const data = await backendAPI.get('/sense/metricas');
        return data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error in getMetricas:', error);
      throw error;
    }
  }

  // Obtener nodos
  static async getNodos(): Promise<any[]> {
    try {
      // Siempre detectar el schema primero
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        const data = await backendAPI.get('/sense/nodos');
        return data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error in getNodos:', error);
      throw error;
    }
  }

  // Obtener tipos
  static async getTipos(): Promise<any[]> {
    try {
      // Siempre detectar el schema primero
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        const data = await backendAPI.get('/sense/tipos');
        return data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error in getTipos:', error);
      throw error;
    }
  }

  // Obtener entidades
  static async getEntidades(ubicacionId?: number): Promise<any[]> {
    try {
      // Siempre detectar el schema primero
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        let endpoint = '/sense/entidades';
        if (ubicacionId) {
          endpoint += `?ubicacionId=${ubicacionId}`;
        }
        const data = await backendAPI.get(endpoint);
        return data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error in getEntidades:', error);
      throw error;
    }
  }

  // Obtener localizaciones
  static async getLocalizaciones(): Promise<any[]> {
    try {
      // Siempre detectar el schema primero
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        const data = await backendAPI.get('/sense/localizaciones');
        return data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error in getLocalizaciones:', error);
      throw error;
    }
  }

  // Obtener información de las tablas disponibles
  static async getTableInfo(): Promise<{
    medicionCount: number;
    paisCount: number;
    empresaCount: number;
    fundoCount: number;
    ubicacionCount: number;
    metricaCount: number;
    nodoCount: number;
    tipoCount: number;
  }> {
    try {
      // Siempre detectar el schema primero
      const detectedSchema = await this.detectSchema();
      
      if (detectedSchema === 'sense') {
        // Obtener datos básicos para contar
        const [paises, empresas, fundos, ubicaciones, metricas, nodos, tipos, mediciones] = await Promise.all([
          this.getPaises(),
          this.getEmpresas(),
          this.getFundos(),
          this.getUbicaciones(),
          backendAPI.get('/sense/metricas'),
          backendAPI.get('/sense/nodos'),
          backendAPI.get('/sense/tipos'),
          this.getMediciones({ limit: 1 })
        ]);

        // Verificar que mediciones sea un array
        const medicionesCount = Array.isArray(mediciones) ? mediciones.length : 0;

        return {
          medicionCount: medicionesCount,
          paisCount: paises.length,
          empresaCount: empresas.length,
          fundoCount: fundos.length,
          ubicacionCount: ubicaciones.length,
          metricaCount: metricas.length,
          nodoCount: nodos.length,
          tipoCount: tipos.length
        };
      } else {
        // Schema public - valores por defecto
        return {
          medicionCount: 0,
          paisCount: 0,
          empresaCount: 0,
          fundoCount: 0,
          ubicacionCount: 0,
          metricaCount: 0,
          nodoCount: 0,
          tipoCount: 0
        };
      }
    } catch (error) {
      console.error('❌ Error in getTableInfo:', error);
      throw error;
    }
  }

  // Métodos para operaciones CRUD genéricas
  static async getTableData(tableName: string, limit: number = 100): Promise<any[]> {
    try {
      const schemaPrefix = this.getSchemaPrefix();
      const endpoint = `/sense/${tableName}?limit=${limit}`;
      const data = await backendAPI.get(endpoint);
      return Array.isArray(data) ? data : (data?.data || []);
    } catch (error) {
      console.error(`Error in getTableData for ${tableName}:`, error);
      throw error;
    }
  }


  static async getTableColumns(tableName: string): Promise<any[]> {
    try {
      const schemaPrefix = this.getSchemaPrefix();
      const endpoint = `/sense/${tableName}/columns`;
      const data = await backendAPI.get(endpoint);
      const rawColumns = Array.isArray(data) ? data : (data?.columns || []);
      
      // Mapear las columnas del backend al formato esperado por el frontend
      return rawColumns.map((col: any) => ({
        columnName: col.column_name,
        dataType: col.data_type,
        isNullable: col.is_nullable === 'YES',
        defaultValue: col.column_default,
        isIdentity: col.column_default?.includes('nextval') || false,
        isPrimaryKey: false // Se determinará por separado
      }));
    } catch (error) {
      console.error(`Error in getTableColumns for ${tableName}:`, error);
      throw error;
    }
  }

  static async getTableInfoByName(tableName: string): Promise<any> {
    try {
      const schemaPrefix = this.getSchemaPrefix();
      const endpoint = `/sense/${tableName}/info`;
      const data = await backendAPI.get(endpoint);
      return data || {};
    } catch (error) {
      console.error(`Error in getTableInfoByName for ${tableName}:`, error);
      throw error;
    }
  }

  static async getTableConstraints(tableName: string): Promise<any[]> {
    try {
      const schemaPrefix = this.getSchemaPrefix();
      const endpoint = `/sense/${tableName}/constraints`;
      const data = await backendAPI.get(endpoint);
      return Array.isArray(data) ? data : (data?.constraints || []);
    } catch (error) {
      console.error(`Error in getTableConstraints for ${tableName}:`, error);
      throw error;
    }
  }

  static async insertTableRow(tableName: string, data: Record<string, any>): Promise<any> {
    try {
      const schemaPrefix = this.getSchemaPrefix();
      const endpoint = `/sense/${tableName}`;
      const result = await backendAPI.post(endpoint, data);
      return result;
    } catch (error) {
      console.error(`Error in insertTableRow for ${tableName}:`, error);
      throw error;
    }
  }

  static async updateTableRow(tableName: string, id: string, data: Record<string, any>): Promise<any> {
    try {
      const schemaPrefix = this.getSchemaPrefix();
      const endpoint = `/sense/${tableName}/${id}`;
      const result = await backendAPI.put(endpoint, data);
      return result;
    } catch (error) {
      console.error(`Error in updateTableRow for ${tableName}:`, error);
      throw error;
    }
  }

  static async updateTableRowByCompositeKey(tableName: string, compositeKey: Record<string, any>, data: Record<string, any>): Promise<any> {
    try {
      const schemaPrefix = this.getSchemaPrefix();
      const keyParams = new URLSearchParams(compositeKey).toString();
      const endpoint = `/sense/${tableName}/composite?${keyParams}`;
      const result = await backendAPI.put(endpoint, data);
      return result;
    } catch (error) {
      console.error(`Error in updateTableRowByCompositeKey for ${tableName}:`, error);
      throw error;
    }
  }

  static async deleteTableRow(tableName: string, id: string): Promise<any> {
    try {
      const schemaPrefix = this.getSchemaPrefix();
      const endpoint = `/sense/${tableName}/${id}`;
      const result = await backendAPI.delete(endpoint);
      return result;
    } catch (error) {
      console.error(`Error in deleteTableRow for ${tableName}:`, error);
      throw error;
    }
  }

  // Obtener nodos con localizaciones completas (para mapa)
  static async getNodosConLocalizacion(limit: number = 1000): Promise<any[]> {
    try {
      const detectedSchema = await this.detectSchema();
      if (detectedSchema === 'sense') {
        const data = await backendAPI.get(`/sense/nodos-con-localizacion?limit=${limit}`);
        return data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error in getNodosConLocalizacion:', error);
      throw error;
    }
  }
}
