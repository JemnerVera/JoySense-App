/**
 * Hook para obtener permisos del usuario actual para todos los niveles geográficos
 * Retorna permisos y objetos permitidos para cada nivel
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { JoySenseService } from '../services/backend-api';

interface LevelPermissions {
  puede_ver: boolean;
  puede_insertar: boolean;
  puede_actualizar: boolean;
  allowedObjects: number[]; // IDs de objetos permitidos
}

interface UseUserGeographyPermissionsReturn {
  permissions: Record<string, LevelPermissions>;
  loading: boolean;
}

export function useUserGeographyPermissions(): UseUserGeographyPermissionsReturn {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Record<string, LevelPermissions>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const levels = ['pais', 'empresa', 'fundo', 'ubicacion', 'nodo', 'localizacion'];
      const permissionsMap: Record<string, LevelPermissions> = {};

      // Obtener permisos para cada nivel
      await Promise.all(
        levels.map(async (level) => {
          try {
            const perms = await JoySenseService.getUserPermissions(level);
            
            if (perms?.puede_ver) {
              // Obtener objetos permitidos para este nivel
              // Por ahora, si tiene puede_ver, puede ver todos los objetos
              // TODO: Filtrar por permisos específicos (objetoid) si es necesario
              const allObjects = await JoySenseService.getTableData(level, 10000);
              const objectsArray = Array.isArray(allObjects) ? allObjects : [];
              
              // Mapear a IDs según el nivel
              const allowedObjects = objectsArray.map((obj: any) => {
                switch (level) {
                  case 'pais': return obj.paisid;
                  case 'empresa': return obj.empresaid;
                  case 'fundo': return obj.fundoid;
                  case 'ubicacion': return obj.ubicacionid;
                  case 'nodo': return obj.nodoid;
                  case 'localizacion': return obj.localizacionid;
                  default: return null;
                }
              }).filter((id: any) => id !== null && id !== undefined);

              permissionsMap[level] = {
                puede_ver: perms.puede_ver,
                puede_insertar: perms.puede_insertar,
                puede_actualizar: perms.puede_actualizar,
                allowedObjects
              };
            } else {
              permissionsMap[level] = {
                puede_ver: false,
                puede_insertar: false,
                puede_actualizar: false,
                allowedObjects: []
              };
            }
          } catch (error) {
            console.error(`[useUserGeographyPermissions] Error cargando permisos para ${level}:`, error);
            permissionsMap[level] = {
              puede_ver: false,
              puede_insertar: false,
              puede_actualizar: false,
              allowedObjects: []
            };
          }
        })
      );

      setPermissions(permissionsMap);
      setLoading(false);
    };

    loadPermissions();
  }, [user]);

  return { permissions, loading };
}

