import { createClient } from '@supabase/supabase-js';
import { AuthUser, AuthError } from '../types';

// Configuración de Supabase Auth
const supabaseUrl = 'https://fagswxnjkcavchfrnrhs.supabase.co';
const supabasePublishableKey = 'sb_publishable_OTw0aSfLWFXIyQkYc-jRzg_KkeFvn3X';

// Crear cliente de Supabase para autenticación
export const supabaseAuth = createClient(supabaseUrl, supabasePublishableKey);

// Funciones de autenticación
export const authService = {
  // Iniciar sesión usando el backend (modo desarrollo)
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      console.log('🔐 Intentando autenticar usuario via backend (modo desarrollo):', email);
      
      // Usar el backend para autenticación
      const backendUrl = (window as any).process?.env?.REACT_APP_BACKEND_URL || 'http://localhost:3001/api';
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

      console.log('✅ Usuario autenticado via backend:', email);
      // Guardar el email en localStorage para uso global
      localStorage.setItem('userEmail', email);
      console.log('🔍 Debug - Email guardado en localStorage:', localStorage.getItem('userEmail'));
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
    try {
      // En modo desarrollo, no mantenemos sesiones persistentes
      // El usuario debe iniciar sesión cada vez
      return { user: null, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: 'Error inesperado al obtener usuario actual' } 
      };
    }
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