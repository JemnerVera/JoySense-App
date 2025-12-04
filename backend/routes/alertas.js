/**
 * Rutas de Alertas: umbral, alerta, alertaconsolidado, criticidad, mensaje, perfilumbral
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { paginateAndFilter, getTableMetadata } = require('../utils/pagination');
const logger = require('../utils/logger');

// ============================================================================
// CRITICIDAD
// ============================================================================

router.get('/criticidad', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('criticidad')
      .select('*')
      .order('grado');
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /criticidad:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/criticidad/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('criticidad');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /criticidad/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/criticidad', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('criticidad')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /criticidad:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/criticidad/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('criticidad')
      .update(req.body)
      .eq('criticidadid', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /criticidad:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// UMBRAL (ahora solo usa localizacionid)
// ============================================================================

router.get('/umbral', async (req, res) => {
  try {
    const { localizacionId } = req.query;
    
    let query = supabase
      .from('umbral')
      .select(`
        *,
        criticidad:criticidadid(criticidadid, criticidad, grado),
        localizacion:localizacionid(
          localizacionid,
          localizacion,
          nodo:nodoid(nodoid, nodo),
          metrica:metricaid(metricaid, metrica, unidad)
        )
      `)
      .order('umbralid');
    
    if (localizacionId) {
      query = query.eq('localizacionid', localizacionId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /umbral:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/umbral/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('umbral');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /umbral/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/umbral', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('umbral')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /umbral:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/umbral/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('umbral')
      .update(req.body)
      .eq('umbralid', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /umbral:', error);
    res.status(500).json({ error: error.message });
  }
});

// Umbrales por lote (para dashboard)
router.get('/umbrales-por-lote', async (req, res) => {
  try {
    const { fundoIds, metricaId } = req.query;
    
    if (!fundoIds) {
      return res.status(400).json({ error: 'fundoIds es requerido' });
    }
    
    const fundoIdArray = fundoIds.split(',').map(Number);
    
    // Obtener ubicaciones -> nodos -> localizaciones
    const { data: ubicaciones } = await supabase
      .from('ubicacion')
      .select('ubicacionid')
      .in('fundoid', fundoIdArray)
      .eq('statusid', 1);
    
    const ubicacionIds = ubicaciones?.map(u => u.ubicacionid) || [];
    
    if (ubicacionIds.length === 0) return res.json([]);
    
    const { data: nodos } = await supabase
      .from('nodo')
      .select('nodoid')
      .in('ubicacionid', ubicacionIds)
      .eq('statusid', 1);
    
    const nodoIds = nodos?.map(n => n.nodoid) || [];
    
    if (nodoIds.length === 0) return res.json([]);
    
    let locQuery = supabase
      .from('localizacion')
      .select('localizacionid')
      .in('nodoid', nodoIds)
      .eq('statusid', 1);
    
    if (metricaId) {
      locQuery = locQuery.eq('metricaid', metricaId);
    }
    
    const { data: localizaciones } = await locQuery;
    const locIds = localizaciones?.map(l => l.localizacionid) || [];
    
    if (locIds.length === 0) return res.json([]);
    
    const { data, error } = await supabase
      .from('umbral')
      .select(`
        *,
        criticidad:criticidadid(criticidadid, criticidad),
        localizacion:localizacionid(
          localizacionid,
          localizacion,
          nodo:nodoid(nodoid, nodo),
          metrica:metricaid(metricaid, metrica)
        )
      `)
      .in('localizacionid', locIds)
      .eq('statusid', 1);
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /umbrales-por-lote:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ALERTA (ahora usa UUID)
// ============================================================================

router.get('/alerta', async (req, res) => {
  try {
    const { umbralId, startDate, endDate, limit = 100 } = req.query;
    
    let query = supabase
      .from('alerta')
      .select(`
        *,
        umbral:umbralid(
          umbralid,
          umbral,
          minimo,
          maximo,
          localizacion:localizacionid(localizacionid, localizacion)
        ),
        medicion:medicionid(medicionid, medicion, fecha)
      `)
      .order('fecha', { ascending: false });
    
    if (umbralId) query = query.eq('umbralid', umbralId);
    if (startDate) query = query.gte('fecha', startDate);
    if (endDate) query = query.lte('fecha', endDate);
    
    query = query.limit(parseInt(limit));
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /alerta:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/alerta/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('alerta');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /alerta/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ALERTACONSOLIDADO
// ============================================================================

router.get('/alertaconsolidado', async (req, res) => {
  try {
    const { statusid = 1, limit = 100 } = req.query;
    
    let query = supabase
      .from('alertaconsolidado')
      .select(`
        *,
        umbral:umbralid(
          umbralid,
          umbral,
          minimo,
          maximo,
          criticidad:criticidadid(criticidadid, criticidad),
          localizacion:localizacionid(
            localizacionid,
            localizacion,
            nodo:nodoid(nodoid, nodo),
            metrica:metricaid(metricaid, metrica)
          )
        )
      `)
      .order('fechaultimo', { ascending: false });
    
    if (statusid !== undefined) {
      query = query.eq('statusid', statusid);
    }
    
    query = query.limit(parseInt(limit));
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /alertaconsolidado:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/alertaconsolidado/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('alertaconsolidado');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /alertaconsolidado/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// MENSAJE
// ============================================================================

router.get('/mensaje', async (req, res) => {
  try {
    const { tipo_origen, limit = 100 } = req.query;
    
    let query = supabase
      .from('mensaje')
      .select(`
        *,
        contacto:contactoid(
          contactoid,
          celular,
          usuario:usuarioid(usuarioid, login, firstname, lastname)
        )
      `)
      .order('fecha', { ascending: false });
    
    if (tipo_origen) {
      query = query.eq('tipo_origen', tipo_origen);
    }
    
    query = query.limit(parseInt(limit));
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /mensaje:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/mensaje/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('mensaje');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /mensaje/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PERFILUMBRAL
// ============================================================================

router.get('/perfilumbral', async (req, res) => {
  try {
    const { perfilId, umbralId } = req.query;
    
    let query = supabase
      .from('perfilumbral')
      .select(`
        *,
        perfil:perfilid(perfilid, perfil, nivel),
        umbral:umbralid(umbralid, umbral)
      `)
      .order('perfilid');
    
    if (perfilId) query = query.eq('perfilid', perfilId);
    if (umbralId) query = query.eq('umbralid', umbralId);
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /perfilumbral:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/perfilumbral/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('perfilumbral');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /perfilumbral/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/perfilumbral', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('perfilumbral')
      .insert(req.body)
      .select();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error en POST /perfilumbral:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/perfilumbral/composite', async (req, res) => {
  try {
    const { perfilid, umbralid } = req.query;
    
    const { data, error } = await supabase
      .from('perfilumbral')
      .update(req.body)
      .eq('perfilid', perfilid)
      .eq('umbralid', umbralid)
      .select();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    logger.error('Error en PUT /perfilumbral/composite:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AUDIT_LOG_UMBRAL
// ============================================================================

router.get('/audit_log_umbral', async (req, res) => {
  try {
    const { umbralId, limit = 100 } = req.query;
    
    let query = supabase
      .from('audit_log_umbral')
      .select(`
        *,
        umbral:umbralid(umbralid, umbral)
      `)
      .order('modified_at', { ascending: false });
    
    if (umbralId) {
      query = query.eq('umbralid', umbralId);
    }
    
    query = query.limit(parseInt(limit));
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    logger.error('Error en GET /audit_log_umbral:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/audit_log_umbral/columns', async (req, res) => {
  try {
    const metadata = await getTableMetadata('audit_log_umbral');
    res.json(metadata.columns);
  } catch (error) {
    logger.error('Error en GET /audit_log_umbral/columns:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

