import { 
  Pais, Empresa, Fundo, Ubicacion, Localizacion, Medicion, Metrica,
  Nodo, Sensor, Tipo, Umbral, Alerta, AlertaConsolidado, Usuario,
  Contacto, Correo, Criticidad, CodigoTelefono, TableName, PaginatedResponse
} from '../types';

// Declaración para TypeScript
declare const process: any;

// ============================================================================
// BACKEND API SERVICE - JOYSENSE
// ============================================================================
// Configuración mediante variables de entorno (12-Factor App)
// Este archivo NO contiene URLs hardcodeadas → Se puede commitear de forma segura
// ============================================================================

const API_PREFIX = '/api/joysense';

/**
 * Obtiene y valida la URL del backend
 * Usa fallback a localhost solo en desarrollo
 */
function getBackendUrl(): string {
  let url = process.env.REACT_APP_BACKEND_URL;
  
  // En desarrollo, permitir fallback a localhost
  if (process.env.NODE_ENV === 'development' && !url) {
    console.warn('⚠️ REACT_APP_BACKEND_URL no configurada, usando localhost por defecto');
    return `http://localhost:3001${API_PREFIX}`;
  }
  
  // En producción, requerir configuración explícita
  if (process.env.NODE_ENV === 'production' && !url) {
    console.error('❌ ERROR: REACT_APP_BACKEND_URL no configurada en producción');
    throw new Error('REACT_APP_BACKEND_URL is required in production');
  }
  
  // Limpiar URL: remover /api si ya está incluido para evitar duplicación
  if (url) {
    url = url.replace(/\/api\/?$/, '');
  }
  
  return url ? `${url}${API_PREFIX}` : `http://localhost:3001${API_PREFIX}`;
}

const BACKEND_URL = getBackendUrl();

// ============================================================================
// HTTP CLIENT
// ============================================================================

export const backendAPI = {
  async get(endpoint: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = `${BACKEND_URL}${endpoint}`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  async post(endpoint: string, data: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        try {
          const errorText = await response.text();
          errorData = { error: errorText };
        } catch {
          errorData = { error: `HTTP error! status: ${response.status}` };
        }
      }
      const error = new Error(`HTTP error! status: ${response.status}`) as any;
      error.response = { status: response.status, data: errorData };
      throw error;
    }
    return response.json();
  },

  async put(endpoint: string, data: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        try {
          const errorText = await response.text();
          errorData = { error: errorText };
        } catch {
          errorData = { error: `HTTP error! status: ${response.status}` };
        }
      }
      const error = new Error(`HTTP error! status: ${response.status}`) as any;
      error.response = { status: response.status, data: errorData };
      throw error;
    }
    return response.json();
  },

  async delete(endpoint: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }
};

// ============================================================================
// FUNCIONES AUXILIARES PARA SINCRONIZACIÓN DE USUARIOS
// ============================================================================

/**
 * Verificar estado de sincronización de un usuario
 * @param usuarioid ID del usuario a verificar
 * @returns Estado de sincronización
 */
export async function checkUserSyncStatus(usuarioid: number): Promise<{
  synced: boolean;
  useruuid: string | null;
  message: string;
  error?: string;
}> {
  try {
    const response = await backendAPI.get(`/usuario/${usuarioid}/sync-status`);
    return response;
  } catch (error: any) {
    return {
      synced: false,
      useruuid: null,
      message: 'Error al verificar sincronización',
      error: error.message
    };
  }
}

// ============================================================================
// JOYSENSE SERVICE
// ============================================================================

export class JoySenseService {
  
  // --------------------------------------------------------------------------
  // HEALTH / STATUS
  // --------------------------------------------------------------------------
  
  static async testConnection(): Promise<boolean> {
    try {
      const data = await backendAPI.get('/health');
      return data.status === 'ok';
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // GEOGRAFÍA
  // --------------------------------------------------------------------------

  static async getPaises(): Promise<Pais[]> {
    try {
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      const data = await backendAPI.get('/geografia/pais', token || undefined);
      return data || [];
    } catch (error) {
      console.error('Error in getPaises:', error);
      throw error;
    }
  }

  static async getEmpresas(): Promise<Empresa[]> {
    try {
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      const data = await backendAPI.get('/geografia/empresa', token || undefined);
      return data || [];
    } catch (error) {
      console.error('Error in getEmpresas:', error);
      throw error;
    }
  }

  static async getEmpresasByPais(paisId: number): Promise<Empresa[]> {
    try {
      const data = await backendAPI.get(`/geografia/empresa?paisid=${paisId}`);
      return data || [];
    } catch (error) {
      console.error('Error in getEmpresasByPais:', error);
      throw error;
    }
  }

  static async getFundos(): Promise<Fundo[]> {
    try {
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      const data = await backendAPI.get('/geografia/fundo', token || undefined);
      return data || [];
    } catch (error) {
      console.error('Error in getFundos:', error);
      throw error;
    }
  }

  static async getFundosByEmpresa(empresaId: number): Promise<Fundo[]> {
    try {
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      const data = await backendAPI.get(`/geografia/fundo?empresaid=${empresaId}`, token || undefined);
      return data || [];
    } catch (error) {
      console.error('Error in getFundosByEmpresa:', error);
      throw error;
    }
  }

  static async getUbicaciones(): Promise<Ubicacion[]> {
    try {
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      const data = await backendAPI.get('/geografia/ubicacion', token || undefined);
      return data || [];
    } catch (error) {
      console.error('Error in getUbicaciones:', error);
      throw error;
    }
  }

  static async getUbicacionesByFundo(fundoId: number): Promise<Ubicacion[]> {
    try {
      const data = await backendAPI.get(`/geografia/ubicacion?fundoid=${fundoId}`);
      return data || [];
    } catch (error) {
      console.error('Error in getUbicacionesByFundo:', error);
      throw error;
    }
  }

  static async getEntidades(ubicacionId?: number): Promise<any[]> {
    try {
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      let endpoint = '/geografia/entidad';
      if (ubicacionId) endpoint += `?ubicacionid=${ubicacionId}`;
      const data = await backendAPI.get(endpoint, token || undefined);
      return data || [];
    } catch (error) {
      console.error('Error in getEntidades:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // DISPOSITIVOS
  // --------------------------------------------------------------------------

  static async getTipos(): Promise<Tipo[]> {
    try {
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      const data = await backendAPI.get('/dispositivos/tipo', token || undefined);
      return data || [];
    } catch (error) {
      console.error('Error in getTipos:', error);
      throw error;
    }
  }

  static async getMetricas(): Promise<Metrica[]> {
    try {
      const data = await backendAPI.get('/dispositivos/metrica');
      return data || [];
    } catch (error) {
      console.error('Error in getMetricas:', error);
      throw error;
    }
  }

  static async getNodos(): Promise<Nodo[]> {
    try {
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      const data = await backendAPI.get('/dispositivos/nodo', token || undefined);
      return data || [];
    } catch (error) {
      console.error('Error in getNodos:', error);
      throw error;
    }
  }

  static async getSensores(): Promise<Sensor[]> {
    try {
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      const data = await backendAPI.get('/dispositivos/sensor', token || undefined);
      return data || [];
    } catch (error) {
      console.error('Error in getSensores:', error);
      throw error;
    }
  }

  static async getLocalizaciones(): Promise<Localizacion[]> {
    try {
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      const data = await backendAPI.get('/dispositivos/localizacion', token || undefined);
      return data || [];
    } catch (error) {
      console.error('Error in getLocalizaciones:', error);
      throw error;
    }
  }

  static async getLocalizacionesByUbicacion(ubicacionId: number): Promise<Localizacion[]> {
    try {
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      // Localizacion se relaciona con nodo, que tiene ubicacionid
      const data = await backendAPI.get(`/dispositivos/localizacion?ubicacionid=${ubicacionId}`, token || undefined);
      return data || [];
    } catch (error) {
      console.error('Error in getLocalizacionesByUbicacion:', error);
      throw error;
    }
  }

  static async getNodosConLocalizacion(limit: number = 1000): Promise<any[]> {
    try {
      const data = await backendAPI.get(`/dispositivos/nodo?withLocalizacion=true&limit=${limit}`);
      return data || [];
    } catch (error) {
      console.error('Error in getNodosConLocalizacion:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // MEDICIONES
  // --------------------------------------------------------------------------

  static async getMediciones(filters: {
    paisId?: number;
    empresaId?: number;
    fundoId?: number;
    ubicacionId?: number;
    localizacionId?: number;
    metricaId?: number;
    nodoid?: number;
    entidadId?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
    getAll?: boolean;
    countOnly?: boolean;
  }): Promise<Medicion[] | { count: number }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.localizacionId) params.append('localizacionid', filters.localizacionId.toString());
      if (filters.ubicacionId) params.append('ubicacionid', filters.ubicacionId.toString());
      if (filters.nodoid) params.append('nodoid', filters.nodoid.toString());
      if (filters.metricaId) params.append('metricaId', filters.metricaId.toString());
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.countOnly) params.append('countOnly', 'true');
      if (filters.getAll) params.append('getAll', 'true');

      // Si hay entidadId, usar endpoint especial
      let endpoint: string;
      if (filters.entidadId && !filters.nodoid) {
        params.append('entidadId', filters.entidadId.toString());
        endpoint = `/mediciones/mediciones-con-entidad?${params.toString()}`;
      } else {
        endpoint = `/mediciones/mediciones?${params.toString()}`;
      }
      
      const data = await backendAPI.get(endpoint);

      if (filters.countOnly) return data || { count: 0 };
      
      if (!Array.isArray(data)) {
        console.warn('⚠️ [getMediciones] Backend devolvió datos que no son un array:', typeof data, data);
        return Array.isArray(data?.data) ? data.data : (data ? [data] : []);
      }
      
      return data;
    } catch (error) {
      console.error('Error in getMediciones:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // ALERTAS
  // --------------------------------------------------------------------------

  static async getCriticidades(): Promise<Criticidad[]> {
    try {
      const data = await backendAPI.get('/alertas/criticidad');
      return data || [];
    } catch (error) {
      console.error('Error in getCriticidades:', error);
      throw error;
    }
  }

  static async getUmbrales(localizacionId?: number): Promise<Umbral[]> {
    try {
      let endpoint = '/alertas/umbral';
      if (localizacionId) endpoint += `?localizacionid=${localizacionId}`;
      const data = await backendAPI.get(endpoint);
      return data || [];
    } catch (error) {
      console.error('Error in getUmbrales:', error);
      throw error;
    }
  }

  static async getAlertas(filters?: {
    umbralId?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<Alerta[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.umbralId) params.append('umbralid', filters.umbralId.toString());
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const queryString = params.toString();
      const endpoint = `/alertas/alerta${queryString ? '?' + queryString : ''}`;
      const data = await backendAPI.get(endpoint);
      return data || [];
    } catch (error) {
      console.error('Error in getAlertas:', error);
      throw error;
    }
  }

  static async getAlertasConsolidadas(): Promise<AlertaConsolidado[]> {
    try {
      const data = await backendAPI.get('/alertas/alerta_regla_consolidado');
      return data || [];
    } catch (error) {
      console.error('Error in getAlertasConsolidadas:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // USUARIOS
  // --------------------------------------------------------------------------

  static async getUsuarios(): Promise<Usuario[]> {
    try {
      const data = await backendAPI.get('/usuarios/usuario');
      return data || [];
    } catch (error) {
      console.error('Error in getUsuarios:', error);
      throw error;
    }
  }

  static async getContactos(usuarioId?: number): Promise<Contacto[]> {
    try {
      let endpoint = '/usuarios/contacto';
      if (usuarioId) endpoint += `?usuarioid=${usuarioId}`;
      const data = await backendAPI.get(endpoint);
      return data || [];
    } catch (error) {
      console.error('Error in getContactos:', error);
      throw error;
    }
  }

  static async getCorreos(usuarioId?: number): Promise<Correo[]> {
    try {
      let endpoint = '/usuarios/correo';
      if (usuarioId) endpoint += `?usuarioid=${usuarioId}`;
      const data = await backendAPI.get(endpoint);
      return data || [];
    } catch (error) {
      console.error('Error in getCorreos:', error);
      throw error;
    }
  }

  static async getCodigosTelefonicos(): Promise<CodigoTelefono[]> {
    try {
      const data = await backendAPI.get('/usuarios/codigotelefono');
      return data || [];
    } catch (error) {
      console.error('Error in getCodigosTelefonicos:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // AUTENTICACIÓN (básica con joysense.usuario)
  // --------------------------------------------------------------------------

  static async authenticateUser(login: string, password: string): Promise<{ user: any | null; error: string | null }> {
    try {
      const users = await this.getTableData('usuario');
      const user = users.find((u: any) => u.login === login);
      
      if (!user) return { user: null, error: 'Usuario no encontrado' };
      
      // TODO: Implementar verificación de password_hash con bcrypt
      return { 
        user: {
          id: user.usuarioid,
          email: user.login,
          user_metadata: {
            full_name: `${user.firstname} ${user.lastname}`,
            login: user.login,
            firstname: user.firstname,
            lastname: user.lastname,
            usuarioid: user.usuarioid
          }
        }, 
        error: null 
      };
    } catch (error) {
      console.error('❌ Error authenticating user:', error);
      return { user: null, error: 'Error de autenticación' };
    }
  }

  // --------------------------------------------------------------------------
  // ESTADÍSTICAS Y RESUMEN
  // --------------------------------------------------------------------------

  static async getDashboardStats(): Promise<{
    totalMediciones: number;
    promedioMedicion: number;
    ultimaMedicion: string;
    sensoresActivos: number;
  }> {
    try {
      const mediciones = await this.getMediciones({ getAll: true });
      
      if (!Array.isArray(mediciones)) {
        return { totalMediciones: 0, promedioMedicion: 0, ultimaMedicion: 'N/A', sensoresActivos: 0 };
      }
      
      const totalMediciones = mediciones.length;
      const promedioMedicion = mediciones.length > 0 
        ? mediciones.reduce((sum: number, item: any) => sum + (item.medicion || 0), 0) / mediciones.length 
        : 0;
      const ultimaMedicion = mediciones.length > 0 ? mediciones[0].fecha : 'N/A';
      
      // Sensores activos (últimas 24 horas)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const sensoresActivos = mediciones.filter((item: any) => 
        new Date(item.fecha) >= yesterday
      ).length;

      return { totalMediciones, promedioMedicion, ultimaMedicion, sensoresActivos };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      throw error;
    }
  }

  static async getDataSummary(): Promise<{
    medicion: number;
    pais: number;
    empresa: number;
    fundo: number;
    ubicacion: number;
    metrica: number;
    nodo: number;
    tipo: number;
    localizacion: number;
    sensor: number;
  }> {
    try {
      const [paises, empresas, fundos, ubicaciones, metricas, nodos, tipos, localizaciones, sensores, mediciones] = await Promise.all([
        this.getPaises(),
        this.getEmpresas(),
        this.getFundos(),
        this.getUbicaciones(),
        this.getMetricas(),
        this.getNodos(),
        this.getTipos(),
        this.getLocalizaciones(),
        this.getSensores(),
        this.getMediciones({ limit: 1 })
      ]);

      const medicionesCount = Array.isArray(mediciones) ? mediciones.length : 0;

      return {
        medicion: medicionesCount,
        pais: paises.length,
        empresa: empresas.length,
        fundo: fundos.length,
        ubicacion: ubicaciones.length,
        metrica: metricas.length,
        nodo: nodos.length,
        tipo: tipos.length,
        localizacion: localizaciones.length,
        sensor: sensores.length
      };
    } catch (error) {
      console.error('Error in getDataSummary:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // OPERACIONES CRUD GENÉRICAS
  // --------------------------------------------------------------------------

  static async getTableData(tableName: TableName | string, limit?: number): Promise<any[]> {
    try {
      const endpoint = limit ? `/generic/${tableName}?limit=${limit}` : `/generic/${tableName}`;
      
      // Obtener token de sesión de Supabase para enviarlo al backend
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      
      const data = await backendAPI.get(endpoint, token || undefined);
      const result = Array.isArray(data) ? data : (data?.data || []);
      
      return result;
    } catch (error) {
      console.error(`❌ Error in getTableData for ${tableName}:`, error);
      throw error;
    }
  }

  static async getTableDataPaginated(
    tableName: TableName | string,
    options: {
      page?: number;
      pageSize?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      [key: string]: any;
    } = {}
  ): Promise<{ data: any[]; pagination?: any }> {
    try {
      const params = new URLSearchParams();
      
      if (options.page !== undefined) params.append('page', options.page.toString());
      if (options.pageSize !== undefined) params.append('pageSize', options.pageSize.toString());
      if (options.search) params.append('search', options.search);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);
      
      // Filtros adicionales
      Object.keys(options).forEach(key => {
        if (!['page', 'pageSize', 'search', 'sortBy', 'sortOrder'].includes(key)) {
          const value = options[key];
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        }
      });
      
      const queryString = params.toString();
      const endpoint = `/generic/${tableName}${queryString ? '?' + queryString : ''}`;
      
      // Obtener token de sesión de Supabase para enviarlo al backend
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      
      const response = await backendAPI.get(endpoint, token || undefined);
      
      if (response && response.pagination) return response;
      
      const data = Array.isArray(response) ? response : (response?.data || []);
      return { data };
    } catch (error) {
      console.error(`❌ [backend-api] Error in getTableDataPaginated for ${tableName}:`, error);
      throw error;
    }
  }

  static async getTableColumns(tableName: TableName | string): Promise<any[]> {
    try {
      const endpoint = `/generic/${tableName}/columns`;
      const data = await backendAPI.get(endpoint);
      const rawColumns = Array.isArray(data) ? data : (data?.columns || []);
      
      return rawColumns.map((col: any) => ({
        columnName: col.column_name,
        dataType: col.data_type,
        isNullable: col.is_nullable === 'YES',
        defaultValue: col.column_default,
        isIdentity: col.column_default?.includes('nextval') || false,
        isPrimaryKey: false
      }));
    } catch (error) {
      console.error(`Error in getTableColumns for ${tableName}:`, error);
      throw error;
    }
  }

  static async getTableInfoByName(tableName: TableName | string): Promise<any> {
    try {
      // Obtener columnas y construir info básica
      const columns = await this.getTableColumns(tableName);
      // Usar getPrimaryKey del config si está disponible
      const { getPrimaryKey } = await import('../config/tables.config');
      const primaryKey = getPrimaryKey(tableName);
      
      return {
        columns,
        tableName,
        primaryKey
      };
    } catch (error) {
      console.error(`Error in getTableInfoByName for ${tableName}:`, error);
      throw error;
    }
  }

  static async getTableConstraints(tableName: TableName | string): Promise<any[]> {
    try {
      const endpoint = `/generic/${tableName}/metadata`;
      // Obtener token de sesión de Supabase para enviarlo al backend
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      
      const data = await backendAPI.get(endpoint, token || undefined);
      return data?.constraints || [];
    } catch (error) {
      console.error(`Error in getTableConstraints for ${tableName}:`, error);
      throw error;
    }
  }

  static async insertTableRow(tableName: TableName | string, data: Record<string, any>): Promise<any> {
    try {
      const endpoint = `/generic/${tableName}`;
      // Obtener token de sesión de Supabase para enviarlo al backend
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      
      const result = await backendAPI.post(endpoint, data, token || undefined);
      return result;
    } catch (error) {
      console.error(`Error in insertTableRow for ${tableName}:`, error);
      throw error;
    }
  }

  static async updateTableRow(tableName: TableName | string, id: string, data: Record<string, any>): Promise<any> {
    try {
      const endpoint = `/generic/${tableName}/${id}`;
      // Obtener token de sesión de Supabase para enviarlo al backend
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      
      const result = await backendAPI.put(endpoint, data, token || undefined);
      return result;
    } catch (error) {
      console.error(`Error in updateTableRow for ${tableName}:`, error);
      throw error;
    }
  }

  static async updateTableRowByCompositeKey(tableName: TableName | string, compositeKey: Record<string, any>, data: Record<string, any>): Promise<any> {
    try {
      const keyParams = new URLSearchParams(compositeKey).toString();
      const endpoint = `/generic/${tableName}/composite?${keyParams}`;
      // Obtener token de sesión de Supabase para enviarlo al backend
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      
      const result = await backendAPI.put(endpoint, data, token || undefined);
      return result;
    } catch (error) {
      console.error(`Error in updateTableRowByCompositeKey for ${tableName}:`, error);
      throw error;
    }
  }

  static async deleteTableRow(tableName: TableName | string, id: string): Promise<any> {
    try {
      const endpoint = `/generic/${tableName}/${id}`;
      // Obtener token de sesión de Supabase para enviarlo al backend
      const { supabaseAuth } = await import('./supabase-auth');
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const token = session?.access_token || null;
      
      const result = await backendAPI.delete(endpoint, token || undefined);
      return result;
    } catch (error) {
      console.error(`Error in deleteTableRow for ${tableName}:`, error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // MÉTODOS OPTIMIZADOS PARA DASHBOARD
  // --------------------------------------------------------------------------

  static async getUltimasMedicionesPorLote(params: {
    fundoIds: number[];
    metricaId: number;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('fundoIds', params.fundoIds.join(','));
      queryParams.append('metricaId', params.metricaId.toString());
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const data = await backendAPI.get(`/mediciones/ultimas-mediciones-por-lote?${queryParams.toString()}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error in getUltimasMedicionesPorLote:', error);
      throw error;
    }
  }

  static async getUmbralesPorLote(params: {
    fundoIds: number[];
    metricaId?: number;
  }): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('fundoIds', params.fundoIds.join(','));
      if (params.metricaId) queryParams.append('metricaId', params.metricaId.toString());

      const data = await backendAPI.get(`/alertas/umbrales-por-lote?${queryParams.toString()}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error in getUmbralesPorLote:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // HELPERS PARA GRÁFICOS
  // --------------------------------------------------------------------------

  static async getChartData(filters: {
    paisId?: number;
    empresaId?: number;
    fundoId?: number;
    ubicacionId?: number;
    localizacionId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Array<{ name: string; value: number; timestamp: string; metrica: string; unidad: string }>> {
    try {
      const data = await this.getMediciones({ ...filters, limit: 1000 });

      if (!Array.isArray(data)) return [];

      return data.map((item: any) => ({
        name: new Date(item.fecha).toLocaleString(),
        value: item.medicion,
        timestamp: item.fecha,
        metrica: item.localizacion?.metrica?.metrica || 'N/A',
        unidad: item.localizacion?.metrica?.unidad || 'N/A',
      }));
    } catch (error) {
      console.error('Error in getChartData:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // MÉTODOS LEGACY (para compatibilidad)
  // --------------------------------------------------------------------------

  /** @deprecated Use getTableData instead */
  static async listTables(_schema: string): Promise<string[]> {
    return [
      'pais', 'empresa', 'fundo', 'ubicacion', 'entidad', 'entidad_localizacion',
      'tipo', 'metrica', 'sensor', 'metricasensor', 'nodo', 'localizacion', 'asociacion',
      'medicion', 'sensor_valor', 'sensor_valor_error',
      'criticidad', 'umbral', 'alerta', 'alerta_regla_consolidado', 'mensaje', 'audit_log_umbral',
      'regla', 'regla_objeto', 'regla_perfil', 'regla_umbral',
      'usuario', 'perfil', 'usuarioperfil', 'contacto', 'correo', 'codigotelefono', 'permiso', 'fuente', 'origen'
    ];
  }

  /** @deprecated */
  static async detectSchema(): Promise<string> {
    return 'joysense';
  }

  /** @deprecated */
  static getSchemaPrefix(): string {
    return 'joysense.';
  }

  /** @deprecated Use getDataSummary instead */
  static async getTableInfo(): Promise<any> {
    const summary = await this.getDataSummary();
    return {
      medicionCount: summary.medicion,
      paisCount: summary.pais,
      empresaCount: summary.empresa,
      fundoCount: summary.fundo,
      ubicacionCount: summary.ubicacion,
      metricaCount: summary.metrica,
      nodoCount: summary.nodo,
      tipoCount: summary.tipo
    };
  }

  /** @deprecated */
  static async listSchemas(): Promise<string[]> {
    return ['joysense'];
  }

  /** @deprecated Use insertTableRow */
  static async insertContacto(contactoData: any): Promise<any> {
    return this.insertTableRow('contacto', contactoData);
  }

  /** @deprecated Use insertTableRow */
  static async insertCorreo(correoData: any): Promise<any> {
    return this.insertTableRow('correo', correoData);
  }
}
