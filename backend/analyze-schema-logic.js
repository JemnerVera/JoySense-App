require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const dbSchema = process.env.DB_SCHEMA || 'sense';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados en .env');
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: dbSchema }
});

async function analyzeSchemaLogic() {
  console.log('🔍 Analizando schema y lógica de relaciones...\n');
  console.log('='.repeat(80));

  try {
    // 1. Analizar estructura de medicion
    console.log('\n📊 1. ESTRUCTURA DE TABLA: medicion');
    console.log('-'.repeat(80));
    
    const { data: medicionSample, error: medError } = await supabase
      .from('medicion')
      .select('*')
      .limit(1);
    
    if (!medError && medicionSample && medicionSample.length > 0) {
      const sample = medicionSample[0];
      console.log('Campos en medicion:', Object.keys(sample).join(', '));
      console.log('Campos clave:');
      console.log(`  - medicionid: ${sample.medicionid} (PK)`);
      console.log(`  - nodoid: ${sample.nodoid} (FK -> nodo)`);
      console.log(`  - ubicacionid: ${sample.ubicacionid} (FK -> ubicacion)`);
      console.log(`  - tipoid: ${sample.tipoid} (FK -> tipo)`);
      console.log(`  - metricaid: ${sample.metricaid} (FK -> metrica)`);
      console.log(`  - fecha: ${sample.fecha}`);
      console.log(`  - medicion: ${sample.medicion}`);
    } else {
      console.log('⚠️ No se pudo obtener muestra de medicion');
    }

    // 2. Analizar estructura de nodo
    console.log('\n📊 2. ESTRUCTURA DE TABLA: nodo');
    console.log('-'.repeat(80));
    
    const { data: nodoSample, error: nodoError } = await supabase
      .from('nodo')
      .select('*')
      .limit(1);
    
    if (!nodoError && nodoSample && nodoSample.length > 0) {
      const sample = nodoSample[0];
      console.log('Campos en nodo:', Object.keys(sample).join(', '));
      console.log('Campos clave:');
      console.log(`  - nodoid: ${sample.nodoid} (PK)`);
      console.log(`  - nodo: ${sample.nodo}`);
      console.log(`  - deveui: ${sample.deveui}`);
      console.log(`  - statusid: ${sample.statusid}`);
      console.log('⚠️ IMPORTANTE: nodo NO tiene ubicacionid directamente');
    } else {
      console.log('⚠️ No se pudo obtener muestra de nodo');
    }

    // 3. Analizar estructura de localizacion
    console.log('\n📊 3. ESTRUCTURA DE TABLA: localizacion');
    console.log('-'.repeat(80));
    
    const { data: locSample, error: locError } = await supabase
      .from('localizacion')
      .select('*')
      .limit(1);
    
    if (!locError && locSample && locSample.length > 0) {
      const sample = locSample[0];
      console.log('Campos en localizacion:', Object.keys(sample).join(', '));
      console.log('Campos clave:');
      console.log(`  - localizacionid: ${sample.localizacionid} (PK)`);
      console.log(`  - nodoid: ${sample.nodoid} (FK -> nodo)`);
      console.log(`  - ubicacionid: ${sample.ubicacionid} (FK -> ubicacion)`);
      console.log(`  - entidadid: ${sample.entidadid} (FK -> entidad)`);
      console.log(`  - latitud: ${sample.latitud}`);
      console.log(`  - longitud: ${sample.longitud}`);
      console.log(`  - referencia: ${sample.referencia}`);
    } else {
      console.log('⚠️ No se pudo obtener muestra de localizacion');
    }

    // 4. Verificar relaciones y consistencia
    console.log('\n🔗 4. ANÁLISIS DE RELACIONES');
    console.log('-'.repeat(80));
    
    // Verificar si hay mediciones con nodoid pero sin ubicacionid válida
    const { data: medicionesSinUbicacion, error: medSinUbiError } = await supabase
      .from('medicion')
      .select('medicionid, nodoid, ubicacionid')
      .not('nodoid', 'is', null)
      .is('ubicacionid', null)
      .limit(10);
    
    if (!medSinUbiError) {
      if (medicionesSinUbicacion && medicionesSinUbicacion.length > 0) {
        console.log(`⚠️ PROBLEMA: Se encontraron ${medicionesSinUbicacion.length} mediciones con nodoid pero sin ubicacionid`);
        console.log('Ejemplos:', medicionesSinUbicacion.slice(0, 3));
      } else {
        console.log('✅ Todas las mediciones tienen ubicacionid');
      }
    }

    // Verificar si hay nodos sin localizacion
    const { data: nodosSinLocalizacion, error: nodosSinLocError } = await supabase
      .from('nodo')
      .select('nodoid, nodo')
      .eq('statusid', 1)
      .limit(100);
    
    if (!nodosSinLocError && nodosSinLocalizacion) {
      const nodoIds = nodosSinLocalizacion.map(n => n.nodoid);
      
      const { data: localizaciones, error: locsError } = await supabase
        .from('localizacion')
        .select('nodoid')
        .in('nodoid', nodoIds)
        .eq('statusid', 1);
      
      if (!locsError) {
        const nodosConLocalizacion = new Set(localizaciones?.map(l => l.nodoid) || []);
        const nodosSinLoc = nodosSinLocalizacion.filter(n => !nodosConLocalizacion.has(n.nodoid));
        
        if (nodosSinLocalizacion.length > 0) {
          console.log(`⚠️ PROBLEMA: Se encontraron ${nodosSinLocalizacion.length} nodos activos sin localizacion`);
          console.log('Ejemplos:', nodosSinLocalizacion.slice(0, 5).map(n => `Nodo ${n.nodoid}: ${n.nodo}`));
        } else {
          console.log('✅ Todos los nodos activos tienen localizacion');
        }
      }
    }

    // 5. Verificar consistencia: mediciones de un nodo vs ubicacionid en localizacion
    console.log('\n🔍 5. VERIFICACIÓN DE CONSISTENCIA: Nodo 139');
    console.log('-'.repeat(80));
    
    const testNodoid = 139;
    
    // Obtener localizacion del nodo
    const { data: localizacionNodo, error: locNodoError } = await supabase
      .from('localizacion')
      .select('ubicacionid, entidadid')
      .eq('nodoid', testNodoid)
      .eq('statusid', 1)
      .limit(1)
      .single();
    
    if (!locNodoError && localizacionNodo) {
      console.log(`✅ Localizacion del nodo ${testNodoid}:`);
      console.log(`   - ubicacionid: ${localizacionNodo.ubicacionid}`);
      console.log(`   - entidadid: ${localizacionNodo.entidadid}`);
      
      // Verificar mediciones del nodo
      const { count: countMediciones, error: countError } = await supabase
        .from('medicion')
        .select('*', { count: 'exact', head: true })
        .eq('nodoid', testNodoid);
      
      if (!countError) {
        console.log(`   - Total mediciones del nodo: ${countMediciones}`);
      }
      
      // Verificar mediciones por ubicacionid
      const { count: countMedicionesUbicacion, error: countUbiError } = await supabase
        .from('medicion')
        .select('*', { count: 'exact', head: true })
        .eq('ubicacionid', localizacionNodo.ubicacionid);
      
      if (!countUbiError) {
        console.log(`   - Total mediciones de la ubicacion ${localizacionNodo.ubicacionid}: ${countMedicionesUbicacion}`);
      }
      
      // Verificar mediciones por nodoid Y ubicacionid
      const { count: countMedicionesAmbos, error: countAmbosError } = await supabase
        .from('medicion')
        .select('*', { count: 'exact', head: true })
        .eq('nodoid', testNodoid)
        .eq('ubicacionid', localizacionNodo.ubicacionid);
      
      if (!countAmbosError) {
        console.log(`   - Total mediciones del nodo ${testNodoid} EN ubicacion ${localizacionNodo.ubicacionid}: ${countMedicionesAmbos}`);
        
        if (countMediciones !== countMedicionesAmbos) {
          console.log(`   ⚠️ INCONSISTENCIA: El nodo tiene ${countMediciones} mediciones, pero solo ${countMedicionesAmbos} están en su ubicacion`);
        }
      }
      
      // Verificar mediciones por entidadId
      const { data: ubicacionesEntidad, error: ubiEntError } = await supabase
        .from('localizacion')
        .select('ubicacionid')
        .eq('entidadid', localizacionNodo.entidadid)
        .eq('statusid', 1);
      
      if (!ubiEntError && ubicacionesEntidad) {
        const ubicacionIds = ubicacionesEntidad.map(u => u.ubicacionid);
        const { count: countMedicionesEntidad, error: countEntError } = await supabase
          .from('medicion')
          .select('*', { count: 'exact', head: true })
          .eq('nodoid', testNodoid)
          .in('ubicacionid', ubicacionIds);
        
        if (!countEntError) {
          console.log(`   - Total mediciones del nodo ${testNodoid} en ubicaciones de entidad ${localizacionNodo.entidadid}: ${countMedicionesEntidad}`);
          
          if (countMediciones !== countMedicionesEntidad) {
            console.log(`   ⚠️ PROBLEMA: Cuando se filtra por entidadId, solo se encuentran ${countMedicionesEntidad} mediciones de ${countMediciones} totales`);
            console.log(`   💡 SOLUCIÓN: Cuando hay nodoid, NO usar filtro de entidadId, filtrar directamente por nodoid`);
          }
        }
      }
    } else {
      console.log(`❌ No se encontró localizacion para el nodo ${testNodoid}`);
    }

    // 6. Resumen y recomendaciones
    console.log('\n📋 6. RESUMEN Y RECOMENDACIONES');
    console.log('='.repeat(80));
    console.log(`
RELACIONES DEL SCHEMA:
- medicion: tiene nodoid Y ubicacionid (ambos FK)
- nodo: NO tiene ubicacionid directamente
- localizacion: relaciona nodoid -> ubicacionid -> entidadid

LÓGICA ACTUAL:
1. Cuando hay nodoid, el backend filtra directamente por nodoid (CORRECTO)
2. Cuando hay entidadId, el backend filtra por ubicacionIds de esa entidad (CORRECTO)
3. PROBLEMA: Cuando hay AMBOS (nodoid + entidadId), el endpoint mediciones-con-entidad
   filtra primero por entidadId (obtiene ubicacionIds), luego por nodoid.
   Si el nodo no está en esas ubicaciones, devuelve 0.

SOLUCIÓN IMPLEMENTADA:
- Cuando hay nodoid, usar endpoint /sense/mediciones (no mediciones-con-entidad)
- Esto filtra directamente por nodoid sin necesidad de entidadId o ubicacionId
- El nodoid es suficiente para obtener todas las mediciones del nodo

RECOMENDACIONES:
1. ✅ Usar nodoid directamente cuando está disponible (más eficiente)
2. ✅ No depender de ubicacionId cuando hay nodoid
3. ✅ El endpoint mediciones-con-entidad solo debe usarse cuando NO hay nodoid
    `);

  } catch (error) {
    console.error('❌ Error en el análisis:', error);
  }
}

// Ejecutar el análisis
analyzeSchemaLogic()
  .then(() => {
    console.log('\n✅ Análisis completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

