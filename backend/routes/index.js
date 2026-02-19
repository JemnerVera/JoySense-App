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

// Aplicar auth opcional para permitir pruebas con token de usuario
router.use(optionalAuth);

// Ruta de health check
router.get('/health', async (req, res) => {
  try {
    // Usar el cliente del request (puede tener token de usuario)
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

// Endpoint de prueba para verificar permisos y RPC (usa token si se proporciona)
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
  
  // Test 0: Identidad Real en la DB (fn_obtener_diagnostico_sesion eliminada - no existe en Supabase)
  try {
    const { data: qData, error: qError } = await supabase.from('usuario').select('login').limit(1);
    results.db_context = {
      manual_select_usuario: qError ? `FALLÓ: ${qError.message}` : 'EXITOSO'
    };
  } catch (e) {
    results.db_context = { exception: e.message };
  }
  
  // Test 1: Select directo pais
  try {
    const { data, error } = await supabase.schema(dbSchema).from('pais').select('paisid').limit(1);
    results.tests.select_pais = error ? { error: error.message, code: error.code } : { success: true };
  } catch (e) {
    results.tests.select_pais = { error: e.message };
  }
  
  // Test 3: RPC fn_get_table_metadata
  try {
    const { data, error } = await supabase.schema('joysense').rpc('fn_get_table_metadata', { tbl_name: 'usuario' });
    results.tests.rpc_metadata = error ? { error: error.message, code: error.code } : { success: true };
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
