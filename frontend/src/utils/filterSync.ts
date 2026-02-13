/**
 * Utilidades para sincronización bidireccional entre filtros globales y dashboards.
 * Centraliza la lógica de derivación de jerarquía y validación de coincidencia.
 */

export interface GlobalFilters {
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
}

export interface DerivedHierarchy {
  paisId?: string;
  empresaId?: string;
  fundoId?: string;
  ubicacion?: any;
}

/**
 * Extrae un valor que puede ser un objeto o un array de un elemento.
 */
function unwrap<T>(val: T | T[] | undefined): T | undefined {
  if (val == null) return undefined;
  return Array.isArray(val) ? val[0] : val;
}

/**
 * Deriva la jerarquía (pais, empresa, fundo, ubicacion) desde un objeto Localizacion.
 * La Localizacion tiene: nodo -> ubicacion -> fundoid
 * Usa fundosInfo como fuente primaria para empresa/pais
 *
 * @param localizacion - Objeto localizacion con nodo.ubicacion.fundoid
 * @param fundosInfo - Mapa fundoid -> fundo (con empresaid y empresa.paisid)
 */
export function deriveHierarchyFromLocalizacion(
  localizacion: any,
  fundosInfo?: Map<number, any>
): DerivedHierarchy | null {
  console.log('[filterSync] deriveHierarchyFromLocalizacion - input:', { localizacion, fundosInfoSize: fundosInfo?.size });

  if (!localizacion?.nodo) {
    console.log('[filterSync] deriveHierarchyFromLocalizacion: no nodo');
    return null;
  }

  const nodo = unwrap(localizacion.nodo);
  if (!nodo?.ubicacion) {
    console.log('[filterSync] deriveHierarchyFromLocalizacion: no ubicacion en nodo');
    return null;
  }

  const ubicacion = unwrap(nodo.ubicacion);
  if (!ubicacion) {
    console.log('[filterSync] deriveHierarchyFromLocalizacion: ubicacion is null after unwrap');
    return null;
  }

  // Obtener fundoId desde ubicacion (el campo más confiable)
  const fundoId = ubicacion.fundoid;
  if (!fundoId) {
    console.log('[filterSync] deriveHierarchyFromLocalizacion: no fundoId en ubicacion');
    return null;
  }

  console.log('[filterSync] Derivando desde localizacion:', { fundoId, ubicacionid: ubicacion.ubicacionid });

  let empresaId: string | undefined;
  let paisId: string | undefined;

  // Usar fundosInfo como fuente primaria (es la más confiable)
  if (fundosInfo && fundosInfo.size > 0) {
    const fundoInfo = fundosInfo.get(Number(fundoId));
    if (fundoInfo) {
      empresaId = fundoInfo.empresaid?.toString();
      // El fundo puede tener empresa con paisid, o directamente paisid
      paisId = fundoInfo.empresa?.paisid?.toString() ?? fundoInfo.paisid?.toString();
      console.log('[filterSync] Obtenido de fundosInfo:', { fundoId, empresaid: fundoInfo.empresaid, paisid: paisId });
    } else {
      console.warn('[filterSync] fundoId no encontrado en fundosInfo:', fundoId);
    }
  } else {
    console.warn('[filterSync] fundosInfo vacío o no disponible');
  }

  // Fallback: intentar obtener desde estructura anidada
  if (!empresaId || !paisId) {
    const fundo = unwrap(ubicacion.fundo);
    if (fundo) {
      empresaId = empresaId ?? fundo.empresaid?.toString();
      const empresa = unwrap(fundo.empresa);
      if (empresa) {
        paisId = paisId ?? empresa.paisid?.toString();
        const pais = unwrap(empresa.pais);
        paisId = paisId ?? pais?.paisid?.toString();
      }
      console.log('[filterSync] Fallback a estructura anidada:', { empresaId, paisId });
    }
  }

  const result = {
    paisId: paisId ?? '',
    empresaId: empresaId ?? '',
    fundoId: fundoId.toString(),
    ubicacion: ubicacion, // Retornar el objeto ubicacion completo, no un subset
  };

  console.log('[filterSync] deriveHierarchyFromLocalizacion - resultado:', result);
  return result;
}

/**
 * Deriva la jerarquía (pais, empresa, fundo) desde un objeto Ubicacion.
 *
 * @param ubicacion - Objeto ubicacion con fundoid
 * @param fundosInfo - Mapa fundoid -> fundo (con empresaid, paisid) - fuente primaria
 */
export function deriveHierarchyFromUbicacion(
  ubicacion: any,
  fundosInfo?: Map<number, any>
): DerivedHierarchy | null {
  if (!ubicacion?.fundoid) {
    console.log('[filterSync] deriveHierarchyFromUbicacion: no fundoid');
    return null;
  }

  const fundoId = Number(ubicacion.fundoid);
  console.log('[filterSync] Derivando desde ubicacion:', { fundoId, ubicacionid: ubicacion.ubicacionid });

  let empresaId: string | undefined;
  let paisId: string | undefined;

  // Usar fundosInfo como fuente primaria (es la más confiable)
  if (fundosInfo && fundosInfo.size > 0) {
    const fundoInfo = fundosInfo.get(fundoId);
    if (fundoInfo) {
      empresaId = fundoInfo.empresaid?.toString();
      paisId = fundoInfo.empresa?.paisid?.toString() ?? fundoInfo.paisid?.toString();
      console.log('[filterSync] Obtenido de fundosInfo:', { fundoId, empresaid: fundoInfo.empresaid, paisid: paisId });
    } else {
      console.warn('[filterSync] fundoId no encontrado en fundosInfo:', fundoId);
    }
  } else {
    console.warn('[filterSync] fundosInfo vacío o no disponible');
  }

  // Fallback: estructura anidada
  if (!empresaId || !paisId) {
    const fundo = unwrap(ubicacion.fundo);
    if (fundo) {
      empresaId = empresaId ?? fundo.empresaid?.toString();
      const empresa = unwrap(fundo.empresa);
      if (empresa) {
        paisId = paisId ?? empresa.paisid?.toString();
        const pais = unwrap(empresa.pais);
        paisId = paisId ?? pais?.paisid?.toString();
      }
      console.log('[filterSync] Fallback a estructura anidada:', { empresaId, paisId });
    }
  }

  const result = {
    paisId: paisId ?? '',
    empresaId: empresaId ?? '',
    fundoId: fundoId.toString(),
    ubicacion: ubicacion, // Retornar el objeto ubicacion completo, no un subset
  };

  console.log('[filterSync] deriveHierarchyFromUbicacion - resultado:', result);
  return result;
}

/**
 * Verifica si una localización cumple con los filtros globales.
 *
 * @param loc - Objeto localizacion con nodo.ubicacion.fundo
 * @param filters - Filtros globales activos
 * @param fundosInfo - Mapa opcional para resolver empresa/pais desde fundoid
 */
export function localizacionMatchesGlobalFilters(
  loc: any,
  filters: GlobalFilters,
  fundosInfo?: Map<number, any>
): boolean {
  const { paisSeleccionado, empresaSeleccionada, fundoSeleccionado } = filters;

  if (!paisSeleccionado && !empresaSeleccionada && !fundoSeleccionado) {
    return true;
  }

  if (!loc?.nodo) return false;

  const nodo = unwrap(loc.nodo);
  if (!nodo?.ubicacion) return false;

  const ubicacion = unwrap(nodo.ubicacion);
  if (!ubicacion?.fundo) return false;

  const fundo = unwrap(ubicacion.fundo);
  const fundoId = fundo?.fundoid;

  if (!fundoId) return false;

  // Filtro por fundo
  if (fundoSeleccionado && fundoSeleccionado !== '') {
    if (fundoId.toString() !== fundoSeleccionado) return false;
  }

  // Para empresa y pais usar fundosInfo
  const fundoInfo = fundosInfo?.get(Number(fundoId));

  if (empresaSeleccionada && empresaSeleccionada !== '') {
    const empresaId = fundo?.empresa ? unwrap(fundo.empresa)?.empresaid : fundoInfo?.empresaid;
    if (empresaId?.toString() !== empresaSeleccionada) return false;
  }

  if (paisSeleccionado && paisSeleccionado !== '') {
    const empresa = fundo?.empresa ? unwrap(fundo.empresa) : null;
    const paisId = empresa?.pais ? unwrap(empresa.pais)?.paisid : empresa?.paisid ?? fundoInfo?.empresa?.paisid ?? fundoInfo?.paisid;
    if (paisId?.toString() !== paisSeleccionado) return false;
  }

  return true;
}
