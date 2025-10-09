require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

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

// Función para obtener metadatos dinámicamente desde Supabase
const getTableMetadata = async (tableName) => {
  // Verificar cache primero
  if (metadataCache.has(tableName)) {
    console.log(`📋 Usando metadatos en cache para tabla: ${tableName}`);
    return metadataCache.get(tableName);
  }
  try {
    console.log(`🔍 Obteniendo metadatos dinámicos para tabla: ${tableName}`);
    
    // Intentar obtener metadatos dinámicamente desde Supabase
    // Si falla, usar metadatos hardcodeados como fallback
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'sense')
      .eq('table_name', tableName);
    
    if (columnsError || !columns || columns.length === 0) {
      console.log(`⚠️ No se pudo obtener columnas dinámicamente para ${tableName}, usando metadatos hardcodeados`);
      return getHardcodedMetadata(tableName);
    }
    
    // Obtener información de la tabla
    const { data: tableInfo, error: tableInfoError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'sense')
      .eq('table_name', tableName)
      .single();
    
    // Obtener constraints
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_schema', 'sense')
      .eq('table_name', tableName);
    
    const metadata = {
      columns: columns || [],
      info: tableInfo || { table_name: tableName, table_type: 'BASE TABLE' },
      constraints: constraints || []
    };
    
    // Guardar en cache
    metadataCache.set(tableName, metadata);
    console.log(`✅ Metadatos dinámicos obtenidos y guardados en cache para: ${tableName}`);
    return metadata;
  } catch (error) {
    console.error(`❌ Error obteniendo metadatos dinámicos para ${tableName}:`, error);
    console.log(`🔄 Usando metadatos hardcodeados como fallback para ${tableName}`);
    const fallbackMetadata = getHardcodedMetadata(tableName);
    // También guardar el fallback en cache para evitar consultas repetidas
    metadataCache.set(tableName, fallbackMetadata);
    return fallbackMetadata;
  }
};

// Función fallback con metadatos básicos (sin hardcodeo)
const getHardcodedMetadata = (tableName) => {
  console.log(`⚠️ Usando metadatos básicos para tabla: ${tableName} (sin hardcodeo)`);
  return {
    columns: [],
    info: { table_name: tableName, table_type: 'BASE TABLE' },
    constraints: []
  };
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
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo nodo del schema sense...');
    const { data, error } = await supabase
      .from('nodo')
      .select('*')
      .order('nodoid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Nodo obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/nodo:', error); res.status(500).json({ error: error.message }); }
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
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo umbral del schema sense...');
    const { data, error } = await supabase
      .from('umbral')
      .select('*')
      .order('umbralid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Umbral obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/umbral:', error); res.status(500).json({ error: error.message }); }
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
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo sensor del schema sense...');
    const { data, error } = await supabase
      .from('sensor')
      .select('*')
      .order('nodoid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Sensor obtenido:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/sensor:', error); res.status(500).json({ error: error.message }); }
});

// Ruta para metricasensor - usada por el frontend
app.get('/api/sense/metricasensor', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo metricasensor del schema sense...');
    const { data, error } = await supabase
      .from('metricasensor')
      .select('*')
      .order('nodoid')
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Metricasensor obtenidos:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/metricasensor:', error); res.status(500).json({ error: error.message }); }
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
    const { limit = 100 } = req.query;
    console.log('🔍 Backend: Obteniendo localizacion del schema sense...');
    const { data, error } = await supabase
      .from('localizacion')
      .select('*')
      .order('ubicacionid, nodoid') // Ordenar por clave primaria compuesta
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Backend: Localizacion obtenida:', data?.length || 0);
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/localizacion:', error); res.status(500).json({ error: error.message }); }
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
    const { limit = 100 } = req.query;
    console.log('🔍 Obteniendo alertas de sense.alerta...');
    const { data, error } = await supabase
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
          valor,
          fecha,
          nodoid,
          tipoid,
          metricaid
        )
      `)
      .order('alertaid', { ascending: false })
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Alertas encontradas:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('🔍 Primera alerta:', JSON.stringify(data[0], null, 2));
    }
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/alerta:', error); res.status(500).json({ error: error.message }); }
});

// Ruta para mensaje - usada por el frontend
app.get('/api/sense/mensaje', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    console.log('🔍 Obteniendo mensajes de sense.mensaje...');
    const { data, error } = await supabase
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
      .limit(parseInt(limit));
    if (error) { console.error('❌ Error backend:', error); return res.status(500).json({ error: error.message }); }
    console.log('✅ Mensajes encontrados:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('🔍 Primer mensaje:', JSON.stringify(data[0], null, 2));
    }
    res.json(data || []);
  } catch (error) { console.error('❌ Error in /api/sense/mensaje:', error); res.status(500).json({ error: error.message }); }
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
      console.error('❌ Usuario no encontrado en sense.usuario:', userError);
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

    console.log('✅ Usuario autenticado en modo desarrollo:', email);

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
    console.log(`🔍 Backend: Actualizando ubicacion con ID ${id}`);
    
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
    console.log(`🔍 Backend: Actualizando ubicacion con ID ${id}`);
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

app.put('/api/sense/usuario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔍 Backend: Actualizando usuario con ID ${id}...`);
    
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
    console.log(`🔍 Backend: Actualizando ubicacion con ID ${id}`);
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
    console.log(`🔍 Backend: Actualizando ubicacion con ID ${id}`);
    
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
    console.log(`🔍 Backend: Actualizando ubicacion con ID ${id}`);
    
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
    console.log(`🔍 Backend: Actualizando ubicacion con ID ${id}`);

    // Para metricasensor, la validación de negocio es diferente
    // No hay restricción de entidad como en sensor, solo validamos que no haya conflictos
    // La tabla metricasensor no tiene columna entidadid

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
    console.log(`🔍 Backend: Actualizando ubicacion con ID ${id}`);

    // Validación de negocio
    if (!nodoid || !tipoid) {
      return res.status(400).json({ error: 'nodoid y tipoid son requeridos' });
    }

    // Usar upsert para crear o actualizar la entrada (similar a metricasensor)
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
    console.log('🔍 Backend: Insertando datos');

    const { data, error } = await supabase
      .from('pais')
      .insert(insertData)
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
    console.log('🔍 Backend: Insertando datos');
    
    const { data, error } = await supabase
      .from('empresa')
      .insert(insertData)
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
    console.log('🔍 Backend: Insertando datos');
    
    const { data, error } = await supabase
      .from('fundo')
      .insert(insertData)
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
    console.log('🔍 Backend: Insertando datos');
    
    // Filtrar solo las columnas que existen en la tabla (omitir ubicacionabrev por problemas de cache)
    const filteredData = {
      ubicacion: insertData.ubicacion,
      fundoid: insertData.fundoid,
      statusid: insertData.statusid,
      usercreatedid: insertData.usercreatedid,
      usermodifiedid: insertData.usermodifiedid,
      datecreated: insertData.datecreated,
      datemodified: insertData.datemodified
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
    console.log('🔍 Backend: Insertando datos');
    
    const { data, error } = await supabase
      .from('entidad')
      .insert(insertData)
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
    console.log('🔍 Backend: Insertando datos');
    
    const { data, error } = await supabase
      .from('tipo')
      .insert(insertData)
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
    console.log('🔍 Backend: Insertando datos');
    
    const { data, error } = await supabase
      .from('nodo')
      .insert(insertData)
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
    console.log('🔍 Backend: Insertando datos');
    
    const { data, error } = await supabase
      .from('metrica')
      .insert(insertData)
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
    console.log('🔍 Backend: Insertando datos');
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      ubicacionid: insertData.ubicacionid,
      nodoid: insertData.nodoid,
      tipoid: insertData.tipoid,
      metricaid: insertData.metricaid,
      criticidadid: insertData.criticidadid,
      umbral: insertData.umbral,
      minimo: insertData.minimo,
      maximo: insertData.maximo,
      statusid: insertData.statusid,
      usercreatedid: insertData.usercreatedid,
      usermodifiedid: insertData.usermodifiedid,
      datecreated: insertData.datecreated,
      datemodified: insertData.datemodified
    };
    
    console.log('🔍 Backend: Datos filtrados:', JSON.stringify(filteredData, null, 2));
    
    const { data, error } = await supabase
      .from('umbral')
      .insert(filteredData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
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
    console.log('🔍 Backend: Insertando datos');
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      criticidad: insertData.criticidad,
      grado: insertData.grado,
      statusid: insertData.statusid,
      usercreatedid: insertData.usercreatedid,
      usermodifiedid: insertData.usermodifiedid,
      datecreated: insertData.datecreated,
      datemodified: insertData.datemodified,
      frecuencia: insertData.frecuencia,
      escalamiento: insertData.escalamiento,
      escalon: insertData.escalon
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
    console.log('🔍 Backend: Insertando datos');
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      nombre: insertData.nombre,
      statusid: insertData.statusid,
      usercreatedid: insertData.usercreatedid,
      usermodifiedid: insertData.usermodifiedid,
      datecreated: insertData.datecreated,
      datemodified: insertData.datemodified
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
    console.log('🔍 Backend: Insertando datos');
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      usuarioid: insertData.usuarioid,
      celular: insertData.celular,
      codigotelefonoid: insertData.codigotelefonoid,
      statusid: insertData.statusid || 1,
      usercreatedid: insertData.usercreatedid,
      usermodifiedid: insertData.usermodifiedid,
      datecreated: insertData.datecreated,
      datemodified: insertData.datemodified
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
    console.log('🔍 Backend: Insertando datos');
    
    // Validar formato de correo
    if (!EMAIL_REGEX.test(insertData.correo)) {
      return res.status(400).json({ error: 'Formato de correo inválido' });
    }
    
    const filteredData = {
      usuarioid: insertData.usuarioid,
      correo: insertData.correo,
      statusid: insertData.statusid || 1,
      usercreatedid: insertData.usercreatedid,
      usermodifiedid: insertData.usermodifiedid,
      datecreated: insertData.datecreated,
      datemodified: insertData.datemodified
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
    console.log('🔍 Backend: Insertando datos');
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      login: insertData.login,
      lastname: insertData.lastname,
      firstname: insertData.firstname,
      statusid: insertData.statusid,
      usercreatedid: insertData.usercreatedid,
      usermodifiedid: insertData.usermodifiedid,
      datecreated: insertData.datecreated,
      datemodified: insertData.datemodified
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
    console.log('🔍 Backend: Insertando datos');
    
    // Filtrar solo las columnas que existen en la tabla
    const filteredData = {
      perfil: insertData.perfil,
      statusid: insertData.statusid,
      usercreatedid: insertData.usercreatedid,
      datecreated: insertData.datecreated,
      usermodifiedid: insertData.usermodifiedid,
      datemodified: insertData.datemodified,
      nivel: insertData.nivel,
      jefeid: insertData.jefeid
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

// Ruta POST para insertar localización (clave compuesta)
app.post('/api/sense/localizacion', async (req, res) => {
  try {
    const insertData = req.body;
    console.log('🔍 Backend: Insertando localización...');
    console.log('🔍 Backend: Insertando datos');
    
    const { data, error } = await supabase
      .from('localizacion')
      .insert(insertData)
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
    console.log('🔍 Backend: Insertando datos');
    
    const { data, error } = await supabase
        .from('sensor')
      .insert(insertData)
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
    console.log('🔍 Backend: Insertando datos');
    
    const { data, error } = await supabase
            .from('metricasensor')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`✅ Backend: Metricasensor insertado: ${data.length} registros`);
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
