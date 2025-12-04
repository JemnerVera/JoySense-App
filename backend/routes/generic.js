/**
 * Rutas Genéricas para operaciones CRUD dinámicas
 * Útil para tablas que no tienen endpoints específicos
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { paginateAndFilter, getTableMetadata, clearMetadataCache } = require('../utils/pagination');
const logger = require('../utils/logger');

// Lista de tablas permitidas para operaciones genéricas
const ALLOWED_TABLES = [
  'pais', 'empresa', 'fundo', 'ubicacion', 'localizacion', 
  'entidad', 'entidad_localizacion',
  'nodo', 'sensor', 'tipo', 'metrica', 'metricasensor',
  'umbral', 'alerta', 'alertaconsolidado', 'criticidad',
  'perfilumbral', 'audit_log_umbral',
  'usuario', 'perfil', 'usuarioperfil', 
  'contacto', 'correo', 'codigotelefono',
  'mensaje', 'asociacion',
  'perfil_geografia_permiso',
  'sensor_valor', 'sensor_valor_error'
];

// Mapeo de PK por tabla
const PK_MAPPING = {
  pais: 'paisid',
  empresa: 'empresaid',
  fundo: 'fundoid',
  ubicacion: 'ubicacionid',
  localizacion: 'localizacionid',
  entidad: 'entidadid',
  nodo: 'nodoid',
  sensor: 'sensorid',
  tipo: 'tipoid',
  metrica: 'metricaid',
  umbral: 'umbralid',
  alerta: 'uuid_alertaid',
  alertaconsolidado: 'uuid_consolidadoid',
  criticidad: 'criticidadid',
  usuario: 'usuarioid',
  perfil: 'perfilid',
  contacto: 'contactoid',
  correo: 'correoid',
  codigotelefono: 'codigotelefonoid',
  mensaje: null, // PK compuesta
  asociacion: 'asociacionid',
  perfil_geografia_permiso: 'permisoid',
  audit_log_umbral: 'auditid',
  sensor_valor: null, // PK compuesta
  sensor_valor_error: 'sensorvalorerrorid',
  // Tablas con PK compuesta
  metricasensor: null,
  usuarioperfil: null,
  perfilumbral: null,
  entidad_localizacion: null
};

/**
 * Middleware para validar tabla
 */
function validateTable(req, res, next) {
  const tableName = req.params.table;
  
  if (!ALLOWED_TABLES.includes(tableName)) {
    return res.status(400).json({ 
      error: `Tabla '${tableName}' no permitida`,
      allowedTables: ALLOWED_TABLES 
    });
  }
  
  req.tableName = tableName;
  next();
}

// ============================================================================
// GET - Obtener datos de cualquier tabla
// ============================================================================

router.get('/:table', validateTable, async (req, res) => {
  try {
    const result = await paginateAndFilter(req.tableName, req.query);
    res.json(result);
  } catch (error) {
    logger.error(`Error en GET /${req.tableName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET - Obtener columnas de una tabla
// ============================================================================

router.get('/:table/columns', validateTable, async (req, res) => {
  try {
    const metadata = await getTableMetadata(req.tableName);
    res.json(metadata.columns || []);
  } catch (error) {
    logger.error(`Error en GET /${req.tableName}/columns:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET - Obtener info de una tabla
// ============================================================================

router.get('/:table/info', validateTable, async (req, res) => {
  try {
    const metadata = await getTableMetadata(req.tableName);
    res.json(metadata.info || {});
  } catch (error) {
    logger.error(`Error en GET /${req.tableName}/info:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET - Obtener constraints de una tabla
// ============================================================================

router.get('/:table/constraints', validateTable, async (req, res) => {
  try {
    const metadata = await getTableMetadata(req.tableName);
    res.json(metadata.constraints || []);
  } catch (error) {
    logger.error(`Error en GET /${req.tableName}/constraints:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST - Insertar en cualquier tabla
// ============================================================================

router.post('/:table', validateTable, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from(req.tableName)
      .insert(req.body)
      .select();
    
    if (error) throw error;
    
    // Limpiar cache de metadatos si la inserción fue exitosa
    clearMetadataCache(req.tableName);
    
    res.status(201).json(data);
  } catch (error) {
    logger.error(`Error en POST /${req.tableName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PUT - Actualizar por ID simple
// ============================================================================

router.put('/:table/:id', validateTable, async (req, res) => {
  try {
    const pkField = PK_MAPPING[req.tableName];
    
    if (!pkField) {
      return res.status(400).json({ 
        error: `La tabla '${req.tableName}' tiene PK compuesta, usa /composite` 
      });
    }
    
    const { data, error } = await supabase
      .from(req.tableName)
      .update(req.body)
      .eq(pkField, req.params.id)
      .select();
    
    if (error) throw error;
    
    clearMetadataCache(req.tableName);
    
    res.json(data);
  } catch (error) {
    logger.error(`Error en PUT /${req.tableName}/${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PUT - Actualizar por clave compuesta
// ============================================================================

router.put('/:table/composite', validateTable, async (req, res) => {
  try {
    // Los campos de la PK vienen en query params
    const queryParams = { ...req.query };
    delete queryParams.page;
    delete queryParams.pageSize;
    
    let query = supabase.from(req.tableName).update(req.body);
    
    // Aplicar cada campo de la PK como filtro
    Object.keys(queryParams).forEach(key => {
      query = query.eq(key, queryParams[key]);
    });
    
    const { data, error } = await query.select();
    
    if (error) throw error;
    
    clearMetadataCache(req.tableName);
    
    res.json(data);
  } catch (error) {
    logger.error(`Error en PUT /${req.tableName}/composite:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// DELETE - Eliminar por ID (soft delete - cambia statusid a 0)
// ============================================================================

router.delete('/:table/:id', validateTable, async (req, res) => {
  try {
    const pkField = PK_MAPPING[req.tableName];
    
    if (!pkField) {
      return res.status(400).json({ 
        error: `La tabla '${req.tableName}' tiene PK compuesta` 
      });
    }
    
    // Soft delete: cambiar statusid a 0
    const { data, error } = await supabase
      .from(req.tableName)
      .update({ statusid: 0 })
      .eq(pkField, req.params.id)
      .select();
    
    if (error) throw error;
    
    clearMetadataCache(req.tableName);
    
    res.json({ success: true, data });
  } catch (error) {
    logger.error(`Error en DELETE /${req.tableName}/${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Limpiar cache
// ============================================================================

router.post('/cache/clear', (req, res) => {
  const { table } = req.body;
  clearMetadataCache(table || null);
  res.json({ success: true, message: table ? `Cache limpiado para ${table}` : 'Cache completo limpiado' });
});

module.exports = router;

