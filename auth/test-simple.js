/**
 * Script SIMPLE para probar llamada directa
 * EJECUTAR DESDE: backend/ (cd backend && node ../auth/test-simple.js)
 */

const path = require('path');
const Module = require('module');

// Agregar backend/node_modules al path de búsqueda de módulos
const backendNodeModules = path.join(__dirname, '../backend/node_modules');
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request.startsWith('@supabase/') || request === 'dotenv') {
    try {
      return originalResolveFilename(request, {
        ...parent,
        paths: [backendNodeModules, ...(parent?.paths || [])]
      }, isMain, options);
    } catch (e) {
      // Si falla, intentar con el método original
    }
  }
  return originalResolveFilename(request, parent, isMain, options);
};

// Intentar cargar dotenv solo si está disponible
try {
  const fs = require('fs');
  // Cargar .env desde backend
  const backendEnv = path.join(__dirname, '../backend/.env');
  if (fs.existsSync(backendEnv)) {
    require('dotenv').config({ path: backendEnv });
  } else {
    require('dotenv').config();
  }
} catch (e) {
  // dotenv no está disponible, usar solo variables de entorno
  console.log('⚠️ dotenv no disponible, usando solo variables de entorno');
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://fagswxnjkcavchfrnrhs.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('ERROR: SUPABASE_ANON_KEY no encontrado');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('=== TEST 1: joysense.fn_get_table_metadata ===');
  const r1 = await supabase.rpc('joysense.fn_get_table_metadata', { tbl_name: 'pais' });
  console.log('Error:', r1.error?.message || 'Ninguno');
  console.log('Data:', r1.data ? 'OK' : 'NULL');
  
  console.log('\n=== TEST 2: .schema("joysense").rpc() ===');
  const r2 = await supabase.schema('joysense').rpc('fn_get_table_metadata', { tbl_name: 'pais' });
  console.log('Error:', r2.error?.message || 'Ninguno');
  console.log('Data:', r2.data ? 'OK' : 'NULL');
  
  console.log('\n=== TEST 3: public.fn_get_table_metadata (wrapper) ===');
  const r3 = await supabase.rpc('fn_get_table_metadata', { tbl_name: 'pais' });
  console.log('Error:', r3.error?.message || 'Ninguno');
  console.log('Data:', r3.data ? `OK (${r3.data.columns?.length || 0} columnas)` : 'NULL');
}

test().catch(console.error);


