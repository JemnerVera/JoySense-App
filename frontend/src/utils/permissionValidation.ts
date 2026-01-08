/**
 * Utilidades para validar y filtrar objetos según permisos del usuario
 */

import { JoySenseService } from '../services/backend-api';
import { getObjectHierarchy } from './geografiaHierarchy';

/**
 * Verifica si un objeto pertenece a la jerarquía de un permiso padre
 */
export function objectBelongsToParentHierarchy(
  obj: { id: number; objetoid: number; [key: string]: any },
  level: string,
  parentPermisos: Array<{ level: string; objetoid: number; fuenteid: number }>,
  data: {
    paisesData?: any[];
    empresasData?: any[];
    fundosData?: any[];
    ubicacionesData?: any[];
    nodosData?: any[];
    localizacionesData?: any[];
  }
): boolean {
  if (parentPermisos.length === 0) {
    return true; // Si no hay permisos padre, todos los objetos son válidos
  }

  return parentPermisos.some(parentPermiso => {
    const parentHierarchy = getObjectHierarchy(
      parentPermiso.level,
      parentPermiso.objetoid,
      data
    );

    // Verificar si el objeto pertenece a la jerarquía del padre
    switch (level) {
      case 'empresa': {
        const empresa = data.empresasData?.find(e => e.empresaid === obj.objetoid);
        return empresa?.paisid === parentHierarchy.paisid;
      }
      case 'fundo': {
        const fundo = data.fundosData?.find(f => f.fundoid === obj.objetoid);
        return fundo?.empresaid === parentHierarchy.empresaid;
      }
      case 'ubicacion': {
        const ubicacion = data.ubicacionesData?.find(u => u.ubicacionid === obj.objetoid);
        return ubicacion?.fundoid === parentHierarchy.fundoid;
      }
      case 'nodo': {
        const nodo = data.nodosData?.find(n => n.nodoid === obj.objetoid);
        return nodo?.ubicacionid === parentHierarchy.ubicacionid;
      }
      case 'localizacion': {
        const localizacion = data.localizacionesData?.find(l => l.localizacionid === obj.objetoid);
        return localizacion?.nodoid === parentHierarchy.nodoid;
      }
      default:
        return true;
    }
  });
}

/**
 * Filtra objetos según permisos del usuario y jerarquía de permisos padre
 */
export function filterObjectsByUserPermissions<T extends { id: number; objetoid: number; nombre?: string; [key: string]: any }>(
  objects: T[],
  level: string,
  userPermissions: Record<string, { allowedObjects: number[]; puede_ver: boolean }>,
  parentPermisos: Array<{ level: string; objetoid: number; fuenteid: number }>,
  data: {
    paisesData?: any[];
    empresasData?: any[];
    fundosData?: any[];
    ubicacionesData?: any[];
    nodosData?: any[];
    localizacionesData?: any[];
  }
): T[] {
  const levelPermissions = userPermissions[level];
  
  // Si el usuario no tiene permisos para este nivel, no mostrar nada
  if (!levelPermissions || !levelPermissions.puede_ver) {
    return [];
  }

  // Si el usuario tiene permiso global (allowedObjects vacío o muy grande), puede ver todos
  // Si tiene permisos específicos, filtrar por allowedObjects
  let filtered = objects;
  
  // Si hay allowedObjects específicos, filtrar por ellos
  if (levelPermissions.allowedObjects.length > 0 && 
      levelPermissions.allowedObjects.length < 1000) { // Si son menos de 1000, son específicos
    filtered = objects.filter(obj => 
      levelPermissions.allowedObjects.includes(obj.objetoid)
    );
  }

  // Filtrar por jerarquía de permisos padre
  if (parentPermisos.length > 0) {
    filtered = filtered.filter(obj => 
      objectBelongsToParentHierarchy(obj, level, parentPermisos, data)
    );
  }

  return filtered;
}

/**
 * Verifica si el usuario tiene permiso para asignar permisos a un objeto
 */
export function userCanAssignPermissionToObject(
  objetoid: number,
  level: string,
  userPermissions: Record<string, { allowedObjects: number[]; puede_ver: boolean }>
): boolean {
  const levelPermissions = userPermissions[level];
  
  if (!levelPermissions || !levelPermissions.puede_ver) {
    return false;
  }

  // Si tiene permiso global (allowedObjects vacío o muy grande), puede asignar a todos
  if (levelPermissions.allowedObjects.length === 0 || levelPermissions.allowedObjects.length >= 1000) {
    return true;
  }

  // Si tiene permisos específicos, verificar que el objeto esté en la lista
  return levelPermissions.allowedObjects.includes(objetoid);
}

