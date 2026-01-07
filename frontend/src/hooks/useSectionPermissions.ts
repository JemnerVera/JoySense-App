/**
 * Hook para verificar permisos de múltiples tablas de una sección
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
        // Verificar permisos para cada tabla usando la función RPC
        const permissionChecks = await Promise.all(
          tableNames.map(async (tableName) => {
            const permissions = await JoySenseService.getUserPermissions(tableName);
            return permissions?.puede_ver === true;
          })
        );

        // Si al menos una tabla tiene permiso de ver, permitir acceso a la sección
        const hasAnyAccess = permissionChecks.some(hasPermission => hasPermission === true);
        setHasAccess(hasAnyAccess);
      } catch (error) {
        console.error('[useSectionPermissions] Error verificando permisos:', error);
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

