import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, supabaseAuth } from '../services/supabase-auth';
import { setSessionToken } from '../services/backend-api';
import { AuthUser } from '../types';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar usuario al cargar la aplicación
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { user: currentUser, error } = await authService.getCurrentUser();
        if (error) {
          if (!error.message.includes('session missing') && !error.message.includes('Auth session missing')) {
            logger.error('Error checking user:', error.message);
          }
        } else {
          setUser(currentUser);
        }

        // Sincronizar token al registry para evitar locks de navegador
        const { data: { session } } = await supabaseAuth.auth.getSession();
        setSessionToken(session?.access_token ?? null);
      } catch (error: any) {
        if (!error?.message?.includes('session missing') && !error?.message?.includes('Auth session missing')) {
          logger.error('Error checking user:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user);
      // Sincronizar token también en cambios de sesión (refresh, sign out de otra pestaña)
      supabaseAuth.auth.getSession().then(({ data: { session } }) => {
        setSessionToken(session?.access_token ?? null);
      });
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    logger.debug('[AuthContext] signIn llamado con email:', email);
    try {
      const { user: signedInUser, error } = await authService.signIn(email, password);
      
      if (error) {
        logger.error('[AuthContext] Error en signIn:', error.message);
        return { success: false, error: error.message };
      }

      if (signedInUser) {
        logger.debug('[AuthContext] Usuario autenticado, actualizando estado');
        logger.debug('Usuario:', signedInUser);
        setUser(signedInUser);
        // Sincronizar token inmediatamente para evitar race condition con onAuthStateChange
        const { data: { session } } = await supabaseAuth.auth.getSession();
        setSessionToken(session?.access_token ?? null);
        return { success: true };
      } else {
        logger.error('[AuthContext] No se recibió usuario después de signIn');
        return { success: false, error: 'No se pudo iniciar sesión' };
      }
    } catch (error: any) {
      logger.error('[AuthContext] Excepción durante signIn:', error);
      logger.error('Error completo:', error);
      return { success: false, error: 'Error inesperado durante el inicio de sesión' };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await authService.signOut();
      if (error) {
        console.error('Error signing out:', error.message);
      } else {
        setUser(null);
        setSessionToken(null);
      }
    } catch (error) {
      logger.error('Error signing out:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};