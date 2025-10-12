require('dotenv').config();

console.log('🔍 Verificando variables de entorno:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'NO ENCONTRADA');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'ENCONTRADA' : 'NO ENCONTRADA');
console.log('DB_SCHEMA:', process.env.DB_SCHEMA || 'NO ENCONTRADA');
console.log('PORT:', process.env.PORT || 'NO ENCONTRADA');

// Verificar si las variables están vacías
if (!process.env.SUPABASE_URL) {
  console.log('❌ ERROR: SUPABASE_URL está vacía');
} else {
  console.log('✅ SUPABASE_URL configurada correctamente');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY está vacía');
} else {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY configurada correctamente');
}

