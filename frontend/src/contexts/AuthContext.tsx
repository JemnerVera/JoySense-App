import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthUser } from '../services/supabase-auth';

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
          console.error('Error checking user:', error.message);
        } else {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { user: signedInUser, error } = await authService.signIn(email, password);
      
      if (error) {
        return { success: false, error: error.message };
      }

      if (signedInUser) {
        setUser(signedInUser);
        return { success: true };
      } else {
        return { success: false, error: 'No se pudo iniciar sesión' };
      }
    } catch (error) {
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
      }
    } catch (error) {
      console.error('Error signing out:', error);
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
