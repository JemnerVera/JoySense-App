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

    // Obtener total de registros usando count
    // Construir query de count con filtros
    // IMPORTANTE: Usar .schema() explícitamente porque las tablas están en 'joysense'
    const { dbSchema } = require('../config/database');
    let countQuery = supabase.schema(dbSchema).from(tableName).select('*', { count: 'exact', head: true });
    
    // Aplicar filtros
    Object.keys(whereFilters).forEach(key => {
      countQuery = countQuery.eq(key, whereFilters[key]);
    });
    
    // Aplicar búsqueda (usar or() para múltiples campos)
    if (searchFilters.length > 0) {
      // Supabase requiere usar or() para múltiples condiciones
      const orConditions = searchFilters.map(({ field, value }) => `${field}.ilike.${value}`);
      // Nota: Supabase no soporta or() directamente en select, necesitamos hacerlo diferente
      // Por ahora, usar el primer campo de búsqueda
      if (searchFilters.length > 0) {
        countQuery = countQuery.ilike(searchFilters[0].field, searchFilters[0].value);
      }
    }
    
    const { count: totalRecords, error: countError } = await countQuery;
    
    if (countError) {
      logger.error(`❌ Error obteniendo count para ${tableName}: ${countError.message}`);
      logger.error(`❌ [COUNT] Code: ${countError.code || 'N/A'}, Details: ${countError.details || 'N/A'}, Hint: ${countError.hint || 'N/A'}`);
      logger.error(`❌ [COUNT] Params: ${JSON.stringify(params || {}, null, 2)}`);
      throw countError;
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
      // Para audit_log_umbral, usar modified_at
      // Para otras tablas, usar datecreated
      if (tableName === 'audit_log_umbral') {
        finalSortBy = 'modified_at';
      } else {
        finalSortBy = 'datecreated';
      }
    }
    
    const ascending = sortOrder !== 'desc';
    
    // Ordenar por el campo especificado
    if (finalSortBy === 'datecreated') {
      // Ordenar por datecreated primero, luego por datemodified como desempate (si existe)
      dataQuery = dataQuery.order('datecreated', { ascending });
      dataQuery = dataQuery.order('datemodified', { ascending });
    } else if (finalSortBy === 'modified_at') {
      // Para audit_log_umbral, ordenar solo por modified_at
      dataQuery = dataQuery.order('modified_at', { ascending });
    } else if (finalSortBy === 'datemodified') {
      // Si ordenamos por datemodified, usar datecreated como desempate
      dataQuery = dataQuery.order('datemodified', { ascending });
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
      logger.info(`🔍 Paginación: Tabla=${tableName}, Página=${pageNum}, Total=${totalRecords || 0}`);
    } else if (simpleLimit) {
      // Límite simple sin paginación
      dataQuery = dataQuery.limit(parseInt(simpleLimit));
    }

    // Ejecutar query de datos
    const { data, error: dataError } = await dataQuery;
    
    if (dataError) {
      logger.error(`❌ Error obteniendo datos para ${tableName}: ${dataError.message}`);
      logger.error(`❌ [DATA] Code: ${dataError.code || 'N/A'}, Details: ${dataError.details || 'N/A'}, Hint: ${dataError.hint || 'N/A'}`);
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
 * Obtener metadatos de tabla
 * Intenta usar RPC primero, si falla usa una query directa para inferir estructura
 */
async function getTableMetadata(tableName) {
  if (metadataCache.has(tableName)) {
    return metadataCache.get(tableName);
  }
  
  try {
    // Intentar primero con RPC (la función consulta information_schema, no está afectada por RLS)
    // La función está en joysense y se accede directamente usando .schema('joysense')
    const { data: rpcData, error: rpcError } = await baseSupabase
      .schema('joysense')
      .rpc('fn_get_table_metadata', { tbl_name: tableName });
    
    // Si RPC funciona y retorna datos, usarlos (incluso si la tabla está vacía, debería retornar columnas)
    if (!rpcError && rpcData) {
      // Verificar que tenga la estructura esperada
      if (rpcData.columns !== undefined) {
        metadataCache.set(tableName, rpcData);
        const columnCount = Array.isArray(rpcData.columns) ? rpcData.columns.length : 0;
        logger.info(`✅ Metadatos obtenidos para: ${tableName} (${columnCount} columnas) vía RPC`);
        return rpcData;
      }
      // Si RPC retornó datos pero sin estructura de columnas, continuar con fallback
      logger.warn(`⚠️ RPC retornó datos pero sin estructura de columnas para ${tableName}, usando fallback`);
    } else if (rpcError) {
      logger.warn(`⚠️ RPC falló para ${tableName}: ${rpcError.message}, usando fallback`);
    }
    
    // Fallback: Obtener una fila para inferir estructura
    logger.info(`ℹ️ Usando fallback para obtener estructura de ${tableName} desde una fila`);
    const { data: rows, error: queryError } = await baseSupabase
      .schema(dbSchema)
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (queryError) {
      logger.warn(`⚠️ No se pudo obtener fila de ${tableName}: ${queryError.message}. Retornando metadatos vacíos.`);
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
      logger.info(`ℹ️ La tabla ${tableName} está vacía. Retornando metadatos vacíos.`);
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
