require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Constantes de validación
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sistema de logging configurable
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'; // debug, info, warn, error
const isDebugMode = LOG_LEVEL === 'debug';
const isInfoMode = ['debug', 'info'].includes(LOG_LEVEL);

const logger = {
  debug: (message, ...args) => isDebugMode && console.log(`🔍 ${message}`, ...args),
  info: (message, ...args) => isInfoMode && console.log(`✅ ${message}`, ...args),
  warn: (message, ...args) => console.log(`⚠️ ${message}`, ...args),
  error: (message, ...args) => console.error(`❌ ${message}`, ...args)
};

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de Supabase - Service Role Key (SOLO BACKEND)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const dbSchema = process.env.DB_SCHEMA || 'sense';

// Crear cliente de Supabase con configuración de esquema
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: dbSchema }
});


// Cache de metadatos para evitar consultas repetidas
const metadataCache = new Map();

// ============================================================================
// HELPER: PAGINACIÓN, BÚSQUEDA Y FILTROS
// ============================================================================

/**
 * Configuración de campos buscables por tabla
 */
const SEARCHABLE_FIELDS = {
  metricasensor: ['nodoid', 'tipoid', 'metricaid'],
  sensor: ['nodoid', 'tipoid'],
  nodo: ['nodo', 'nodoid'],
  alerta: ['nodoid', 'alerta'],
  umbral: ['nodoid', 'tipoid', 'metricaid'],
  medicion: ['nodoid', 'medicion'],
  localizacion: ['nodoid', 'ubicacionid'],
  usuario: ['login', 'nombre', 'email'],
  // Agregar más tablas según sea necesario
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
    ...filters // Otros filtros como nodoid, tipoid, statusid, etc.
  } = params;

  // Modo legacy: Si no se especifica 'page', devolver array simple (compatibilidad hacia atrás)
  const usePagination = page !== undefined && page !== null;

  try {
    // Iniciar query base con count
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact' });

    // Aplicar filtros específicos
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        // Convertir a número si es necesario
        const numValue = Number(value);
        query = query.eq(key, isNaN(numValue) ? value : numValue);
      }
    });

    // Aplicar búsqueda en múltiples campos
    if (search && search.trim() !== '') {
      const searchFields = SEARCHABLE_FIELDS[tableName] || ['nodoid'];
      const searchTerm = search.trim().toLowerCase();
      
      // Construir filtro OR para buscar en múltiples campos
      const orFilters = searchFields.map(field => `${field}.ilike.%${searchTerm}%`).join(',');
      query = query.or(orFilters);
    }

    // Obtener total de registros (antes de paginar)
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
      
      console.log(`📄 Paginación: Tabla=${tableName}, Página=${pageNum}, Tamaño=${pageSizeNum}, Total=${totalRecords}`);
    } else {
      // Modo legacy: Usar paginación interna para obtener todos los registros
      console.log(`📚 Modo legacy: Cargando todos los registros de ${tableName}`);
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

      return allData; // Retornar array simple para compatibilidad
    }

    // Ejecutar query con paginación
    const { data, error } = await query;

    if (error) {
      console.error(`❌ Error en paginateAndFilter para ${tableName}:`, error);
      throw error;
    }

    // Retornar con información de paginación
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
    console.error(`❌ Error en paginateAndFilter para ${tableName}:`, error);
    throw error;
  }
}

// Función para obtener metadatos dinámicamente usando Stored Procedure
const getTableMetadata = async (tableName) => {
  // Verificar cache primero
  if (metadataCache.has(tableName)) {
    logger.debug(`Usando metadatos en cache para tabla: ${tableName}`);
    return metadataCache.get(tableName);
  }
  
  try {
    logger.debug(`Obteniendo metadatos dinámicos para tabla: ${tableName} usando stored procedure`);
    
    // Usar la función stored procedure que creamos en Supabase
    const { data, error } = await supabase.rpc('fn_get_table_metadata', {
      tbl_name: tableName
    });
    
    if (error) {
      logger.error(`Error en stored procedure para ${tableName}:`, error);
      throw new Error(`No se pudieron obtener metadatos para la tabla ${tableName}: ${error.message}`);
    }
    
    if (!data || !data.columns || data.columns.length === 0) {
      logger.warn(`Stored procedure no retornó columnas para ${tableName}`);
      throw new Error(`La tabla ${tableName} no tiene columnas o no existe`);
    }
    
    // La función stored procedure ya retorna el formato correcto
    const metadata = data;
    
    // Guardar en cache
    metadataCache.set(tableName, metadata);
    logger.info(`Metadatos dinámicos obtenidos via stored procedure para: ${tableName}`);
    logger.debug(`Columnas encontradas: ${metadata.columns.length}, Constraints: ${metadata.constraints.length}`);
    
    return metadata;
  } catch (error) {
    logger.error(`Error obteniendo metadatos dinámicos para ${tableName}:`, error.message);
    throw error;
  }
};

logger.info('Cliente Supabase configurado');

// Función genérica para rutas de tablas
const createTableRoute = (tableName, orderBy = `${tableName}id`, selectQuery = '*') => {
  return async (req, res) => {
    try {
      const { limit = process.env.DEFAULT_LIMIT || 100 } = req.query;
      logger.debug(`Obteniendo ${tableName} del schema sense...`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select(selectQuery)
        .order(orderBy)
        .limit(parseInt(limit));
      
      if (error) {
        logger.error(`Error backend en ${tableName}:`, error);
        return res.status(500).json({ error: error.message });
      }
      
      logger.debug(`${tableName} obtenido:`, data?.length || 0);
      res.json(data || []);
    } catch (error) {
      logger.error(`Error in /api/sense/${tableName}:`, error);
      res.status(500).json({ error: error.message });
    }
  };
};

// Middleware para verificar autenticación (opcional por ahora)
const verifyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autorización requerido' });
  }

  const token = authHeader.substring(7);
    
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
        return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    return res.status(401).json({ error: 'Error verificando token' });
  }
};

// Rutas para tablas en singular - usadas por el frontend de parámetros
app.get('/api/sense/pais', createTableRoute('pais', 'paisid'));

app.get('/api/sense/empresa', createTableRoute('empresa', 'empresaid'));

app.get('/api/sense/fundo', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo fundo del schema sense...');
    const { data, error } = await supabase
      .from('fundo')
      .select(`
        *,
        empresa:empresaid(
          empresaid,
          empresa,
          empresabrev,
          paisid
        )
      `)
      .order('fundoid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Fundo obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/fundo:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/ubicacion', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo ubicacion del schema sense...');
    const { data, error } = await supabase
      .from('ubicacion')
      .select('*')
      .order('ubicacionid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Ubicacion obtenida:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/ubicacion:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/entidad', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo entidad del schema sense...');
    const { data, error } = await supabase
      .from('entidad')
      .select('*')
      .order('entidadid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Entidad obtenida:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/entidad:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/metrica', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo metrica del schema sense...');
    const { data, error } = await supabase
      .from('metrica')
      .select('*')
      .order('metricaid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Metrica obtenida:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/metrica:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/tipo', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo tipo del schema sense...');
    const { data, error } = await supabase
      .from('tipo')
      .select('*')
      .order('tipoid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Tipo obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/tipo:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/nodo', async (req, res) => {
  try {
    console.log('🔍 Backend: Obteniendo nodo del schema sense...');
    const result = await paginateAndFilter('nodo', req.query);
    
    if (result.pagination) {
      console.log(`✅ Backend: Nodo obtenidos: ${result.data.length} de ${result.pagination.total}`);
      res.json(result);
    } else {
      console.log(`✅ Backend: Nodo obtenidos (modo legacy): ${result.length}`);
      res.json(result);
    }
  } catch (error) { 
    console.error('❌ Error in /api/sense/nodo:', error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.get('/api/sense/criticidad', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo criticidad del schema sense...');
    const { data, error } = await supabase
      .from('criticidad')
      .select('*')
      .order('criticidadid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Criticidad obtenida:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/criticidad:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/perfil', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo perfil del schema sense...');
    const { data, error } = await supabase
      .from('perfil')
      .select('*')
      .order('perfilid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Perfil obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/perfil:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/umbral', async (req, res) => {
  try {
    console.log('🔍 Backend: Obteniendo umbral del schema sense...');
    const result = await paginateAndFilter('umbral', req.query);
    
    if (result.pagination) {
      console.log(`✅ Backend: Umbral obtenidos: ${result.data.length} de ${result.pagination.total}`);
      res.json(result);
    } else {
      console.log(`✅ Backend: Umbral obtenidos (modo legacy): ${result.length}`);
      res.json(result);
    }
  } catch (error) { 
    console.error('❌ Error in /api/sense/umbral:', error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.get('/api/sense/medio', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo medio del schema sense...');
    const { data, error } = await supabase
      .from('medio')
      .select('*')
      .order('medioid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Medio obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/medio:', error); res.status(500).json({ error: error.message }); }
});

app.get('/api/sense/sensor', async (req, res) => {
  try {
    console.log('🔍 Backend: Obteniendo sensor del schema sense...');
    const result = await paginateAndFilter('sensor', req.query);
    
    if (result.pagination) {
      console.log(`✅ Backend: Sensor obtenidos: ${result.data.length} de ${result.pagination.total}`);
      res.json(result);
    } else {
      console.log(`✅ Backend: Sensor obtenidos (modo legacy): ${result.length}`);
      res.json(result);
    }
  } catch (error) { 
    console.error('❌ Error in /api/sense/sensor:', error); 
    res.status(500).json({ error: error.message }); 
  }
});

// Ruta para metricasensor - usada por el frontend
app.get('/api/sense/metricasensor', async (req, res) => {
  try {
    console.log('🔍 Backend: Obteniendo metricasensor del schema sense...');
    
    // Usar el helper de paginación
    const result = await paginateAndFilter('metricasensor', req.query);
    
    // Si el resultado tiene paginación, enviarla; si no, enviar array simple (modo legacy)
    if (result.pagination) {
      console.log(`✅ Backend: Metricasensor obtenidos: ${result.data.length} de ${result.pagination.total}`);
      res.json(result);
    } else {
      console.log(`✅ Backend: Metricasensor obtenidos (modo legacy): ${result.length}`);
      res.json(result);
    }
  } catch (error) { 
    console.error('❌ Error in /api/sense/metricasensor:', error); 
    res.status(500).json({ error: error.message }); 
  }
});

// Ruta para perfilumbral - usada por el frontend
app.get('/api/sense/perfilumbral', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo perfilumbral del schema sense...');
    const { data, error } = await supabase
      .from('perfilumbral')
      .select('*')
      .order('perfilid, umbralid') // Ordenar por clave primaria compuesta
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Perfilumbral obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/perfilumbral:', error); res.status(500).json({ error: error.message }); }
});

// Ruta para usuarioperfil - usada por el frontend
app.get('/api/sense/usuarioperfil', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo usuarioperfil del schema sense...');
    const { data, error } = await supabase
      .from('usuarioperfil')
      .select('*')
      .order('usuarioid, perfilid') // Ordenar por clave primaria compuesta
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Usuarioperfil obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/usuarioperfil:', error); res.status(500).json({ error: error.message }); }
});

// Ruta para audit_log_umbral - usada por el frontend
app.get('/api/sense/audit_log_umbral', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo audit_log_umbral del schema sense...');
    const { data, error } = await supabase
      .from('audit_log_umbral')
      .select('*')
      .order('auditid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Audit_log_umbral obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/audit_log_umbral:', error); res.status(500).json({ error: error.message }); }
});

// Ruta para contacto - usada por el frontend
app.get('/api/sense/contacto', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo contacto del schema sense...');
    const { data, error } = await supabase
      .from('contacto')
      .select(`
        *,
        codigotelefono:codigotelefonoid(codigotelefono, paistelefono),
        usuario:usuarioid(login, firstname, lastname)
      `)
      .order('contactoid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Contacto obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/contacto:', error); res.status(500).json({ error: error.message }); }
});

// Ruta para codigotelefono - usada por el frontend
app.get('/api/sense/codigotelefono', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo codigotelefono del schema sense...');
    const { data, error } = await supabase
      .from('codigotelefono')
      .select('*')
      .eq('statusid', 1)
      .order('codigotelefonoid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Codigotelefono obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/codigotelefono:', error); res.status(500).json({ error: error.message }); }
});

// Ruta para correo - usada por el frontend
app.get('/api/sense/correo', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo correo del schema sense...');
    const { data, error } = await supabase
      .from('correo')
      .select(`
        *,
        usuario:usuarioid(login, firstname, lastname)
      `)
      .eq('statusid', 1)
      .order('correoid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Correo obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/correo:', error); res.status(500).json({ error: error.message }); }
});

// Ruta para localizacion - usada por el frontend
app.get('/api/sense/localizacion', async (req, res) => {
  try {
    console.log('🔍 Backend: Obteniendo localizacion del schema sense...');
    const result = await paginateAndFilter('localizacion', req.query);
    
    if (result.pagination) {
      console.log(`✅ Backend: Localizacion obtenidas: ${result.data.length} de ${result.pagination.total}`);
      res.json(result);
    } else {
      console.log(`✅ Backend: Localizacion obtenidas (modo legacy): ${result.length}`);
      res.json(result);
    }
  } catch (error) { 
    console.error('❌ Error in /api/sense/localizacion:', error); 
    res.status(500).json({ error: error.message }); 
  }
});

// Ruta para usuario - usada por el frontend
app.get('/api/sense/usuario', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Obteniendo usuarios de sense.usuario...');
    const { data, error } = await supabase
      .from('usuario')
      .select('*')
      .order('usuarioid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Usuarios encontrados:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/usuario:', error); res.status(500).json({ error: error.message }); }
});

// Ruta para alerta - usada por el frontend
app.get('/api/sense/alerta', async (req, res) => {
  try {
    const { page, pageSize = 100, search = '', sortBy = 'datecreated', sortOrder = 'desc', ...filters } = req.query;
    const usePagination = page !== undefined && page !== null;
    
    console.log('🔍 Obteniendo alertas de sense.alerta...');
    
    // Query base con joins
    let query = supabase
      .from('alerta')
      .select(`
        *,
        umbral:umbralid(
          umbralid,
          umbral,
          minimo,
          maximo,
          nodoid,
          tipoid,
          metricaid,
          ubicacionid,
          criticidadid
        ),
        medicion:medicionid(
          medicionid,
          medicion,
          fecha,
          nodoid,
          tipoid,
          metricaid
        )
      `, { count: 'exact' });
    
    // Aplicar filtros (excluir sortBy y sortOrder)
    Object.keys(filters).forEach(key => {
      if (key !== 'sortBy' && key !== 'sortOrder') {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        const numValue = Number(value);
        query = query.eq(key, isNaN(numValue) ? value : numValue);
        }
      }
    });
    
    // Búsqueda
    if (search && search.trim() !== '') {
      const searchTerm = search.trim().toLowerCase();
      query = query.or(`alerta.ilike.%${searchTerm}%,nodoid.ilike.%${searchTerm}%`);
    }
    
    // Obtener total
    const { count: totalRecords } = await query;
    
    // Ordenar usando sortBy y sortOrder del query string
    const sortColumn = sortBy || 'datecreated';
    const ascending = sortOrder === 'asc';
    query = query.order(sortColumn, { ascending });
    
    if (usePagination) {
      const pageNum = parseInt(page);
      const pageSizeNum = parseInt(pageSize);
      const from = (pageNum - 1) * pageSizeNum;
      const to = from + pageSizeNum - 1;
      query = query.range(from, to);
      
      console.log(`📄 Paginación: Tabla=alerta, Página=${pageNum}, Tamaño=${pageSizeNum}, Total=${totalRecords}`);
      
      const { data, error } = await query;
      if (error) { 
        console.error('❌ Error backend:', error); 
        return res.status(500).json({ error: error.message }); 
      }
      
      console.log(`✅ Alertas encontradas: ${data?.length || 0} de ${totalRecords}`);
      const totalPages = Math.ceil(totalRecords / pageSizeNum);
      
      res.json({
        data: data || [],
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total: totalRecords || 0,
          totalPages: totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      });
    } else {
      // Modo legacy: obtener todos
      console.log(`📚 Modo legacy: Cargando todas las alertas`);
      let allData = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: batchData, error } = await supabase
          .from('alerta')
          .select(`
            *,
            umbral:umbralid(
              umbralid,
              umbral,
              minimo,
              maximo,
              nodoid,
              tipoid,
              metricaid,
              ubicacionid,
              criticidadid
            ),
            medicion:medicionid(
              medicionid,
              medicion,
          fecha,
          nodoid,
          tipoid,
          metricaid
        )
      `)
      .order('alertaid', { ascending: false })
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

      console.log(`✅ Alertas encontradas (modo legacy): ${allData.length}`);
      res.json(allData);
    }
  } catch (error) { 
    console.error('❌ Error in /api/sense/alerta:', error); 
    res.status(500).json({ error: error.message }); 
  }
});

// Ruta para mensaje - usada por el frontend
app.get('/api/sense/mensaje', async (req, res) => {
  try {
    const { page, pageSize = 100, search = '', sortBy = 'datecreated', sortOrder = 'desc', ...filters } = req.query;
    const usePagination = page !== undefined && page !== null;
    
    console.log('🔍 Obteniendo mensajes de sense.mensaje...');
    
    // Query base con joins
    let query = supabase
      .from('mensaje')
      .select(`
        *,
        contacto:contactoid(
          contactoid,
          celular,
          usuarioid,
          usuario:usuarioid(login, firstname, lastname)
        )
      `, { count: 'exact' });
    
    // Aplicar filtros (excluir sortBy y sortOrder)
    Object.keys(filters).forEach(key => {
      if (key !== 'sortBy' && key !== 'sortOrder') {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        const numValue = Number(value);
        query = query.eq(key, isNaN(numValue) ? value : numValue);
        }
      }
    });
    
    // Búsqueda
    if (search && search.trim() !== '') {
      const searchTerm = search.trim().toLowerCase();
      query = query.or(`mensaje.ilike.%${searchTerm}%,contactoid.ilike.%${searchTerm}%`);
    }
    
    // Obtener total
    const { count: totalRecords } = await query;
    
    // Ordenar usando sortBy y sortOrder del query string
    const sortColumn = sortBy || 'datecreated';
    const ascending = sortOrder === 'asc';
    query = query.order(sortColumn, { ascending });
    
    if (usePagination) {
      const pageNum = parseInt(page);
      const pageSizeNum = parseInt(pageSize);
      const from = (pageNum - 1) * pageSizeNum;
      const to = from + pageSizeNum - 1;
      query = query.range(from, to);
      
      console.log(`📄 Paginación: Tabla=mensaje, Página=${pageNum}, Tamaño=${pageSizeNum}, Total=${totalRecords}`);
      
      const { data, error } = await query;
      if (error) { 
        console.error('❌ Error backend:', error); 
        return res.status(500).json({ error: error.message }); 
      }
      
      console.log(`✅ Mensajes encontrados: ${data?.length || 0} de ${totalRecords}`);
      const totalPages = Math.ceil(totalRecords / pageSizeNum);
      
      res.json({
        data: data || [],
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total: totalRecords || 0,
          totalPages: totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      });
    } else {
      // Modo legacy: obtener todos
      console.log(`📚 Modo legacy: Cargando todos los mensajes`);
      let allData = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: batchData, error } = await supabase
      .from('mensaje')
      .select(`
        *,
        contacto:contactoid(
          contactoid,
          celular,
          usuarioid,
          usuario:usuarioid(login, firstname, lastname)
        )
      `)
      .order('fecha', { ascending: false })
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

      console.log(`✅ Mensajes encontrados (modo legacy): ${allData.length}`);
      res.json(allData);
    }
  } catch (error) { 
    console.error('❌ Error in /api/sense/mensaje:', error); 
    res.status(500).json({ error: error.message }); 
  }
});

// Ruta para alertaconsolidado - usada por el frontend
app.get('/api/sense/alertaconsolidado', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Obteniendo alertas consolidadas de sense.alertaconsolidado...');
    const { data, error } = await supabase
      .from('alertaconsolidado')
      .select('*')
      .order('fecha_inicio', { ascending: false })
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Alertas consolidadas encontradas:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/alertaconsolidado:', error); res.status(500).json({ error: error.message }); }
});

// Rutas para obtener información de las tablas (usadas por el frontend de parámetros)
app.get('/api/sense/:tableName/columns', async (req, res) => {
  try {
    const { tableName } = req.params;
    console.log(`🔍 Backend: Obteniendo columnas de la tabla ${tableName}...`);
    
    // Usar metadatos dinámicos con fallback a hardcodeados
    const metadata = await getTableMetadata(tableName);
    if (!metadata) {
      console.error(`❌ Tabla ${tableName} no encontrada en metadatos`);
      return res.status(404).json({ error: `Tabla ${tableName} no encontrada` });
    }

    console.log(`✅ Backend: Columnas obtenidas para ${tableName}:`, metadata.columns.length);
    res.json(metadata.columns);
  } catch (error) {
    console.error(`❌ Error in /api/sense/${req.params.tableName}/columns:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/:tableName/info', async (req, res) => {
  try {
    const { tableName } = req.params;
    console.log(`🔍 Backend: Obteniendo información de la tabla ${tableName}...`);
    
    // Usar metadatos dinámicos con fallback a hardcodeados
    const metadata = await getTableMetadata(tableName);
    if (!metadata) {
      console.error(`❌ Tabla ${tableName} no encontrada en metadatos`);
      return res.status(404).json({ error: `Tabla ${tableName} no encontrada` });
    }

    console.log(`✅ Backend: Información obtenida para ${tableName}`);
    res.json(metadata.info);
  } catch (error) {
    console.error(`❌ Error in /api/sense/${req.params.tableName}/info:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/:tableName/constraints', async (req, res) => {
  try {
    const { tableName } = req.params;
    console.log(`🔍 Backend: Obteniendo constraints de la tabla ${tableName}...`);
    
    // Usar metadatos dinámicos con fallback a hardcodeados
    const metadata = await getTableMetadata(tableName);
    if (!metadata) {
      console.error(`❌ Tabla ${tableName} no encontrada en metadatos`);
      return res.status(404).json({ error: `Tabla ${tableName} no encontrada` });
    }

    console.log(`✅ Backend: Constraints obtenidos para ${tableName}:`, metadata.constraints.length);
    res.json(metadata.constraints);
  } catch (error) {
    console.error(`❌ Error in /api/sense/${req.params.tableName}/constraints:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener tablas disponibles dinámicamente
app.get('/api/sense/tables', async (req, res) => {
  try {
    console.log('🔍 Obteniendo tablas disponibles en schema sense...');
    
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'sense')
      .eq('table_type', 'BASE TABLE');
    
    if (error) {
      console.error('❌ Error obteniendo tablas:', error);
      return res.status(500).json({ error: 'Error obteniendo tablas' });
    }
    
    console.log('✅ Tablas encontradas:', tables.length);
    res.json(tables);
  } catch (error) {
    console.error('❌ Error inesperado obteniendo tablas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para login en modo desarrollo
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Backend: Intentando autenticar usuario (modo desarrollo):', email);

    // Verificar si el usuario existe en la tabla sense.usuario
    const { data: userData, error: userError } = await supabase
      .from('usuario')
      .select('*')
      .eq('login', email)
      .single();

    if (userError || !userData) {
      console.error('❌ Usuario no encontrado en sense.usuario:', userError?.message);
      return res.status(401).json({ 
        success: false,
        error: 'Usuario no encontrado. Verifique el email.' 
      });
    }

    if (userData.statusid !== 1) {
      console.error('❌ Usuario inactivo (statusid != 1)');
      return res.status(401).json({ 
        success: false,
        error: 'Usuario inactivo. Contacte al administrador.' 
      });
    }

    // Validar contraseña con bcrypt si existe password_hash
    if (userData.password_hash) {
      console.log('🔐 Validando contraseña con hash bcrypt...');
    const isPasswordValid = await bcrypt.compare(password, userData.password_hash);

    if (!isPasswordValid) {
        console.error('❌ Contraseña incorrecta');
      return res.status(401).json({ 
        success: false,
          error: 'Contraseña incorrecta. Verifique sus credenciales.'
      });
      }
      console.log('✅ Contraseña validada correctamente');
    } else {
      console.warn('⚠️ Usuario sin password_hash - permitiendo login por compatibilidad');
    }

    console.log('✅ Usuario autenticado exitosamente:', email);

    // Crear respuesta de usuario autenticado
    const authenticatedUser = {
      id: `dev-${userData.usuarioid}`,
      email: email,
      user_metadata: {
        full_name: `${userData.firstname} ${userData.lastname}`,
        rol: 'admin', // Asumimos admin por ahora
        usuarioid: userData.usuarioid,
        auth_user_id: userData.auth_user_id
      }
    };

    res.json({
      success: true,
      user: authenticatedUser
    });

  } catch (error) {
    console.error('❌ Error inesperado durante autenticación:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// Endpoint para verificar autenticación
app.get('/api/auth/verify', verifyAuth, (req, res) => {
  if (req.user) {
    res.json({ 
      authenticated: true, 
      user: {
        id: req.user.id,
        email: req.user.email,
        user_metadata: req.user.user_metadata
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Rutas PUT para actualizar registros
app.put('/api/sense/pais/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando pais con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('pais')
      .update(updateData)
      .eq('paisid', id)
      .select();

      if (error) {
        console.error('❌ Error backend:', error);
        return res.status(500).json({ error: error.message });
      }

    console.log(`✅ Backend: Pais actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/empresa/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando empresa con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('empresa')
      .update(updateData)
      .eq('empresaid', id)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Empresa actualizada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/fundo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando fundo con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('fundo')
      .update(updateData)
      .eq('fundoid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Fundo actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/ubicacion/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando ubicacion con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('ubicacion')
      .update(updateData)
      .eq('ubicacionid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Ubicacion actualizada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/entidad/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando entidad con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('entidad')
      .update(updateData)
      .eq('entidadid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Entidad actualizada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/metrica/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando metrica con ID ${id}...`);
    console.log(`🔍 Backend: updateData recibido:`, updateData);
    console.log(`🔍 Backend: unidad value:`, updateData.unidad);
    console.log(`🔍 Backend: unidad type:`, typeof updateData.unidad);
    
    const { data, error } = await supabase
      .from('metrica')
      .update(updateData)
      .eq('metricaid', id)
      .select();

    if (error) {
      console.error('❌ Error backend Supabase:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Metrica actualizada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend catch:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/tipo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando tipo con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('tipo')
      .update(updateData)
      .eq('tipoid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Tipo actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/nodo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando nodo con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('nodo')
      .update(updateData)
      .eq('nodoid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Nodo actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/criticidad/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando criticidad con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('criticidad')
      .update(updateData)
      .eq('criticidadid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Criticidad actualizada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/perfil/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando perfil con ID ${id}...`);
    console.log('🔍 Backend: Actualizando perfil');
    
    // Validar que el ID sea un número
    if (isNaN(id)) {
      console.error('❌ Error: ID debe ser un número');
      return res.status(400).json({ error: 'ID debe ser un número' });
    }
    
    // Validar que updateData no esté vacío
    if (!updateData || Object.keys(updateData).length === 0) {
      console.error('❌ Error: No hay datos para actualizar');
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }
    
    const { data, error } = await supabase
      .from('perfil')
      .update(updateData)
      .eq('perfilid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Perfil actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/umbral/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando umbral con ID ${id}...`);
    
    // VALIDACIÓN EMPRESARIAL: Si se reactiva umbral (statusid = 1), metricasensor debe estar activo
    const statusId = parseInt(updateData.statusid);
    
    if (statusId === 1 && updateData.nodoid && updateData.tipoid && updateData.metricaid) {
      const { data: metricasensor, error: metricaError } = await supabase
        .from('metricasensor')
        .select('statusid')
        .eq('nodoid', parseInt(updateData.nodoid))
        .eq('tipoid', parseInt(updateData.tipoid))
        .eq('metricaid', parseInt(updateData.metricaid))
        .single();
      
      if (metricaError && metricaError.code !== 'PGRST116') {
        console.error('❌ Error al verificar metricasensor:', metricaError);
        return res.status(500).json({ 
          success: false, 
          error: 'No se pudo verificar el estado de la métrica' 
        });
      }
      
      if (metricasensor && metricasensor.statusid !== 1) {
        console.log('⚠️ Validación: Intento de reactivar umbral con métrica inactiva');
        return res.status(400).json({ 
          success: false,
          error: 'No se puede reactivar el umbral: la métrica del sensor está inactiva',
          requireAction: 'activate_metricasensor_first',
          metricasensorStatus: metricasensor.statusid
        });
      }
    }
    
    console.log(`🔍 Backend: Tipos de datos:`, Object.keys(updateData).map(key => `${key}: ${typeof updateData[key]}`));
    
    const { data, error } = await supabase
      .from('umbral')
      .update(updateData)
      .eq('umbralid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Umbral actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/medio/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando medio con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('medio')
      .update(updateData)
      .eq('medioid', id)
      .select();

      if (error) {
      console.error('❌ Error backend:', error);
        return res.status(500).json({ error: error.message });
      }

    console.log(`✅ Backend: Medio actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Nota: La tabla sensor usa clave compuesta (nodoid, tipoid), no ID simple
// La ruta PUT para sensor se maneja con las rutas de clave compuesta

// Nota: La tabla metricasensor usa clave compuesta (nodoid, metricaid, tipoid), no ID simple
// La ruta PUT para metricasensor se maneja con las rutas de clave compuesta

app.put('/api/sense/contacto/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando contacto con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('contacto')
      .update(updateData)
      .eq('contactoid', id)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Contacto actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta para actualizar correo
app.put('/api/sense/correo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando correo con ID ${id}...`);
    console.log('🔍 Backend: Actualizando perfil');
    
    // Validar formato de correo si se está actualizando
    if (updateData.correo) {
      if (!EMAIL_REGEX.test(updateData.correo)) {
        return res.status(400).json({ error: 'Formato de correo inválido' });
      }
    }
    
    const { data, error } = await supabase
      .from('correo')
      .update(updateData)
      .eq('correoid', id)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Correo actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para detectar si el esquema sense está disponible (usado por frontend)
app.get('/api/sense/detect', async (req, res) => {
  try {
    console.log(`🔍 Backend: Detectando esquema '${dbSchema}' para frontend...`);

    // Verificar si podemos acceder a una tabla del esquema
    const { data, error } = await supabase
      .from('usuario')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error(`❌ Error detectando esquema ${dbSchema}:`, error);
      return res.status(404).json({
        available: false,
        error: `Esquema ${dbSchema} no disponible`,
        details: error.message
      });
    }

    console.log(`✅ Esquema '${dbSchema}' detectado exitosamente`);
    res.json({
      available: true,
      schema: dbSchema,
      totalUsers: data,
      message: `Esquema '${dbSchema}' está disponible`
    });
  } catch (error) {
    console.error(`❌ Error inesperado detectando esquema ${dbSchema}:`, error);
    res.status(404).json({
      available: false,
      error: `Error interno detectando esquema ${dbSchema}`,
      details: error.message
    });
  }
});

// Endpoint genérico POST para insertar en cualquier tabla del esquema sense
app.post('/api/sense/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const insertData = req.body;

    console.log(`🔍 Backend: Insertando en tabla '${tableName}'...`);

    // MANEJO ESPECIAL PARA USUARIOS: Encriptar contraseña si viene
    if (tableName === 'usuario' && insertData.password) {
      console.log(`🔐 Encriptando contraseña para nuevo usuario...`);
      insertData.password_hash = await bcrypt.hash(insertData.password, 10);
      delete insertData.password; // Eliminar contraseña en texto plano
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert([insertData])
      .select();

    if (error) {
      console.error(`❌ Error insertando en ${tableName}:`, error);
      return res.status(500).json({
        error: `Error insertando en tabla ${tableName}`,
        details: error.message
      });
    }

    console.log(`✅ Registro insertado en '${tableName}':`, data.length, 'registros');
    res.json(data);
  } catch (error) {
    console.error(`❌ Error inesperado insertando en ${req.params.tableName}:`, error);
    res.status(500).json({
      error: `Error interno del servidor insertando en ${req.params.tableName}`,
      details: error.message
    });
  }
});

app.put('/api/sense/usuario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log(`🔍 Backend: Actualizando usuario con ID ${id}...`);

    // Encriptar contraseña si está presente
    if (updateData.password) {
      updateData.password_hash = await bcrypt.hash(updateData.password, 10);
      delete updateData.password; // Eliminar contraseña en texto plano
    }

    const { data, error } = await supabase
      .from('usuario')
      .update(updateData)
      .eq('usuarioid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Usuario actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rutas PUT para tablas con claves compuestas
app.put('/api/sense/localizacion/:ubicacionid/:nodoid', async (req, res) => {
  try {
    const { ubicacionid, nodoid } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando localizacion con ubicacionid ${ubicacionid} y nodoid ${nodoid}...`);
    
    const { data, error } = await supabase
      .from('localizacion')
      .update(updateData)
      .eq('ubicacionid', ubicacionid)
      .eq('nodoid', nodoid)
      .select();
      
      if (error) {
      console.error('❌ Error backend:', error);
        return res.status(500).json({ error: error.message });
      }
      
    console.log(`✅ Backend: Localizacion actualizada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta PUT para localizacion con query parameters (para compatibilidad con frontend)
app.put('/api/sense/localizacion/composite', async (req, res) => {
  try {
    const { ubicacionid, nodoid, entidadid } = req.query;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando localizacion con query params - ubicacionid: ${ubicacionid}, nodoid: ${nodoid}, entidadid: ${entidadid}...`);
    console.log(`🔍 Backend: Tipos de datos - ubicacionid: ${typeof ubicacionid}, nodoid: ${typeof nodoid}, entidadid: ${typeof entidadid}`);
    
    const { data, error } = await supabase
        .from('localizacion')
      .update(updateData)
      .eq('ubicacionid', ubicacionid)
      .eq('nodoid', nodoid)
      .eq('entidadid', entidadid)
      .select();
    
    if (error) {
      console.error('❌ Error backend en localizacion:', error);
      console.error('❌ Detalles del error:', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Localizacion actualizada: ${data.length} registros`);
    console.log(`✅ Backend: Datos actualizados:`, JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/perfilumbral/:perfilid/:umbralid', async (req, res) => {
  try {
    const { perfilid, umbralid } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando perfilumbral con perfilid ${perfilid} y umbralid ${umbralid}...`);
    
    const { data, error } = await supabase
      .from('perfilumbral')
      .update(updateData)
      .eq('perfilid', perfilid)
      .eq('umbralid', umbralid)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Perfilumbral actualizado: ${data.length} registros`);
    res.json(data);
      } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta PUT para perfilumbral con query parameters (para compatibilidad con frontend)
app.put('/api/sense/perfilumbral/composite', async (req, res) => {
  try {
    const { perfilid, umbralid } = req.query;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando perfilumbral con query params - perfilid: ${perfilid}, umbralid: ${umbralid}...`);
    
    const { data, error } = await supabase
      .from('perfilumbral')
      .update(updateData)
      .eq('perfilid', perfilid)
      .eq('umbralid', umbralid)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Perfilumbral actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sense/usuarioperfil/:usuarioid/:perfilid', async (req, res) => {
  try {
    const { usuarioid, perfilid } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando usuarioperfil con usuarioid ${usuarioid} y perfilid ${perfilid}...`);
    
    const { data, error } = await supabase
      .from('usuarioperfil')
      .update(updateData)
      .eq('usuarioid', usuarioid)
      .eq('perfilid', perfilid)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Usuarioperfil actualizado: ${data.length} registros`);
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta PUT para usuarioperfil con query parameters (para compatibilidad con frontend)
app.put('/api/sense/usuarioperfil/composite', async (req, res) => {
  try {
    const { usuarioid, perfilid } = req.query;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando usuarioperfil con query params - usuarioid: ${usuarioid}, perfilid: ${perfilid}...`);
    
    const { data, error } = await supabase
      .from('usuarioperfil')
      .update(updateData)
      .eq('usuarioid', usuarioid)
      .eq('perfilid', perfilid)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Usuarioperfil actualizado: ${data.length} registros`);
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta PUT para sensor con clave compuesta (path parameters)
app.put('/api/sense/sensor/:nodoid/:tipoid', async (req, res) => {
  try {
    const { nodoid, tipoid } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando sensor con nodoid ${nodoid} y tipoid ${tipoid}...`);
    
    const { data, error } = await supabase
      .from('sensor')
      .update(updateData)
      .eq('nodoid', nodoid)
      .eq('tipoid', tipoid)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Sensor actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta PUT para metricasensor con query parameters (para clave compuesta)
app.put('/api/sense/metricasensor/composite', async (req, res) => {
  try {
    const { nodoid, metricaid, tipoid } = req.query;
    const updateData = req.body;
    console.log(`🔍 Backend: Actualizando metricasensor con query params - nodoid: ${nodoid}, metricaid: ${metricaid}, tipoid: ${tipoid}...`);

    // VALIDACIÓN EMPRESARIAL: Si se reactiva métrica (statusid = 1), sensor debe estar activo
    // Convertir a número para comparación (puede venir como string desde el frontend)
    const statusId = parseInt(updateData.statusid);
    
    if (statusId === 1) {
      const { data: sensor, error: sensorError } = await supabase
        .from('sensor')
        .select('statusid')
        .eq('nodoid', parseInt(nodoid))
        .eq('tipoid', parseInt(tipoid))
        .single();
      
      if (sensorError) {
        console.error('❌ Error verificando sensor:', sensorError);
        return res.status(500).json({ 
          success: false, 
          error: 'Error verificando estado del sensor' 
        });
      }
      
      if (sensor && sensor.statusid !== 1) {
        console.log('⚠️ Validación: Intento de reactivar métrica con sensor inactivo');
        return res.status(400).json({ 
          success: false,
          error: 'No se puede reactivar la métrica: el sensor está inactivo',
          requireAction: 'activate_sensor_first',
          sensorStatus: sensor.statusid
        });
      }
    }

    // Usar upsert para crear o actualizar la entrada
    const { data, error } = await supabase
      .from('metricasensor')
      .upsert({
        nodoid: parseInt(nodoid),
        metricaid: parseInt(metricaid),
        tipoid: parseInt(tipoid),
        ...updateData
      })
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log(`✅ Backend: Metricasensor actualizado: ${data.length} registros`);
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta PUT para sensor con query parameters (para compatibilidad con frontend)
app.put('/api/sense/sensor/composite', async (req, res) => {
  try {
    const { nodoid, tipoid } = req.query;
    const updateData = req.body;
    console.log(`🔍 Backend: Actualizando sensor con query params - nodoid: ${nodoid}, tipoid: ${tipoid}...`);

    // Validación de negocio
    if (!nodoid || !tipoid) {
      return res.status(400).json({ error: 'nodoid y tipoid son requeridos' });
    }

    // Usar upsert para crear o actualizar la entrada
    const { data, error } = await supabase
      .from('sensor')
      .upsert({
        nodoid: parseInt(nodoid),
        tipoid: parseInt(tipoid),
        ...updateData
      })
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log(`✅ Backend: Sensor actualizado: ${data.length} registros`);
    
    // CASCADA EMPRESARIAL: Si se desactiva sensor (statusid = 0), desactivar métricas Y umbrales asociados
    const statusId = parseInt(updateData.statusid);
    
    if (statusId === 0) {
      // 1. Desactivar metricasensor asociados
      const cascadeUpdate = {
        statusid: 0,
        datemodified: new Date().toISOString()
      };
      
      if (updateData.usermodifiedid) {
        cascadeUpdate.usermodifiedid = updateData.usermodifiedid;
      }
      
      const { data: cascadeMetricas, error: cascadeMetricasError } = await supabase
        .from('metricasensor')
        .update(cascadeUpdate)
        .eq('nodoid', parseInt(nodoid))
        .eq('tipoid', parseInt(tipoid))
        .select();
      
      if (cascadeMetricasError) {
        console.error('⚠️ Error en cascada de métricas:', cascadeMetricasError);
      } else {
        console.log(`✅ Cascada Nivel 1: ${cascadeMetricas?.length || 0} métricas desactivadas`);
      }
      
      // 2. Desactivar umbrales asociados
      const { data: cascadeUmbrales, error: cascadeUmbralesError } = await supabase
        .from('umbral')
        .update(cascadeUpdate)
        .eq('nodoid', parseInt(nodoid))
        .eq('tipoid', parseInt(tipoid))
        .select();
      
      if (cascadeUmbralesError) {
        console.error('⚠️ Error en cascada de umbrales:', cascadeUmbralesError);
      } else {
        console.log(`✅ Cascada Nivel 2: ${cascadeUmbrales?.length || 0} umbrales desactivados`);
      }
    }
    
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/sense/audit_log_umbral/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando audit_log_umbral con ID ${id}...`);
    
    const { data, error } = await supabase
      .from('audit_log_umbral')
      .update(updateData)
      .eq('auditid', id)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Audit_log_umbral actualizado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta para detectar schema disponible
app.get('/api/detect', async (req, res) => {
  try {
    console.log('🔍 Detectando schema disponible...');
    
    // Probar schema 'sense' usando una tabla conocida
    const { data: senseData, error: senseError } = await supabase
      .from('pais')
      .select('paisid')
        .limit(1);

    if (!senseError && senseData) {
      console.log('✅ Schema "sense" detectado y disponible');
      res.json({ available: true, schema: 'sense' });
      } else {
      console.log('❌ Schema "sense" no disponible, usando "public"');
      res.json({ available: false, schema: 'public' });
      }
    } catch (error) {
    console.error('❌ Error detectando schema:', error);
    res.json({ available: false, schema: 'public' });
  }
});

// Rutas en plural para filtros globales (usadas por el frontend)
app.get('/api/sense/paises', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log(`🔍 Backend: Obteniendo paises del schema sense...`);
    
    const { data, error } = await supabase
      .from('pais')
      .select('*')
      .eq('statusid', 1)
      .limit(parseInt(limit));

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Paises obtenidos: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/empresas', async (req, res) => {
  try {
    const { limit = 100, paisId } = req.query;
    console.log(`🔍 Backend: Obteniendo empresas del schema sense...`);
    
    let query = supabase
      .from('empresa')
      .select('*')
      .eq('statusid', 1);
    
    if (paisId) {
      query = query.eq('paisid', paisId);
    }
    
    const { data, error } = await query.limit(parseInt(limit));
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Empresas obtenidas: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/fundos', async (req, res) => {
  try {
    const { limit = 100, empresaId } = req.query;
    console.log(`🔍 Backend: Obteniendo fundos del schema sense...`);

    let query = supabase
      .from('fundo')
      .select('*')
      .eq('statusid', 1);
    
    if (empresaId) {
      query = query.eq('empresaid', empresaId);
    }
    
    const { data, error } = await query.limit(parseInt(limit));
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Fundos obtenidos: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/ubicaciones', async (req, res) => {
  try {
    const { limit = 100, fundoId } = req.query;
    console.log(`🔍 Backend: Obteniendo ubicaciones del schema sense...`);
    
    let query = supabase
      .from('ubicacion')
      .select('*')
      .eq('statusid', 1);
    
    if (fundoId) {
      query = query.eq('fundoid', fundoId);
    }
    
    const { data, error } = await query.limit(parseInt(limit));
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Ubicaciones obtenidas: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/entidades', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log(`🔍 Backend: Obteniendo entidades del schema sense...`);
    
    const { data, error } = await supabase
      .from('entidad')
      .select('*')
      .eq('statusid', 1)
      .limit(parseInt(limit));

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Entidades obtenidas: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/metricas', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log(`🔍 Backend: Obteniendo metricas del schema sense...`);
    
    const { data, error } = await supabase
      .from('metrica')
      .select('*')
      .eq('statusid', 1)
      .limit(parseInt(limit));
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Metricas obtenidas: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/nodos', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log(`🔍 Backend: Obteniendo nodos del schema sense...`);
    
    const { data, error } = await supabase
      .from('nodo')
        .select('*')
      .eq('statusid', 1)
      .limit(parseInt(limit));
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Nodos obtenidos: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/tipos', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log(`🔍 Backend: Obteniendo tipos del schema sense...`);
    
    const { data, error } = await supabase
      .from('tipo')
      .select('*')
      .eq('statusid', 1)
      .limit(parseInt(limit));

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Tipos obtenidos: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/localizaciones', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log(`🔍 Backend: Obteniendo localizaciones del schema sense...`);
    
    const { data, error } = await supabase
      .from('localizacion')
      .select('*')
      .eq('statusid', 1)
      .limit(parseInt(limit));
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Localizaciones obtenidas: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener nodos con localizaciones completas (para mapa)
app.get('/api/sense/nodos-con-localizacion', async (req, res) => {
  try {
    const { limit = 1000 } = req.query;
    console.log(`🔍 Backend: Obteniendo nodos con localizaciones del schema sense...`);
    
    // Estrategia: obtener nodos activos primero, luego sus localizaciones
    console.log('🔄 Paso 1: Obteniendo nodos activos...');
    const { data: nodos, error: nodosError } = await supabase
      .from('nodo')
      .select('*')
      .eq('statusid', 1)
      .limit(parseInt(limit));
    
    if (nodosError) {
      console.error('❌ Error obteniendo nodos:', nodosError);
      return res.status(500).json({ error: nodosError.message });
    }
    
    console.log(`✅ Nodos obtenidos: ${nodos.length}`);
    
    if (nodos.length === 0) {
      console.log('⚠️ No hay nodos activos');
      return res.json([]);
    }
    
    // Paso 2: obtener localizaciones para estos nodos
    console.log('🔄 Paso 2: Obteniendo localizaciones...');
    const nodoIds = nodos.map(n => n.nodoid);
    
    const { data: localizaciones, error: locError } = await supabase
      .from('localizacion')
      .select('*')
      .in('nodoid', nodoIds)
      .eq('statusid', 1)
      .not('latitud', 'is', null)
      .not('longitud', 'is', null);
    
    if (locError) {
      console.error('❌ Error obteniendo localizaciones:', locError);
      return res.status(500).json({ error: locError.message });
    }
    
    console.log(`✅ Localizaciones obtenidas: ${localizaciones.length}`);
    
    // Paso 3: obtener ubicaciones con fundos
    console.log('🔄 Paso 3: Obteniendo ubicaciones con fundos...');
    const ubicacionIds = [...new Set(localizaciones.map(l => l.ubicacionid))];
    
    const { data: ubicaciones, error: ubiError } = await supabase
      .from('ubicacion')
      .select(`
        *,
        fundo: fundoid (
          fundoid,
          fundo,
          fundoabrev,
          empresaid,
          empresa: empresaid (
            empresaid,
            empresa,
            empresabrev,
            paisid,
            pais: paisid (
              paisid,
              pais,
              paisabrev
            )
          )
        )
      `)
      .in('ubicacionid', ubicacionIds);
    
    if (ubiError) {
      console.error('❌ Error obteniendo ubicaciones:', ubiError);
      return res.status(500).json({ error: ubiError.message });
    }
    
    console.log(`✅ Ubicaciones obtenidas: ${ubicaciones.length}`);
    
    // Paso 4: obtener entidades
    console.log('🔄 Paso 4: Obteniendo entidades...');
    const entidadIds = [...new Set(localizaciones.map(l => l.entidadid).filter(id => id))];
    
    const { data: entidades, error: entError } = await supabase
      .from('entidad')
      .select('*')
      .in('entidadid', entidadIds);
    
    if (entError) {
      console.error('❌ Error obteniendo entidades:', entError);
      return res.status(500).json({ error: entError.message });
    }
    
    console.log(`✅ Entidades obtenidas: ${entidades.length}`);
    
    // Paso 5: combinar datos
    console.log('🔄 Paso 5: Combinando datos...');
    const resultado = localizaciones.map(loc => {
      const nodo = nodos.find(n => n.nodoid === loc.nodoid);
      const ubicacion = ubicaciones.find(u => u.ubicacionid === loc.ubicacionid);
      const entidad = entidades.find(e => e.entidadid === loc.entidadid);
      
      return {
        nodoid: loc.nodoid,
        nodo: nodo?.nodo || `Nodo ${loc.nodoid}`,
        deveui: nodo?.deveui || 'N/A',
        ubicacionid: loc.ubicacionid,
        latitud: loc.latitud,
        longitud: loc.longitud,
        referencia: loc.referencia,
        ubicacion: {
          ubicacion: ubicacion?.ubicacion || `Ubicación ${loc.ubicacionid}`,
          ubicacionabrev: ubicacion?.ubicacion || `U${loc.ubicacionid}`, // Usar ubicacion como abreviación
          fundoid: ubicacion?.fundoid || null,
          fundo: {
            fundo: ubicacion?.fundo?.fundo || 'N/A',
            fundoabrev: ubicacion?.fundo?.fundoabrev || 'N/A',
            empresa: {
              empresaid: ubicacion?.fundo?.empresa?.empresaid || null,
              empresa: ubicacion?.fundo?.empresa?.empresa || 'N/A',
              empresabrev: ubicacion?.fundo?.empresa?.empresabrev || 'N/A',
              pais: {
                paisid: ubicacion?.fundo?.empresa?.pais?.paisid || null,
                pais: ubicacion?.fundo?.empresa?.pais?.pais || 'N/A',
                paisabrev: ubicacion?.fundo?.empresa?.pais?.paisabrev || 'N/A'
              }
            }
          }
        },
        entidad: {
          entidadid: entidad?.entidadid || loc.entidadid || 1,
          entidad: entidad?.entidad || 'N/A'
        }
      };
    });
    
    console.log(`✅ Backend: Nodos con localizaciones procesados: ${resultado.length}`);
    res.json(resultado);
    
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta para detectar schema disponible (alias para sense)
app.get('/api/sense/detect', async (req, res) => {
  try {
    console.log('🔍 Detectando schema disponible via /api/sense/detect...');
    
    // Probar schema 'sense' usando una tabla conocida
    const { data: senseData, error: senseError } = await supabase
      .from('pais')
      .select('paisid')
      .limit(1);

    if (!senseError && senseData) {
      console.log('✅ Schema "sense" detectado y disponible');
      res.json({ available: true, schema: 'sense' });
    } else {
      console.log('❌ Schema "sense" no disponible, usando "public"');
      res.json({ available: false, schema: 'public' });
    }
  } catch (error) {
    console.error('❌ Error detectando schema:', error);
    res.json({ available: false, schema: 'public' });
  }
});

// ===== RUTAS POST PARA INSERCIÓN DE DATOS =====

// Ruta POST para insertar país
app.post('/api/sense/pais', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando país...');

    // Eliminar paisid para que PostgreSQL lo genere automáticamente
    const { paisid, ...dataWithoutId } = insertData;

    const { data, error } = await supabase
      .from('pais')
      .insert(dataWithoutId)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: País insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar empresa
app.post('/api/sense/empresa', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando empresa...');
    
    // Eliminar empresaid para que PostgreSQL lo genere automáticamente
    const { empresaid, ...dataWithoutId } = insertData;
    
    const { data, error } = await supabase
      .from('empresa')
      .insert(dataWithoutId)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Empresa insertada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar fundo
app.post('/api/sense/fundo', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando fundo...');
    
    // Eliminar fundoid para que PostgreSQL lo genere automáticamente
    const { fundoid, ...dataWithoutId } = insertData;
    
    const { data, error } = await supabase
      .from('fundo')
      .insert(dataWithoutId)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Fundo insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar ubicación
app.post('/api/sense/ubicacion', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando ubicación...');
    
    // Filtrar solo las columnas que existen en la tabla (omitir ubicacionabrev por problemas de cache)
    const { ubicacionid, ...dataWithoutId } = insertData;
    const filteredData = {
      ubicacion: dataWithoutId.ubicacion,
      fundoid: dataWithoutId.fundoid,
      statusid: dataWithoutId.statusid,
      usercreatedid: dataWithoutId.usercreatedid,
      usermodifiedid: dataWithoutId.usermodifiedid,
      datecreated: dataWithoutId.datecreated,
      datemodified: dataWithoutId.datemodified
    };

    const { data, error } = await supabase
      .from('ubicacion')
      .insert(filteredData)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Ubicación insertada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar entidad
app.post('/api/sense/entidad', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando entidad...');
    
    // Eliminar entidadid para que PostgreSQL lo genere automáticamente
    const { entidadid, ...dataWithoutId } = insertData;
    
    const { data, error } = await supabase
      .from('entidad')
      .insert(dataWithoutId)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Entidad insertada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
    }
});

// Ruta POST para insertar tipo
app.post('/api/sense/tipo', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando tipo...');
    
    // Eliminar tipoid para que PostgreSQL lo genere automáticamente
    const { tipoid, ...dataWithoutId } = insertData;
    
    const { data, error } = await supabase
      .from('tipo')
      .insert(dataWithoutId)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Tipo insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar nodo
app.post('/api/sense/nodo', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando nodo...');
    
    // Eliminar nodoid para que PostgreSQL lo genere automáticamente
    const { nodoid, ...dataWithoutId } = insertData;
    
    const { data, error } = await supabase
      .from('nodo')
      .insert(dataWithoutId)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Nodo insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
    }
});

// Ruta POST para insertar métrica
app.post('/api/sense/metrica', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando métrica...');

    // Eliminar metricaid para que PostgreSQL lo genere automáticamente
    const { metricaid, ...dataWithoutId } = insertData;
    
    const { data, error } = await supabase
      .from('metrica')
      .insert(dataWithoutId)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Métrica insertada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar umbral
app.post('/api/sense/umbral', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando umbral...');
    
    // Eliminar umbralid para que PostgreSQL lo genere automáticamente
    const { umbralid, ...dataWithoutId } = insertData;
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      ubicacionid: dataWithoutId.ubicacionid,
      nodoid: dataWithoutId.nodoid,
      tipoid: dataWithoutId.tipoid,
      metricaid: dataWithoutId.metricaid,
      criticidadid: dataWithoutId.criticidadid,
      umbral: dataWithoutId.umbral,
      minimo: dataWithoutId.minimo,
      maximo: dataWithoutId.maximo,
      statusid: dataWithoutId.statusid,
      usercreatedid: dataWithoutId.usercreatedid,
      usermodifiedid: dataWithoutId.usermodifiedid,
      datecreated: dataWithoutId.datecreated,
      datemodified: dataWithoutId.datemodified
    };
    
    const { data, error } = await supabase
      .from('umbral')
      .insert(filteredData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ 
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }
    
    console.log(`✅ Backend: Umbral insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar criticidad
app.post('/api/sense/criticidad', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando criticidad...');
    
    // Eliminar criticidadid para que PostgreSQL lo genere automáticamente
    const { criticidadid, ...dataWithoutId } = insertData;
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      criticidad: dataWithoutId.criticidad,
      grado: dataWithoutId.grado,
      statusid: dataWithoutId.statusid,
      usercreatedid: dataWithoutId.usercreatedid,
      usermodifiedid: dataWithoutId.usermodifiedid,
      datecreated: dataWithoutId.datecreated,
      datemodified: dataWithoutId.datemodified,
      frecuencia: dataWithoutId.frecuencia,
      escalamiento: dataWithoutId.escalamiento,
      escalon: dataWithoutId.escalon
    };
    
    const { data, error } = await supabase
      .from('criticidad')
      .insert(filteredData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Criticidad insertada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar medio
app.post('/api/sense/medio', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando medio...');
    
    // Eliminar medioid para que PostgreSQL lo genere automáticamente
    const { medioid, ...dataWithoutId } = insertData;
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      nombre: dataWithoutId.nombre,
      statusid: dataWithoutId.statusid,
      usercreatedid: dataWithoutId.usercreatedid,
      usermodifiedid: dataWithoutId.usermodifiedid,
      datecreated: dataWithoutId.datecreated,
      datemodified: dataWithoutId.datemodified
    };
    
    const { data, error } = await supabase
      .from('medio')
      .insert(filteredData)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Medio insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar contacto
app.post('/api/sense/contacto', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando contacto...');
    
    // Eliminar contactoid para que PostgreSQL lo genere automáticamente
    const { contactoid, ...dataWithoutId } = insertData;
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      usuarioid: dataWithoutId.usuarioid,
      celular: dataWithoutId.celular,
      codigotelefonoid: dataWithoutId.codigotelefonoid,
      statusid: dataWithoutId.statusid || 1,
      usercreatedid: dataWithoutId.usercreatedid,
      usermodifiedid: dataWithoutId.usermodifiedid,
      datecreated: dataWithoutId.datecreated,
      datemodified: dataWithoutId.datemodified
    };
    
    const { data, error } = await supabase
      .from('contacto')
      .insert(filteredData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Contacto insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar correo
app.post('/api/sense/correo', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando correo...');
    
    // Validar formato de correo
    if (!EMAIL_REGEX.test(insertData.correo)) {
      return res.status(400).json({ error: 'Formato de correo inválido' });
    }
    
    // Eliminar correoid para que PostgreSQL lo genere automáticamente
    const { correoid, ...dataWithoutId } = insertData;
    
    const filteredData = {
      usuarioid: dataWithoutId.usuarioid,
      correo: dataWithoutId.correo,
      statusid: dataWithoutId.statusid || 1,
      usercreatedid: dataWithoutId.usercreatedid,
      usermodifiedid: dataWithoutId.usermodifiedid,
      datecreated: dataWithoutId.datecreated,
      datemodified: dataWithoutId.datemodified
    };
    
    const { data, error } = await supabase
      .from('correo')
      .insert(filteredData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Correo insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar usuario
app.post('/api/sense/usuario', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando usuario...');

    // Eliminar usuarioid para que PostgreSQL lo genere automáticamente
    const { usuarioid, ...dataWithoutId } = insertData;
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      login: dataWithoutId.login,
      lastname: dataWithoutId.lastname,
      firstname: dataWithoutId.firstname,
      statusid: dataWithoutId.statusid,
      usercreatedid: dataWithoutId.usercreatedid,
      usermodifiedid: dataWithoutId.usermodifiedid,
      datecreated: dataWithoutId.datecreated,
      datemodified: dataWithoutId.datemodified
    };
    
    const { data, error } = await supabase
      .from('usuario')
      .insert(filteredData)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Usuario insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar perfil
app.post('/api/sense/perfil', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando perfil...');
    
    // Eliminar perfilid para que PostgreSQL lo genere automáticamente
    const { perfilid, ...dataWithoutId } = insertData;
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      perfil: dataWithoutId.perfil,
      statusid: dataWithoutId.statusid,
      usercreatedid: dataWithoutId.usercreatedid,
      datecreated: dataWithoutId.datecreated,
      usermodifiedid: dataWithoutId.usermodifiedid,
      datemodified: dataWithoutId.datemodified,
      nivel: dataWithoutId.nivel,
      jefeid: dataWithoutId.jefeid
    };
    
    const { data, error } = await supabase
      .from('perfil')
      .insert(filteredData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Perfil insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar localización
app.post('/api/sense/localizacion', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando localización...');
    
    // Eliminar localizacionid para que PostgreSQL lo genere automáticamente
    const { localizacionid, ...dataWithoutId } = insertData;
    
    const { data, error } = await supabase
      .from('localizacion')
      .insert(dataWithoutId)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Localización insertada: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar perfilumbral (clave compuesta)
app.post('/api/sense/perfilumbral', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando perfilumbral...');
    console.log('🔍 Backend: Insertando datos');
    
    const { data, error } = await supabase
      .from('perfilumbral')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Perfilumbral insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar usuarioperfil (clave compuesta)
app.post('/api/sense/usuarioperfil', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando usuarioperfil...');
    console.log('🔍 Backend: Insertando datos');
    
    const { data, error } = await supabase
      .from('usuarioperfil')
      .insert(insertData)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Usuarioperfil insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar sensor (clave compuesta)
app.post('/api/sense/sensor', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando sensor...');
    
    // Eliminar sensorid para que PostgreSQL lo genere automáticamente
    const { sensorid, ...dataWithoutId } = insertData;
    
    const { data, error } = await supabase
        .from('sensor')
      .insert(dataWithoutId)
      .select();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Backend: Sensor insertado: ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta POST para insertar metricasensor (clave compuesta)
app.post('/api/sense/metricasensor', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando metricasensor...');
    
    // Eliminar metricasensorid si existe (es auto-increment)
    const { metricasensorid, ...dataWithoutId } = insertData;
    
    // Usar INSERT estándar - debe fallar si ya existe (comportamiento correcto)
    const { data, error } = await supabase
      .from('metricasensor')
      .insert(dataWithoutId)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Metricasensor insertado: ${data?.length || 0} registros`);
    res.json(data);
  } catch (error) {
    console.error('❌ Error backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener mediciones con filtros
app.get('/api/sense/mediciones', async (req, res) => {
  try {
    const { ubicacionId, startDate, endDate, limit, countOnly, getAll } = req.query;
    console.log('🔍 Backend: Obteniendo mediciones del schema sense...', { ubicacionId, startDate, endDate, limit, countOnly, getAll });
    
    let query = supabase
      .from('medicion')
      .select('*');
    
    // Aplicar filtros
    if (ubicacionId) {
      query = query.eq('ubicacionid', ubicacionId);
    }
    
    if (startDate) {
      query = query.gte('fecha', startDate);
    }
    
    if (endDate) {
      query = query.lte('fecha', endDate);
    }
    
    // Si solo necesitamos el conteo
    if (countOnly === 'true') {
      query = query.select('*', { count: 'exact', head: true });
    } else if (limit) {
      query = query.limit(parseInt(limit));
    } else if (getAll !== 'true') {
      // Límite por defecto si no se especifica
      query = query.limit(1000);
    }
    
    // Ordenar por fecha descendente (más recientes primero)
    query = query.order('fecha', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    if (countOnly === 'true') {
      console.log(`✅ Backend: Conteo de mediciones: ${count}`);
      res.json({ count: count || 0 });
    } else {
      console.log(`✅ Backend: Mediciones obtenidas: ${data?.length || 0}`);
      res.json(data || []);
    }
  } catch (error) {
    console.error('❌ Error in /api/sense/mediciones:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener mediciones con entidad (con JOIN)
app.get('/api/sense/mediciones-con-entidad', async (req, res) => {
  try {
    const { ubicacionId, startDate, endDate, limit, entidadId, countOnly, getAll } = req.query;
    console.log('🔍 Backend: Obteniendo mediciones con entidad del schema sense...', { ubicacionId, startDate, endDate, limit, entidadId, countOnly, getAll });
    
    // Query simple primero - solo mediciones
    let query = supabase
      .from('medicion')
      .select('*');
    
    // Aplicar filtros básicos
    if (ubicacionId) {
      query = query.eq('ubicacionid', ubicacionId);
    }
    
    if (startDate) {
      query = query.gte('fecha', startDate);
  }
    
    if (endDate) {
      query = query.lte('fecha', endDate);
    }
    
    // Si solo necesitamos el conteo
    if (countOnly === 'true') {
      query = query.select('*', { count: 'exact', head: true });
    } else if (limit) {
      query = query.limit(parseInt(limit));
    } else if (getAll !== 'true') {
      // Límite por defecto si no se especifica
      query = query.limit(1000);
    }
    
    // Ordenar por fecha descendente (más recientes primero)
    query = query.order('fecha', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Si hay entidadId, filtrar después de obtener los datos
    let filteredData = data || [];
    if (entidadId && data) {
      // Obtener ubicaciones que pertenecen a la entidad - query simple
      const { data: ubicaciones, error: ubicError } = await supabase
        .from('ubicacion')
        .select('ubicacionid');
      
      if (ubicError) {
        console.error('❌ Error obteniendo ubicaciones:', ubicError);
        return res.status(500).json({ error: ubicError.message });
      }
      
      // Filtrar mediciones por entidad usando ubicaciones
      if (ubicaciones && ubicaciones.length > 0) {
        const ubicacionIds = ubicaciones.map(u => u.ubicacionid);
        filteredData = data.filter(medicion => 
          ubicacionIds.includes(medicion.ubicacionid)
        );
      } else {
        filteredData = [];
      }
    }
    
    if (countOnly === 'true') {
      console.log(`✅ Backend: Conteo de mediciones con entidad: ${filteredData.length}`);
      res.json({ count: filteredData.length });
    } else {
      console.log(`✅ Backend: Mediciones con entidad obtenidas: ${filteredData.length}`);
      res.json(filteredData);
    }
  } catch (error) {
    console.error('❌ Error in /api/sense/mediciones-con-entidad:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// SERVIR FRONTEND EN PRODUCCIÓN (AZURE)
// ==========================================
if (process.env.NODE_ENV === 'production') {
  const path = require('path')
  
  // Servir archivos estáticos del frontend
  const frontendBuildPath = path.join(__dirname, '../frontend/build')
  app.use(express.static(frontendBuildPath))
  
  console.log('✅ Sirviendo frontend desde:', frontendBuildPath)
  
  // Todas las rutas no-API deben servir index.html (SPA)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendBuildPath, 'index.html'))
    }
  })
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 JoySense Backend API running on port ${PORT}`);
  console.log(`🔑 Using Service Role Key (backend only)`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log(`📡 Servidor listo para recibir conexiones...`);
}).on('error', (error) => {
  console.error('❌ Error al iniciar el servidor:', error);
  process.exit(1);
});
