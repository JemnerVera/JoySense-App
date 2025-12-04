/**
 * Utilidades de Paginación, Búsqueda y Filtros
 * Versión PostgreSQL Directo
 */

const { pool, dbSchema } = require('../config/database');
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
  alertaconsolidado: ['uuid_consolidadoid'],
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
  entidad_localizacion: ['entidadid', 'localizacionid']
};

/**
 * Helper para paginar, buscar y filtrar datos de cualquier tabla
 * @param {string} tableName - Nombre de la tabla
 * @param {Object} params - Parámetros de paginación, búsqueda y filtros
 * @returns {Promise<Object>} - { data, pagination } o data (modo legacy)
 */
async function paginateAndFilter(tableName, params = {}) {
  const {
    page,
    pageSize = 100,
    search = '',
    sortBy = 'datemodified',
    sortOrder = 'desc',
    ...filters
  } = params;

  const usePagination = page !== undefined && page !== null;

  try {
    const queryParams = [];
    let paramIndex = 1;
    
    // Base query
    let countSql = `SELECT COUNT(*) as total FROM ${dbSchema}.${tableName}`;
    let dataSql = `SELECT * FROM ${dbSchema}.${tableName}`;
    
    // WHERE clauses
    const whereClauses = [];
    
    // Aplicar filtros específicos
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        whereClauses.push(`${key} = $${paramIndex}`);
        queryParams.push(value);
        paramIndex++;
      }
    });

    // Aplicar búsqueda en múltiples campos
    if (search && search.trim() !== '') {
      const searchFields = SEARCHABLE_FIELDS[tableName] || [];
      if (searchFields.length > 0) {
        const searchTerm = `%${search.trim().toLowerCase()}%`;
        const searchClauses = searchFields.map(field => `LOWER(${field}::text) LIKE $${paramIndex}`);
        whereClauses.push(`(${searchClauses.join(' OR ')})`);
        queryParams.push(searchTerm);
        paramIndex++;
      }
    }

    // Agregar WHERE si hay condiciones
    if (whereClauses.length > 0) {
      const whereStr = ` WHERE ${whereClauses.join(' AND ')}`;
      countSql += whereStr;
      dataSql += whereStr;
    }

    // Obtener total de registros
    const countResult = await pool.query(countSql, queryParams.slice(0, paramIndex - 1));
    const totalRecords = parseInt(countResult.rows[0].total);

    // Aplicar ordenamiento
    if (sortBy) {
      dataSql += ` ORDER BY ${sortBy} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
    }

    // Aplicar paginación si está habilitada
    if (usePagination) {
      const pageNum = parseInt(page);
      const pageSizeNum = parseInt(pageSize);
      const offset = (pageNum - 1) * pageSizeNum;
      
      dataSql += ` LIMIT ${pageSizeNum} OFFSET ${offset}`;
      logger.debug(`Paginación: Tabla=${tableName}, Página=${pageNum}, Total=${totalRecords}`);
    }

    const dataResult = await pool.query(dataSql, queryParams.slice(0, paramIndex - 1));
    const data = dataResult.rows;

    // Si no hay paginación, retornar solo los datos (modo legacy)
    if (!usePagination) {
      return data;
    }

    const totalPages = Math.ceil(totalRecords / parseInt(pageSize));
    
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
 * Obtener metadatos de tabla usando Stored Procedure
 */
async function getTableMetadata(tableName) {
  if (metadataCache.has(tableName)) {
    logger.debug(`Usando metadatos en cache para: ${tableName}`);
    return metadataCache.get(tableName);
  }
  
  try {
    logger.debug(`Obteniendo metadatos para: ${tableName}`);
    
    const result = await pool.query(
      `SELECT ${dbSchema}.fn_get_table_metadata($1)`,
      [tableName]
    );
    
    const data = result.rows[0]?.fn_get_table_metadata;
    
    if (!data || !data.columns || data.columns.length === 0) {
      logger.warn(`No hay columnas para ${tableName}`);
      throw new Error(`La tabla ${tableName} no existe o no tiene columnas`);
    }
    
    metadataCache.set(tableName, data);
    logger.info(`Metadatos obtenidos para: ${tableName} (${data.columns.length} columnas)`);
    
    return data;
  } catch (error) {
    logger.error(`Error obteniendo metadatos para ${tableName}:`, error.message);
    throw error;
  }
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
