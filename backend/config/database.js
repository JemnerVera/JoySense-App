/**
 * Configuración de Base de Datos - Supabase API
 * Schema: joysense
 * Usuario: admin@joysense.com (autenticado vía Supabase Auth)
 * 
 * IMPORTANTE: Usa Supabase API directamente - RLS funciona automáticamente
 * según las indicaciones del DBA: "backend_user YA NO SIRVE"
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

const dbSchema = process.env.DB_SCHEMA || 'joysense';

// ============================================================================
// CONFIGURACIÓN DE SUPABASE
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Se requiere SUPABASE_URL y SUPABASE_ANON_KEY');
  console.error('   Agrega estas variables a tu archivo .env:');
  console.error('   SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.error('   SUPABASE_ANON_KEY=tu-anon-key');
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
