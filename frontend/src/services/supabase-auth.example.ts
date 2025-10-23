import { createClient } from '@supabase/supabase-js';
import { AuthUser, AuthError } from '../types';

// Declaración para TypeScript
declare const process: any;

// ============================================================================
// SUPABASE AUTH SERVICE - TEMPLATE
// ============================================================================
// INSTRUCCIONES:
// 1. Copia este archivo como: supabase-auth.ts
// 2. Reemplaza los fallbacks con tus credenciales reales de Supabase
// 3. Asegúrate de tener el archivo .env en frontend/ con las variables
// 
// OBTENER CREDENCIALES:
// - Ve a: https://supabase.com/dashboard/project/_/settings/api
// - Copia: Project URL y anon/public key
// ============================================================================

// Obtener credenciales desde process.env con fallbacks
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabasePublishableKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || 'your-anon-or-publishable-key-here';

// Validación de seguridad
if (supabasePublishableKey.includes('service_role')) {
  throw new Error('❌ PELIGRO: Service Role Key detectada en el frontend. Solo usar Anon/Publishable Key.');
}

// Debug en desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('🔐 Supabase Auth - Configuración:');
  console.log('  - URL:', supabaseUrl);
  console.log('  - Key:', supabasePublishableKey ? '✅ Configurada' : '❌ No configurada');
  console.log('  - Leyendo desde:', process.env.REACT_APP_SUPABASE_URL ? '.env' : 'fallback');
}

// Crear cliente de Supabase
export const supabaseAuth = createClient(supabaseUrl, supabasePublishableKey);

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

