/**
 * Utilidades para manejar la jerarquía geográfica y cascada de permisos
 * Jerarquía: pais -> empresa -> fundo -> ubicacion -> nodo -> localizacion
 */

// Mapeo de niveles geográficos a su orden en la jerarquía
export const GEOGRAFIA_HIERARCHY_ORDER: Record<string, number> = {
  'pais': 1,
  'empresa': 2,
  'fundo': 3,
  'ubicacion': 4,
  'nodo': 5,
  'localizacion': 6
};

// Mapeo de nombres de fuente a niveles
export const FUENTE_TO_LEVEL: Record<string, string> = {
  'pais': 'pais',
  'empresa': 'empresa',
  'fundo': 'fundo',
  'ubicacion': 'ubicacion',
  'nodo': 'nodo',
  'localizacion': 'localizacion'
};

/**
 * Obtiene el orden de un nivel geográfico
 */
export function getGeografiaLevelOrder(level: string): number {
  return GEOGRAFIA_HIERARCHY_ORDER[level.toLowerCase()] || 999;
}

/**
 * Verifica si un nivel es anterior a otro en la jerarquía
 */
export function isLevelBefore(level1: string, level2: string): boolean {
  return getGeografiaLevelOrder(level1) < getGeografiaLevelOrder(level2);
}

/**
 * Obtiene todos los niveles inferiores a un nivel dado
 */
export function getLowerLevels(level: string): string[] {
  const currentOrder = getGeografiaLevelOrder(level);
  return Object.entries(GEOGRAFIA_HIERARCHY_ORDER)
    .filter(([_, order]) => order > currentOrder)
    .map(([levelName, _]) => levelName);
}

/**
 * Obtiene el nivel padre de un nivel dado
 */
export function getParentLevel(level: string): string | null {
  const currentOrder = getGeografiaLevelOrder(level);
  if (currentOrder === 1) return null; // pais no tiene padre
  
  const parent = Object.entries(GEOGRAFIA_HIERARCHY_ORDER)
    .find(([_, order]) => order === currentOrder - 1);
  
  return parent ? parent[0] : null;
}

/**
 * Obtiene la jerarquía completa de un objeto geográfico
 */
export interface GeografiaHierarchy {
  paisid?: number;
  empresaid?: number;
  fundoid?: number;
  ubicacionid?: number;
  nodoid?: number;
  localizacionid?: number;
}

/**
 * Obtiene la jerarquía de un objeto según su nivel y ID
 */
export function getObjectHierarchy(
  level: string,
  objetoid: number,
  data: {
    paisesData?: any[];
    empresasData?: any[];
    fundosData?: any[];
    ubicacionesData?: any[];
    nodosData?: any[];
    localizacionesData?: any[];
  }
): GeografiaHierarchy {
  const hierarchy: GeografiaHierarchy = {};

  switch (level.toLowerCase()) {
    case 'pais':
      hierarchy.paisid = objetoid;
      break;
    
    case 'empresa':
      hierarchy.empresaid = objetoid;
      const empresa = data.empresasData?.find(e => e.empresaid === objetoid);
      if (empresa?.paisid) {
        hierarchy.paisid = empresa.paisid;
      }
      break;
    
    case 'fundo':
      hierarchy.fundoid = objetoid;
      const fundo = data.fundosData?.find(f => f.fundoid === objetoid);
      if (fundo?.empresaid) {
        hierarchy.empresaid = fundo.empresaid;
        const empresa = data.empresasData?.find(e => e.empresaid === fundo.empresaid);
        if (empresa?.paisid) {
          hierarchy.paisid = empresa.paisid;
        }
      }
      break;
    
    case 'ubicacion':
      hierarchy.ubicacionid = objetoid;
      const ubicacion = data.ubicacionesData?.find(u => u.ubicacionid === objetoid);
      if (ubicacion?.fundoid) {
        hierarchy.fundoid = ubicacion.fundoid;
        const fundo = data.fundosData?.find(f => f.fundoid === ubicacion.fundoid);
        if (fundo?.empresaid) {
          hierarchy.empresaid = fundo.empresaid;
          const empresa = data.empresasData?.find(e => e.empresaid === fundo.empresaid);
          if (empresa?.paisid) {
            hierarchy.paisid = empresa.paisid;
          }
        }
      }
      break;
    
    case 'nodo':
      hierarchy.nodoid = objetoid;
      const nodo = data.nodosData?.find(n => n.nodoid === objetoid);
      if (nodo?.ubicacionid) {
        hierarchy.ubicacionid = nodo.ubicacionid;
        const ubicacion = data.ubicacionesData?.find(u => u.ubicacionid === nodo.ubicacionid);
        if (ubicacion?.fundoid) {
          hierarchy.fundoid = ubicacion.fundoid;
          const fundo = data.fundosData?.find(f => f.fundoid === ubicacion.fundoid);
          if (fundo?.empresaid) {
            hierarchy.empresaid = fundo.empresaid;
            const empresa = data.empresasData?.find(e => e.empresaid === fundo.empresaid);
            if (empresa?.paisid) {
              hierarchy.paisid = empresa.paisid;
            }
          }
        }
      }
      break;
    
    case 'localizacion':
      hierarchy.localizacionid = objetoid;
      const localizacion = data.localizacionesData?.find(l => l.localizacionid === objetoid);
      if (localizacion?.nodoid) {
        hierarchy.nodoid = localizacion.nodoid;
        const nodo = data.nodosData?.find(n => n.nodoid === localizacion.nodoid);
        if (nodo?.ubicacionid) {
          hierarchy.ubicacionid = nodo.ubicacionid;
          const ubicacion = data.ubicacionesData?.find(u => u.ubicacionid === nodo.ubicacionid);
          if (ubicacion?.fundoid) {
            hierarchy.fundoid = ubicacion.fundoid;
            const fundo = data.fundosData?.find(f => f.fundoid === ubicacion.fundoid);
            if (fundo?.empresaid) {
              hierarchy.empresaid = fundo.empresaid;
              const empresa = data.empresasData?.find(e => e.empresaid === fundo.empresaid);
              if (empresa?.paisid) {
                hierarchy.paisid = empresa.paisid;
              }
            }
          }
        }
      }
      break;
  }

  return hierarchy;
}

/**
 * Filtra objetos según la jerarquía de un permiso padre
 */
export function filterObjectsByParentHierarchy(
  objects: any[],
  parentLevel: string,
  parentObjetoid: number,
  currentLevel: string,
  data: {
    paisesData?: any[];
    empresasData?: any[];
    fundosData?: any[];
    ubicacionesData?: any[];
    nodosData?: any[];
    localizacionesData?: any[];
  }
): any[] {
  const parentHierarchy = getObjectHierarchy(parentLevel, parentObjetoid, data);

  return objects.filter(obj => {
    switch (currentLevel.toLowerCase()) {
      case 'pais':
        return obj.paisid === parentHierarchy.paisid;
      
      case 'empresa':
        return obj.empresaid === parentHierarchy.empresaid && 
               (!parentHierarchy.paisid || obj.paisid === parentHierarchy.paisid);
      
      case 'fundo':
        return obj.fundoid === parentHierarchy.fundoid &&
               (!parentHierarchy.empresaid || obj.empresaid === parentHierarchy.empresaid);
      
      case 'ubicacion':
        return obj.ubicacionid === parentHierarchy.ubicacionid &&
               (!parentHierarchy.fundoid || obj.fundoid === parentHierarchy.fundoid);
      
      case 'nodo':
        return obj.nodoid === parentHierarchy.nodoid &&
               (!parentHierarchy.ubicacionid || obj.ubicacionid === parentHierarchy.ubicacionid);
      
      case 'localizacion':
        return obj.localizacionid === parentHierarchy.localizacionid &&
               (!parentHierarchy.nodoid || obj.nodoid === parentHierarchy.nodoid);
      
      default:
        return true;
    }
  });
}

/**
 * Obtiene todos los objetos hijos de un objeto padre en la jerarquía
 */
export function getChildObjects(
  parentLevel: string,
  parentObjetoid: number,
  childLevel: string,
  data: {
    paisesData?: any[];
    empresasData?: any[];
    fundosData?: any[];
    ubicacionesData?: any[];
    nodosData?: any[];
    localizacionesData?: any[];
  }
): any[] {
  const parentHierarchy = getObjectHierarchy(parentLevel, parentObjetoid, data);

  switch (childLevel.toLowerCase()) {
    case 'empresa':
      return (data.empresasData || []).filter(e => 
        parentHierarchy.paisid ? e.paisid === parentHierarchy.paisid : true
      );
    
    case 'fundo':
      return (data.fundosData || []).filter(f => 
        parentHierarchy.empresaid ? f.empresaid === parentHierarchy.empresaid : true
      );
    
    case 'ubicacion':
      return (data.ubicacionesData || []).filter(u => 
        parentHierarchy.fundoid ? u.fundoid === parentHierarchy.fundoid : true
      );
    
    case 'nodo':
      return (data.nodosData || []).filter(n => 
        parentHierarchy.ubicacionid ? n.ubicacionid === parentHierarchy.ubicacionid : true
      );
    
    case 'localizacion':
      return (data.localizacionesData || []).filter(l => 
        parentHierarchy.nodoid ? l.nodoid === parentHierarchy.nodoid : true
      );
    
    default:
      return [];
  }
}

/**
 * Verifica si las fuentes seleccionadas son consecutivas en la jerarquía
 */
export function areFuentesConsecutive(
  fuenteNames: string[]
): { valid: boolean; message?: string } {
  if (fuenteNames.length === 0) {
    return { valid: true };
  }

  // Convertir nombres de fuente a niveles
  const levels = fuenteNames
    .map(name => FUENTE_TO_LEVEL[name.toLowerCase()])
    .filter(Boolean)
    .sort((a, b) => getGeografiaLevelOrder(a) - getGeografiaLevelOrder(b));

  if (levels.length === 0) {
    return { valid: true }; // No son niveles geográficos, no validar
  }

  // Verificar que sean consecutivos
  for (let i = 1; i < levels.length; i++) {
    const prevOrder = getGeografiaLevelOrder(levels[i - 1]);
    const currentOrder = getGeografiaLevelOrder(levels[i]);
    
    if (currentOrder - prevOrder > 1) {
      return {
        valid: false,
        message: `Las fuentes deben ser consecutivas. No se puede saltar de ${levels[i - 1]} a ${levels[i]}`
      };
    }
  }

  return { valid: true };
}

