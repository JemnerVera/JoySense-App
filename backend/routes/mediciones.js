/**
 * Rutas de Mediciones: medicion, sensor_valor
 * Versión Supabase API con RLS
 */

const express = require('express');
const router = express.Router();
const medicionesController = require('../controllers/medicionesController');
const { optionalAuth } = require('../middleware/auth');

// Aplicar middleware de autenticación opcional a todas las rutas
// Esto permite que las queries usen el token del usuario para RLS
router.use(optionalAuth);

// ============================================================================
// MEDICION
// ============================================================================

router.get('/medicion', medicionesController.getMedicion);

// Alias para compatibilidad
router.get('/mediciones', medicionesController.getMediciones);

// Mediciones con entidad
router.get('/mediciones-con-entidad', medicionesController.getMedicionesConEntidad);

// ============================================================================
// SENSOR_VALOR (staging table para datos LoRaWAN)
// ============================================================================

router.get('/sensor_valor', medicionesController.getSensorValor);
router.post('/sensor_valor', medicionesController.postSensorValor);

// ============================================================================
// SENSOR_VALOR_ERROR (log de errores)
// ============================================================================

router.get('/sensor_valor_error', medicionesController.getSensorValorError);

// ============================================================================
// ÚLTIMAS MEDICIONES POR LOTE (optimizado para dashboard)
// ============================================================================

router.get('/ultimas-mediciones-por-lote', medicionesController.getUltimasMedicionesPorLote);

module.exports = router;
