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

async function checkNodosSinMediciones() {
  console.log('🔍 Iniciando verificación de nodos sin mediciones...\n');

  try {
    // 1. Obtener todos los nodos activos
    console.log('📋 Obteniendo todos los nodos...');
    const { data: nodos, error: nodosError } = await supabase
      .from('nodo')
      .select('nodoid, nodo, statusid')
      .eq('statusid', 1) // Solo nodos activos
      .order('nodoid', { ascending: true });

    if (nodosError) {
      console.error('❌ Error obteniendo nodos:', nodosError);
      return;
    }

    console.log(`✅ Se encontraron ${nodos.length} nodos activos\n`);

    // 2. Para cada nodo, verificar si tiene mediciones
    const nodosSinMediciones = [];
    const nodosConMediciones = [];
    const nodosConPocasMediciones = []; // Menos de 10 mediciones

    console.log('🔍 Verificando mediciones para cada nodo...\n');

    for (let i = 0; i < nodos.length; i++) {
      const nodo = nodos[i];
      const progress = `[${i + 1}/${nodos.length}]`;

      // Contar mediciones para este nodo
      const { count, error: countError } = await supabase
        .from('medicion')
        .select('*', { count: 'exact', head: true })
        .eq('nodoid', nodo.nodoid);

      if (countError) {
        console.error(`❌ ${progress} Error verificando nodo ${nodo.nodoid} (${nodo.nodo}):`, countError.message);
        continue;
      }

      const cantidadMediciones = count || 0;

      if (cantidadMediciones === 0) {
        nodosSinMediciones.push({
          nodoid: nodo.nodoid,
          nodo: nodo.nodo
        });
        console.log(`⚠️  ${progress} Nodo ${nodo.nodoid} (${nodo.nodo}): SIN MEDICIONES`);
      } else if (cantidadMediciones < 10) {
        nodosConPocasMediciones.push({
          nodoid: nodo.nodoid,
          nodo: nodo.nodo,
          cantidad: cantidadMediciones
        });
        console.log(`⚠️  ${progress} Nodo ${nodo.nodoid} (${nodo.nodo}): ${cantidadMediciones} mediciones (MUY POCAS)`);
      } else {
        nodosConMediciones.push({
          nodoid: nodo.nodoid,
          nodo: nodo.nodo,
          cantidad: cantidadMediciones
        });
        console.log(`✅ ${progress} Nodo ${nodo.nodoid} (${nodo.nodo}): ${cantidadMediciones} mediciones`);
      }
    }

    // 3. Obtener información adicional: última medición y primera medición para nodos con datos
    console.log('\n📊 Obteniendo información adicional de mediciones...\n');

    const nodosConInfoDetallada = [];

    for (const nodo of [...nodosConMediciones, ...nodosConPocasMediciones]) {
      // Última medición
      const { data: ultimaMedicion, error: ultimaError } = await supabase
        .from('medicion')
        .select('fecha')
        .eq('nodoid', nodo.nodoid)
        .order('fecha', { ascending: false })
        .limit(1)
        .single();

      // Primera medición
      const { data: primeraMedicion, error: primeraError } = await supabase
        .from('medicion')
        .select('fecha')
        .eq('nodoid', nodo.nodoid)
        .order('fecha', { ascending: true })
        .limit(1)
        .single();

      if (!ultimaError && !primeraError) {
        nodosConInfoDetallada.push({
          ...nodo,
          primeraMedicion: primeraMedicion?.fecha || null,
          ultimaMedicion: ultimaMedicion?.fecha || null
        });
      }
    }

    // 4. Generar reporte
    console.log('\n' + '='.repeat(80));
    console.log('📊 REPORTE DE NODOS Y MEDICIONES');
    console.log('='.repeat(80) + '\n');

    console.log(`📈 ESTADÍSTICAS GENERALES:`);
    console.log(`   Total de nodos activos: ${nodos.length}`);
    console.log(`   Nodos con mediciones (≥10): ${nodosConMediciones.length}`);
    console.log(`   Nodos con pocas mediciones (<10): ${nodosConPocasMediciones.length}`);
    console.log(`   Nodos SIN mediciones: ${nodosSinMediciones.length}\n`);

    // Nodos sin mediciones
    if (nodosSinMediciones.length > 0) {
      console.log('❌ NODOS SIN MEDICIONES:');
      console.log('-'.repeat(80));
      nodosSinMediciones.forEach(nodo => {
        console.log(`   Nodo ID: ${nodo.nodoid} | Nombre: ${nodo.nodo}`);
      });
      console.log('');
    }

    // Nodos con pocas mediciones
    if (nodosConPocasMediciones.length > 0) {
      console.log('⚠️  NODOS CON MUY POCAS MEDICIONES (<10):');
      console.log('-'.repeat(80));
      nodosConPocasMediciones.forEach(nodo => {
        console.log(`   Nodo ID: ${nodo.nodoid} | Nombre: ${nodo.nodo} | Mediciones: ${nodo.cantidad}`);
      });
      console.log('');
    }

    // Nodos con información detallada (última y primera medición)
    if (nodosConInfoDetallada.length > 0) {
      console.log('📅 INFORMACIÓN TEMPORAL DE MEDICIONES:');
      console.log('-'.repeat(80));
      
      // Ordenar por última medición (más reciente primero)
      nodosConInfoDetallada.sort((a, b) => {
        const fechaA = a.ultimaMedicion ? new Date(a.ultimaMedicion).getTime() : 0;
        const fechaB = b.ultimaMedicion ? new Date(b.ultimaMedicion).getTime() : 0;
        return fechaB - fechaA;
      });

      nodosConInfoDetallada.forEach(nodo => {
        const primeraFecha = nodo.primeraMedicion ? new Date(nodo.primeraMedicion).toLocaleString('es-ES') : 'N/A';
        const ultimaFecha = nodo.ultimaMedicion ? new Date(nodo.ultimaMedicion).toLocaleString('es-ES') : 'N/A';
        const ahora = new Date();
        const ultimaFechaObj = nodo.ultimaMedicion ? new Date(nodo.ultimaMedicion) : null;
        const diasDesdeUltima = ultimaFechaObj ? Math.floor((ahora.getTime() - ultimaFechaObj.getTime()) / (1000 * 60 * 60 * 24)) : null;
        
        let estado = '';
        if (diasDesdeUltima === null) {
          estado = '❓';
        } else if (diasDesdeUltima === 0) {
          estado = '✅';
        } else if (diasDesdeUltima <= 7) {
          estado = '⚠️';
        } else {
          estado = '❌';
        }

        console.log(`   ${estado} Nodo ${nodo.nodoid} (${nodo.nodo}):`);
        console.log(`      Total: ${nodo.cantidad} mediciones`);
        console.log(`      Primera: ${primeraFecha}`);
        console.log(`      Última: ${ultimaFecha} ${diasDesdeUltima !== null ? `(${diasDesdeUltima} días atrás)` : ''}`);
      });
      console.log('');
    }

    // Resumen final
    console.log('='.repeat(80));
    console.log('📋 RESUMEN:');
    console.log('='.repeat(80));
    console.log(`✅ Nodos con datos suficientes: ${nodosConMediciones.length}`);
    console.log(`⚠️  Nodos con pocos datos: ${nodosConPocasMediciones.length}`);
    console.log(`❌ Nodos sin datos: ${nodosSinMediciones.length}`);
    console.log('='.repeat(80) + '\n');

    // Generar lista de nodos sin mediciones para fácil copia
    if (nodosSinMediciones.length > 0) {
      console.log('📋 LISTA DE NODOS SIN MEDICIONES (para copiar):');
      console.log(nodosSinMediciones.map(n => `Nodo ${n.nodoid}: ${n.nodo}`).join('\n'));
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

// Ejecutar el script
checkNodosSinMediciones()
  .then(() => {
    console.log('✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

