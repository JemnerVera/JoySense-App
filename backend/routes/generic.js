/**
 * Rutas Genéricas para operaciones CRUD dinámicas
 * Versión PostgreSQL Directo
 */

const express = require('express');
const router = express.Router();
const { db, dbSchema, pool } = require('../config/database');
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
  entidad_localizacion: null, // PK compuesta
  metricasensor: null, // PK compuesta
  usuarioperfil: null, // PK compuesta
  perfilumbral: null, // PK compuesta
  sensor_valor: 'id',
  sensor_valor_error: 'id'
};

// Validar tabla permitida
function isTableAllowed(table) {
  return ALLOWED_TABLES.includes(table.toLowerCase());
}

// ============================================================================
// RUTA GENÉRICA GET /:table
// ============================================================================

router.get('/:table', async (req, res) => {
  const { table } = req.params;
  
  if (!isTableAllowed(table)) {
    return res.status(400).json({ 
      error: `Tabla '${table}' no permitida`,
      allowedTables: ALLOWED_TABLES 
    });
  }
  
  try {
    const result = await paginateAndFilter(table, req.query);
    res.json(result);
  } catch (error) {
    logger.error(`Error en GET /${table}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// RUTA GENÉRICA GET /:table/columns
// ============================================================================

router.get('/:table/columns', async (req, res) => {
  const { table } = req.params;
  
  if (!isTableAllowed(table)) {
    return res.status(400).json({ error: `Tabla '${table}' no permitida` });
  }
  
  try {
    const metadata = await getTableMetadata(table);
    res.json(metadata.columns);
  } catch (error) {
    logger.error(`Error en GET /${table}/columns:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// RUTA GENÉRICA POST /:table
// ============================================================================

router.post('/:table', async (req, res) => {
  const { table } = req.params;
  
  if (!isTableAllowed(table)) {
    return res.status(400).json({ error: `Tabla '${table}' no permitida` });
  }
  
  try {
    const { data, error } = await db.insert(table, req.body);
    
    if (error) throw error;
    
    // Limpiar cache de metadata
    clearMetadataCache(table);
    
    res.status(201).json(data);
  } catch (error) {
    logger.error(`Error en POST /${table}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// RUTA GENÉRICA PUT /:table/:id
// ============================================================================

router.put('/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  
  if (!isTableAllowed(table)) {
    return res.status(400).json({ error: `Tabla '${table}' no permitida` });
  }
  
  const pk = PK_MAPPING[table.toLowerCase()];
  
  if (!pk) {
    return res.status(400).json({ 
      error: `Tabla '${table}' tiene PK compuesta. Use el endpoint específico.` 
    });
  }
  
  try {
    const { data, error } = await db.update(table, req.body, { [pk]: id });
    
    if (error) throw error;
    
    // Limpiar cache de metadata
    clearMetadataCache(table);
    
    res.json(data);
  } catch (error) {
    logger.error(`Error en PUT /${table}/${id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// RUTA PARA ACTUALIZAR PK COMPUESTAS
// ============================================================================

router.put('/:table/composite', async (req, res) => {
  const { table } = req.params;
  
  if (!isTableAllowed(table)) {
    return res.status(400).json({ error: `Tabla '${table}' no permitida` });
  }
  
  try {
    // Los parámetros de la PK vienen en el query string
    const pkParams = { ...req.query };
    delete pkParams.page;
    delete pkParams.pageSize;
    
    if (Object.keys(pkParams).length === 0) {
      return res.status(400).json({ 
        error: 'Se requieren parámetros de PK en el query string' 
      });
    }
    
    // Construir query dinámico
    const setClauses = Object.keys(req.body).map((k, i) => `${k} = $${i + 1}`);
    const whereClauses = Object.keys(pkParams).map((k, i) => `${k} = $${setClauses.length + i + 1}`);
    
    const sql = `UPDATE ${dbSchema}.${table} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')} RETURNING *`;
    const params = [...Object.values(req.body), ...Object.values(pkParams)];
    
    const result = await pool.query(sql, params);
    
    clearMetadataCache(table);
    
    res.json(result.rows);
  } catch (error) {
    logger.error(`Error en PUT /${table}/composite:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// INFORMACIÓN DE TABLAS
// ============================================================================

router.get('/meta/tables', async (req, res) => {
  res.json({
    allowedTables: ALLOWED_TABLES,
    pkMapping: PK_MAPPING,
    schema: dbSchema
  });
});

router.get('/meta/clear-cache', async (req, res) => {
  const { table } = req.query;
  clearMetadataCache(table || null);
  res.json({ 
    message: table ? `Cache limpiado para ${table}` : 'Cache completo limpiado',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
