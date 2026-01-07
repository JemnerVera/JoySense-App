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
    console.log('🚀 [useUserPermissions] useEffect ejecutado', { tableName, hasUser: !!user, userEmail: user?.email });
    
    const loadPermissions = async () => {
      console.log('📞 [useUserPermissions] loadPermissions llamado', { tableName, hasUser: !!user });
      
      // Si no hay tabla, no hay permisos
      if (!tableName) {
        console.log('⚠️ [useUserPermissions] No hay tabla, sin permisos', { tableName });
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
        console.log('⚠️ [useUserPermissions] No hay usuario, permitiendo todo (comportamiento por defecto)', { tableName });
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
      console.log('🔍 [useUserPermissions] Buscando usuarioid...', { 
        fromMetadata: usuarioid, 
        userId: user.id, 
        userEmail: user.email,
        hasUserMetadata: !!user.user_metadata
      });
      
      if (!usuarioid) {
        try {
          // Intentar usar la función RPC primero (evita problemas de RLS)
          console.log('🔍 [useUserPermissions] usuarioid no está en metadata, intentando función RPC...');
          const rpcUsuarioid = await JoySenseService.getCurrentUsuarioid();
          usuarioid = rpcUsuarioid ?? undefined;
          
          if (usuarioid) {
            console.log('✅ [useUserPermissions] usuarioid encontrado por función RPC:', usuarioid);
          } else {
            console.log('⚠️ [useUserPermissions] Función RPC no retornó usuarioid, intentando buscar en tabla usuario...');
            
            // Fallback: buscar en tabla usuario (puede fallar por RLS)
            const usuariosData = await JoySenseService.getTableData('usuario', 100);
            const usuarios = Array.isArray(usuariosData) ? usuariosData : ((usuariosData as any)?.data || []);
            console.log('📋 [useUserPermissions] Usuarios cargados:', usuarios.length);
            
            if (usuarios.length > 0) {
              console.log('📋 [useUserPermissions] Primeros 3 usuarios:', usuarios.slice(0, 3).map((u: any) => ({
                usuarioid: u.usuarioid,
                login: u.login,
                useruuid: u.useruuid,
                hasUseruuid: !!u.useruuid
              })));
              
              // Buscar por useruuid primero (coincide con user.id de Supabase Auth)
              if (user.id) {
                console.log('🔍 [useUserPermissions] Buscando por useruuid:', user.id);
                const usuarioByUuid = usuarios.find((u: any) => {
                  const match = u.useruuid && String(u.useruuid).toLowerCase() === String(user.id).toLowerCase();
                  if (match) {
                    console.log('✅ [useUserPermissions] Match encontrado:', { usuarioid: u.usuarioid, useruuid: u.useruuid });
                  }
                  return match;
                });
                if (usuarioByUuid?.usuarioid) {
                  usuarioid = usuarioByUuid.usuarioid;
                  console.log('✅ [useUserPermissions] usuarioid encontrado por useruuid:', usuarioid);
                } else {
                  console.log('⚠️ [useUserPermissions] No se encontró usuario por useruuid');
                }
              }
              
              // Si no se encuentra por UUID, buscar por email/login
              if (!usuarioid && user.email) {
                console.log('🔍 [useUserPermissions] Buscando por email/login:', user.email);
                const usuarioByEmail = usuarios.find((u: any) => {
                  const match = u.login && u.login.toLowerCase() === user.email.toLowerCase();
                  if (match) {
                    console.log('✅ [useUserPermissions] Match encontrado por email:', { usuarioid: u.usuarioid, login: u.login });
                  }
                  return match;
                });
                if (usuarioByEmail?.usuarioid) {
                  usuarioid = usuarioByEmail.usuarioid;
                  console.log('✅ [useUserPermissions] usuarioid encontrado por email/login:', usuarioid);
                } else {
                  console.log('⚠️ [useUserPermissions] No se encontró usuario por email/login');
                }
              }
            } else {
              console.log('⚠️ [useUserPermissions] No se pudieron cargar usuarios (probablemente por RLS)');
            }
          }
        } catch (error) {
          console.error('❌ [useUserPermissions] Error buscando usuarioid:', error);
        }
      } else {
        console.log('✅ [useUserPermissions] usuarioid encontrado en user_metadata:', usuarioid);
      }

      console.log('🔐 [useUserPermissions] Iniciando carga de permisos', { tableName, usuarioid, origenid, fuenteid, hasUser: !!user });
      
      // Si después de buscar no hay usuarioid, permitir todo (comportamiento por defecto)
      if (!usuarioid) {
        console.log('⚠️ [useUserPermissions] No se encontró usuarioid, permitiendo todo (comportamiento por defecto)', { tableName });
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
        console.log('🔍 [useUserPermissions] Intentando obtener permisos con función RPC...', { tableName });
        const rpcPermissions = await JoySenseService.getUserPermissions(tableName);
        
        if (rpcPermissions) {
          console.log('✅ [useUserPermissions] Permisos obtenidos por RPC:', rpcPermissions);
          setPermissions(rpcPermissions);
          setLoading(false);
          return;
        }
        
        console.log('⚠️ [useUserPermissions] RPC no retornó permisos, usando método tradicional...');
        
        // Fallback: método tradicional (puede fallar por RLS)
        console.log('🔍 [useUserPermissions] Obteniendo perfil del usuario...', { usuarioid });
        
        // Intentar obtener perfilid usando función RPC
        const perfilid = await JoySenseService.getCurrentPerfilid();
        
        if (!perfilid) {
          console.log('⚠️ [useUserPermissions] Usuario sin perfil asignado', { usuarioid });
          setPermissions({
            puede_ver: false,
            puede_insertar: false,
            puede_actualizar: false
          });
          setLoading(false);
          return;
        }
        
        console.log('✅ [useUserPermissions] Perfil encontrado:', { perfilid });

        // Obtener permisos del perfil
        console.log('🔍 [useUserPermissions] Obteniendo permisos del perfil...');
        const permisosData = await JoySenseService.getTableData('permiso', 10000);
        const permisosArray = Array.isArray(permisosData) 
          ? permisosData 
          : ((permisosData as any)?.data || []);
        console.log('📋 [useUserPermissions] Total permisos cargados:', permisosArray.length);

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
          console.log('🔍 [useUserPermissions] Fuente encontrada:', { fuenteid: finalFuenteid, fuenteNombre: fuente?.fuente, tableName });
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
          console.log('🔍 [useUserPermissions] Origen encontrado:', { origenid: finalOrigenid, origenNombre: origen?.origen, isGeografia });
        }

        // Filtrar permisos del perfil para esta tabla
        console.log('🔍 [useUserPermissions] Filtrando permisos...', { perfilid, origenid: finalOrigenid, fuenteid: finalFuenteid });
        const permisosRelevantes = permisosArray.filter((p: any) => 
          p.perfilid === perfilid &&
          p.statusid === 1 &&
          (!finalOrigenid || p.origenid === finalOrigenid) &&
          (!finalFuenteid || p.fuenteid === finalFuenteid)
        );
        console.log('📋 [useUserPermissions] Permisos relevantes encontrados:', permisosRelevantes.length, permisosRelevantes);

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

        console.log('✅ [useUserPermissions] Permisos consolidados:', permisosConsolidados, { totalPermisosFinales: permisosFinales.length });
        setPermissions(permisosConsolidados);
      } catch (error) {
        console.error('❌ [useUserPermissions] Error cargando permisos:', error);
        // En caso de error, permitir todo (comportamiento por defecto)
        console.log('⚠️ [useUserPermissions] Error al cargar permisos, permitiendo todo (comportamiento por defecto)');
        setPermissions({
          puede_ver: true,
          puede_insertar: true,
          puede_actualizar: true
        });
      } finally {
        console.log('🏁 [useUserPermissions] Carga de permisos finalizada', { tableName, loading: false });
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

