import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase Auth
const supabaseUrl = 'https://fagswxnjkcavchfrnrhs.supabase.co';
const supabasePublishableKey = 'sb_publishable_OTw0aSfLWFXIyQkYc-jRzg_KkeFvn3X';

// Crear cliente de Supabase para autenticación
export const supabaseAuth = createClient(supabaseUrl, supabasePublishableKey);

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
      console.log('🔐 Intentando autenticación con Supabase Auth...');
      
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Error de autenticación:', error.message);
        return { user: null, error: { message: error.message } };
      }

      if (data.user) {
        console.log('✅ Usuario autenticado:', data.user.email);
        
        // Verificar si el usuario existe en auth.users (ya está verificado por Supabase Auth)
        // No necesitamos verificar tabla sense.usuario porque usamos auth.users directamente
        console.log('✅ Usuario verificado en auth.users:', data.user.email);

        if (userError || !userData) {
          console.error('❌ Usuario no encontrado en sense.usuario:', userError);
          return { 
            user: null, 
            error: { message: 'Usuario no autorizado. Contacte al administrador.' } 
          };
        }

        if (!userData.activo) {
          console.error('❌ Usuario inactivo');
          return { 
            user: null, 
            error: { message: 'Usuario inactivo. Contacte al administrador.' } 
          };
        }

        return { 
          user: {
            id: data.user.id,
            email: data.user.email || undefined,
            user_metadata: {
              full_name: `${userData.nombre} ${userData.apellido}`,
              rol: userData.rol,
              usuarioid: userData.usuarioid
            }
          }, 
          error: null 
        };
      }

      return { user: null, error: { message: 'No se pudo autenticar el usuario' } };
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

  // Obtener usuario actual
  async getCurrentUser(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data: { user }, error } = await supabaseAuth.auth.getUser();
      
      if (error) {
        return { user: null, error: { message: error.message } };
      }

      if (user) {
        // Verificar si el usuario existe en la tabla sense.usuario
        const { data: userData, error: userError } = await supabaseAuth
          .from('usuario')
          .select('*')
          .eq('email', user.email)
          .single();

        if (userError || !userData) {
          console.error('❌ Usuario no encontrado en sense.usuario:', userError);
          return { user: null, error: { message: 'Usuario no autorizado' } };
        }

        if (!userData.activo) {
          console.error('❌ Usuario inactivo');
          return { user: null, error: { message: 'Usuario inactivo' } };
        }

        return { 
          user: {
            id: user.id,
            email: user.email || undefined,
            user_metadata: {
              full_name: `${userData.nombre} ${userData.apellido}`,
              rol: userData.rol,
              usuarioid: userData.usuarioid
            }
          }, 
          error: null 
        };
      }

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
          email: session.user.email || undefined,
          user_metadata: session.user.user_metadata
        });
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  }
};
