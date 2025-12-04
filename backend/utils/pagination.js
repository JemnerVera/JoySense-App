/**
 * Utilidades de Paginación, Búsqueda y Filtros
 */

const { supabase } = require('../config/database');
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
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact' });

    // Aplicar filtros específicos
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        const numValue = Number(value);
        query = query.eq(key, isNaN(numValue) ? value : numValue);
      }
    });

    // Aplicar búsqueda en múltiples campos
    if (search && search.trim() !== '') {
      const searchFields = SEARCHABLE_FIELDS[tableName] || [];
      if (searchFields.length > 0) {
        const searchTerm = search.trim().toLowerCase();
        const orFilters = searchFields.map(field => `${field}.ilike.%${searchTerm}%`).join(',');
        query = query.or(orFilters);
      }
    }

    // Obtener total de registros
    const { count: totalRecords } = await query;

    // Aplicar ordenamiento
    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Aplicar paginación si está habilitada
    if (usePagination) {
      const pageNum = parseInt(page);
      const pageSizeNum = parseInt(pageSize);
      const from = (pageNum - 1) * pageSizeNum;
      const to = from + pageSizeNum - 1;
      
      query = query.range(from, to);
      logger.debug(`Paginación: Tabla=${tableName}, Página=${pageNum}, Total=${totalRecords}`);
    } else {
      // Modo legacy: obtener todos los registros en batches
      logger.debug(`Modo legacy: Cargando todos los registros de ${tableName}`);
      let allData = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: batchData, error } = await supabase
          .from(tableName)
          .select('*')
          .order(sortBy, { ascending: sortOrder === 'asc' })
          .range(from, from + batchSize - 1);

        if (error) throw error;

        if (batchData && batchData.length > 0) {
          allData = allData.concat(batchData);
          from += batchSize;
          hasMore = batchData.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      return allData;
    }

    const { data, error } = await query;

    if (error) {
      logger.error(`Error en paginateAndFilter para ${tableName}:`, error);
      throw error;
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
    
    const { data, error } = await supabase.rpc('fn_get_table_metadata', {
      tbl_name: tableName
    });
    
    if (error) {
      logger.error(`Error en stored procedure para ${tableName}:`, error);
      throw new Error(`No se pudieron obtener metadatos para ${tableName}: ${error.message}`);
    }
    
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

