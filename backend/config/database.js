/**
 * Configuración de Base de Datos - Supabase
 * Schema: joysense
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const dbSchema = process.env.DB_SCHEMA || 'joysense';

// Validar configuración
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  process.exit(1);
}

// Crear cliente de Supabase con configuración de esquema
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: dbSchema }
});

console.log(`✅ Cliente Supabase configurado para schema: ${dbSchema}`);

module.exports = {
  supabase,
  dbSchema
};

