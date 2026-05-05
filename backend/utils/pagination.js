/**
 * Paginación y filtros para Supabase
 */

const { dbSchema } = require('../config/database');
const logger = require('./logger');

/**
 * Campos buscables por tabla
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
  carpeta: ['carpeta'],
  carpeta_ubicacion: ['carpetaid', 'ubicacionid'],
  carpeta_usuario: ['carpetaid', 'usuarioid'],
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
  permiso: ['perfilid'],
  fuente: ['fuente'],
  origen: ['origen']
};

/**
 * Paginar, buscar y filtrar datos
 */
async function paginateAndFilter(tableName, params = {}, userSupabase = null) {
  if (!userSupabase) {
    throw new Error('paginateAndFilter requiere cliente autenticado (userSupabase)');
  }
  const supabase = userSupabase;
  
  const {
    page,
    pageSize = 100,
    limit,  // Límite simple
    search = '',
    sortBy,
    sortOrder = 'desc',
    ...filters
  } = params;

  const usePagination = page !== undefined && page !== null;
  const simpleLimit = limit ? parseInt(limit) : null;

  try {
    const whereFilters = {};
    
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        whereFilters[key] = value;
      }
    });

    // Filtros de búsqueda
    let searchFilters = [];
    if (search && search.trim() !== '') {
      const searchFields = SEARCHABLE_FIELDS[tableName] || [];
      if (searchFields.length > 0) {
        searchFields.forEach(field => {
          searchFilters.push({ field, value: `%${search.trim()}%`, operator: 'ilike' });
        });
      }
    }

    // Total de registros (solo con paginación)
    let totalRecords = null;
    if (usePagination) {
      const { dbSchema } = require('../config/database');
      let countQuery = supabase.schema(dbSchema).from(tableName).select('*', { count: 'exact', head: true });
      
      Object.keys(whereFilters).forEach(key => {
        countQuery = countQuery.eq(key, whereFilters[key]);
      });
      
      if (searchFilters.length > 0) {
        countQuery = countQuery.ilike(searchFilters[0].field, searchFilters[0].value);
      }
      
      try {
        const { count, error: countError } = await countQuery;
        
        if (countError) {
          logger.warn(`⚠️ Count falló para ${tableName}: ${countError.message}`);
          totalRecords = null;
        } else {
          totalRecords = count;
        }
      } catch (countCatchError) {
        logger.warn(`⚠️ Count exception para ${tableName}: ${countCatchError.message}`);
        totalRecords = null;
      }
    }
    
    // Query de datos
    logger.info(`🔍 [paginateAndFilter] EJECUTANDO query para tabla: ${tableName} (usuarioid de JWT: se extrae en BD via auth.uid())`);
    let dataQuery = supabase.schema(dbSchema).from(tableName).select('*');
    
    // Aplicar filtros
    Object.keys(whereFilters).forEach(key => {
      dataQuery = dataQuery.eq(key, whereFilters[key]);
    });
    
    // Aplicar búsqueda
    if (searchFilters.length > 0) {
      dataQuery = dataQuery.ilike(searchFilters[0].field, searchFilters[0].value);
    }
    
    // Campo de ordenamiento por defecto
    let finalSortBy = sortBy;
    
    if (!finalSortBy) {
      if (tableName === 'audit_log_umbral') {
        finalSortBy = 'datemodified';
      } else if (tableName === 'alerta_regla' || tableName === 'sensor_valor_error') {
        finalSortBy = 'fecha';
      } else {
        finalSortBy = 'datecreated';
      }
    }
    
    const ascending = sortOrder !== 'desc';
    
    const tablesWithoutIndexOrder = ['sensor_valor_error', 'audit_log_umbral'];
    const skipOrderForLargeTables = simpleLimit && !sortBy && tablesWithoutIndexOrder.includes(tableName);
    
    // Ordenar
    if (!skipOrderForLargeTables) {
      if (finalSortBy === 'datecreated') {
      dataQuery = dataQuery.order('datecreated', { ascending });
      if (tableName !== 'audit_log_umbral' && tableName !== 'alerta_regla' && tableName !== 'sensor_valor_error') {
        dataQuery = dataQuery.order('datemodified', { ascending });
      }
    } else if (finalSortBy === 'datemodified') {
      dataQuery = dataQuery.order('datemodified', { ascending });
      if (tableName !== 'audit_log_umbral' && tableName !== 'sensor_valor_error') {
        dataQuery = dataQuery.order('datecreated', { ascending });
      }
    } else if (finalSortBy === 'fecha' && (tableName === 'alerta_regla' || tableName === 'sensor_valor_error')) {
      dataQuery = dataQuery.order('fecha', { ascending });
      if (tableName === 'alerta_regla') {
        dataQuery = dataQuery.order('datecreated', { ascending });
      }
    } else {
      dataQuery = dataQuery.order(finalSortBy, { ascending });
    }
    }

    // Paginación
    if (usePagination) {
      const pageNum = parseInt(page);
      const pageSizeNum = parseInt(pageSize);
      const offset = (pageNum - 1) * pageSizeNum;
      
      dataQuery = dataQuery.range(offset, offset + pageSizeNum - 1);
    } else if (simpleLimit) {
      dataQuery = dataQuery.limit(parseInt(simpleLimit));
    }

    const { data, error: dataError } = await dataQuery;
    
    if (dataError) {
      const errorMessage = dataError.message || 'Error desconocido';
      logger.error(`❌ Error para ${tableName}: [${dataError.code || 'N/A'}] ${errorMessage}`);
      if (dataError.details) logger.error(`   Detalles: ${dataError.details}`);
      if (dataError.hint) logger.error(`   Hint: ${dataError.hint}`);
      throw dataError;
    }
    
    // Sin paginación → solo datos
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

const metadataCache = new Map();

function clearMetadataCache(tableName = null) {
  if (tableName) {
    metadataCache.delete(tableName);
  } else {
    metadataCache.clear();
  }
}

/**
 * Obtener metadatos de tabla
 */
async function getTableMetadata(tableName, userSupabase = null) {
  if (!userSupabase) {
    throw new Error('getTableMetadata requiere cliente autenticado (userSupabase)');
  }
  const supabase = userSupabase;

  logger.debug(`[getTableMetadata] Obteniendo metadatos para: ${tableName}`);
  
  if (metadataCache.has(tableName)) {
    const cached = metadataCache.get(tableName);
    const cachedColumnsCount = cached.columns ? (Array.isArray(cached.columns) ? cached.columns.length : 0) : 0;
    
    if (cachedColumnsCount === 0) {
      logger.warn(`⚠️ Cache vacío para: ${tableName}`);
      metadataCache.delete(tableName);
    } else {
      return cached;
    }
  }
  
  try {
    const { data: rpcData, error: rpcError } = await supabase
      .schema(dbSchema)
       .rpc('fn_get_table_metadata', { tbl_name: tableName });
    
    if (!rpcError && rpcData && rpcData.columns !== undefined) {
      metadataCache.set(tableName, rpcData);
      return rpcData;
    }
    
    if (rpcError) {
      const isPermissionError = rpcError.code === '42501' || (rpcError.message && rpcError.message.includes('permission denied'));
      const logMsg = `RPC falló para ${tableName}: [${rpcError.code || 'N/A'}] ${rpcError.message}`;
      
      if (isPermissionError) {
        logger.error(`⚠️ ${logMsg}`);
        logger.error(`   Rol: authenticated`);
        logger.error(`   SQL: GRANT EXECUTE ON FUNCTION joysense.fn_get_table_metadata(text) TO authenticated;`);
      } else {
        logger.warn(logMsg);
      }
      
      if (rpcError.details) logger.warn(`   Detalles: ${rpcError.details}`);
      if (rpcError.hint) logger.warn(`   Hint: ${rpcError.hint}`);
    }
    
    // Fallback: query directa
    const { data: rows, error: queryError } = await supabase
      .schema(dbSchema)
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (queryError) {
      logger.error(`Fallback falló para ${tableName}: [${queryError.code || 'N/A'}] ${queryError.message}`);
      if (queryError.details) logger.error(`   Detalles: ${queryError.details}`);
      if (queryError.hint) logger.error(`   Hint: ${queryError.hint}`);
      
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
    
    const firstRow = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    
    // Tabla vacía
    if (!firstRow || Object.keys(firstRow).length === 0) {
      logger.warn(`Tabla vacía: ${tableName}`);
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
    
    // Construir metadatos desde la fila
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
    
    return metadata;
  } catch (error) {
    logger.warn(`Error para ${tableName}: ${error.message}`);
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
 * Inferir tipo de dato desde valor JS
 */
function inferDataType(value) {
  if (value === null || value === undefined) return 'text';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'numeric';
  }
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'timestamp';
    return 'text';
  }
  if (value instanceof Date) return 'timestamp';
  return 'text';
}

module.exports = {
  SEARCHABLE_FIELDS,
  paginateAndFilter,
  getTableMetadata,
  clearMetadataCache,
  metadataCache
};
