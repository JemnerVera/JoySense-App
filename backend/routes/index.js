/**
 * Router Principal - Punto de entrada para todas las rutas API
 */

const express = require('express');
const router = express.Router();
const { dbSchema, supabase: baseSupabase } = require('../config/database');
const logger = require('../utils/logger');
const { optionalAuth } = require('../middleware/auth');

// ============================================================================
// RUTAS DE DIAGNÓSTICO Y SALUD
// ============================================================================

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const supabase = req.supabase || baseSupabase;
    const { data, error } = await supabase.schema(dbSchema).from('pais').select('paisid').limit(1);
    
    res.json({ 
      status: error ? 'error' : 'ok',
      schema: dbSchema,
      database: 'Supabase API',
      usingToken: !!req.user,
      timestamp: new Date().toISOString(),
      error: error ? error.message : null
    });
  } catch (error) {
    res.json({ 
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint de prueba de conectividad y permisos
router.get('/test-db', async (req, res) => {
  const supabase = req.supabase || baseSupabase;
  const results = {
    info: {
      schema: dbSchema,
      usingToken: !!req.user,
      userInRequest: req.user?.email || 'anon'
    },
    db_context: {},
    tests: {}
  };
  
  // Test: Select directo a tabla usuario
  try {
    const { data: qData, error: qError } = await supabase.from('usuario').select('login').limit(1);
    results.db_context = {
      manual_select_usuario: qError ? `FALLÓ: ${qError.message}` : 'EXITOSO'
    };
  } catch (e) {
    results.db_context = { exception: e.message };
  }
  
  // Test: Select directo a tabla pais
  try {
    const { data, error } = await supabase.schema(dbSchema).from('pais').select('paisid').limit(1);
    results.tests.select_pais = error ? { error: error.message, code: error.code } : { success: true };
  } catch (e) {
    results.tests.select_pais = { error: e.message };
  }
  
  // Test: RPC de metadatos
  try {
    const { data, error } = await supabase.schema('joysense').rpc('fn_get_table_metadata', { tbl_name: 'usuario' });
    results.tests.rpc_metadata = error ? { error: error.message, code: error.code } : { success: true };
  } catch (e) {
    results.tests.rpc_metadata = { error: e.message };
  }
  
  res.json(results);
});

// Detección de schema disponible
router.get('/detect', async (req, res) => {
  try {
    const { data, error } = await baseSupabase.schema(dbSchema).from('pais').select('paisid').limit(1);
    
    if (error) {
      return res.json({ available: false, error: error.message });
    }
    
    res.json({ available: true, schema: dbSchema, connection: 'Supabase API' });
  } catch (error) {
    res.json({ available: false, error: error.message });
  }
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Auth opcional para permitir requests autenticados
router.use(optionalAuth);

// ============================================================================
// MOUNT MODULE ROUTERS
// ============================================================================

const geografiaRouter = require('./geografia');
const dispositivosRouter = require('./dispositivos');
const medicionesRouter = require('./mediciones');
const alertasRouter = require('./alertas');
const usuariosRouter = require('./usuarios');
const genericRouter = require('./generic');

// Montar routers con prefijos
router.use('/geografia', geografiaRouter);      // pais, empresa, fundo, ubicacion, entidad
router.use('/dispositivos', dispositivosRouter);   // nodo, sensor, metrica, tipo, localizacion, metricasensor
router.use('/mediciones', medicionesRouter);     // medicion, sensor_valor
router.use('/alertas', alertasRouter);        // umbral, alerta, alerta_regla_consolidado, criticidad, mensaje
router.use('/usuarios', usuariosRouter);       // usuario, perfil, contacto, correo, usuarioperfil
router.use('/generic', genericRouter);  // Operaciones genéricas CRUD

module.exports = router;
