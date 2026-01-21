/**
 * Rutas de Dispositivos: sensor, metrica, tipo, metricasensor, asociacion
 * Versión Supabase API con RLS - Refactorizado a MVC (Route-Controller-Service)
 */

const express = require('express');
const router = express.Router();
const dispositivosController = require('../controllers/dispositivosController');
const { optionalAuth } = require('../middleware/auth');

// Aplicar middleware de autenticación opcional a todas las rutas
// Esto permite que las queries usen el token del usuario para RLS
router.use(optionalAuth);

// ============================================================================
// SENSOR
// ============================================================================
router.get('/sensor', dispositivosController.getSensores);
router.get('/sensor/columns', dispositivosController.getSensorColumns);
router.post('/sensor', dispositivosController.postSensor);
router.put('/sensor/:id', dispositivosController.putSensor);

// ============================================================================
// TIPO
// ============================================================================
router.get('/tipo', dispositivosController.getTipos);
router.get('/tipos', dispositivosController.getTiposSimple); // Alias para compatibilidad
router.get('/tipo/columns', dispositivosController.getTipoColumns);
router.post('/tipo', dispositivosController.postTipo);
router.put('/tipo/:id', dispositivosController.putTipo);

// ============================================================================
// METRICA
// ============================================================================
router.get('/metrica', dispositivosController.getMetricas);
router.get('/metricas', dispositivosController.getMetricasSimple); // Alias para compatibilidad
router.get('/metrica/columns', dispositivosController.getMetricaColumns);
router.post('/metrica', dispositivosController.postMetrica);
router.put('/metrica/:id', dispositivosController.putMetrica);

// ============================================================================
// METRICASENSOR
// ============================================================================
router.get('/metricasensor', dispositivosController.getMetricaSensores);
router.get('/metricasensor/columns', dispositivosController.getMetricaSensorColumns);
router.post('/metricasensor', dispositivosController.postMetricaSensor);
router.put('/metricasensor/composite', dispositivosController.putMetricaSensorComposite);

// ============================================================================
// ASOCIACION
// ============================================================================
router.get('/asociacion', dispositivosController.getAsociaciones);
router.get('/asociacion/columns', dispositivosController.getAsociacionColumns);
router.post('/asociacion', dispositivosController.postAsociacion);
router.put('/asociacion/:id', dispositivosController.putAsociacion);

module.exports = router;
