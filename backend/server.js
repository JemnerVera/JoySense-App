const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de Supabase - Service Role Key (SOLO BACKEND)
const supabaseUrl = 'https://fagswxnjkcavchfrnrhs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZ3N3eG5qa2NhdmNoZnJucmhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzE1NDMyNywiZXhwIjoyMDYyNzMwMzI3fQ.ioeluR-iTWJ7-w_7UAuMl_aPXHJM6nlhv6Nh4hohBjw';

// Crear cliente de Supabase con Service Role Key
console.log('🔧 Configurando cliente Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'sense'
  }
});
console.log('✅ Cliente Supabase configurado');

// Middleware para verificar autenticación (opcional por ahora)
const verifyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    // Por ahora permitimos acceso sin autenticación
    // En el futuro aquí se puede agregar verificación de JWT
    console.log('⚠️ Acceso sin token de autenticación (permitido por ahora)');
    return next();
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('❌ Token inválido:', error?.message);
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = user;
    console.log('✅ Usuario autenticado:', user.email);
    next();
  } catch (error) {
    console.error('❌ Error verificando autenticación:', error);
    return res.status(401).json({ error: 'Error de autenticación' });
  }
};

// Rutas API para acceder al schema sense
app.get('/api/sense/paises', async (req, res) => {
  try {
    console.log('🔍 Backend: Obteniendo países del schema sense...');
    const { data, error } = await supabase
      .from('pais')
      .select('*')
      .order('pais');

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Backend: Países obtenidos:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Error in /api/sense/paises:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/empresas', async (req, res) => {
  try {
    const { paisId } = req.query;
    console.log('🔍 Backend: Obteniendo empresas del schema sense...', paisId ? `para país ${paisId}` : '');
    
    let query = supabase
      .from('empresa')
      .select('*')
      .order('empresa');

    if (paisId) {
      query = query.eq('paisid', paisId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Backend: Empresas obtenidas:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Error in /api/sense/empresas:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/fundos', async (req, res) => {
  try {
    const { empresaId } = req.query;
    console.log('🔍 Backend: Obteniendo fundos del schema sense...', empresaId ? `para empresa ${empresaId}` : '');
    
    let query = supabase
      .from('fundo')
      .select('*')
      .order('fundo');

    if (empresaId) {
      query = query.eq('empresaid', empresaId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    // Obtener conteo de mediciones para cada fundo
    const fundosConConteo = await Promise.all(
      data.map(async (fundo) => {
        try {
          // Obtener ubicaciones del fundo
          const { data: ubicaciones } = await supabase
            .from('ubicacion')
            .select('ubicacionid')
            .eq('fundoid', fundo.fundoid);

          if (!ubicaciones || ubicaciones.length === 0) {
            return { ...fundo, medicionesCount: 0 };
          }

          // Obtener conteo de mediciones para todas las ubicaciones del fundo
          const ubicacionIds = ubicaciones.map(u => u.ubicacionid);
          const { count, error: countError } = await supabase
            .from('medicion')
            .select('*', { count: 'exact', head: true })
            .in('ubicacionid', ubicacionIds);

          if (countError) {
            console.error('❌ Error obteniendo conteo para fundo', fundo.fundoid, ':', countError);
            return { ...fundo, medicionesCount: 0 };
          }

          return { ...fundo, medicionesCount: count || 0 };
        } catch (error) {
          console.error('❌ Error procesando fundo', fundo.fundoid, ':', error);
          return { ...fundo, medicionesCount: 0 };
        }
      })
    );

    console.log('✅ Backend: Fundos obtenidos con conteo:', fundosConConteo?.length || 0);
    res.json(fundosConConteo || []);
  } catch (error) {
    console.error('❌ Error in /api/sense/fundos:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/mediciones', async (req, res) => {
  try {
    const { limit = 100, ubicacionId, startDate, endDate, entidadId, getAll = false, countOnly = false } = req.query;
    console.log('🔍 Backend: Obteniendo mediciones del schema sense...');

    // Si solo necesitamos el conteo, hacer consulta rápida
    if (countOnly === 'true') {
      console.log('📊 Obteniendo solo conteo de mediciones...');
      
      let query = supabase
        .from('medicion')
        .select('*', { count: 'exact', head: true });
      
      // Aplicar filtros si existen
      if (ubicacionId) {
        query = query.eq('ubicacionid', ubicacionId);
      }
      if (startDate) {
        query = query.gte('fecha', startDate);
      }
      if (endDate) {
        query = query.lte('fecha', endDate);
      }
      
      // Si hay filtro de entidad, filtrar después
      if (entidadId) {
        console.log('🔗 Aplicando filtro de entidad...');
        // Por ahora, vamos a obtener todas las mediciones y filtrar por entidad en el frontend
        // Esto no es óptimo pero funcionará mientras arreglamos el JOIN
      }

      const { count, error } = await query;

      if (error) {
        console.error('❌ Error backend en conteo:', error);
        return res.status(500).json({ error: error.message });
      }

      console.log('✅ Backend: Conteo obtenido:', count);
      res.json({ count: count || 0 });
      return;
    }

    // Si getAll=true, obtener todas las mediciones usando paginación
    if (getAll === 'true' || limit === '1000000') {
      console.log('📊 Obteniendo TODAS las mediciones con paginación...');
      
      let allMediciones = [];
      let from = 0;
      const pageSize = 1000; // Máximo permitido por Supabase
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from('medicion')
          .select('*')
          .order('fecha', { ascending: false })
          .range(from, from + pageSize - 1);
        
        // Aplicar filtros si existen
        if (ubicacionId) {
          query = query.eq('ubicacionid', ubicacionId);
        }
        if (startDate) {
          query = query.gte('fecha', startDate);
        }
        if (endDate) {
          query = query.lte('fecha', endDate);
        }
        // Aplicar filtro de entidad si existe
        if (entidadId) {
          // Hacer JOIN con localizacion para filtrar por entidad
          query = supabase
            .from('medicion')
            .select('*, ubicacion!inner(localizacion!inner(entidadid))')
            .eq('ubicacion.localizacion.entidadid', entidadId)
            .order('fecha', { ascending: false })
            .range(from, from + pageSize - 1);
          
          // Aplicar otros filtros
          if (ubicacionId) {
            query = query.eq('ubicacionid', ubicacionId);
          }
          if (startDate) {
            query = query.gte('fecha', startDate);
          }
          if (endDate) {
            query = query.lte('fecha', endDate);
          }
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ Error backend en paginación:', error);
          return res.status(500).json({ error: error.message });
        }

        if (data && data.length > 0) {
          allMediciones = allMediciones.concat(data);
          from += pageSize;
          
          // Si obtenemos menos de pageSize, hemos llegado al final
          if (data.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }

        console.log(`📄 Página ${Math.floor(from / pageSize)}: ${data?.length || 0} mediciones`);
      }

      console.log('✅ Backend: TODAS las mediciones obtenidas:', allMediciones.length);
      res.json(allMediciones);
      return;
    }

    // Consulta normal con límite (más rápida)
    let query = supabase
      .from('medicion')
      .select('*')
      .order('fecha', { ascending: false });
    
    // Aplicar filtros si existen
    if (ubicacionId) {
      query = query.eq('ubicacionid', ubicacionId);
    }
    if (startDate) {
      query = query.gte('fecha', startDate);
    }
    if (endDate) {
      query = query.lte('fecha', endDate);
    }
    
    // Si hay filtro de entidad, por ahora lo manejaremos en el frontend
    if (entidadId) {
      console.log('🔗 Filtro de entidad detectado, se aplicará en frontend...');
    }
    
    // Aplicar límite (por defecto 100 para carga rápida)
    query = query.limit(parseInt(limit));
    
    const { data, error } = await query;

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Backend: Mediciones obtenidas:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Error in /api/sense/mediciones:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/detect', async (req, res) => {
  try {
    console.log('🔍 Backend: Detectando schema sense...');
    
    // Usar consulta SQL directa para verificar el schema sense
    const { data, error } = await supabase
      .from('pais')
      .select('paisid')
      .limit(1);

    if (error) {
      console.error('❌ Schema sense no disponible:', error);
      return res.json({ available: false, error: error.message });
    }

    console.log('✅ Schema sense disponible');
    res.json({ available: true, data });
  } catch (error) {
    console.error('❌ Error detecting schema:', error);
    res.status(500).json({ available: false, error: error.message });
  }
});

app.get('/api/sense/ubicaciones', async (req, res) => {
  try {
    const { fundoId } = req.query;
    console.log('🔍 Backend: Obteniendo ubicaciones del schema sense...', fundoId ? `para fundo ${fundoId}` : '');
    
    let query = supabase
      .from('ubicacion')
      .select('*')
      .order('ubicacion');

    if (fundoId) {
      query = query.eq('fundoid', fundoId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Backend: Ubicaciones obtenidas:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Error in /api/sense/ubicaciones:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/nodos', async (req, res) => {
  try {
    console.log('🔍 Backend: Obteniendo nodos del schema sense...');
    const { data, error } = await supabase
      .from('nodo')
      .select('*')
      .order('nodo');

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Backend: Nodos obtenidos:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Error in /api/sense/nodos:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/tipos', async (req, res) => {
  try {
    console.log('🔍 Backend: Obteniendo tipos del schema sense...');
    const { data, error } = await supabase
      .from('tipo')
      .select('*')
      .order('tipo');

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Backend: Tipos obtenidos:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Error in /api/sense/tipos:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/entidades', async (req, res) => {
  try {
    const { ubicacionId } = req.query;
    console.log('🔍 Backend: Obteniendo entidades del schema sense...', ubicacionId ? `para ubicación ${ubicacionId}` : '');
    
    // Primero verificar si la tabla existe
    const { data: testData, error: testError } = await supabase
      .from('entidad')
      .select('entidadid')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error verificando tabla entidad:', testError);
      return res.status(500).json({ error: testError.message });
    }
    
    let query = supabase
      .from('entidad')
      .select('*')
      .order('entidad');

    // Si hay ubicacionId, filtrar entidades disponibles para esa ubicación
    if (ubicacionId) {
      console.log('🔗 Filtrando entidades para ubicación:', ubicacionId);
      
      // Obtener entidades que están relacionadas con la ubicación
      const { data: entidadesRelacionadas, error: relacionError } = await supabase
        .from('localizacion')
        .select('entidadid')
        .eq('ubicacionid', ubicacionId);
      
      if (relacionError) {
        console.error('❌ Error obteniendo entidades relacionadas:', relacionError);
        return res.status(500).json({ error: relacionError.message });
      }
      
      if (entidadesRelacionadas && entidadesRelacionadas.length > 0) {
        const entidadIds = entidadesRelacionadas.map(e => e.entidadid);
        query = query.in('entidadid', entidadIds);
      } else {
        // Si no hay entidades relacionadas, devolver array vacío
        console.log('✅ No hay entidades relacionadas para esta ubicación');
        res.json([]);
        return;
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Backend: Entidades obtenidas:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Error in /api/sense/entidades:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/localizaciones', async (req, res) => {
  try {
    console.log('🔍 Backend: Obteniendo localizaciones del schema sense...');
    const { data, error } = await supabase
      .from('localizacion')
      .select('*')
      .order('ubicacionid');

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Backend: Localizaciones obtenidas:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Error in /api/sense/localizaciones:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sense/metricas', async (req, res) => {
  try {
    console.log('🔍 Backend: Obteniendo métricas del schema sense...');
    const { data, error } = await supabase
      .from('metrica')
      .select('*')
      .order('metrica');

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Backend: Métricas obtenidas:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Error in /api/sense/metricas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener nombres de métricas por ID
app.get('/api/sense/metricas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Backend: Obteniendo métrica ID:', id);
    
    const { data, error } = await supabase
      .from('metrica')
      .select('*')
      .eq('metricaid', id)
      .single();

    if (error) {
      console.error('❌ Error backend:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Backend: Métrica obtenida:', data);
    res.json(data || {});
  } catch (error) {
    console.error('❌ Error in /api/sense/metricas/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

// Nuevo endpoint para obtener mediciones con filtros de entidad usando JOINs
app.get('/api/sense/mediciones-con-entidad', async (req, res) => {
  try {
    const { limit = 100, ubicacionId, startDate, endDate, entidadId, countOnly = false } = req.query;
    console.log('🔍 Backend: Obteniendo mediciones con filtro de entidad...', { ubicacionId, startDate, endDate, entidadId, countOnly });

    // Si solo necesitamos el conteo
    if (countOnly === 'true') {
      console.log('📊 Obteniendo conteo con filtro de entidad...');
      
      // Usar consulta simple para el conteo - sin JOIN complejo
      let query = supabase
        .from('medicion')
        .select('medicionid', { count: 'exact', head: true });

      // Aplicar filtros básicos
      if (ubicacionId) {
        query = query.eq('ubicacionid', ubicacionId);
      }
      if (startDate) {
        query = query.gte('fecha', startDate);
      }
      if (endDate) {
        query = query.lte('fecha', endDate);
      }

      const { count, error } = await query;

      if (error) {
        console.error('❌ Error backend en conteo:', error);
        return res.status(500).json({ error: error.message });
      }

      console.log('✅ Backend: Conteo con entidad obtenido:', count);
      res.json({ count: count || 0 });
      return;
    }

    // Para obtener datos, usar un enfoque más simple
    // Primero obtener las mediciones básicas
    let query = supabase
      .from('medicion')
      .select('*')
      .order('fecha', { ascending: false });

    // Aplicar filtros básicos
    if (ubicacionId) {
      query = query.eq('ubicacionid', ubicacionId);
    }
    if (startDate) {
      query = query.gte('fecha', startDate);
    }
    if (endDate) {
      query = query.lte('fecha', endDate);
    }

    // Aplicar límite
    query = query.limit(parseInt(limit));

    const { data: mediciones, error } = await query;

    if (error) {
      console.error('❌ Error backend en consulta básica:', error);
      return res.status(500).json({ error: error.message });
    }

    // Si hay filtro de entidad, filtrar después
    let medicionesFiltradas = mediciones || [];
    if (entidadId && medicionesFiltradas.length > 0) {
      console.log('🔗 Aplicando filtro de entidad después de obtener datos...');
      
      // Obtener las ubicaciones que tienen la entidad específica
      const { data: localizaciones, error: locError } = await supabase
        .from('localizacion')
        .select('ubicacionid')
        .eq('entidadid', entidadId);

      if (locError) {
        console.error('❌ Error obteniendo localizaciones:', locError);
        return res.status(500).json({ error: locError.message });
      }

      if (localizaciones && localizaciones.length > 0) {
        const ubicacionIds = localizaciones.map(l => l.ubicacionid);
        medicionesFiltradas = medicionesFiltradas.filter(m => 
          ubicacionIds.includes(m.ubicacionid)
        );
      } else {
        medicionesFiltradas = [];
      }
    }

    console.log('✅ Backend: Mediciones con entidad obtenidas:', medicionesFiltradas.length);
    res.json(medicionesFiltradas);
  } catch (error) {
    console.error('❌ Error in /api/sense/mediciones-con-entidad:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'JoySense Backend API running' });
});

// Endpoint para verificar autenticación
app.get('/api/auth/verify', verifyAuth, (req, res) => {
  if (req.user) {
    res.json({ 
      authenticated: true, 
      user: {
        id: req.user.id,
        email: req.user.email,
        user_metadata: req.user.user_metadata
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 JoySense Backend API running on port ${PORT}`);
  console.log(`🔑 Using Service Role Key (backend only)`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log(`📡 Servidor listo para recibir conexiones...`);
}).on('error', (error) => {
  console.error('❌ Error al iniciar el servidor:', error);
  process.exit(1);
});
