/**
 * Configuración de Base de Datos - Supabase API
 * Schema: joysense
 * Usuario: admin@joysense.com (autenticado vía Supabase Auth)
 * 
 * IMPORTANTE: Usa Supabase API directamente - RLS funciona automáticamente
 * El usuario backend_user ya no es necesario
 */

// Cargar dotenv solo si existe archivo .env (desarrollo local)
// En Azure, las variables están en Application Settings y ya están en process.env
try {
  require('dotenv').config();
} catch (err) {
  // Ignorar si no existe .env (normal en producción)
}

const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

const dbSchema = process.env.DB_SCHEMA || 'joysense';

// ============================================================================
// CONFIGURACIÓN DE SUPABASE
// ============================================================================

// Debug: Verificar variables de entorno disponibles
const isAzure = !!process.env.WEBSITE_SITE_NAME;
const isProduction = process.env.NODE_ENV === 'production';

if (isAzure || isProduction) {
  console.log('🔷 Ambiente detectado:', isAzure ? 'Azure App Service' : 'Producción');
  console.log('🔷 Variables de entorno disponibles:');
  console.log('   - SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configurada' : '❌ No configurada');
  console.log('   - SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada');
  console.log('   - DB_SCHEMA:', process.env.DB_SCHEMA || 'joysense (default)');
  console.log('   - NODE_ENV:', process.env.NODE_ENV || 'no definido');
  console.log('   - WEBSITE_SITE_NAME:', process.env.WEBSITE_SITE_NAME || 'no definido');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Se requiere SUPABASE_URL y SUPABASE_ANON_KEY');
  console.error('');
  
  // Debug adicional
  console.error('🔍 DEBUG - Variables de entorno detectadas:');
  console.error('   - process.env keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('NODE') || k.includes('WEBSITE')).join(', '));
  console.error('   - SUPABASE_URL value:', supabaseUrl ? 'existe pero vacío' : 'no existe');
  console.error('   - SUPABASE_ANON_KEY value:', supabaseAnonKey ? 'existe pero vacío' : 'no existe');
  console.error('');
  
  if (isAzure || isProduction) {
    console.error('   🔷 EN AZURE APP SERVICE:');
    console.error('   Ve a: Azure Portal → App Service → Configuration → Application settings');
    console.error('   Agrega estas variables (asegúrate de hacer "Save" después):');
    console.error('   - SUPABASE_URL=https://tu-proyecto.supabase.co');
    console.error('   - SUPABASE_ANON_KEY=tu-anon-key');
    console.error('');
    console.error('   ⚠️ IMPORTANTE: Después de agregar las variables, haz clic en "Save"');
    console.error('   Esto reiniciará la aplicación y cargará las nuevas variables.');
  } else {
    console.error('   🔷 EN DESARROLLO LOCAL:');
    console.error('   Agrega estas variables a tu archivo backend/.env:');
    console.error('   SUPABASE_URL=https://tu-proyecto.supabase.co');
    console.error('   SUPABASE_ANON_KEY=tu-anon-key');
  }
  console.error('');
  process.exit(1);
}

// Crear cliente base de Supabase (anon key para queries normales)
// NOTA: Este cliente se usa como fallback cuando no hay token de usuario
// Las rutas deben usar req.supabase (con token del usuario) cuando esté disponible
// para que RLS funcione correctamente
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// NOTA: El backend ya NO autentica con credenciales de admin
// Todas las queries usan el token de sesión del usuario que viene del frontend
// Esto permite que las políticas RLS usen auth.uid() correctamente
logger.info('ℹ️  Backend configurado para usar tokens de sesión del frontend');
logger.info('   Las queries usarán el contexto del usuario autenticado desde el frontend');

console.log(`✅ Cliente Supabase configurado para schema: ${dbSchema}`);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  dbSchema,
  supabase // Cliente base de Supabase (sin autenticación de admin)
};
