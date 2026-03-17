import { useMemo } from 'react';
import { useFilters } from '../contexts/FilterContext';

interface RelatedData {
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
  ubicacionesData?: any[];
  localizacionesData?: any[];
  nodosData?: any[];
  [key: string]: any[] | undefined;
}

interface GlobalFilterEffectOptions {
  tableName: string;
  data: any[];
  relatedData?: RelatedData;
}

export const useGlobalFilterEffect = ({ tableName, data, relatedData }: GlobalFilterEffectOptions) => {
  const { 
    paisSeleccionado, 
    empresaSeleccionada, 
    fundoSeleccionado,
    ubicacionSeleccionada,
    localizacionSeleccionada
  } = useFilters();

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return data;

    const hasAnyFilter = paisSeleccionado || empresaSeleccionada || fundoSeleccionado || ubicacionSeleccionada || localizacionSeleccionada;
    if (!hasAnyFilter) return data;

    const empresas = relatedData?.empresasData || [];
    const fundos = relatedData?.fundosData || [];
    const ubicaciones = relatedData?.ubicacionesData || [];
    const localizaciones = relatedData?.localizacionesData || [];
    const nodos = relatedData?.nodosData || [];

    const empresasPorPais = new Map(empresas.map(e => [e.paisid?.toString(), e.empresaid?.toString()]));
    const fundosPorEmpresa = new Map(fundos.map(f => [f.empresaid?.toString(), f.fundoid?.toString()]));
    const ubicacionesPorFundo = new Map(ubicaciones.map(u => [u.fundoid?.toString(), u.ubicacionid?.toString()]));
    const nodosPorUbicacion = new Map(nodos.map(n => [n.ubicacionid?.toString(), n.nodoid?.toString()]));
    const localizacionesPorNodo = new Map(localizaciones.map(l => [l.nodoid?.toString(), l.localizacionid?.toString()]));
    const localizacionesPorUbicacion = new Map(localizaciones.map(l => [l.ubicacionid?.toString(), l.localizacionid?.toString()]));

    const getEmpresasIdsPorPais = (paisId: string): string[] => {
      return empresas.filter(e => e.paisid?.toString() === paisId).map(e => e.empresaid?.toString());
    };

    const getFundosIdsPorEmpresa = (empresaId: string): string[] => {
      return fundos.filter(f => f.empresaid?.toString() === empresaId).map(f => f.fundoid?.toString());
    };

    const getUbicacionesIdsPorFundo = (fundoId: string): string[] => {
      return ubicaciones.filter(u => u.fundoid?.toString() === fundoId).map(u => u.ubicacionid?.toString());
    };

    const getNodosIdsPorUbicacion = (ubicacionId: string): string[] => {
      return nodos.filter(n => n.ubicacionid?.toString() === ubicacionId).map(n => n.nodoid?.toString());
    };

    const getLocalizacionesIdsPorNodo = (nodoId: string): string[] => {
      return localizaciones.filter(l => l.nodoid?.toString() === nodoId).map(l => l.localizacionid?.toString());
    };

    const getLocalizacionesIdsPorUbicacion = (ubicacionId: string): string[] => {
      return localizaciones.filter(l => l.ubicacionid?.toString() === ubicacionId).map(l => l.localizacionid?.toString());
    };

    if (tableName === 'pais') {
      return data;
    }

    if (tableName === 'empresa') {
      if (!paisSeleccionado) return data;
      const filtered = data.filter(row => row.paisid?.toString() === paisSeleccionado);
      return filtered;
    }

    if (tableName === 'fundo') {
      if (fundoSeleccionado) {
        return data.filter(row => row.fundoid?.toString() === fundoSeleccionado);
      }
      if (empresaSeleccionada) {
        return data.filter(row => row.empresaid?.toString() === empresaSeleccionada);
      }
      return data;
    }

    if (tableName === 'ubicacion') {
      if (ubicacionSeleccionada) {
        const ubiId = ubicacionSeleccionada.ubicacionid?.toString() || ubicacionSeleccionada.toString();
        return data.filter(row => row.ubicacionid?.toString() === ubiId);
      }
      if (fundoSeleccionado) {
        return data.filter(row => row.fundoid?.toString() === fundoSeleccionado);
      }
      if (empresaSeleccionada) {
        const fundoIds = getFundosIdsPorEmpresa(empresaSeleccionada);
        return data.filter(row => row.fundoid && fundoIds.includes(row.fundoid.toString()));
      }
      if (paisSeleccionado) {
        const empresaIds = getEmpresasIdsPorPais(paisSeleccionado);
        const fundoIds = empresaIds.flatMap(eid => getFundosIdsPorEmpresa(eid));
        return data.filter(row => row.fundoid && fundoIds.includes(row.fundoid.toString()));
      }
      return data;
    }

    if (tableName === 'nodo') {
      if (ubicacionSeleccionada) {
        const ubiId = ubicacionSeleccionada.ubicacionid?.toString() || ubicacionSeleccionada.toString();
        return data.filter(row => row.ubicacionid?.toString() === ubiId);
      }
      if (fundoSeleccionado) {
        const ubiIds = getUbicacionesIdsPorFundo(fundoSeleccionado);
        return data.filter(row => row.ubicacionid && ubiIds.includes(row.ubicacionid.toString()));
      }
      if (empresaSeleccionada) {
        const fundoIds = getFundosIdsPorEmpresa(empresaSeleccionada);
        const ubiIds = fundoIds.flatMap(fid => getUbicacionesIdsPorFundo(fid));
        return data.filter(row => row.ubicacionid && ubiIds.includes(row.ubicacionid.toString()));
      }
      if (paisSeleccionado) {
        const empresaIds = getEmpresasIdsPorPais(paisSeleccionado);
        const fundoIds = empresaIds.flatMap(eid => getFundosIdsPorEmpresa(eid));
        const ubiIds = fundoIds.flatMap(fid => getUbicacionesIdsPorFundo(fid));
        return data.filter(row => row.ubicacionid && ubiIds.includes(row.ubicacionid.toString()));
      }
      return data;
    }

    if (tableName === 'localizacion') {
      if (localizacionSeleccionada) {
        const locId = localizacionSeleccionada.localizacionid?.toString() || localizacionSeleccionada.toString();
        return data.filter(row => row.localizacionid?.toString() === locId);
      }
      if (ubicacionSeleccionada) {
        const ubiId = ubicacionSeleccionada.ubicacionid?.toString() || ubicacionSeleccionada.toString();
        return data.filter(row => row.ubicacionid?.toString() === ubiId);
      }
      if (fundoSeleccionado) {
        const ubiIds = getUbicacionesIdsPorFundo(fundoSeleccionado);
        return data.filter(row => row.ubicacionid && ubiIds.includes(row.ubicacionid.toString()));
      }
      if (empresaSeleccionada) {
        const fundoIds = getFundosIdsPorEmpresa(empresaSeleccionada);
        const ubiIds = fundoIds.flatMap(fid => getUbicacionesIdsPorFundo(fid));
        return data.filter(row => row.ubicacionid && ubiIds.includes(row.ubicacionid.toString()));
      }
      if (paisSeleccionado) {
        const empresaIds = getEmpresasIdsPorPais(paisSeleccionado);
        const fundoIds = empresaIds.flatMap(eid => getFundosIdsPorEmpresa(eid));
        const ubiIds = fundoIds.flatMap(fid => getUbicacionesIdsPorFundo(fid));
        return data.filter(row => row.ubicacionid && ubiIds.includes(row.ubicacionid.toString()));
      }
      return data;
    }

    return data.filter(row => {
      let matches = true;
      if (paisSeleccionado && row.paisid) {
        matches = matches && row.paisid.toString() === paisSeleccionado;
      }
      if (empresaSeleccionada && row.empresaid) {
        matches = matches && row.empresaid.toString() === empresaSeleccionada;
      }
      if (fundoSeleccionado && row.fundoid) {
        matches = matches && row.fundoid.toString() === fundoSeleccionado;
      }
      return matches;
    });
  }, [data, paisSeleccionado, empresaSeleccionada, fundoSeleccionado, ubicacionSeleccionada, localizacionSeleccionada, tableName, relatedData]);

  const hasAnyFilter = paisSeleccionado || empresaSeleccionada || fundoSeleccionado || ubicacionSeleccionada || localizacionSeleccionada;
  if (filteredData.length !== data.length || hasAnyFilter) {
    console.log('📊 Resultado del filtrado global:', {
      tableName,
      originalCount: data.length,
      filteredCount: filteredData.length,
      hasFilters: hasAnyFilter,
      filtros: { paisSeleccionado, empresaSeleccionada, fundoSeleccionado }
    });
  }

  return filteredData;
};
