const { dbSchema } = require('../config/database');
const geografiaService = require('../services/geografiaService');
const logger = require('../utils/logger');

/**
 * Helper para loguear y responder errores de Supabase con detalles completos
 */
function handleError(res, error, context) {
  const errorDetails = {
    message: error.message,
    code: error.code || 'N/A',
    details: error.details || null,
    hint: error.hint || null
  };
  logger.error(`❌ ${context}:`, errorDetails);
  if (error.details) logger.error(`   Details: ${error.details}`);
  if (error.hint) logger.error(`   Hint: ${error.hint}`);
  res.status(500).json(errorDetails);
}

/**
 * Helper to get the correct supabase client
 * REQUIERE: req.supabase debe estar definido (usuario autenticado)
 */
const getSupabase = (req) => {
  if (!req.supabase) {
    logger.error(`❌ [getSupabase] ERROR: req.supabase no definido - se requiere autenticación JWT`);
    throw new Error('Usuario no autenticado - se requiere token JWT válido');
  }
  return req.supabase;
};

/**
 * PAIS
 */
exports.getPaises = async (req, res) => {
  try {
    const result = await geografiaService.getPaises(getSupabase(req), req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error, 'getPaises');
  }
};

exports.getPaisColumns = async (req, res) => {
  try {
    const columns = await geografiaService.getPaisColumns(getSupabase(req));
    res.json(columns);
  } catch (error) {
    handleError(res, error, 'getPaisColumns');
  }
};

exports.postPais = async (req, res) => {
  try {
    const data = await geografiaService.createPais(getSupabase(req), req.body);
    res.status(201).json(data);
  } catch (error) {
    handleError(res, error, 'postPais');
  }
};

exports.putPais = async (req, res) => {
  try {
    const data = await geografiaService.updatePais(getSupabase(req), req.params.id, req.body);
    res.json(data);
  } catch (error) {
    handleError(res, error, 'putPais');
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
    handleError(res, error, 'getEmpresas');
  }
};

exports.getEmpresaColumns = async (req, res) => {
  try {
    const columns = await geografiaService.getEmpresaColumns(getSupabase(req));
    res.json(columns);
  } catch (error) {
    handleError(res, error, 'getEmpresaColumns');
  }
};

exports.postEmpresa = async (req, res) => {
  try {
    const data = await geografiaService.createEmpresa(getSupabase(req), req.body);
    res.status(201).json(data);
  } catch (error) {
    handleError(res, error, 'postEmpresa');
  }
};

exports.putEmpresa = async (req, res) => {
  try {
    const data = await geografiaService.updateEmpresa(getSupabase(req), req.params.id, req.body);
    res.json(data);
  } catch (error) {
    handleError(res, error, 'putEmpresa');
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
    handleError(res, error, 'getFundos');
  }
};

exports.getFundoColumns = async (req, res) => {
  try {
    const columns = await geografiaService.getFundoColumns(getSupabase(req));
    res.json(columns);
  } catch (error) {
    handleError(res, error, 'getFundoColumns');
  }
};

exports.postFundo = async (req, res) => {
  try {
    const data = await geografiaService.createFundo(getSupabase(req), req.body);
    res.status(201).json(data);
  } catch (error) {
    handleError(res, error, 'postFundo');
  }
};

exports.putFundo = async (req, res) => {
  try {
    const data = await geografiaService.updateFundo(getSupabase(req), req.params.id, req.body);
    res.json(data);
  } catch (error) {
    handleError(res, error, 'putFundo');
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
    handleError(res, error, 'getUbicaciones');
  }
};

exports.getUbicacionColumns = async (req, res) => {
  try {
    const columns = await geografiaService.getUbicacionColumns(getSupabase(req));
    res.json(columns);
  } catch (error) {
    handleError(res, error, 'getUbicacionColumns');
  }
};

exports.postUbicacion = async (req, res) => {
  try {
    const data = await geografiaService.createUbicacion(getSupabase(req), req.body);
    res.status(201).json(data);
  } catch (error) {
    handleError(res, error, 'postUbicacion');
  }
};

exports.putUbicacion = async (req, res) => {
  try {
    const data = await geografiaService.updateUbicacion(getSupabase(req), req.params.id, req.body);
    res.json(data);
  } catch (error) {
    handleError(res, error, 'putUbicacion');
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
    handleError(res, error, 'getEntidades');
  }
};

exports.getEntidadColumns = async (req, res) => {
  try {
    const columns = await geografiaService.getEntidadColumns(getSupabase(req));
    res.json(columns);
  } catch (error) {
    handleError(res, error, 'getEntidadColumns');
  }
};

exports.postEntidad = async (req, res) => {
  try {
    const data = await geografiaService.createEntidad(getSupabase(req), req.body);
    res.status(201).json(data);
  } catch (error) {
    handleError(res, error, 'postEntidad');
  }
};

exports.putEntidad = async (req, res) => {
  try {
    const data = await geografiaService.updateEntidad(getSupabase(req), req.params.id, req.body);
    res.json(data);
  } catch (error) {
    handleError(res, error, 'putEntidad');
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
    handleError(res, error, 'getEntidadLocalizaciones');
  }
};

exports.postEntidadLocalizacion = async (req, res) => {
  try {
    const data = await geografiaService.createEntidadLocalizacion(getSupabase(req), req.body);
    res.status(201).json(data);
  } catch (error) {
    handleError(res, error, 'postEntidadLocalizacion');
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
    handleError(res, error, 'getNodos');
  }
};

exports.getNodosSimple = async (req, res) => {
  try {
    const result = await geografiaService.getNodosSimple(getSupabase(req));
    res.json(result);
  } catch (error) {
    handleError(res, error, 'getNodosSimple');
  }
};

exports.getNodoColumns = async (req, res) => {
  try {
    const columns = await geografiaService.getColumns('nodo', getSupabase(req));
    res.json(columns);
  } catch (error) {
    handleError(res, error, 'getNodoColumns');
  }
};

exports.postNodo = async (req, res) => {
  try {
    const result = await geografiaService.createNodo(getSupabase(req), req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error, 'postNodo');
  }
};

exports.putNodo = async (req, res) => {
  try {
    const result = await geografiaService.updateNodo(getSupabase(req), req.params.id, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error, 'putNodo');
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
    handleError(res, error, 'getLocalizaciones');
  }
};

exports.getLocalizacionesSimple = async (req, res) => {
  try {
    const result = await geografiaService.getLocalizacionesSimple(getSupabase(req));
    res.json(result);
  } catch (error) {
    handleError(res, error, 'getLocalizacionesSimple');
  }
};

exports.getLocalizacionColumns = async (req, res) => {
  try {
    const columns = await geografiaService.getColumns('localizacion', getSupabase(req));
    res.json(columns);
  } catch (error) {
    handleError(res, error, 'getLocalizacionColumns');
  }
};

exports.postLocalizacion = async (req, res) => {
  try {
    const result = await geografiaService.createLocalizacion(getSupabase(req), req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error, 'postLocalizacion');
  }
};

exports.putLocalizacion = async (req, res) => {
  try {
    const result = await geografiaService.updateLocalizacion(getSupabase(req), req.params.id, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error, 'putLocalizacion');
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
    handleError(res, error, 'getNodosConLocalizacionDashboard');
  }
};

exports.searchLocations = async (req, res) => {
  try {
    const result = await geografiaService.searchLocations(getSupabase(req), req.query.query);
    res.json(result);
  } catch (error) {
    handleError(res, error, 'searchLocations');
  }
};

exports.getKPIsNodo = async (req, res) => {
  try {
    const nodoid = parseInt(req.params.nodoid, 10);
    const { startDate, endDate } = req.query;
    if (!nodoid || nodoid <= 0) {
      return res.status(400).json({ error: 'nodoid inválido' });
    }
    const result = await geografiaService.getKPIsNodo(getSupabase(req), {
      nodoid,
      startDate,
      endDate
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, 'getKPIsNodo');
  }
};

exports.getLocalizacionesByName = async (req, res) => {
  try {
    const { nombre } = req.query;
    if (!nombre) {
      return res.status(400).json({ error: 'El parámetro nombre es requerido' });
    }
    const result = await geografiaService.getLocalizacionesByName(getSupabase(req), nombre);
    res.json(result);
  } catch (error) {
    handleError(res, error, 'getLocalizacionesByName');
  }
};
