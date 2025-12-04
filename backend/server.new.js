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

require('dotenv').config();
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

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ============================================================================
// RUTAS
// ============================================================================

// Importar router principal
const apiRoutes = require('./routes');

// Montar rutas bajo /api/joysense (nuevo schema)
app.use('/api/joysense', apiRoutes);

// Compatibilidad con rutas antiguas /api/sense (redirect)
app.use('/api/sense', (req, res, next) => {
  logger.warn(`Ruta deprecada /api/sense usada: ${req.path}`);
  // Redirigir internamente a joysense
  req.url = req.url; // Mantener la ruta original
  apiRoutes(req, res, next);
});

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

app.listen(PORT, () => {
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
  logger.info(`Servidor iniciado en puerto ${PORT}`);
});

module.exports = app;

