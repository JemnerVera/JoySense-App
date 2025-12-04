/**
 * Script de demostración - Prueba de acceso al schema joysense
 * Ejecutar: node test-db-access.js
 */

require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente configurado para schema joysense
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'joysense' }
});

async function testAccess() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   PRUEBA DE ACCESO AL SCHEMA JOYSENSE                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`🔗 URL: ${supabaseUrl}`);
  console.log(`🔑 Key: ${supabaseKey ? 'Configurada (service_role)' : '❌ NO CONFIGURADA'}\n`);
  
  const tests = [
    { table: 'pais', description: 'Tabla de países' },
    { table: 'usuario', description: 'Tabla de usuarios' },
    { table: 'empresa', description: 'Tabla de empresas' }
  ];
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  for (const test of tests) {
    console.log(`📋 Probando SELECT en: joysense.${test.table}`);
    console.log(`   (${test.description})`);
    
    const { data, error } = await supabase
      .from(test.table)
      .select('*')
      .limit(3);
    
    if (error) {
      console.log(`   ❌ ERROR: ${error.message}\n`);
    } else {
      console.log(`   ✅ ÉXITO: ${data.length} registros encontrados\n`);
    }
  }
  
  // Test de INSERT
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 Probando INSERT en: joysense.usuario');
  
  const { data: insertData, error: insertError } = await supabase
    .from('usuario')
    .insert({
      login: 'test@demo.com',
      password_hash: 'test_hash',
      firstname: 'Test',
      lastname: 'Demo',
      statusid: 1,
      usercreatedid: 1,
      usermodifiedid: 1
    })
    .select();
  
  if (insertError) {
    console.log(`   ❌ ERROR: ${insertError.message}\n`);
  } else {
    console.log(`   ✅ ÉXITO: Usuario creado con ID ${insertData[0]?.usuarioid}\n`);
  }
  
  // Test de RPC
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔧 Probando RPC: fn_get_table_metadata');
  
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('fn_get_table_metadata', { tbl_name: 'usuario' });
  
  if (rpcError) {
    console.log(`   ❌ ERROR: ${rpcError.message}\n`);
  } else {
    console.log(`   ✅ ÉXITO: Metadata obtenida\n`);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 RESUMEN:');
  console.log('   Si todos los tests fallan con "permission denied for schema joysense"');
  console.log('   significa que el rol service_role NO tiene permisos en el schema.\n');
  console.log('💡 SOLUCIÓN - El DBA debe ejecutar:');
  console.log('   GRANT USAGE ON SCHEMA joysense TO service_role;');
  console.log('   GRANT ALL ON ALL TABLES IN SCHEMA joysense TO service_role;');
  console.log('   GRANT ALL ON ALL SEQUENCES IN SCHEMA joysense TO service_role;\n');
}

testAccess().catch(console.error);

