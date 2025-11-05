import { createClient } from '@supabase/supabase-js';
import { AuthUser, AuthError } from '../types';

// Declaración para TypeScript
declare const process: any;

// ============================================================================
// SUPABASE AUTH SERVICE
// ============================================================================
// Configuración mediante variables de entorno (12-Factor App)
// Este archivo NO contiene credenciales → Se puede commitear de forma segura
// 
// Setup: Crea frontend/.env con las variables requeridas
// Ver: frontend/env.example para plantilla
// ============================================================================

/**
 * Lee y valida las variables de entorno requeridas
 * Lanza error claro si falta alguna configuración
 */
function getSupabaseConfig() {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;

  // Validación: Variables requeridas
  if (!url || !key) {
    const missing = [];
    if (!url) missing.push('REACT_APP_SUPABASE_URL');
    if (!key) missing.push('REACT_APP_SUPABASE_PUBLISHABLE_KEY');

    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ ERROR: Configuración de Supabase incompleta');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('Variables faltantes:', missing.join(', '));
    console.error('');
    console.error('📝 SOLUCIÓN:');
    console.error('1. Crea el archivo: frontend/.env');
    console.error('2. Agrega las siguientes variables:');
    console.error('');
    console.error('   REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co');
    console.error('   REACT_APP_SUPABASE_PUBLISHABLE_KEY=tu-anon-key');
    console.error('   REACT_APP_BACKEND_URL=http://localhost:3001/api');
    console.error('');
    console.error('📚 Ver: frontend/env.example para plantilla');
    console.error('🔗 Obtén tus credenciales en: https://supabase.com/dashboard');
    console.error('═══════════════════════════════════════════════════════════');

    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validación: NO permitir Service Role Key en frontend (seguridad crítica)
  if (key.includes('service_role')) {
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ PELIGRO: Service Role Key detectada en el frontend');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('La Service Role Key tiene acceso total a la base de datos');
    console.error('y NUNCA debe usarse en el frontend (código público).');
    console.error('');
    console.error('✅ Usa en su lugar:');
    console.error('  - anon key (público, seguro)');
    console.error('  - publishable key (público, seguro)');
    console.error('');
    console.error('🔗 Encuentra estas keys en:');
    console.error('   https://supabase.com/dashboard/project/_/settings/api');
    console.error('═══════════════════════════════════════════════════════════');

    throw new Error('Service Role Key cannot be used in frontend');
  }

  // Debug en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Supabase Auth - Configuración validada:');
    console.log('  - URL:', url);
    console.log('  - Key:', key.substring(0, 30) + '...');
    console.log('  - Tipo:', key.includes('anon') ? 'Anon Key ✅' : 'Publishable Key ✅');
  }

  return { url, key };
}

// Obtener y validar configuración
const config = getSupabaseConfig();

// Crear cliente de Supabase con configuración validada
export const supabaseAuth = createClient(config.url, config.key);

// Funciones de autenticación
export const authService = {
  // Iniciar sesión usando el backend (modo desarrollo)
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      // Backend URL desde process.env
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001/api';
      const response = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ Error de autenticación:', result.error);
        return { 
          user: null, 
          error: { message: result.error || 'Error de autenticación' } 
        };
      }

      // Guardar el email en localStorage para uso global
      localStorage.setItem('userEmail', email);
      return { 
        user: result.user, 
        error: null 
      };

    } catch (error) {
      console.error('❌ Error inesperado durante autenticación:', error);
      return { 
        user: null, 
        error: { message: 'Error inesperado durante el inicio de sesión' } 
      };
    }
  },

  // Reset de contraseña
  async resetPassword(login: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001/api';
      const response = await fetch(`${backendUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ login })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ Error al resetear contraseña:', result.error);
        return { 
          success: false, 
          error: result.error || 'Error al resetear la contraseña' 
        };
      }

      console.log('✅ Reset de contraseña exitoso');
      return { 
        success: true, 
        message: result.message || 'Se ha enviado una nueva contraseña al correo registrado' 
      };

    } catch (error) {
      console.error('❌ Error inesperado durante reset de contraseña:', error);
      return { 
        success: false, 
        error: 'Error inesperado durante el reset de contraseña' 
      };
    }
  },

  // Cerrar sesión
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabaseAuth.auth.signOut();
      return { error: error ? { message: error.message } : null };
    } catch (error) {
      return { error: { message: 'Error inesperado durante el cierre de sesión' } };
    }
  },

  // Obtener usuario actual (modo desarrollo)
  async getCurrentUser(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    // En modo desarrollo, no mantenemos sesiones persistentes
    // El usuario debe iniciar sesión cada vez
    return { user: null, error: null };
  },

  // Escuchar cambios en la autenticación
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabaseAuth.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata || {}
        });
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  }
};
