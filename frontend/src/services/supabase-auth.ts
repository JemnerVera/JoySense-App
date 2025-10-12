import { createClient } from '@supabase/supabase-js';
import { AuthUser, AuthError } from '../types';

// Declaración para TypeScript
declare const process: any;

// Configuración de Supabase Auth - SEGURO: Usando publishable key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://fagswxnjkcavchfrnrhs.supabase.co';
const supabasePublishableKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_OTw0aSfLWFXIyQkYc-jRzg_KkeFvn3X';

// Debug: Verificar variables de entorno
console.log('🔍 Debug Supabase Auth:');
console.log('REACT_APP_SUPABASE_URL:', supabaseUrl);
console.log('REACT_APP_SUPABASE_PUBLISHABLE_KEY:', supabasePublishableKey ? 'Presente' : 'Ausente');
console.log('process.env keys:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP')));
console.log('🔧 Usando valores hardcodeados temporalmente');

// Verificar que sea PUBLISHABLE KEY (seguro para frontend)
const isServiceRole = supabasePublishableKey.includes('service_role');
const isPublishableKey = supabasePublishableKey.startsWith('sb_publishable_');
const isAnonKey = supabasePublishableKey.includes('anon');
console.log('🔑 Tipo de key detectado:');
console.log('  - Service Role Key:', isServiceRole ? '❌ PELIGROSO' : '✅ NO');
console.log('  - Publishable Key:', isPublishableKey ? '✅ SÍ' : '❌ NO');
console.log('  - Anon Key:', isAnonKey ? '✅ SÍ' : '❌ NO');
console.log('  - Key completa (primeros 30 chars):', supabasePublishableKey.substring(0, 30) + '...');

// Crear cliente de Supabase para autenticación
export const supabaseAuth = createClient(supabaseUrl, supabasePublishableKey);

// Funciones de autenticación
export const authService = {
  // Iniciar sesión usando el backend (modo desarrollo)
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      
      // Usar el backend para autenticación
  const backendUrl = 'https://lorawan-sense-app.vercel.app/api';
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
