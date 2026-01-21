/**
 * Controlador para el módulo de Mediciones
 */
const medicionesService = require('../services/medicionesService');
const { supabase: baseSupabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * GET /medicion
 */
exports.getMedicion = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      limit = 1000,
      getAll,
      countOnly 
    } = req.query;
    
    const localizacionId = req.query.localizacionId || req.query.localizacionid;
    const userSupabase = req.supabase || baseSupabase;
    
    if (countOnly) {
      const count = await medicionesService.getMedicionesCount(userSupabase, { localizacionId, startDate, endDate });
      return res.json({ count });
    }
    
    const data = await medicionesService.getMediciones(userSupabase, { 
      localizacionId, 
      startDate, 
      endDate, 
      limit, 
      getAll: getAll === 'true' || getAll === true 
    });
    
    res.json(data);
  } catch (error) {
    logger.error('Error en getMedicion:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /mediciones (Alias con carga de detalles optimizada para dashboard)
 */
exports.getMediciones = async (req, res) => {
  try {
    const { 
      nodoid,
      startDate, 
      endDate, 
      limit = 1000,
      getAll
    } = req.query;
    
    const localizacionId = req.query.localizacionId || req.query.localizacionid;
    const userSupabase = req.supabase || baseSupabase;
    const isGetAll = getAll === 'true' || getAll === true;

    // SI HAY NODOID: Usar la nueva función RPC optimizada para el dashboard
    if (nodoid && startDate && endDate) {
      const data = await medicionesService.getMedicionesDashboard(userSupabase, {
        nodoid,
        startDate,
        endDate,
        limit,
        getAll: isGetAll
      });
      return res.json(data);
    }
    
    const data = await medicionesService.getMedicionesWithDetails(userSupabase, {
      localizacionId,
      nodoid,
      startDate,
      endDate,
      limit,
      getAll: isGetAll
    });
    
    res.json(data);
  } catch (error) {
    logger.error('Error en getMediciones:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /mediciones-con-entidad
 */
exports.getMedicionesConEntidad = async (req, res) => {
  try {
    const { entidadId, startDate, endDate, limit = 1000 } = req.query;
    const userSupabase = req.supabase || baseSupabase;
    
    if (!entidadId) {
      return res.status(400).json({ error: 'entidadId es requerido' });
    }
    
    const data = await medicionesService.getMedicionesConEntidad(userSupabase, {
      entidadId,
      startDate,
      endDate,
      limit
    });
    
    res.json(data);
  } catch (error) {
    logger.error('Error en getMedicionesConEntidad:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /sensor_valor
 */
exports.getSensorValor = async (req, res) => {
  try {
    const { id_device, limit = 100 } = req.query;
    const userSupabase = req.supabase || baseSupabase;
    
    const data = await medicionesService.getSensorValor(userSupabase, { id_device, limit });
    res.json(data);
  } catch (error) {
    logger.error('Error en getSensorValor:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /sensor_valor
 */
exports.postSensorValor = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const data = await medicionesService.createSensorValor(userSupabase, req.body);
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en postSensorValor:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /sensor_valor_error
 */
exports.getSensorValorError = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const userSupabase = req.supabase || baseSupabase;
    
    const data = await medicionesService.getSensorValorError(userSupabase, { limit });
    res.json(data);
  } catch (error) {
    logger.error('Error en getSensorValorError:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /ultimas-mediciones-por-lote
 */
exports.getUltimasMedicionesPorLote = async (req, res) => {
  try {
    const { fundoIds, metricaId, startDate, endDate } = req.query;
    const userSupabase = req.supabase || baseSupabase;
    
    if (!fundoIds) {
      return res.status(400).json({ error: 'fundoIds es requerido' });
    }
    
    const data = await medicionesService.getUltimasMedicionesPorLote(userSupabase, {
      fundoIds,
      metricaId,
      startDate,
      endDate
    });
    
    res.json(data);
  } catch (error) {
    logger.error('Error en getUltimasMedicionesPorLote:', error);
    res.status(500).json({ error: error.message });
  }
};
