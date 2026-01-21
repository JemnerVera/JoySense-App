const { supabase: baseSupabase } = require('../config/database');
const geografiaService = require('../services/geografiaService');
const logger = require('../utils/logger');

/**
 * Helper to get the correct supabase client
 */
const getSupabase = (req) => req.supabase || baseSupabase;

/**
 * PAIS
 */
exports.getPaises = async (req, res) => {
  try {
    const result = await geografiaService.getPaises(getSupabase(req), req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error en getPaises:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPaisColumns = async (req, res) => {
  try {
    const columns = await geografiaService.getPaisColumns(getSupabase(req));
    res.json(columns);
  } catch (error) {
    logger.error('Error en getPaisColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.postPais = async (req, res) => {
  try {
    const data = await geografiaService.createPais(getSupabase(req), req.body);
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en postPais:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.putPais = async (req, res) => {
  try {
    const data = await geografiaService.updatePais(getSupabase(req), req.params.id, req.body);
    res.json(data);
  } catch (error) {
    logger.error('Error en putPais:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * EMPRESA
 */
exports.getEmpresas = async (req, res) => {
  try {
    const { paisId } = req.query;
    const data = await geografiaService.getEmpresas(getSupabase(req), paisId);
    res.json(data);
  } catch (error) {
    logger.error('Error en getEmpresas:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getEmpresaColumns = async (req, res) => {
  try {
    const columns = await geografiaService.getEmpresaColumns(getSupabase(req));
    res.json(columns);
  } catch (error) {
    logger.error('Error en getEmpresaColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.postEmpresa = async (req, res) => {
  try {
    const data = await geografiaService.createEmpresa(getSupabase(req), req.body);
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en postEmpresa:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.putEmpresa = async (req, res) => {
  try {
    const data = await geografiaService.updateEmpresa(getSupabase(req), req.params.id, req.body);
    res.json(data);
  } catch (error) {
    logger.error('Error en putEmpresa:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * FUNDO
 */
exports.getFundos = async (req, res) => {
  try {
    const { empresaId } = req.query;
    const data = await geografiaService.getFundos(getSupabase(req), empresaId);
    res.json(data);
  } catch (error) {
    logger.error('Error en getFundos:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getFundoColumns = async (req, res) => {
  try {
    const columns = await geografiaService.getFundoColumns(getSupabase(req));
    res.json(columns);
  } catch (error) {
    logger.error('Error en getFundoColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.postFundo = async (req, res) => {
  try {
    const data = await geografiaService.createFundo(getSupabase(req), req.body);
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en postFundo:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.putFundo = async (req, res) => {
  try {
    const data = await geografiaService.updateFundo(getSupabase(req), req.params.id, req.body);
    res.json(data);
  } catch (error) {
    logger.error('Error en putFundo:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * UBICACION
 */
exports.getUbicaciones = async (req, res) => {
  try {
    const { fundoId } = req.query;
    const data = await geografiaService.getUbicaciones(getSupabase(req), fundoId);
    res.json(data);
  } catch (error) {
    logger.error('Error en getUbicaciones:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getUbicacionColumns = async (req, res) => {
  try {
    const columns = await geografiaService.getUbicacionColumns(getSupabase(req));
    res.json(columns);
  } catch (error) {
    logger.error('Error en getUbicacionColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.postUbicacion = async (req, res) => {
  try {
    const data = await geografiaService.createUbicacion(getSupabase(req), req.body);
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en postUbicacion:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.putUbicacion = async (req, res) => {
  try {
    const data = await geografiaService.updateUbicacion(getSupabase(req), req.params.id, req.body);
    res.json(data);
  } catch (error) {
    logger.error('Error en putUbicacion:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * ENTIDAD
 */
exports.getEntidades = async (req, res) => {
  try {
    const result = await geografiaService.getEntidades(getSupabase(req), req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error en getEntidades:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getEntidadColumns = async (req, res) => {
  try {
    const columns = await geografiaService.getEntidadColumns(getSupabase(req));
    res.json(columns);
  } catch (error) {
    logger.error('Error en getEntidadColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.postEntidad = async (req, res) => {
  try {
    const data = await geografiaService.createEntidad(getSupabase(req), req.body);
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en postEntidad:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.putEntidad = async (req, res) => {
  try {
    const data = await geografiaService.updateEntidad(getSupabase(req), req.params.id, req.body);
    res.json(data);
  } catch (error) {
    logger.error('Error en putEntidad:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * ENTIDAD_LOCALIZACION
 */
exports.getEntidadLocalizaciones = async (req, res) => {
  try {
    const data = await geografiaService.getEntidadLocalizaciones(getSupabase(req));
    res.json(data);
  } catch (error) {
    logger.error('Error en getEntidadLocalizaciones:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.postEntidadLocalizacion = async (req, res) => {
  try {
    const data = await geografiaService.createEntidadLocalizacion(getSupabase(req), req.body);
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en postEntidadLocalizacion:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * NODO
 */
exports.getNodos = async (req, res) => {
  try {
    const result = await geografiaService.getNodos(getSupabase(req), req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error en getNodos:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getNodosSimple = async (req, res) => {
  try {
    const result = await geografiaService.getNodosSimple(getSupabase(req));
    res.json(result);
  } catch (error) {
    logger.error('Error en getNodosSimple:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getNodoColumns = async (req, res) => {
  try {
    const columns = await geografiaService.getColumns('nodo', getSupabase(req));
    res.json(columns);
  } catch (error) {
    logger.error('Error en getNodoColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.postNodo = async (req, res) => {
  try {
    const result = await geografiaService.createNodo(getSupabase(req), req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error en postNodo:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.putNodo = async (req, res) => {
  try {
    const result = await geografiaService.updateNodo(getSupabase(req), req.params.id, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error en putNodo:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * LOCALIZACION
 */
exports.getLocalizaciones = async (req, res) => {
  try {
    const result = await geografiaService.getLocalizaciones(getSupabase(req), req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error en getLocalizaciones:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getLocalizacionesSimple = async (req, res) => {
  try {
    const result = await geografiaService.getLocalizacionesSimple(getSupabase(req));
    res.json(result);
  } catch (error) {
    logger.error('Error en getLocalizacionesSimple:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getLocalizacionColumns = async (req, res) => {
  try {
    const columns = await geografiaService.getColumns('localizacion', getSupabase(req));
    res.json(columns);
  } catch (error) {
    logger.error('Error en getLocalizacionColumns:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.postLocalizacion = async (req, res) => {
  try {
    const result = await geografiaService.createLocalizacion(getSupabase(req), req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error en postLocalizacion:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.putLocalizacion = async (req, res) => {
  try {
    const result = await geografiaService.updateLocalizacion(getSupabase(req), req.params.id, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error en putLocalizacion:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * ESPECIALIZADOS
 */
exports.getNodosConLocalizacionDashboard = async (req, res) => {
  try {
    const result = await geografiaService.getNodosConLocalizacionDashboard(getSupabase(req), req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error en getNodosConLocalizacionDashboard:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.searchLocations = async (req, res) => {
  try {
    const result = await geografiaService.searchLocations(getSupabase(req), req.query.query);
    res.json(result);
  } catch (error) {
    logger.error('Error en searchLocations:', error);
    res.status(500).json({ error: error.message });
  }
};
