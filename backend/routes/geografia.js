/**
 * Rutas de Geografía: pais, empresa, fundo, ubicacion
 * Versión PostgreSQL Directo
 */

const express = require('express');
const router = express.Router();
const geografiaController = require('../controllers/geografiaController');
const { optionalAuth } = require('../middleware/auth');

// Aplicar middleware de autenticación opcional a todas las rutas
// Esto permite que las queries usen el token del usuario para RLS
router.use(optionalAuth);

// ============================================================================
// PAIS
// ============================================================================
router.get('/pais', geografiaController.getPaises);
router.get('/pais/columns', geografiaController.getPaisColumns);
router.post('/pais', geografiaController.postPais);
router.put('/pais/:id', geografiaController.putPais);

// ============================================================================
// EMPRESA
// ============================================================================
router.get('/empresa', geografiaController.getEmpresas);
router.get('/empresa/columns', geografiaController.getEmpresaColumns);
router.post('/empresa', geografiaController.postEmpresa);
router.put('/empresa/:id', geografiaController.putEmpresa);

// ============================================================================
// FUNDO
// ============================================================================
router.get('/fundo', geografiaController.getFundos);
router.get('/fundo/columns', geografiaController.getFundoColumns);
router.post('/fundo', geografiaController.postFundo);
router.put('/fundo/:id', geografiaController.putFundo);

// ============================================================================
// UBICACION
// ============================================================================
router.get('/ubicacion', geografiaController.getUbicaciones);
router.get('/ubicacion/columns', geografiaController.getUbicacionColumns);
router.post('/ubicacion', geografiaController.postUbicacion);
router.put('/ubicacion/:id', geografiaController.putUbicacion);

// ============================================================================
// ENTIDAD
// ============================================================================
router.get('/entidad', geografiaController.getEntidades);
router.get('/entidad/columns', geografiaController.getEntidadColumns);
router.post('/entidad', geografiaController.postEntidad);
router.put('/entidad/:id', geografiaController.putEntidad);

// ============================================================================
// ENTIDAD_LOCALIZACION (tabla de relación)
// ============================================================================
router.get('/entidad_localizacion', geografiaController.getEntidadLocalizaciones);
router.post('/entidad_localizacion', geografiaController.postEntidadLocalizacion);

// ============================================================================
// NODO
// ============================================================================
router.get('/nodo', geografiaController.getNodos);
router.get('/nodos', geografiaController.getNodosSimple); // Alias para compatibilidad
router.get('/nodo/columns', geografiaController.getNodoColumns);
router.post('/nodo', geografiaController.postNodo);
router.put('/nodo/:id', geografiaController.putNodo);

// ============================================================================
// LOCALIZACION
// ============================================================================
router.get('/localizacion', geografiaController.getLocalizaciones);
router.get('/localizaciones', geografiaController.getLocalizacionesSimple); // Alias para compatibilidad
router.get('/localizacion/columns', geografiaController.getLocalizacionColumns);
router.post('/localizacion', geografiaController.postLocalizacion);
router.put('/localizacion/:id', geografiaController.putLocalizacion);

// ============================================================================
// ESPECIALIZADOS
// ============================================================================
router.get('/nodos-con-localizacion', geografiaController.getNodosConLocalizacionDashboard);
router.get('/locations/search', geografiaController.searchLocations);

module.exports = router;
