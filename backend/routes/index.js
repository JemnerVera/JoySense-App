/**
 * Router Principal - Agrupa todas las rutas
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { supabase } = require('../config/database');
const logger = require('../utils/logger');

// ============================================================================
// RUTAS ESPECÍFICAS (deben ir ANTES del router genérico)
// ============================================================================

// Ruta de health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    schema: process.env.DB_SCHEMA || 'joysense',
    timestamp: new Date().toISOString() 
  });
});

// Endpoint de prueba para verificar permisos y RPC
router.get('/test-db', async (req, res) => {
  const results = {
    schema: process.env.DB_SCHEMA || 'joysense',
    tests: {}
  };
  
  // Test 1: Select directo
  try {
    const { data, error } = await supabase.from('pais').select('*').limit(1);
    results.tests.select_pais = error ? { error: error.message } : { success: true, count: data?.length };
  } catch (e) {
    results.tests.select_pais = { error: e.message };
  }
  
  // Test 2: Select usuario
  try {
    const { data, error } = await supabase.from('usuario').select('*').limit(1);
    results.tests.select_usuario = error ? { error: error.message } : { success: true, count: data?.length };
  } catch (e) {
    results.tests.select_usuario = { error: e.message };
  }
  
  // Test 3: RPC fn_get_table_metadata
  try {
    const { data, error } = await supabase.rpc('fn_get_table_metadata', { tbl_name: 'usuario' });
    results.tests.rpc_metadata = error ? { error: error.message } : { success: true, data };
  } catch (e) {
    results.tests.rpc_metadata = { error: e.message };
  }
  
  // Test 4: RPC fn_consolidar_alertas
  try {
    const { data, error } = await supabase.rpc('fn_consolidar_alertas');
    results.tests.rpc_alertas = error ? { error: error.message } : { success: true };
  } catch (e) {
    results.tests.rpc_alertas = { error: e.message };
  }
  
  res.json(results);
});

// Ruta de detección de schema
router.get('/detect', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pais')
      .select('paisid')
      .limit(1);
    
    if (error) {
      return res.json({ available: false, error: error.message });
    }
    
    res.json({ available: true, schema: process.env.DB_SCHEMA || 'joysense' });
  } catch (error) {
    res.json({ available: false, error: error.message });
  }
});

// ============================================================================
// RUTAS DE AUTENTICACIÓN
// ============================================================================

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario por login (email)
    const { data: usuarios, error } = await supabase
      .from('usuario')
      .select('*')
      .eq('login', email)
      .eq('statusid', 1)
      .limit(1);
    
    if (error) throw error;
    
    if (!usuarios || usuarios.length === 0) {
      return res.status(401).json({ success: false, error: 'Usuario no encontrado' });
    }
    
    const usuario = usuarios[0];
    
    // Verificar password con bcrypt si hay hash
    if (usuario.password_hash) {
      const passwordValid = await bcrypt.compare(password, usuario.password_hash);
      if (!passwordValid) {
        return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
      }
    } else {
      // Si no hay hash, verificar texto plano (temporal para desarrollo)
      logger.warn('Usuario sin password_hash, verificando texto plano');
      // Por seguridad, rechazar si no hay hash en producción
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({ success: false, error: 'Contraseña no configurada' });
      }
    }
    
    // Construir respuesta de usuario para el frontend
    const userResponse = {
      id: usuario.usuarioid,
      email: usuario.login,
      user_metadata: {
        full_name: `${usuario.firstname} ${usuario.lastname}`,
        firstname: usuario.firstname,
        lastname: usuario.lastname,
        login: usuario.login,
        usuarioid: usuario.usuarioid
      }
    };
    
    logger.info(`Usuario ${usuario.login} autenticado`);
    res.json({ success: true, user: userResponse });
  } catch (error) {
    logger.error('Error en POST /auth/login:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear usuario con password hasheado (para setup inicial)
router.post('/auth/register', async (req, res) => {
  try {
    const { login, password, firstname, lastname } = req.body;
    
    if (!login || !password || !firstname || !lastname) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campos requeridos: login, password, firstname, lastname' 
      });
    }
    
    // Hashear password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insertar usuario directamente en la tabla
    const { data, error } = await supabase
      .from('usuario')
      .insert({
        login,
        password_hash: hashedPassword,
        firstname,
        lastname,
        statusid: 1,
        usercreatedid: 1,
        datecreated: new Date().toISOString(),
        usermodifiedid: 1,
        datemodified: new Date().toISOString()
      })
      .select();
    
    if (error) throw error;
    
    logger.info(`Usuario ${login} creado exitosamente`);
    res.json({ success: true, user: data[0] });
  } catch (error) {
    logger.error('Error en POST /auth/register:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/auth/reset-password', async (req, res) => {
  try {
    const { login } = req.body;
    
    // Buscar usuario
    const { data: usuarios, error } = await supabase
      .from('usuario')
      .select('usuarioid, login, firstname, lastname')
      .eq('login', login)
      .eq('statusid', 1)
      .limit(1);
    
    if (error) throw error;
    
    if (!usuarios || usuarios.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    
    // Generar nueva contraseña temporal
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Actualizar password
    const { error: updateError } = await supabase
      .from('usuario')
      .update({ password_hash: hashedPassword })
      .eq('usuarioid', usuarios[0].usuarioid);
    
    if (updateError) throw updateError;
    
    // TODO: Enviar email con nueva contraseña
    logger.info(`Password reset para ${login}. Nueva contraseña: ${tempPassword}`);
    
    res.json({ 
      success: true, 
      message: 'Se ha enviado una nueva contraseña al correo registrado',
      // Solo en desarrollo, mostrar la contraseña temporal
      ...(process.env.NODE_ENV !== 'production' && { tempPassword })
    });
  } catch (error) {
    logger.error('Error en POST /auth/reset-password:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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

// Montar rutas por módulo
router.use('/', geografiaRouter);      // pais, empresa, fundo, ubicacion
router.use('/', dispositivosRouter);   // nodo, sensor, metrica, tipo, localizacion, metricasensor
router.use('/', medicionesRouter);     // medicion, sensor_valor
router.use('/', alertasRouter);        // umbral, alerta, alertaconsolidado, criticidad, mensaje
router.use('/', usuariosRouter);       // usuario, perfil, contacto, correo, usuarioperfil
router.use('/', genericRouter);        // Operaciones genéricas CRUD (DEBE IR AL FINAL)

module.exports = router;
