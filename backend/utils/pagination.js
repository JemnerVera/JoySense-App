/**
 * Utilidades de Paginación, Búsqueda y Filtros
 * Versión Supabase API
 * 
 * IMPORTANTE: Usa Supabase API directamente - RLS funciona automáticamente
 */

const { supabase: baseSupabase, dbSchema } = require('../config/database');
const logger = require('./logger');

/**
 * Configuración de campos buscables por tabla
 * Actualizado para el nuevo schema joysense
 */
const SEARCHABLE_FIELDS = {
  pais: ['pais', 'paisabrev'],
  empresa: ['empresa', 'empresabrev'],
  fundo: ['fundo', 'fundoabrev'],
  ubicacion: ['ubicacion'],
  localizacion: ['localizacion', 'referencia'],
  nodo: ['nodo', 'descripcion'],
  sensor: ['sensorid'],
  metrica: ['metrica', 'unidad'],
  metricasensor: ['sensorid', 'metricaid'],
  tipo: ['tipo'],
  entidad: ['entidad'],
  umbral: ['umbral'],
  alerta: ['uuid_alertaid'],
  alerta_regla: ['uuid_alerta_reglaid'],
  alerta_regla_consolidado: ['uuid_consolidadoid'],
  criticidad: ['criticidad'],
  perfil: ['perfil'],
  usuario: ['login', 'firstname', 'lastname'],
  usuarioperfil: ['usuarioid', 'perfilid'],
  contacto: ['celular'],
  correo: ['correo'],
  codigotelefono: ['codigotelefono', 'paistelefono'],
  mensaje: ['mensaje', 'tipo_origen'],
  perfilumbral: ['perfilid', 'umbralid'],
  asociacion: ['id_device'],
  audit_log_umbral: ['accion'],
  entidad_localizacion: ['entidadid', 'localizacionid'],
  permiso: ['perfilid'], // Nuevo sistema de permisos
  fuente: ['fuente'],
  origen: ['origen']
};

/**
 * Helper para paginar, buscar y filtrar datos de cualquier tabla usando Supabase API
 * @param {string} tableName - Nombre de la tabla
 * @param {Object} params - Parámetros de paginación, búsqueda y filtros
 * @returns {Promise<Object>} - { data, pagination } o data (modo legacy)
 */
async function paginateAndFilter(tableName, params = {}, userSupabase = null) {
  // Usar el cliente de Supabase del request (con token del usuario) si está disponible
  // Si no hay token, usar el cliente base
  const supabase = userSupabase || baseSupabase;
  
  const {
    page,
    pageSize = 100,
    limit,  // Parámetro de límite simple (sin paginación completa)
    search = '',
    sortBy,
    sortOrder = 'desc',
    ...filters
  } = params;

  const usePagination = page !== undefined && page !== null;
  const simpleLimit = limit ? parseInt(limit) : null;

  try {
    
    // Construir filtros para Supabase
    const whereFilters = {};
    
    // Aplicar filtros específicos
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        whereFilters[key] = value;
      }
    });

    // Construir query de búsqueda para Supabase
    // Supabase usa ilike para búsqueda case-insensitive
    let searchFilters = [];
    if (search && search.trim() !== '') {
      const searchFields = SEARCHABLE_FIELDS[tableName] || [];
      if (searchFields.length > 0) {
        searchFields.forEach(field => {
          searchFilters.push({ field, value: `%${search.trim()}%`, operator: 'ilike' });
        });
      }
    }

    // Obtener total de registros usando count (solo si se usa paginación)
    let totalRecords = null;
    if (usePagination) {
      const { dbSchema } = require('../config/database');
      let countQuery = supabase.schema(dbSchema).from(tableName).select('*', { count: 'exact', head: true });
      
      // Aplicar filtros
      Object.keys(whereFilters).forEach(key => {
        countQuery = countQuery.eq(key, whereFilters[key]);
      });
      
      // Aplicar búsqueda
      if (searchFilters.length > 0) {
        countQuery = countQuery.ilike(searchFilters[0].field, searchFilters[0].value);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        const errorMessage = countError.message || (typeof countError === 'string' ? countError : JSON.stringify(countError)) || 'Error desconocido en count';
        logger.error(`❌ Error obteniendo count para ${tableName}: ${errorMessage}`);
        const error = new Error(errorMessage);
        if (countError.code) error.code = countError.code;
        if (countError.details) error.details = countError.details;
        if (countError.hint) error.hint = countError.hint;
        throw error;
      }
      
      totalRecords = count;
    }
    
    // Construir query de datos
    // IMPORTANTE: Usar .schema() explícitamente porque las tablas están en 'joysense'
    // Usar el mismo cliente de Supabase (con o sin token de usuario)
    let dataQuery = supabase.schema(dbSchema).from(tableName).select('*');
    
    // Aplicar filtros
    Object.keys(whereFilters).forEach(key => {
      dataQuery = dataQuery.eq(key, whereFilters[key]);
    });
    
    // Aplicar búsqueda
    if (searchFilters.length > 0) {
      // Usar el primer campo de búsqueda (Supabase limita or() en algunos casos)
      dataQuery = dataQuery.ilike(searchFilters[0].field, searchFilters[0].value);
    }
    
    // Aplicar ordenamiento
    // Determinar el campo de ordenamiento por defecto según la tabla
    let finalSortBy = sortBy;
    
    if (!finalSortBy) {
      // Para audit_log_umbral, usar datemodified (no tiene datecreated)
      // Para alerta_regla, usar fecha (no tiene datemodified)
      // Para otras tablas, usar datecreated
      if (tableName === 'audit_log_umbral') {
        finalSortBy = 'datemodified';
      } else if (tableName === 'alerta_regla') {
        finalSortBy = 'fecha';
      } else {
        finalSortBy = 'datecreated';
      }
    }
    
    const ascending = sortOrder !== 'desc';
    
    // Ordenar por el campo especificado
    if (finalSortBy === 'datecreated') {
      // Ordenar por datecreated primero, luego por datemodified como desempate (si existe)
      dataQuery = dataQuery.order('datecreated', { ascending });
      // Solo agregar datemodified si la tabla lo tiene (no todas las tablas lo tienen)
      // alerta_regla no tiene datemodified, solo tiene datecreated y fecha
      if (tableName !== 'audit_log_umbral' && tableName !== 'alerta_regla') {
        dataQuery = dataQuery.order('datemodified', { ascending });
      }
    } else if (finalSortBy === 'datemodified') {
      // Si ordenamos por datemodified, usar datecreated como desempate (si existe)
      dataQuery = dataQuery.order('datemodified', { ascending });
      // Solo agregar datecreated si la tabla lo tiene
      if (tableName !== 'audit_log_umbral') {
        dataQuery = dataQuery.order('datecreated', { ascending });
      }
    } else if (finalSortBy === 'fecha' && tableName === 'alerta_regla') {
      // Para alerta_regla, ordenar por fecha (campo principal de timestamp)
      dataQuery = dataQuery.order('fecha', { ascending });
      // Usar datecreated como desempate
      dataQuery = dataQuery.order('datecreated', { ascending });
    } else {
      // Ordenar por el campo especificado
      dataQuery = dataQuery.order(finalSortBy, { ascending });
    }

    // Aplicar paginación
    if (usePagination) {
      const pageNum = parseInt(page);
      const pageSizeNum = parseInt(pageSize);
      const offset = (pageNum - 1) * pageSizeNum;
      
      // Supabase range es inclusivo: range(offset, offset + pageSize - 1)
      dataQuery = dataQuery.range(offset, offset + pageSizeNum - 1);
    } else if (simpleLimit) {
      // Límite simple sin paginación
      dataQuery = dataQuery.limit(parseInt(simpleLimit));
    }

    // Ejecutar query de datos
    const { data, error: dataError } = await dataQuery;
    
    if (dataError) {
      const errorMessage = dataError.message || 'Error desconocido obteniendo datos';
      logger.error(`❌ Error obteniendo datos para ${tableName}: ${errorMessage}`);
      throw dataError;
    }
    
    
    // Si no hay paginación, retornar solo los datos (modo legacy)
    if (!usePagination) {
      return data || [];
    }

    const totalPages = Math.ceil((totalRecords || 0) / parseInt(pageSize));
    
    return {
      data: data || [],
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: totalRecords || 0,
        totalPages: totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    };

  } catch (error) {
    logger.error(`Error en paginateAndFilter para ${tableName}:`, error);
    throw error;
  }
}

/**
 * Cache de metadatos para evitar consultas repetidas
 */
const metadataCache = new Map();

/**
 * Limpiar cache de metadatos
 */
function clearMetadataCache(tableName = null) {
  if (tableName) {
    metadataCache.delete(tableName);
    logger.info(`🗑️ [clearMetadataCache] Cache limpiado para tabla: ${tableName}`);
  } else {
    metadataCache.clear();
    logger.info(`🗑️ [clearMetadataCache] Cache limpiado completamente`);
  }
}

/**
 * Obtener metadatos de tabla
 * Intenta usar RPC primero, si falla usa una query directa para inferir estructura
 * @param {string} tableName - Nombre de la tabla
 * @param {object} userSupabase - Cliente de Supabase con token de usuario (para RLS)
 */
async function getTableMetadata(tableName, userSupabase = null) {
  // Usar el cliente con token de usuario si está disponible, sino usar el base
  const supabase = userSupabase || baseSupabase;
  
  if (metadataCache.has(tableName)) {
    const cached = metadataCache.get(tableName);
    const cachedColumnsCount = cached.columns ? (Array.isArray(cached.columns) ? cached.columns.length : 0) : 0;
    
    // Si el cache tiene columnas vacías pero la tabla debería tener columnas, limpiar el cache
    if (cachedColumnsCount === 0) {
      logger.warn(`⚠️ [getTableMetadata] Cache vacío para: ${tableName}, limpiando cache`);
      metadataCache.delete(tableName);
      // Continuar para obtener los datos frescos
    } else {
      return cached;
    }
  }
  
  try {
    // Intentar primero con RPC (la función consulta information_schema, no está afectada por RLS)
    // IMPORTANTE: Usar el cliente con token de usuario para que la función pueda verificar autenticación
    const { data: rpcData, error: rpcError } = await supabase
      .schema('joysense')
      .rpc('fn_get_table_metadata', { tbl_name: tableName });
    
    // Si RPC funciona y retorna datos, usarlos
    if (!rpcError && rpcData && rpcData.columns !== undefined) {
      metadataCache.set(tableName, rpcData);
      return rpcData;
    }
    
    // Si la función RPC falló por permisos, registrar el error
    if (rpcError && rpcError.code === '42501') {
      logger.warn(`⚠️ [getTableMetadata] RPC falló por permisos para: ${tableName} - ${rpcError.message}`);
    }
    
    // Fallback: usar query directa si RPC falló
    // Obtener una fila para inferir estructura
    // IMPORTANTE: Usar el cliente con token de usuario para que RLS funcione
    const { data: rows, error: queryError } = await supabase
      .schema(dbSchema)
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (queryError) {
      logger.warn(`⚠️ [getTableMetadata] Error en query fallback para: ${tableName} - ${queryError.message}`);
      const emptyMetadata = {
        columns: [],
        constraints: [],
        tableName,
        info: {
          table_name: tableName,
          table_type: 'BASE TABLE'
        }
      };
      metadataCache.set(tableName, emptyMetadata);
      return emptyMetadata;
    }
    
    // Verificar si obtuvimos alguna fila
    const firstRow = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    
    // Si la tabla está vacía (no hay filas), retornar metadatos vacíos
    if (!firstRow || Object.keys(firstRow).length === 0) {
      logger.warn(`⚠️ [getTableMetadata] Tabla vacía para: ${tableName}`);
      const emptyMetadata = {
        columns: [],
        constraints: [],
        tableName,
        info: {
          table_name: tableName,
          table_type: 'BASE TABLE'
        }
      };
      metadataCache.set(tableName, emptyMetadata);
      return emptyMetadata;
    }
    
    // Construir metadatos básicos desde la estructura de la primera fila
    const columns = Object.keys(firstRow).map(colName => ({
      column_name: colName,
      data_type: inferDataType(firstRow[colName]),
      is_nullable: firstRow[colName] === null ? 'YES' : 'NO',
      column_default: null,
      is_identity: colName.endsWith('id') && colName !== 'statusid' && colName !== 'usercreatedid' && colName !== 'usermodifiedid'
    }));
    
    const metadata = {
      columns,
      constraints: [],
      tableName
    };
    
    metadataCache.set(tableName, metadata);
    logger.info(`✅ Metadatos inferidos para: ${tableName} (${columns.length} columnas) desde primera fila`);
    
    return metadata;
  } catch (error) {
    // En caso de error inesperado, retornar metadatos vacíos en lugar de lanzar error
    logger.warn(`⚠️ Error obteniendo metadatos para ${tableName}: ${error.message}. Retornando metadatos vacíos.`);
    const emptyMetadata = {
      columns: [],
      constraints: [],
      tableName,
      info: {
        table_name: tableName,
        table_type: 'BASE TABLE'
      }
    };
    metadataCache.set(tableName, emptyMetadata);
    return emptyMetadata;
  }
}

/**
 * Inferir tipo de dato desde un valor JavaScript
 */
function inferDataType(value) {
  if (value === null || value === undefined) return 'text';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'numeric';
  }
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') {
    // Intentar detectar fechas/timestamps
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'timestamp';
    return 'text';
  }
  if (value instanceof Date) return 'timestamp';
  return 'text';
}

/**
 * Limpiar cache de metadatos
 */
function clearMetadataCache(tableName = null) {
  if (tableName) {
    metadataCache.delete(tableName);
  } else {
    metadataCache.clear();
  }
}

module.exports = {
  SEARCHABLE_FIELDS,
  paginateAndFilter,
  getTableMetadata,
  clearMetadataCache,
  metadataCache
};
