/**
 * Router Principal - Agrupa todas las rutas
 */

const express = require('express');
const router = express.Router();
const { dbSchema, supabase: baseSupabase } = require('../config/database');
const logger = require('../utils/logger');
const { optionalAuth } = require('../middleware/auth');
// Nota: setUserContext ya no se necesita - Supabase API maneja RLS automáticamente

// ============================================================================
// RUTAS ESPECÍFICAS (deben ir ANTES del router genérico)
// ============================================================================

// Ruta de health check
router.get('/health', async (req, res) => {
  try {
    // Verificar conexión a Supabase (ruta pública, usar baseSupabase)
    const { data, error } = await baseSupabase.schema(dbSchema).from('pais').select('paisid').limit(1);
    
    res.json({ 
      status: error ? 'error' : 'ok',
      schema: dbSchema,
      database: 'Supabase API',
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

// Endpoint de prueba para verificar permisos y RPC (ruta pública, usar baseSupabase)
router.get('/test-db', async (req, res) => {
  const results = {
    schema: dbSchema,
    connection: 'Supabase API',
    tests: {}
  };
  
  // Test 1: Select directo
  try {
    const { data, error } = await baseSupabase.schema(dbSchema).from('pais').select('*').limit(1);
    results.tests.select_pais = error ? { error: error.message } : { success: true, count: data?.length };
  } catch (e) {
    results.tests.select_pais = { error: e.message };
  }
  
  // Test 2: Select usuario
  try {
    const { data, error } = await baseSupabase.schema(dbSchema).from('usuario').select('*').limit(1);
    results.tests.select_usuario = error ? { error: error.message } : { success: true, count: data?.length };
  } catch (e) {
    results.tests.select_usuario = { error: e.message };
  }
  
  // Test 3: RPC fn_get_table_metadata
  try {
    const { data, error } = await baseSupabase.schema('joysense').rpc('fn_get_table_metadata', { tbl_name: 'usuario' });
    results.tests.rpc_metadata = error ? { error: error.message } : { success: true, data };
  } catch (e) {
    results.tests.rpc_metadata = { error: e.message };
  }
  
  res.json(results);
});

// Ruta de detección de schema (ruta pública, usar baseSupabase)
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
// MIDDLEWARE GLOBAL
// ============================================================================
// NOTA: Ya no necesitamos setUserContext - Supabase API maneja RLS automáticamente
// El backend se autentica como admin@joysense.com al iniciar
// router.use(optionalAuth);        // Opcional si necesitas verificar usuario en requests
// router.use(setUserContext);      // Ya no necesario - Supabase maneja RLS

// ============================================================================
// MONTAR ROUTERS DE MÓDULOS
// ============================================================================

// Importar routers de módulos
const geografiaRouter = require('./geografia');
const dispositivosRouter = require('./dispositivos');
const medicionesRouter = require('./mediciones');
const alertasRouter = require('./alertas');
const usuariosRouter = require('./usuarios');
const genericRouter = require('./generic');

// Montar rutas por módulo con prefijos
router.use('/geografia', geografiaRouter);      // pais, empresa, fundo, ubicacion, entidad
router.use('/dispositivos', dispositivosRouter);   // nodo, sensor, metrica, tipo, localizacion, metricasensor
router.use('/mediciones', medicionesRouter);     // medicion, sensor_valor
router.use('/alertas', alertasRouter);        // umbral, alerta, alerta_regla_consolidado, criticidad, mensaje
router.use('/usuarios', usuariosRouter);       // usuario, perfil, contacto, correo, usuarioperfil
router.use('/generic', genericRouter);  // Operaciones genéricas CRUD (DEBE IR AL FINAL)

module.exports = router;
