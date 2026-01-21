/**
 * Controlador de Dispositivos
 * Maneja las peticiones HTTP y delega la lógica de negocio al servicio
 */

const dispositivosService = require('../services/dispositivosService');
const { supabase: baseSupabase } = require('../config/database');
const logger = require('../utils/logger');

// ============================================================================
// SENSOR
// ============================================================================

const getSensores = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.getSensores(userSupabase);
    res.json(result);
  } catch (error) {
    logger.error('Error en getSensores:', error);
    res.status(500).json({ error: error.message });
  }
};

const getSensorColumns = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const columns = await dispositivosService.getColumns('sensor', userSupabase);
    res.json(columns);
  } catch (error) {
    logger.error('Error en getSensorColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

const postSensor = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.createSensor(userSupabase, req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error en postSensor:', error);
    res.status(500).json({ error: error.message });
  }
};

const putSensor = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.updateSensor(userSupabase, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error en putSensor:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// TIPO
// ============================================================================

const getTipos = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.getTipos(userSupabase, req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error en getTipos:', error);
    res.status(500).json({ error: error.message });
  }
};

const getTiposSimple = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.getTiposSimple(userSupabase);
    res.json(result);
  } catch (error) {
    logger.error('Error en getTiposSimple:', error);
    res.status(500).json({ error: error.message });
  }
};

const getTipoColumns = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const columns = await dispositivosService.getColumns('tipo', userSupabase);
    res.json(columns);
  } catch (error) {
    logger.error('Error en getTipoColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

const postTipo = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.createTipo(userSupabase, req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error en postTipo:', error);
    res.status(500).json({ error: error.message });
  }
};

const putTipo = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.updateTipo(userSupabase, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error en putTipo:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// METRICA
// ============================================================================

const getMetricas = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.getMetricas(userSupabase, req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error en getMetricas:', error);
    res.status(500).json({ error: error.message });
  }
};

const getMetricasSimple = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.getMetricasSimple(userSupabase);
    res.json(result);
  } catch (error) {
    logger.error('Error en getMetricasSimple:', error);
    res.status(500).json({ error: error.message });
  }
};

const getMetricaColumns = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const columns = await dispositivosService.getColumns('metrica', userSupabase);
    res.json(columns);
  } catch (error) {
    logger.error('Error en getMetricaColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

const postMetrica = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.createMetrica(userSupabase, req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error en postMetrica:', error);
    res.status(500).json({ error: error.message });
  }
};

const putMetrica = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.updateMetrica(userSupabase, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error en putMetrica:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// METRICASENSOR
// ============================================================================

const getMetricaSensores = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.getMetricaSensores(userSupabase, req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error en getMetricaSensores:', error);
    res.status(500).json({ error: error.message });
  }
};

const getMetricaSensorColumns = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const columns = await dispositivosService.getColumns('metricasensor', userSupabase);
    res.json(columns);
  } catch (error) {
    logger.error('Error en getMetricaSensorColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

const postMetricaSensor = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.createMetricaSensor(userSupabase, req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error en postMetricaSensor:', error);
    res.status(500).json({ error: error.message });
  }
};

const putMetricaSensorComposite = async (req, res) => {
  try {
    const { sensorid, metricaid } = req.query;
    if (!sensorid || !metricaid) {
      return res.status(400).json({ error: 'Se requieren sensorid y metricaid' });
    }
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.updateMetricaSensorComposite(userSupabase, sensorid, metricaid, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error en putMetricaSensorComposite:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// ASOCIACION
// ============================================================================

const getAsociaciones = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.getAsociaciones(userSupabase);
    res.json(result);
  } catch (error) {
    logger.error('Error en getAsociaciones:', error);
    res.status(500).json({ error: error.message });
  }
};

const getAsociacionColumns = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const columns = await dispositivosService.getColumns('asociacion', userSupabase);
    res.json(columns);
  } catch (error) {
    logger.error('Error en getAsociacionColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

const postAsociacion = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.createAsociacion(userSupabase, req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error en postAsociacion:', error);
    res.status(500).json({ error: error.message });
  }
};

const putAsociacion = async (req, res) => {
  try {
    const userSupabase = req.supabase || baseSupabase;
    const result = await dispositivosService.updateAsociacion(userSupabase, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error en putAsociacion:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSensores,
  getSensorColumns,
  postSensor,
  putSensor,
  getTipos,
  getTiposSimple,
  getTipoColumns,
  postTipo,
  putTipo,
  getMetricas,
  getMetricasSimple,
  getMetricaColumns,
  postMetrica,
  putMetrica,
  getMetricaSensores,
  getMetricaSensorColumns,
  postMetricaSensor,
  putMetricaSensorComposite,
  getAsociaciones,
  getAsociacionColumns,
  postAsociacion,
  putAsociacion
};
