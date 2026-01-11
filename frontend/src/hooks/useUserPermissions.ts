/**
 * Hook para obtener y verificar permisos del usuario actual
 * Verifica permisos basados en la tabla seleccionada y el origen (GEOGRAFÍA o TABLA)
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { JoySenseService } from '../services/backend-api';

interface UserPermissions {
  puede_ver: boolean;
  puede_insertar: boolean;
  puede_actualizar: boolean;
}

interface UseUserPermissionsOptions {
  tableName: string | null;
  origenid?: number | null; // 1 = GEOGRAFÍA, 2 = TABLA
  fuenteid?: number | null;
}

interface UseUserPermissionsReturn {
  permissions: UserPermissions;
  loading: boolean;
  hasPermission: (permission: 'ver' | 'insertar' | 'actualizar') => boolean;
}

export function useUserPermissions({
  tableName,
  origenid,
  fuenteid
}: UseUserPermissionsOptions): UseUserPermissionsReturn {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({
    puede_ver: false,
    puede_insertar: false,
    puede_actualizar: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      // Si no hay tabla, no hay permisos
      if (!tableName) {
        setPermissions({
          puede_ver: false,
          puede_insertar: false,
          puede_actualizar: false
        });
        setLoading(false);
        return;
      }

      // Si no hay usuario, mostrar todas las pestañas (comportamiento por defecto)
      if (!user) {
        setPermissions({
          puede_ver: true,
          puede_insertar: true,
          puede_actualizar: true
        });
        setLoading(false);
        return;
      }

      // Obtener usuarioid: primero de user_metadata, luego función RPC, luego buscar en tabla usuario
      let usuarioid: number | undefined = user.user_metadata?.usuarioid;
      
      if (!usuarioid) {
        try {
          // Intentar usar la función RPC primero (evita problemas de RLS)
          const rpcUsuarioid = await JoySenseService.getCurrentUsuarioid();
          usuarioid = rpcUsuarioid ?? undefined;
          
          if (!usuarioid) {
            // Fallback: buscar en tabla usuario (puede fallar por RLS)
            const usuariosData = await JoySenseService.getTableData('usuario', 100);
            const usuarios = Array.isArray(usuariosData) ? usuariosData : ((usuariosData as any)?.data || []);
            
            if (usuarios.length > 0) {
              // Buscar por useruuid primero (coincide con user.id de Supabase Auth)
              if (user.id) {
                const usuarioByUuid = usuarios.find((u: any) => 
                  u.useruuid && String(u.useruuid).toLowerCase() === String(user.id).toLowerCase()
                );
                if (usuarioByUuid?.usuarioid) {
                  usuarioid = usuarioByUuid.usuarioid;
                }
              }
              
              // Si no se encuentra por UUID, buscar por email/login
              if (!usuarioid && user.email) {
                const usuarioByEmail = usuarios.find((u: any) => 
                  u.login && u.login.toLowerCase() === user.email.toLowerCase()
                );
                if (usuarioByEmail?.usuarioid) {
                  usuarioid = usuarioByEmail.usuarioid;
                }
              }
            }
          }
        } catch (error) {
          console.error('[useUserPermissions] Error buscando usuarioid:', error);
        }
      }
      
      // Si después de buscar no hay usuarioid, permitir todo (comportamiento por defecto)
      if (!usuarioid) {
        setPermissions({
          puede_ver: true,
          puede_insertar: true,
          puede_actualizar: true
        });
        setLoading(false);
        return;
      }

      try {
        // Intentar usar la función RPC para obtener permisos directamente (evita problemas de RLS)
        const rpcPermissions = await JoySenseService.getUserPermissions(tableName);
        
        // Si la función RPC devuelve permisos, verificar si son válidos (no todos false)
        // Si son todos false, podría ser que la función RPC no encontró la fuente (ej: tabla 'permiso')
        // En ese caso, usar el fallback para buscar permisos manualmente
        if (rpcPermissions && (rpcPermissions.puede_ver || rpcPermissions.puede_insertar || rpcPermissions.puede_actualizar)) {
          setPermissions(rpcPermissions);
          setLoading(false);
          return;
        }
        
        // Si la función RPC devolvió null o todos los permisos en false, usar fallback
        
        // Fallback: método tradicional (puede fallar por RLS)
        // Intentar obtener perfilid usando función RPC
        const perfilid = await JoySenseService.getCurrentPerfilid();
        
        if (!perfilid) {
          setPermissions({
            puede_ver: false,
            puede_insertar: false,
            puede_actualizar: false
          });
          setLoading(false);
          return;
        }

        // Obtener permisos del perfil
        const permisosData = await JoySenseService.getTableData('permiso', 10000);
        const permisosArray = Array.isArray(permisosData) 
          ? permisosData 
          : ((permisosData as any)?.data || []);

        // Obtener fuenteid si no está proporcionado
        // Buscar la fuente que coincida con el nombre de la tabla
        let finalFuenteid = fuenteid;
        if (!finalFuenteid && tableName) {
          const fuentesData = await JoySenseService.getTableData('fuente', 100);
          const fuentesArray = Array.isArray(fuentesData) 
            ? fuentesData 
            : ((fuentesData as any)?.data || []);
          
          // Buscar fuente que coincida exactamente con el nombre de la tabla
          const fuente = fuentesArray.find((f: any) => 
            f.fuente?.toLowerCase() === tableName.toLowerCase()
          );
          finalFuenteid = fuente?.fuenteid || null;
        }

        // Obtener origenid si no está proporcionado
        let finalOrigenid = origenid;
        if (!finalOrigenid && finalFuenteid) {
          // Determinar si es geografía o tabla
          const fuentesData = await JoySenseService.getTableData('fuente', 100);
          const fuentesArray = Array.isArray(fuentesData) 
            ? fuentesData 
            : ((fuentesData as any)?.data || []);
          
          const fuente = fuentesArray.find((f: any) => f.fuenteid === finalFuenteid);
          const fuenteName = fuente?.fuente?.toLowerCase() || '';
          
          const isGeografia = ['pais', 'empresa', 'fundo', 'ubicacion', 'nodo', 'localizacion'].includes(fuenteName);
          
          const origenesData = await JoySenseService.getTableData('origen', 100);
          const origenesArray = Array.isArray(origenesData) 
            ? origenesData 
            : ((origenesData as any)?.data || []);
          
          const origen = origenesArray.find((o: any) => {
            const nombre = (o.origen || '').toUpperCase().trim();
            if (isGeografia) {
              return nombre === 'GEOGRAFÍA' || nombre === 'GEOGRAFIA';
            } else {
              return nombre === 'TABLA';
            }
          });
          finalOrigenid = origen?.origenid || null;
        }

        // Filtrar permisos del perfil para esta tabla
        const permisosRelevantes = permisosArray.filter((p: any) => 
          p.perfilid === perfilid &&
          p.statusid === 1 &&
          (!finalOrigenid || p.origenid === finalOrigenid) &&
          (!finalFuenteid || p.fuenteid === finalFuenteid)
        );

        // Verificar si hay permisos globales (objetoid = null) o específicos
        const permisosGlobales = permisosRelevantes.filter((p: any) => p.objetoid === null);
        const permisosEspecificos = permisosRelevantes.filter((p: any) => p.objetoid !== null);

        // Si hay permisos globales, usarlos (tienen prioridad)
        const permisosFinales = permisosGlobales.length > 0 ? permisosGlobales : permisosEspecificos;

        // Consolidar permisos (OR lógico: si alguno tiene el permiso, está habilitado)
        const permisosConsolidados: UserPermissions = {
          puede_ver: permisosFinales.some((p: any) => p.puede_ver === true),
          puede_insertar: permisosFinales.some((p: any) => p.puede_insertar === true),
          puede_actualizar: permisosFinales.some((p: any) => p.puede_actualizar === true)
        };

        setPermissions(permisosConsolidados);
      } catch (error) {
        console.error('[useUserPermissions] Error cargando permisos:', error);
        // En caso de error, permitir todo (comportamiento por defecto)
        setPermissions({
          puede_ver: true,
          puede_insertar: true,
          puede_actualizar: true
        });
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [tableName, user, origenid, fuenteid]);

  const hasPermission = (permission: 'ver' | 'insertar' | 'actualizar'): boolean => {
    switch (permission) {
      case 'ver':
        return permissions.puede_ver;
      case 'insertar':
        return permissions.puede_insertar;
      case 'actualizar':
        return permissions.puede_actualizar;
      default:
        return false;
    }
  };

  return {
    permissions,
    loading,
    hasPermission
  };
}

