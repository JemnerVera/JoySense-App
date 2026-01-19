import { createClient } from '@supabase/supabase-js';
import { AuthUser, AuthError } from '../types';
import { logger } from '../utils/logger';

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

  // Debug en desarrollo - usar logger solo si está habilitado
  // Los mensajes críticos de error de configuración se mantienen como console.error

  return { url, key };
}

// Obtener y validar configuración
const config = getSupabaseConfig();

// Crear cliente de Supabase con configuración validada ####################################################
export const supabaseAuth = createClient(config.url, config.key);

// Funciones de autenticación
export const authService = {
  // Iniciar sesión usando Supabase API directamente (según indicaciones del DBA)
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    // Logs de debug (solo en modo debug)
    logger.debug('[AUTH] Iniciando proceso de autenticación');
    logger.debug('Email:', email);
    logger.debug('Supabase URL:', config.url);
    
    try {
      logger.debug('[AUTH] Llamando a supabaseAuth.auth.signInWithPassword...');
      const startTime = Date.now();
      
      // Usar Supabase API directamente - RLS funciona automáticamente
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email: email,
        password: password
      });

      const duration = Date.now() - startTime;
      logger.debug(`[AUTH] Respuesta recibida en ${duration}ms`);

      if (error) {
        console.error('═══════════════════════════════════════════════════════════');
        console.error('❌ [AUTH] Error de autenticación');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('📝 Mensaje:', error.message);
        console.error('📊 Status:', error.status || 'NO DISPONIBLE');
        console.error('🔢 Code:', error.code || 'NO DISPONIBLE');
        console.error('📦 Error completo:', JSON.stringify(error, null, 2));
        
        // Log detallado del error
        if (error.message) {
          console.error('🔍 Análisis del mensaje de error:');
          if (error.message.includes('schema')) {
            console.error('   ⚠️  El error menciona "schema" - posible problema con schema exposure');
            console.error('   💡 Verifica en Supabase Dashboard → Settings → API → Exposed schemas');
            console.error('   💡 Asegúrate de que "joysense" esté en la lista');
          }
          if (error.message.includes('credentials')) {
            console.error('   ⚠️  El error menciona "credentials" - credenciales inválidas');
          }
          if (error.message.includes('Database')) {
            console.error('   ⚠️  El error menciona "Database" - problema en la base de datos');
            console.error('   💡 Puede ser un problema con RLS, vistas, o schema exposure');
          }
        }
        
        console.error('═══════════════════════════════════════════════════════════');
        
        return { 
          user: null, 
          error: { message: error.message || 'Error de autenticación' } 
        };
      }

      logger.debug('[AUTH] No hay error en la respuesta');
      logger.debug('Data recibida:', {
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata
        } : 'NO HAY USER',
        session: data.session ? {
          access_token: data.session.access_token ? 'PRESENTE' : 'NO PRESENTE',
          refresh_token: data.session.refresh_token ? 'PRESENTE' : 'NO PRESENTE'
        } : 'NO HAY SESSION'
      });

      if (!data.user) {
        console.error('═══════════════════════════════════════════════════════════');
        console.error('❌ [AUTH] No se recibió información del usuario');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('📦 Data completa:', JSON.stringify(data, null, 2));
        console.error('═══════════════════════════════════════════════════════════');
        
        return { 
          user: null, 
          error: { message: 'No se recibió información del usuario' } 
        };
      }

      // Guardar el email en localStorage para uso global
      localStorage.setItem('userEmail', email);
      logger.debug('[AUTH] Email guardado en localStorage');
      
      // Convertir usuario de Supabase al formato AuthUser esperado
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email || email,
        user_metadata: data.user.user_metadata || {}
      };

      logger.info('[AUTH] Autenticación exitosa con Supabase API');
      logger.debug('Usuario autenticado:', {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      });
      
      return { 
        user, 
        error: null 
      };

    } catch (error: any) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [AUTH] Error inesperado durante autenticación');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('📝 Mensaje:', error?.message || 'SIN MENSAJE');
      console.error('📦 Error completo:', error);
      console.error('📊 Stack:', error?.stack || 'NO DISPONIBLE');
      console.error('📦 Tipo de error:', error?.constructor?.name || 'DESCONOCIDO');
      console.error('═══════════════════════════════════════════════════════════');
      
      return { 
        user: null, 
        error: { message: error?.message || 'Error inesperado durante el inicio de sesión' } 
      };
    }
  },

  // Reset de contraseña usando Supabase API directamente
  async resetPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      logger.debug('[AUTH] Iniciando reset de contraseña para:', email);
      
      const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        logger.error('Error al resetear contraseña con Supabase:', error.message);
        return { 
          success: false, 
          error: error.message || 'Error al enviar el correo de recuperación' 
        };
      }

      logger.info('Solicitud de reset de contraseña enviada exitosamente');
      return { 
        success: true, 
        message: 'Se ha enviado un correo para restablecer tu contraseña' 
      };

    } catch (error: any) {
      logger.error('Error inesperado durante reset de contraseña:', error);
      return { 
        success: false, 
        error: error?.message || 'Error inesperado durante el reset de contraseña' 
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

  // Obtener usuario actual desde Supabase Auth
  async getCurrentUser(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data: { user }, error } = await supabaseAuth.auth.getUser();
      
      if (error) {
        return { user: null, error: { message: error.message } };
      }
      
      if (!user) {
        return { user: null, error: null };
      }
      
      // Convertir usuario de Supabase al formato AuthUser esperado
      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        user_metadata: user.user_metadata || {}
      };
      
      return { user: authUser, error: null };
    } catch (error: any) {
      return { 
        user: null, 
        error: { message: error?.message || 'Error al obtener usuario actual' } 
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
