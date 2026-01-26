/**
 * Hook para verificar permisos de múltiples tablas de una sección (NEW SYSTEM)
 * Usa el nuevo sistema de menú basado en joysense.menu + joysense.menuperfil
 * Retorna true si el usuario tiene permiso para ver al menos una tabla de la sección
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { JoySenseService } from '../services/backend-api';

interface UseSectionPermissionsOptions {
  tableNames: string[];
}

interface UseSectionPermissionsReturn {
  hasAccess: boolean;
  loading: boolean;
}

export function useSectionPermissions({
  tableNames
}: UseSectionPermissionsOptions): UseSectionPermissionsReturn {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      // Si no hay usuario, no permitir acceso
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Si no hay tablas, no permitir acceso
      if (!tableNames || tableNames.length === 0) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        // Obtener acceso al menú del usuario actual usando el nuevo sistema
        const menuAccess = await JoySenseService.getUserMenuAccess();
        
        if (!menuAccess || menuAccess.length === 0) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        // Crear un mapa de nombres de menú en minúsculas para comparación
        const accessibleMenuItems = menuAccess
          .filter(item => item.tiene_acceso)
          .map(item => item.menu.toLowerCase());

        // Verificar si al menos uno de los tableNames está en los elementos de menú accesibles
        // Comparar ignorando mayúsculas/minúsculas
        const hasAnyAccess = tableNames.some(tableName => 
          accessibleMenuItems.some(menuItem => 
            menuItem === tableName.toLowerCase() ||
            menuItem.includes(tableName.toLowerCase()) ||
            tableName.toLowerCase().includes(menuItem)
          )
        );

        setHasAccess(hasAnyAccess);
      } catch (error) {
        console.error('[useSectionPermissions] Error verificando permisos del menú:', error);
        // En caso de error, no permitir acceso
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [user, tableNames.join(',')]); // Usar join para que el efecto se ejecute cuando cambien las tablas

  return { hasAccess, loading };
}

