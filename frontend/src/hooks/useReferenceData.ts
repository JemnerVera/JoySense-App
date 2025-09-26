import { useState, useEffect, useCallback } from 'react';
import { JoySenseService } from '../services/backend-api';

interface Nodo {
  nodoid: number;
  nodo: string;
}

interface Metrica {
  metricaid: number;
  metrica: string;
}

interface Tipo {
  tipoid: number;
  tipo: string;
}

interface Criticidad {
  criticidadid: number;
  criticidad: string;
  criticidadbrev: string;
}

interface Ubicacion {
  ubicacionid: number;
  ubicacion: string;
  fundoid: number;
}

interface Fundo {
  fundoid: number;
  fundo: string;
  empresaid: number;
}

interface Empresa {
  empresaid: number;
  empresa: string;
}

export const useReferenceData = () => {
  const [nodos, setNodos] = useState<Nodo[]>([]);
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [criticidades, setCriticidades] = useState<Criticidad[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [fundos, setFundos] = useState<Fundo[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para extraer datos de la respuesta del backend
  const extractDataFromResponse = <T>(response: any): T[] => {
    if (!response || typeof response !== 'object') {
      console.warn('⚠️ Respuesta vacía o inválida:', response);
      return [];
    }
    
    if (Array.isArray(response)) {
      return response;
    }
    
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    console.warn('⚠️ Formato de respuesta inesperado:', response);
    return [];
  };

  // Cargar datos de referencia
  const loadReferenceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      // Cargar todas las tablas de referencia en paralelo
      const [
        nodosResponse,
        metricasResponse,
        tiposResponse,
        criticidadesResponse,
        ubicacionesResponse,
        fundosResponse,
        empresasResponse
      ] = await Promise.all([
        JoySenseService.getTableData('nodo', 1000),
        JoySenseService.getTableData('metrica', 1000),
        JoySenseService.getTableData('tipo', 1000),
        JoySenseService.getTableData('criticidad', 1000),
        JoySenseService.getTableData('ubicacion', 1000),
        JoySenseService.getTableData('fundo', 1000),
        JoySenseService.getTableData('empresa', 1000)
      ]);

      // Extraer datos de cada respuesta
      const nodosData = extractDataFromResponse<Nodo>(nodosResponse);
      const metricasData = extractDataFromResponse<Metrica>(metricasResponse);
      const tiposData = extractDataFromResponse<Tipo>(tiposResponse);
      const criticidadesData = extractDataFromResponse<Criticidad>(criticidadesResponse);
      const ubicacionesData = extractDataFromResponse<Ubicacion>(ubicacionesResponse);
      const fundosData = extractDataFromResponse<Fundo>(fundosResponse);
      const empresasData = extractDataFromResponse<Empresa>(empresasResponse);

      // Actualizar estados
      setNodos(nodosData);
      setMetricas(metricasData);
      setTipos(tiposData);
      setCriticidades(criticidadesData);
      setUbicaciones(ubicacionesData);
      setFundos(fundosData);
      setEmpresas(empresasData);

      console.log('✅ Datos de referencia cargados:', {
        nodos: nodosData.length,
        metricas: metricasData.length,
        tipos: tiposData.length,
        criticidades: criticidadesData.length,
        ubicaciones: ubicacionesData.length,
        fundos: fundosData.length,
        empresas: empresasData.length
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error cargando datos de referencia:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Funciones helper para obtener nombres
  const getNodoName = useCallback((nodoid: number): string => {
    if (!Array.isArray(nodos) || nodos.length === 0) return 'Cargando...';
    const nodo = nodos.find(n => n.nodoid === nodoid);
    return nodo?.nodo || 'N/A';
  }, [nodos]);

  const getMetricaName = useCallback((metricaid: number): string => {
    if (!Array.isArray(metricas) || metricas.length === 0) return 'Cargando...';
    const metrica = metricas.find(m => m.metricaid === metricaid);
    return metrica?.metrica || 'N/A';
  }, [metricas]);

  const getTipoName = useCallback((tipoid: number): string => {
    if (!Array.isArray(tipos) || tipos.length === 0) return 'Cargando...';
    const tipo = tipos.find(t => t.tipoid === tipoid);
    return tipo?.tipo || 'N/A';
  }, [tipos]);

  const getCriticidadName = useCallback((criticidadid: number): string => {
    if (!Array.isArray(criticidades) || criticidades.length === 0) return 'Cargando...';
    const criticidad = criticidades.find(c => c.criticidadid === criticidadid);
    return criticidad?.criticidad || 'N/A';
  }, [criticidades]);

  const getUbicacionName = useCallback((ubicacionid: number): string => {
    if (!Array.isArray(ubicaciones) || ubicaciones.length === 0) return 'Cargando...';
    if (!Array.isArray(fundos) || fundos.length === 0) return 'Cargando...';
    if (!Array.isArray(empresas) || empresas.length === 0) return 'Cargando...';

    const ubicacion = ubicaciones.find(u => u.ubicacionid === ubicacionid);
    if (!ubicacion) return 'N/A';
    
    const fundo = fundos.find(f => f.fundoid === ubicacion.fundoid);
    if (!fundo) return ubicacion.ubicacion;
    
    const empresa = empresas.find(e => e.empresaid === fundo.empresaid);
    if (!empresa) return `${fundo.fundo} - ${ubicacion.ubicacion}`;
    
    return `${empresa.empresa} - ${fundo.fundo} - ${ubicacion.ubicacion}`;
  }, [ubicaciones, fundos, empresas]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  return {
    // Estados
    nodos,
    metricas,
    tipos,
    criticidades,
    ubicaciones,
    fundos,
    empresas,
    loading,
    error,
    
    // Funciones
    loadReferenceData,
    getNodoName,
    getMetricaName,
    getTipoName,
    getCriticidadName,
    getUbicacionName
  };
};
