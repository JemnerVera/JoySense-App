/**
 * JoySense Backend API Server
 * Schema: joysense
 * 
 * Estructura Modular:
 * - config/database.js - Configuración Supabase
 * - utils/logger.js - Sistema de logging
 * - utils/pagination.js - Paginación y filtros
 * - utils/validation.js - Validaciones
 * - middleware/auth.js - Autenticación
 * - routes/ - Rutas organizadas por módulo
 */

// Cargar dotenv solo si existe archivo .env (desarrollo local)
// En Azure, las variables están en Application Settings y ya están en process.env
try {
  require('dotenv').config();
} catch (err) {
  // Ignorar si no existe .env (normal en producción)
}

const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar logger
const logger = require('./utils/logger');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE GLOBAL
// ============================================================================

// CORS
app.use(cors());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (solo en modo debug)
if (process.env.LOG_LEVEL === 'debug') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// RUTAS
// ============================================================================

// Importar router principal
const apiRoutes = require('./routes');

// Montar rutas bajo /api/joysense (nuevo schema)
app.use('/api/joysense', apiRoutes);

// ============================================================================
// SERVIR FRONTEND EN PRODUCCIÓN
// ============================================================================

if (process.env.NODE_ENV === 'production') {
  // Servir archivos estáticos del frontend
  const frontendPath = path.join(__dirname, '..', 'frontend', 'build');
  app.use(express.static(frontendPath));
  
  // Cualquier ruta no-API sirve el frontend
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV || 'development',
    schema: process.env.DB_SCHEMA || 'joysense',
    timestamp: new Date().toISOString() 
  });
});

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

// 404 para rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.path,
    method: req.method 
  });
});

// Error handler global
app.use((err, req, res, next) => {
  logger.error('Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

app.listen(PORT, async () => {
  console.log('');
  console.log('🌱 ========================================');
  console.log('🌱  JOYSENSE BACKEND API');
  console.log('🌱 ========================================');
  console.log(`🌱  Schema:      ${process.env.DB_SCHEMA || 'joysense'}`);
  console.log(`🌱  Puerto:      ${PORT}`);
  console.log(`🌱  Ambiente:    ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌱  API Base:    /api/joysense`);
  console.log('🌱 ========================================');
  console.log('');
  logger.info(`✅ Servidor iniciado en puerto ${PORT}`);
  
  // NOTA: Ya NO autenticamos el backend al iniciar
  // El backend usará el token de sesión del usuario que viene del frontend
  // Esto permite que las políticas RLS usen auth.uid() correctamente
});

module.exports = app;

