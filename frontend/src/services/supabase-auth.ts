import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase Auth
const supabaseUrl = 'https://fagswxnjkcavchfrnrhs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZ3N3eG5qa2NhdmNoZnJucmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTQzMjcsImV4cCI6MjA2MjczMDMyN30.13bSx7s-r9jt7ZmIKOYsqTreAwGxqFB8_c5A1XrQBqc';

// Crear cliente de Supabase para autenticación
export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para autenticación
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export interface AuthError {
  message: string;
}

// Funciones de autenticación
export const authService = {
  // Iniciar sesión con email y contraseña
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      // TEMPORAL: Permitir acceso con el usuario específico sin verificar contraseña
      if (email === 'patricio.sandoval@migivagroup.com') {
        console.log('🔓 Acceso temporal permitido para:', email);
        return { 
          user: {
            id: 'temp-user-id',
            email: email,
            user_metadata: {
              full_name: 'Patricio Sandoval'
            }
          }, 
          error: null 
        };
      }

      // Para otros usuarios, intentar autenticación normal
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: { message: error.message } };
      }

      return { 
        user: data.user ? {
          id: data.user.id,
          email: data.user.email || undefined,
          user_metadata: data.user.user_metadata
        } : null, 
        error: null 
      };
    } catch (error) {
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

  // Obtener usuario actual
  async getCurrentUser(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data: { user }, error } = await supabaseAuth.auth.getUser();
      
      if (error) {
        return { user: null, error: { message: error.message } };
      }

      return { 
        user: user ? {
          id: user.id,
          email: user.email || undefined,
          user_metadata: user.user_metadata
        } : null, 
        error: null 
      };
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
          email: session.user.email || undefined,
          user_metadata: session.user.user_metadata
        });
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  }
};
